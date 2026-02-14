import type { Exercise, ExerciseTrackingType } from '../types';
import { v4 as uuid } from 'uuid';

// ==========================================
// Karnet - Pre-filled Exercise Database
// Includes classic exercises + MATRIX machines
// ==========================================

const now = new Date().toISOString();

function ex(
  name: string,
  nameEn: string,
  category: Exercise['category'],
  secondaryMuscles: Exercise['secondaryMuscles'],
  equipment: Exercise['equipment'],
  opts?: {
    isMATRIX?: boolean;
    trackingType?: ExerciseTrackingType;
    description?: string;
    descriptionEn?: string;
    machineSettings?: Exercise['machineSettings'];
  }
): Exercise {
  return {
    id: uuid(),
    name,
    nameEn,
    category,
    secondaryMuscles,
    equipment,
    isCustom: false,
    isMATRIX: opts?.isMATRIX || false,
    trackingType: opts?.trackingType,
    description: opts?.description,
    descriptionEn: opts?.descriptionEn,
    machineSettings: opts?.machineSettings,
    createdAt: now,
    updatedAt: now,
  };
}

export const defaultExercises: Exercise[] = [
  // ========== PECTORAUX / CHEST ==========
  ex('Développé couché (barre)', 'Barbell Bench Press', 'chest', ['triceps', 'shoulders'], 'barbell'),
  ex('Développé couché (haltères)', 'Dumbbell Bench Press', 'chest', ['triceps', 'shoulders'], 'dumbbell'),
  ex('Développé incliné (barre)', 'Incline Barbell Press', 'chest', ['triceps', 'shoulders'], 'barbell'),
  ex('Développé incliné (haltères)', 'Incline Dumbbell Press', 'chest', ['triceps', 'shoulders'], 'dumbbell'),
  ex('Développé décliné (barre)', 'Decline Barbell Press', 'chest', ['triceps'], 'barbell'),
  ex('Écarté couché (haltères)', 'Dumbbell Fly', 'chest', [], 'dumbbell'),
  ex('Écarté incliné (haltères)', 'Incline Dumbbell Fly', 'chest', ['shoulders'], 'dumbbell'),
  ex('Pompes', 'Push-ups', 'chest', ['triceps', 'shoulders'], 'bodyweight'),
  ex('Dips (pectoraux)', 'Chest Dips', 'chest', ['triceps', 'shoulders'], 'bodyweight'),
  ex('Cross-over poulie', 'Cable Crossover', 'chest', [], 'cable'),
  ex('Poulie vis-à-vis haute', 'High Cable Fly', 'chest', [], 'cable'),
  ex('Poulie vis-à-vis basse', 'Low Cable Fly', 'chest', ['shoulders'], 'cable'),
  ex('Pull-over (haltère)', 'Dumbbell Pullover', 'chest', ['lats'], 'dumbbell'),

  // ========== DOS / BACK ==========
  ex('Traction pronation', 'Pull-up (Overhand)', 'back', ['biceps', 'forearms'], 'bodyweight'),
  ex('Traction supination', 'Chin-up (Underhand)', 'back', ['biceps'], 'bodyweight'),
  ex('Rowing barre', 'Barbell Row', 'back', ['biceps', 'forearms'], 'barbell'),
  ex('Rowing haltère', 'Dumbbell Row', 'back', ['biceps', 'forearms'], 'dumbbell'),
  ex('Rowing T-bar', 'T-Bar Row', 'back', ['biceps', 'traps'], 'barbell'),
  ex('Tirage vertical (poulie haute)', 'Lat Pulldown', 'lats', ['biceps'], 'cable'),
  ex('Tirage horizontal (poulie basse)', 'Seated Cable Row', 'back', ['biceps', 'traps'], 'cable'),
  ex('Soulevé de terre', 'Deadlift', 'back', ['hamstrings', 'glutes', 'forearms'], 'barbell'),
  ex('Soulevé de terre roumain', 'Romanian Deadlift', 'hamstrings', ['back', 'glutes'], 'barbell'),
  ex('Shrugs (barre)', 'Barbell Shrugs', 'traps', ['forearms'], 'barbell'),
  ex('Shrugs (haltères)', 'Dumbbell Shrugs', 'traps', ['forearms'], 'dumbbell'),
  ex('Face pull', 'Face Pull', 'back', ['shoulders', 'traps'], 'cable'),
  ex('Hyperextension', 'Hyperextension', 'back', ['glutes', 'hamstrings'], 'bodyweight'),

  // ========== ÉPAULES / SHOULDERS ==========
  ex('Développé militaire (barre)', 'Overhead Barbell Press', 'shoulders', ['triceps'], 'barbell'),
  ex('Développé militaire (haltères)', 'Overhead Dumbbell Press', 'shoulders', ['triceps'], 'dumbbell'),
  ex('Élévation latérale', 'Lateral Raise', 'shoulders', [], 'dumbbell'),
  ex('Élévation frontale', 'Front Raise', 'shoulders', [], 'dumbbell'),
  ex('Oiseau (haltères)', 'Reverse Fly', 'shoulders', ['back', 'traps'], 'dumbbell'),
  ex('Oiseau à la poulie', 'Cable Reverse Fly', 'shoulders', ['back', 'traps'], 'cable'),
  ex('Élévation latérale poulie', 'Cable Lateral Raise', 'shoulders', [], 'cable'),
  ex('Arnold press', 'Arnold Press', 'shoulders', ['triceps'], 'dumbbell'),
  ex('Upright row', 'Upright Row', 'shoulders', ['traps', 'biceps'], 'barbell'),

  // ========== BICEPS ==========
  ex('Curl barre', 'Barbell Curl', 'biceps', ['forearms'], 'barbell'),
  ex('Curl haltères', 'Dumbbell Curl', 'biceps', ['forearms'], 'dumbbell'),
  ex('Curl marteau', 'Hammer Curl', 'biceps', ['forearms'], 'dumbbell'),
  ex('Curl incliné', 'Incline Curl', 'biceps', [], 'dumbbell'),
  ex('Curl pupitre (barre EZ)', 'Preacher Curl', 'biceps', [], 'barbell'),
  ex('Curl poulie basse', 'Cable Curl', 'biceps', ['forearms'], 'cable'),
  ex('Curl concentré', 'Concentration Curl', 'biceps', [], 'dumbbell'),
  ex('Curl barre EZ', 'EZ Bar Curl', 'biceps', ['forearms'], 'barbell'),

  // ========== TRICEPS ==========
  ex('Extension poulie haute (corde)', 'Rope Tricep Pushdown', 'triceps', [], 'cable'),
  ex('Extension poulie haute (barre)', 'Bar Tricep Pushdown', 'triceps', [], 'cable'),
  ex('Dips (triceps)', 'Tricep Dips', 'triceps', ['chest', 'shoulders'], 'bodyweight'),
  ex('Extension nuque (haltère)', 'Overhead Dumbbell Extension', 'triceps', [], 'dumbbell'),
  ex('Extension nuque (barre EZ)', 'Overhead EZ Bar Extension', 'triceps', [], 'barbell'),
  ex('Kickback', 'Tricep Kickback', 'triceps', [], 'dumbbell'),
  ex('Barre au front', 'Skull Crusher', 'triceps', [], 'barbell'),
  ex('Pompes diamant', 'Diamond Push-ups', 'triceps', ['chest'], 'bodyweight'),

  // ========== AVANT-BRAS / FOREARMS ==========
  ex('Curl poignet (barre)', 'Wrist Curl', 'forearms', [], 'barbell'),
  ex('Curl poignet inversé', 'Reverse Wrist Curl', 'forearms', [], 'barbell'),
  ex('Farmer walk', 'Farmer Walk', 'forearms', ['traps'], 'dumbbell'),

  // ========== QUADRICEPS ==========
  ex('Squat (barre)', 'Barbell Squat', 'quadriceps', ['glutes', 'hamstrings'], 'barbell'),
  ex('Squat avant (front squat)', 'Front Squat', 'quadriceps', ['glutes', 'abs'], 'barbell'),
  ex('Squat goblet', 'Goblet Squat', 'quadriceps', ['glutes'], 'dumbbell'),
  ex('Fentes (haltères)', 'Dumbbell Lunges', 'quadriceps', ['glutes', 'hamstrings'], 'dumbbell'),
  ex('Fentes marchées', 'Walking Lunges', 'quadriceps', ['glutes', 'hamstrings'], 'dumbbell'),
  ex('Squat bulgare', 'Bulgarian Split Squat', 'quadriceps', ['glutes'], 'dumbbell'),
  ex('Presse à cuisses', 'Leg Press', 'quadriceps', ['glutes', 'hamstrings'], 'machine'),
  ex('Extension de jambes', 'Leg Extension', 'quadriceps', [], 'machine'),
  ex('Hack squat', 'Hack Squat', 'quadriceps', ['glutes'], 'machine'),

  // ========== ISCHIO-JAMBIERS / HAMSTRINGS ==========
  ex('Leg curl allongé', 'Lying Leg Curl', 'hamstrings', [], 'machine'),
  ex('Leg curl assis', 'Seated Leg Curl', 'hamstrings', [], 'machine'),
  ex('Good morning', 'Good Morning', 'hamstrings', ['back', 'glutes'], 'barbell'),
  ex('Hip thrust (barre)', 'Barbell Hip Thrust', 'glutes', ['hamstrings'], 'barbell'),

  // ========== FESSIERS / GLUTES ==========
  ex('Hip thrust (haltère)', 'Dumbbell Hip Thrust', 'glutes', ['hamstrings'], 'dumbbell'),
  ex('Kickback fessier poulie', 'Cable Glute Kickback', 'glutes', ['hamstrings'], 'cable'),
  ex('Abduction hanche', 'Hip Abduction', 'glutes', [], 'machine'),
  ex('Pont fessier', 'Glute Bridge', 'glutes', ['hamstrings'], 'bodyweight'),
  ex('Fentes arrière', 'Reverse Lunges', 'glutes', ['quadriceps', 'hamstrings'], 'dumbbell'),

  // ========== MOLLETS / CALVES ==========
  ex('Mollets debout', 'Standing Calf Raise', 'calves', [], 'machine'),
  ex('Mollets assis', 'Seated Calf Raise', 'calves', [], 'machine'),
  ex('Mollets presse', 'Calf Press (Leg Press)', 'calves', [], 'machine'),

  // ========== ABDOMINAUX / ABS ==========
  ex('Crunch', 'Crunch', 'abs', [], 'bodyweight'),
  ex('Crunch poulie haute', 'Cable Crunch', 'abs', [], 'cable'),
  ex('Relevé de jambes suspendu', 'Hanging Leg Raise', 'abs', ['obliques'], 'bodyweight'),
  ex('Gainage (planche)', 'Plank', 'abs', ['obliques'], 'bodyweight', { trackingType: 'duration' }),
  ex('Gainage latéral', 'Side Plank', 'obliques', ['abs'], 'bodyweight', { trackingType: 'duration' }),
  ex('Russian twist', 'Russian Twist', 'obliques', ['abs'], 'bodyweight'),
  ex('Ab wheel (roue abdominale)', 'Ab Wheel Rollout', 'abs', ['obliques'], 'bodyweight'),
  ex('Mountain climbers', 'Mountain Climbers', 'abs', ['cardio'], 'bodyweight', { trackingType: 'duration' }),
  ex('Crunch inversé', 'Reverse Crunch', 'abs', [], 'bodyweight'),

  // ========== CARDIO ==========
  ex('Course sur tapis', 'Treadmill Running', 'cardio', [], 'cardio_machine', { trackingType: 'cardio' }),
  ex('Vélo elliptique', 'Elliptical', 'cardio', [], 'cardio_machine', { trackingType: 'cardio' }),
  ex('Vélo stationnaire', 'Stationary Bike', 'cardio', ['quadriceps'], 'cardio_machine', { trackingType: 'cardio' }),
  ex('Rameur', 'Rowing Machine', 'cardio', ['back', 'biceps'], 'cardio_machine', { trackingType: 'cardio' }),
  ex('Corde à sauter', 'Jump Rope', 'cardio', ['calves'], 'bodyweight', { trackingType: 'duration' }),
  ex('Stepper', 'Stair Stepper', 'cardio', ['quadriceps', 'glutes'], 'cardio_machine', { trackingType: 'cardio' }),
  ex('Burpees', 'Burpees', 'cardio', ['full_body'], 'bodyweight', { trackingType: 'duration' }),

  // ========== CORPS ENTIER / FULL BODY ==========
  ex('Clean and jerk', 'Clean and Jerk', 'full_body', ['shoulders', 'quadriceps', 'back'], 'barbell'),
  ex('Snatch (arraché)', 'Snatch', 'full_body', ['shoulders', 'back', 'quadriceps'], 'barbell'),
  ex('Thruster', 'Thruster', 'full_body', ['shoulders', 'quadriceps'], 'barbell'),
  ex('Swing kettlebell', 'Kettlebell Swing', 'full_body', ['glutes', 'hamstrings', 'shoulders'], 'kettlebell'),
  ex('Turkish get-up', 'Turkish Get-up', 'full_body', ['shoulders', 'abs'], 'kettlebell'),

  // ========================================
  // MACHINES MATRIX
  // ========================================

  // --- MATRIX Chest ---
  ex('MATRIX Chest Press', 'MATRIX Chest Press', 'chest', ['triceps', 'shoulders'], 'machine', {
    isMATRIX: true,
    description: 'Presse pectorale convergente MATRIX. Mouvement guidé qui reproduit le développé couché.',
    descriptionEn: 'MATRIX converging chest press. Guided motion that replicates bench press movement.',
    machineSettings: { seatHeight: 'Ajustable', backPadPosition: 'Ajustable', handlePosition: 'Ajustable' },
  }),
  ex('MATRIX Incline Press', 'MATRIX Incline Press', 'chest', ['triceps', 'shoulders'], 'machine', {
    isMATRIX: true,
    description: 'Presse inclinée convergente MATRIX. Cible le haut des pectoraux.',
    descriptionEn: 'MATRIX converging incline press. Targets upper chest.',
    machineSettings: { seatHeight: 'Ajustable', backPadPosition: 'Ajustable' },
  }),
  ex('MATRIX Pec Fly', 'MATRIX Pec Fly', 'chest', [], 'machine', {
    isMATRIX: true,
    description: 'Butterfly MATRIX. Mouvement d\'écarté pectoral sur machine.',
    descriptionEn: 'MATRIX pec fly machine. Chest fly isolation movement.',
    machineSettings: { seatHeight: 'Ajustable', armPosition: 'Ajustable' },
  }),

  // --- MATRIX Back ---
  ex('MATRIX Lat Pulldown', 'MATRIX Lat Pulldown', 'lats', ['biceps'], 'machine', {
    isMATRIX: true,
    description: 'Tirage vertical MATRIX. Cible les dorsaux avec mouvement convergent.',
    descriptionEn: 'MATRIX lat pulldown. Targets lats with converging motion.',
    machineSettings: { seatHeight: 'Ajustable', handlePosition: 'Ajustable' },
  }),
  ex('MATRIX Seated Row', 'MATRIX Seated Row', 'back', ['biceps', 'traps'], 'machine', {
    isMATRIX: true,
    description: 'Rowing assis MATRIX. Mouvement horizontal pour l\'épaisseur du dos.',
    descriptionEn: 'MATRIX seated row. Horizontal pulling for back thickness.',
    machineSettings: { seatHeight: 'Ajustable', backPadPosition: 'Ajustable' },
  }),
  ex('MATRIX Rear Delt', 'MATRIX Rear Delt', 'shoulders', ['back', 'traps'], 'machine', {
    isMATRIX: true,
    description: 'Machine arrière d\'épaule MATRIX. Isole le deltoïde postérieur.',
    descriptionEn: 'MATRIX rear delt machine. Isolates posterior deltoid.',
    machineSettings: { seatHeight: 'Ajustable', armPosition: 'Ajustable' },
  }),

  // --- MATRIX Shoulders ---
  ex('MATRIX Shoulder Press', 'MATRIX Shoulder Press', 'shoulders', ['triceps'], 'machine', {
    isMATRIX: true,
    description: 'Presse épaules convergente MATRIX. Mouvement guidé de développé épaules.',
    descriptionEn: 'MATRIX converging shoulder press. Guided overhead pressing motion.',
    machineSettings: { seatHeight: 'Ajustable', handlePosition: 'Ajustable' },
  }),
  ex('MATRIX Lateral Raise', 'MATRIX Lateral Raise', 'shoulders', [], 'machine', {
    isMATRIX: true,
    description: 'Élévation latérale MATRIX. Machine guidée pour isoler le deltoïde moyen.',
    descriptionEn: 'MATRIX lateral raise machine. Guided motion to isolate medial deltoid.',
    machineSettings: { seatHeight: 'Ajustable', armPosition: 'Ajustable' },
  }),

  // --- MATRIX Arms ---
  ex('MATRIX Bicep Curl', 'MATRIX Bicep Curl', 'biceps', [], 'machine', {
    isMATRIX: true,
    description: 'Curl biceps MATRIX. Machine pupitre pour isolation des biceps.',
    descriptionEn: 'MATRIX bicep curl machine. Preacher-style bicep isolation.',
    machineSettings: { seatHeight: 'Ajustable', armPosition: 'Ajustable' },
  }),
  ex('MATRIX Tricep Extension', 'MATRIX Tricep Extension', 'triceps', [], 'machine', {
    isMATRIX: true,
    description: 'Extension triceps MATRIX. Machine pour isolation des triceps.',
    descriptionEn: 'MATRIX tricep extension machine. Tricep isolation.',
    machineSettings: { seatHeight: 'Ajustable' },
  }),

  // --- MATRIX Legs ---
  ex('MATRIX Leg Press', 'MATRIX Leg Press', 'quadriceps', ['glutes', 'hamstrings'], 'machine', {
    isMATRIX: true,
    description: 'Presse à cuisses MATRIX. Grand mouvement composé pour les jambes.',
    descriptionEn: 'MATRIX leg press. Major compound leg movement.',
    machineSettings: { seatHeight: 'Ajustable', backPadPosition: 'Ajustable', footPlatePosition: 'Ajustable' },
  }),
  ex('MATRIX Leg Extension', 'MATRIX Leg Extension', 'quadriceps', [], 'machine', {
    isMATRIX: true,
    description: 'Extension de jambes MATRIX. Isolation des quadriceps.',
    descriptionEn: 'MATRIX leg extension. Quadriceps isolation.',
    machineSettings: { seatHeight: 'Ajustable', backPadPosition: 'Ajustable' },
  }),
  ex('MATRIX Leg Curl (assis)', 'MATRIX Seated Leg Curl', 'hamstrings', [], 'machine', {
    isMATRIX: true,
    description: 'Leg curl assis MATRIX. Isolation des ischio-jambiers.',
    descriptionEn: 'MATRIX seated leg curl. Hamstring isolation.',
    machineSettings: { seatHeight: 'Ajustable', backPadPosition: 'Ajustable' },
  }),
  ex('MATRIX Leg Curl (allongé)', 'MATRIX Lying Leg Curl', 'hamstrings', [], 'machine', {
    isMATRIX: true,
    description: 'Leg curl allongé MATRIX. Isolation des ischio-jambiers.',
    descriptionEn: 'MATRIX lying leg curl. Hamstring isolation.',
  }),
  ex('MATRIX Hip Abductor', 'MATRIX Hip Abductor', 'glutes', [], 'machine', {
    isMATRIX: true,
    description: 'Abducteur de hanche MATRIX. Cible le moyen fessier et le TFL.',
    descriptionEn: 'MATRIX hip abductor. Targets gluteus medius and TFL.',
    machineSettings: { seatHeight: 'Ajustable' },
  }),
  ex('MATRIX Hip Adductor', 'MATRIX Hip Adductor', 'quadriceps', [], 'machine', {
    isMATRIX: true,
    description: 'Adducteur de hanche MATRIX. Cible les adducteurs.',
    descriptionEn: 'MATRIX hip adductor. Targets adductors.',
    machineSettings: { seatHeight: 'Ajustable' },
  }),
  ex('MATRIX Hack Squat', 'MATRIX Hack Squat', 'quadriceps', ['glutes'], 'machine', {
    isMATRIX: true,
    description: 'Hack squat MATRIX. Mouvement guidé de squat.',
    descriptionEn: 'MATRIX hack squat. Guided squat movement.',
    machineSettings: { footPlatePosition: 'Ajustable' },
  }),
  ex('MATRIX Calf Raise', 'MATRIX Calf Raise', 'calves', [], 'machine', {
    isMATRIX: true,
    description: 'Mollets debout MATRIX. Isolation des mollets.',
    descriptionEn: 'MATRIX standing calf raise. Calf isolation.',
    machineSettings: { seatHeight: 'Ajustable' },
  }),
  ex('MATRIX Glute Kickback', 'MATRIX Glute Kickback', 'glutes', ['hamstrings'], 'machine', {
    isMATRIX: true,
    description: 'Kickback fessier MATRIX. Machine pour isolation des fessiers.',
    descriptionEn: 'MATRIX glute kickback machine. Glute isolation.',
  }),

  // --- MATRIX Core ---
  ex('MATRIX Ab Crunch', 'MATRIX Ab Crunch', 'abs', [], 'machine', {
    isMATRIX: true,
    description: 'Crunch abdominal MATRIX. Machine guidée pour les abdominaux.',
    descriptionEn: 'MATRIX ab crunch machine. Guided abdominal crunch.',
    machineSettings: { seatHeight: 'Ajustable' },
  }),
  ex('MATRIX Torso Rotation', 'MATRIX Torso Rotation', 'obliques', ['abs'], 'machine', {
    isMATRIX: true,
    description: 'Rotation du buste MATRIX. Cible les obliques.',
    descriptionEn: 'MATRIX torso rotation. Targets obliques.',
    machineSettings: { seatHeight: 'Ajustable' },
  }),
  ex('MATRIX Back Extension', 'MATRIX Back Extension', 'back', ['glutes'], 'machine', {
    isMATRIX: true,
    description: 'Extension lombaire MATRIX. Renforce le bas du dos.',
    descriptionEn: 'MATRIX back extension. Strengthens lower back.',
  }),

  // --- MATRIX Cardio ---
  ex('MATRIX Treadmill', 'MATRIX Treadmill', 'cardio', [], 'cardio_machine', {
    isMATRIX: true,
    description: 'Tapis de course MATRIX. Course et marche avec inclinaison.',
    descriptionEn: 'MATRIX treadmill. Running and walking with incline.',
  }),
  ex('MATRIX Elliptique', 'MATRIX Elliptical', 'cardio', ['full_body'], 'cardio_machine', {
    isMATRIX: true,
    description: 'Vélo elliptique MATRIX. Cardio faible impact corps entier.',
    descriptionEn: 'MATRIX elliptical. Low-impact full-body cardio.',
  }),
  ex('MATRIX Vélo', 'MATRIX Upright Bike', 'cardio', ['quadriceps'], 'cardio_machine', {
    isMATRIX: true,
    description: 'Vélo stationnaire MATRIX.',
    descriptionEn: 'MATRIX upright stationary bike.',
  }),
  ex('MATRIX Vélo couché', 'MATRIX Recumbent Bike', 'cardio', ['quadriceps'], 'cardio_machine', {
    isMATRIX: true,
    description: 'Vélo couché MATRIX. Position assise confortable.',
    descriptionEn: 'MATRIX recumbent bike. Comfortable seated position.',
  }),
  ex('MATRIX Rameur', 'MATRIX Rower', 'cardio', ['back', 'biceps'], 'cardio_machine', {
    isMATRIX: true,
    description: 'Rameur MATRIX. Cardio corps entier.',
    descriptionEn: 'MATRIX rowing machine. Full body cardio.',
  }),
  ex('MATRIX ClimbMill', 'MATRIX ClimbMill', 'cardio', ['quadriceps', 'glutes', 'calves'], 'cardio_machine', {
    isMATRIX: true,
    description: 'Escalier MATRIX (ClimbMill). Simule la montée d\'escaliers.',
    descriptionEn: 'MATRIX ClimbMill. Simulates stair climbing.',
  }),

  // --- MATRIX Cable / Functional ---
  ex('MATRIX Functional Trainer', 'MATRIX Functional Trainer', 'full_body', [], 'cable', {
    isMATRIX: true,
    description: 'Trainer fonctionnel MATRIX. Double poulie ajustable pour exercices variés.',
    descriptionEn: 'MATRIX functional trainer. Dual adjustable pulley for various exercises.',
    machineSettings: { cableHeight: 'Ajustable' },
  }),
  ex('MATRIX Smith Machine', 'MATRIX Smith Machine', 'full_body', [], 'smith_machine', {
    isMATRIX: true,
    description: 'Smith Machine MATRIX. Barre guidée pour squats, développés, etc.',
    descriptionEn: 'MATRIX Smith Machine. Guided bar for squats, presses, etc.',
  }),
];

export async function seedExercises(db: import('./db').KarnetDB): Promise<void> {
  const count = await db.exercises.where('isCustom').equals(0).count();
  if (count === 0) {
    await db.exercises.bulkPut(defaultExercises);
  }
}
