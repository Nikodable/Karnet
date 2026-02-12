// ==========================================
// Karnet - Type Definitions
// ==========================================

// --- Muscle Groups ---
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'quadriceps'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'abs'
  | 'obliques'
  | 'traps'
  | 'lats'
  | 'cardio'
  | 'full_body';

// --- Equipment Types ---
export type EquipmentType =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'resistance_band'
  | 'smith_machine'
  | 'cardio_machine'
  | 'other';

// --- Exercise ---
export interface Exercise {
  id: string;
  name: string;
  nameEn: string;
  category: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: EquipmentType;
  machineSettings?: MachineSettings;
  description?: string;
  descriptionEn?: string;
  isCustom: boolean;
  isMATRIX?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MachineSettings {
  machineName?: string;
  seatHeight?: string;
  backPadPosition?: string;
  armPosition?: string;
  footPlatePosition?: string;
  handlePosition?: string;
  cableHeight?: string;
  notes?: string;
}

// --- Set (Série) ---
export interface ExerciseSet {
  id: string;
  setNumber: number;
  type: 'normal' | 'warmup' | 'dropset' | 'failure';
  weight?: number;
  reps?: number;
  duration?: number; // seconds (for cardio/planks)
  distance?: number; // meters
  restAfter?: number; // seconds
  rpe?: number; // Rate of Perceived Exertion (1-10)
  completed: boolean;
  notes?: string;
}

// --- Workout Exercise (exercise within a workout session) ---
export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  order: number;
  sets: ExerciseSet[];
  machineSettings?: MachineSettings;
  notes?: string;
  supersetWith?: string; // ID of another WorkoutExercise
}

// --- Workout Session ---
export interface WorkoutSession {
  id: string;
  programId?: string;
  programName?: string;
  name: string;
  date: string; // ISO date string
  startTime: string; // ISO datetime string
  endTime?: string; // ISO datetime string
  exercises: WorkoutExercise[];
  notes?: string;
  mood?: 1 | 2 | 3 | 4 | 5;
  status: 'in_progress' | 'completed' | 'cancelled';
  totalVolume?: number; // kg
  totalSets?: number;
  totalReps?: number;
  duration?: number; // minutes
  createdAt: string;
  updatedAt: string;
}

// --- Program ---
export interface Program {
  id: string;
  name: string;
  description?: string;
  workouts: ProgramWorkout[];
  frequency?: number; // sessions per week
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramWorkout {
  id: string;
  name: string;
  dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  order: number;
  exercises: ProgramExercise[];
}

export interface ProgramExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  order: number;
  targetSets: number;
  targetReps?: number;
  targetWeight?: number;
  targetDuration?: number;
  restBetweenSets?: number;
  machineSettings?: MachineSettings;
  notes?: string;
  supersetWith?: string;
}

// --- Objectives ---
export type ObjectiveType = 'performance' | 'frequency' | 'body';
export type ObjectiveStatus = 'active' | 'completed' | 'abandoned';

export interface Objective {
  id: string;
  type: ObjectiveType;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  targetDate: string;
  status: ObjectiveStatus;
  exerciseId?: string; // For performance objectives
  exerciseName?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Body Measurements ---
export interface BodyMeasurement {
  id: string;
  date: string;
  weight?: number; // kg
  bodyFat?: number; // %
  chest?: number; // cm
  waist?: number; // cm
  hips?: number; // cm
  bicepsLeft?: number; // cm
  bicepsRight?: number; // cm
  thighLeft?: number; // cm
  thighRight?: number; // cm
  calfLeft?: number; // cm
  calfRight?: number; // cm
  neck?: number; // cm
  shoulders?: number; // cm
  notes?: string;
  createdAt: string;
}

// --- Personal Records ---
export interface PersonalRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  type: 'max_weight' | 'max_reps' | 'max_volume' | 'estimated_1rm';
  value: number;
  unit: string;
  date: string;
  workoutSessionId: string;
  createdAt: string;
}

// --- User Settings ---
export interface UserSettings {
  id: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  dynamicColor: boolean;
  seedColor: string; // Hex color for M3 dynamic color
  weightUnit: 'kg' | 'lbs';
  distanceUnit: 'km' | 'miles';
  defaultRestTimer: number; // seconds
  timerSound: boolean;
  timerVibration: boolean;
  showWarmupSets: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- Sync ---
export interface SyncStatus {
  lastSyncAt?: string;
  isSyncing: boolean;
  error?: string;
}
