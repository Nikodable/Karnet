import type { WorkoutSession, ExerciseSet, WorkoutExercise, Exercise, ExerciseTrackingType } from '../types';

// --- Detect tracking type for an exercise ---
// cardio_machine OR explicit trackingType === 'cardio' → durée + distance
// category cardio OU explicit 'duration' → durée seule
// sinon → poids × reps
export function getTrackingType(exercise: Exercise | null | undefined): ExerciseTrackingType {
  if (!exercise) return 'weight_reps';
  if (exercise.trackingType) return exercise.trackingType;
  if (exercise.equipment === 'cardio_machine') return 'cardio';
  if (exercise.category === 'cardio') return 'duration';
  return 'weight_reps';
}

// ==========================================
// Karnet - Calculation Utilities
// ==========================================

// --- Estimated 1RM (Epley formula) ---
export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

// --- Volume for a set ---
export function setVolume(set: ExerciseSet): number {
  if (!set.completed || !set.weight || !set.reps) return 0;
  return set.weight * set.reps;
}

// --- Volume for an exercise ---
export function exerciseVolume(exercise: WorkoutExercise): number {
  return exercise.sets.reduce((total, set) => total + setVolume(set), 0);
}

// --- Total volume for a session ---
export function sessionVolume(session: WorkoutSession): number {
  return session.exercises.reduce((total, ex) => total + exerciseVolume(ex), 0);
}

// --- Total sets for a session ---
export function sessionTotalSets(session: WorkoutSession): number {
  return session.exercises.reduce(
    (total, ex) => total + ex.sets.filter((s) => s.completed).length,
    0
  );
}

// --- Total reps for a session ---
export function sessionTotalReps(session: WorkoutSession): number {
  return session.exercises.reduce(
    (total, ex) =>
      total + ex.sets.filter((s) => s.completed).reduce((sum, s) => sum + (s.reps || 0), 0),
    0
  );
}

// --- Session duration in minutes ---
export function sessionDuration(session: WorkoutSession): number {
  if (!session.startTime || !session.endTime) return 0;
  const start = new Date(session.startTime).getTime();
  const end = new Date(session.endTime).getTime();
  return Math.round((end - start) / 60000);
}

// --- Format time (seconds -> mm:ss) ---
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// --- Format duration (minutes -> Xh Ymin) ---
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// --- Format weight ---
export function formatWeight(weight: number, unit: 'kg' | 'lbs' = 'kg'): string {
  if (unit === 'lbs') {
    return `${Math.round(weight * 2.20462)} lbs`;
  }
  return `${weight} kg`;
}

// --- Calculate streak (consecutive days with workouts) ---
export function calculateStreak(sessions: WorkoutSession[]): number {
  if (sessions.length === 0) return 0;

  const sortedDates = [...new Set(
    sessions
      .filter((s) => s.status === 'completed')
      .map((s) => s.date.split('T')[0])
  )].sort().reverse();

  if (sortedDates.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Streak must include today or yesterday
  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const current = new Date(sortedDates[i - 1]);
    const prev = new Date(sortedDates[i]);
    const diffDays = Math.round((current.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// --- Sessions this week ---
export function sessionsThisWeek(sessions: WorkoutSession[]): number {
  const now = new Date();
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday as start
  startOfWeek.setDate(startOfWeek.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);

  return sessions.filter(
    (s) => s.status === 'completed' && new Date(s.date) >= startOfWeek
  ).length;
}

// --- Best set for an exercise (max weight) ---
export function bestSet(sets: ExerciseSet[]): ExerciseSet | null {
  const completedSets = sets.filter((s) => s.completed && s.weight && s.reps);
  if (completedSets.length === 0) return null;
  return completedSets.reduce((best, set) =>
    (set.weight || 0) > (best.weight || 0) ? set : best
  );
}

// --- Volume per muscle group from sessions ---
export function volumeByMuscleGroup(
  sessions: WorkoutSession[],
  exerciseMap: Map<string, { category: string }>
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const session of sessions) {
    for (const ex of session.exercises) {
      const exercise = exerciseMap.get(ex.exerciseId);
      if (exercise) {
        const group = exercise.category;
        const vol = exerciseVolume(ex);
        result[group] = (result[group] || 0) + vol;
      }
    }
  }

  return result;
}
