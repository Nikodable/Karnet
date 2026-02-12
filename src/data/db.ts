import Dexie, { type Table } from 'dexie';
import type {
  Exercise,
  WorkoutSession,
  Program,
  Objective,
  BodyMeasurement,
  PersonalRecord,
  UserSettings,
} from '../types';

// ==========================================
// Karnet - IndexedDB Database (Dexie.js)
// ==========================================

export class KarnetDB extends Dexie {
  exercises!: Table<Exercise, string>;
  workoutSessions!: Table<WorkoutSession, string>;
  programs!: Table<Program, string>;
  objectives!: Table<Objective, string>;
  bodyMeasurements!: Table<BodyMeasurement, string>;
  personalRecords!: Table<PersonalRecord, string>;
  userSettings!: Table<UserSettings, string>;

  constructor() {
    super('KarnetDB');

    this.version(1).stores({
      exercises: 'id, name, category, equipment, isCustom, isMATRIX, createdAt',
      workoutSessions: 'id, date, status, programId, createdAt',
      programs: 'id, name, isActive, createdAt',
      objectives: 'id, type, status, exerciseId, targetDate, createdAt',
      bodyMeasurements: 'id, date, createdAt',
      personalRecords: 'id, exerciseId, type, date, createdAt',
      userSettings: 'id',
    });
  }
}

export const db = new KarnetDB();

// --- Helper: Get or create default settings ---
export async function getSettings(): Promise<UserSettings> {
  let settings = await db.userSettings.get('default');
  if (!settings) {
    settings = {
      id: 'default',
      language: 'fr',
      theme: 'system',
      dynamicColor: true,
      seedColor: '#FF6B35',
      weightUnit: 'kg',
      distanceUnit: 'km',
      defaultRestTimer: 90,
      timerSound: true,
      timerVibration: true,
      showWarmupSets: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.userSettings.put(settings);
  }
  return settings;
}

export async function updateSettings(
  updates: Partial<UserSettings>
): Promise<void> {
  await db.userSettings.update('default', {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}
