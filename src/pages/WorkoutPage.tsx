import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { db } from '../data/db';
import {
  formatTime,
  sessionVolume,
  sessionTotalSets,
  sessionTotalReps,
  formatDuration,
  formatWeight,
} from '../utils/calculations';
import type {
  WorkoutSession,
  WorkoutExercise,
  ExerciseSet,
  Exercise,
  MachineSettings,
  MuscleGroup,
} from '../types';

// --- MUI Components ---
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Fab from '@mui/material/Fab';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Slide from '@mui/material/Slide';
import InputAdornment from '@mui/material/InputAdornment';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';


// --- MUI Icons ---
import AddRounded from '@mui/icons-material/AddRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import FitnessCenterRounded from '@mui/icons-material/FitnessCenterRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import DoneAllRounded from '@mui/icons-material/DoneAllRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import SentimentVeryDissatisfiedRounded from '@mui/icons-material/SentimentVeryDissatisfiedRounded';
import SentimentSatisfiedRounded from '@mui/icons-material/SentimentSatisfiedRounded';
import SentimentVerySatisfiedRounded from '@mui/icons-material/SentimentVerySatisfiedRounded';

// ==========================================
// Constants
// ==========================================

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'quadriceps', 'hamstrings', 'glutes', 'calves', 'abs', 'obliques',
  'traps', 'lats', 'cardio', 'full_body',
];

const SET_TYPES = ['warmup', 'normal', 'dropset', 'failure'] as const;

const SET_TYPE_COLORS: Record<string, string> = {
  warmup: '#FFA726',
  normal: '#66BB6A',
  dropset: '#AB47BC',
  failure: '#EF5350',
};

// ==========================================
// Helper: Create a fresh default set
// ==========================================
function createDefaultSet(setNumber: number): ExerciseSet {
  return {
    id: uuid(),
    setNumber,
    type: 'normal',
    weight: undefined,
    reps: undefined,
    rpe: undefined,
    restAfter: 90,
    completed: false,
  };
}

// ==========================================
// Helper: Create a new empty WorkoutSession
// ==========================================
function createNewSession(): WorkoutSession {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    name: '',
    date: now.split('T')[0],
    startTime: now,
    exercises: [],
    status: 'in_progress',
    createdAt: now,
    updatedAt: now,
  };
}

// ==========================================
// Slide transition for dialogs
// ==========================================
const SlideUp = Slide;

// ==========================================
// WorkoutPage Component
// ==========================================
export default function WorkoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // --- Session ID tracking ---
  const sessionIdRef = useRef<string | null>(null);

  // --- Elapsed time ---
  const [elapsed, setElapsed] = useState(0);

  // --- Dialog states ---
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [machineSettingsOpen, setMachineSettingsOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState<string | null>(null); // workoutExercise ID

  // --- Machine settings dialog state ---
  const [machineSettingsTarget, setMachineSettingsTarget] = useState<string | null>(null);
  const [machineSettingsForm, setMachineSettingsForm] = useState<MachineSettings>({});

  // --- Finish dialog state ---
  const [finishMood, setFinishMood] = useState<1 | 2 | 3 | 4 | 5>(3);

  // --- Exercise picker state ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | 'all'>('all');
  const [pickerTab, setPickerTab] = useState(0); // 0=All, 1=Favorites, 2=MATRIX, 3=Custom

  // --- Workout name edit ---
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');

  // ==========================================
  // Live queries
  // ==========================================

  // Find or create active session
  const activeSession = useLiveQuery(async () => {
    const sessions = await db.workoutSessions
      .where('status')
      .equals('in_progress')
      .toArray();

    if (sessions.length > 0) {
      sessionIdRef.current = sessions[0].id;
      return sessions[0];
    }

    // No active session: create one
    const newSession = createNewSession();
    await db.workoutSessions.put(newSession);
    sessionIdRef.current = newSession.id;
    return newSession;
  }, []);

  // All exercises from DB
  const allExercises = useLiveQuery(() => db.exercises.toArray(), []);

  // ==========================================
  // Elapsed timer
  // ==========================================
  useEffect(() => {
    if (!activeSession?.startTime) return;

    const updateElapsed = () => {
      const start = new Date(activeSession.startTime).getTime();
      setElapsed(Math.floor((Date.now() - start) / 1000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeSession?.startTime]);

  // Sync name field when session loads
  useEffect(() => {
    if (activeSession && !editingName) {
      setNameValue(activeSession.name);
    }
  }, [activeSession?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  // ==========================================
  // Persist helpers
  // ==========================================

  const persistSession = useCallback(
    async (updates: Partial<WorkoutSession>) => {
      if (!sessionIdRef.current) return;
      await db.workoutSessions.update(sessionIdRef.current, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    },
    []
  );

  const persistExercises = useCallback(
    async (exercises: WorkoutExercise[]) => {
      await persistSession({ exercises });
    },
    [persistSession]
  );

  // ==========================================
  // Workout name handlers
  // ==========================================

  const handleNameBlur = () => {
    setEditingName(false);
    if (nameValue !== activeSession?.name) {
      persistSession({ name: nameValue });
    }
  };

  // ==========================================
  // Exercise CRUD
  // ==========================================

  const addExerciseToWorkout = (exercise: Exercise) => {
    if (!activeSession) return;
    const newWorkoutExercise: WorkoutExercise = {
      id: uuid(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      order: activeSession.exercises.length,
      sets: [createDefaultSet(1)],
      machineSettings: exercise.machineSettings ? { ...exercise.machineSettings } : undefined,
      notes: '',
    };
    const updated = [...activeSession.exercises, newWorkoutExercise];
    persistExercises(updated);
    setExercisePickerOpen(false);
  };

  const removeExerciseFromWorkout = (workoutExerciseId: string) => {
    if (!activeSession) return;
    const updated = activeSession.exercises
      .filter((e) => e.id !== workoutExerciseId)
      .map((e, i) => ({ ...e, order: i }));
    persistExercises(updated);
  };

  // ==========================================
  // Set CRUD
  // ==========================================

  const addSet = (workoutExerciseId: string) => {
    if (!activeSession) return;
    const updated = activeSession.exercises.map((ex) => {
      if (ex.id !== workoutExerciseId) return ex;
      const nextNumber = ex.sets.length + 1;
      return { ...ex, sets: [...ex.sets, createDefaultSet(nextNumber)] };
    });
    persistExercises(updated);
  };

  const removeSet = (workoutExerciseId: string, setId: string) => {
    if (!activeSession) return;
    const updated = activeSession.exercises.map((ex) => {
      if (ex.id !== workoutExerciseId) return ex;
      const filteredSets = ex.sets
        .filter((s) => s.id !== setId)
        .map((s, i) => ({ ...s, setNumber: i + 1 }));
      return { ...ex, sets: filteredSets };
    });
    persistExercises(updated);
  };

  const updateSet = (
    workoutExerciseId: string,
    setId: string,
    updates: Partial<ExerciseSet>
  ) => {
    if (!activeSession) return;
    const updated = activeSession.exercises.map((ex) => {
      if (ex.id !== workoutExerciseId) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...updates } : s)),
      };
    });
    persistExercises(updated);
  };

  // ==========================================
  // Machine settings handlers
  // ==========================================

  const openMachineSettings = (workoutExerciseId: string) => {
    if (!activeSession) return;
    const ex = activeSession.exercises.find((e) => e.id === workoutExerciseId);
    setMachineSettingsTarget(workoutExerciseId);
    setMachineSettingsForm(ex?.machineSettings || {});
    setMachineSettingsOpen(true);
  };

  const saveMachineSettings = () => {
    if (!activeSession || !machineSettingsTarget) return;
    const updated = activeSession.exercises.map((ex) => {
      if (ex.id !== machineSettingsTarget) return ex;
      return { ...ex, machineSettings: { ...machineSettingsForm } };
    });
    persistExercises(updated);
    setMachineSettingsOpen(false);
    setMachineSettingsTarget(null);
  };

  // ==========================================
  // Exercise notes handler
  // ==========================================

  const updateExerciseNotes = (workoutExerciseId: string, notes: string) => {
    if (!activeSession) return;
    const updated = activeSession.exercises.map((ex) => {
      if (ex.id !== workoutExerciseId) return ex;
      return { ...ex, notes };
    });
    persistExercises(updated);
  };

  // ==========================================
  // Finish workout
  // ==========================================

  const finishWorkout = async () => {
    if (!activeSession) return;
    const endTime = new Date().toISOString();
    const startMs = new Date(activeSession.startTime).getTime();
    const endMs = new Date(endTime).getTime();
    const durationMin = Math.round((endMs - startMs) / 60000);

    const vol = sessionVolume(activeSession);
    const sets = sessionTotalSets(activeSession);
    const reps = sessionTotalReps(activeSession);

    await persistSession({
      status: 'completed',
      endTime,
      duration: durationMin,
      totalVolume: vol,
      totalSets: sets,
      totalReps: reps,
      mood: finishMood,
      name: activeSession.name || t('workout.newWorkout'),
    });

    setFinishDialogOpen(false);
    navigate('/');
  };

  // ==========================================
  // Exercise picker filtering
  // ==========================================

  const filteredExercises = (() => {
    if (!allExercises) return [];

    let list = [...allExercises];

    // Tab filter
    switch (pickerTab) {
      case 1: // Favorites - for now show all; favorites feature can be added later
        list = [];
        break;
      case 2: // MATRIX
        list = list.filter((e) => e.isMATRIX);
        break;
      case 3: // Custom
        list = list.filter((e) => e.isCustom);
        break;
      default: // All
        break;
    }

    // Muscle group filter
    if (filterMuscle !== 'all') {
      list = list.filter(
        (e) => e.category === filterMuscle || e.secondaryMuscles.includes(filterMuscle)
      );
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.nameEn.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          t(`exercise.muscles.${e.category}`).toLowerCase().includes(q)
      );
    }

    return list;
  })();

  // Group exercises by muscle category for display
  const groupedExercises = (() => {
    const groups: Record<string, Exercise[]> = {};
    for (const ex of filteredExercises) {
      const key = ex.category;
      if (!groups[key]) groups[key] = [];
      groups[key].push(ex);
    }
    return groups;
  })();

  // ==========================================
  // Loading state
  // ==========================================

  if (!activeSession) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Typography color="text.secondary">{t('common.loading')}</Typography>
      </Box>
    );
  }

  // Calculate summary values for finish dialog
  const summaryVolume = sessionVolume(activeSession);
  const summarySets = sessionTotalSets(activeSession);
  const summaryReps = sessionTotalReps(activeSession);
  const summaryDuration = Math.round(elapsed / 60);

  // ==========================================
  // Render
  // ==========================================

  return (
    <Box sx={{ pb: 12 }}>
      {/* ============================== */}
      {/* TOP SECTION: Name, time, status */}
      {/* ============================== */}
      <Card
        sx={{
          borderRadius: '24px',
          mb: 2,
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.primary.main}18, ${theme.palette.primary.main}08)`,
        }}
      >
        <CardContent sx={{ px: 2.5, py: 2 }}>
          {/* Workout name */}
          {editingName ? (
            <TextField
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
              autoFocus
              fullWidth
              variant="standard"
              placeholder={t('workout.workoutName')}
              sx={{
                mb: 1,
                '& .MuiInputBase-input': {
                  fontSize: '1.4rem',
                  fontWeight: 600,
                },
              }}
            />
          ) : (
            <Typography
              variant="h5"
              onClick={() => setEditingName(true)}
              sx={{
                fontWeight: 600,
                cursor: 'pointer',
                mb: 1,
                minHeight: 36,
                color: activeSession.name ? 'text.primary' : 'text.secondary',
              }}
            >
              {activeSession.name || t('workout.workoutName')}
            </Typography>
          )}

          {/* Time and status row */}
          <Stack direction="row" alignItems="center" spacing={2}>
            <Chip
              label={t('workout.inProgress')}
              color="primary"
              size="small"
              icon={<FitnessCenterRounded />}
              sx={{ borderRadius: '12px', fontWeight: 600 }}
            />
            <Typography
              variant="h6"
              sx={{
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 700,
                color: 'primary.main',
              }}
            >
              {formatTime(elapsed)}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<DoneAllRounded />}
              onClick={() => setFinishDialogOpen(true)}
              sx={{ borderRadius: '20px', fontWeight: 600, px: 2 }}
            >
              {t('workout.finish')}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* ============================== */}
      {/* EXERCISE LIST */}
      {/* ============================== */}
      {activeSession.exercises.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
            gap: 2,
          }}
        >
          <FitnessCenterRounded sx={{ fontSize: 64, color: 'text.disabled', opacity: 0.4 }} />
          <Typography color="text.secondary" variant="body1">
            {t('workout.noExercises')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => setExercisePickerOpen(true)}
            sx={{ borderRadius: '20px', mt: 1, px: 3 }}
          >
            {t('workout.addExercise')}
          </Button>
        </Box>
      ) : (
        <Stack spacing={2}>
          {activeSession.exercises.map((workoutEx) => {
            // Find the original exercise for muscle group info
            const originalExercise = allExercises?.find((e) => e.id === workoutEx.exerciseId);

            return (
              <Card key={workoutEx.id} sx={{ borderRadius: '20px', overflow: 'visible' }}>
                <CardContent sx={{ px: 2, py: 2, '&:last-child': { pb: 2 } }}>
                  {/* Exercise header */}
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }} noWrap>
                        {workoutEx.exerciseName}
                      </Typography>
                      {originalExercise && (
                        <Chip
                          label={t(`exercise.muscles.${originalExercise.category}`)}
                          size="small"
                          sx={{
                            mt: 0.5,
                            borderRadius: '8px',
                            fontSize: '0.7rem',
                            height: 22,
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            fontWeight: 600,
                          }}
                        />
                      )}
                    </Box>

                    {/* Machine settings button */}
                    <IconButton
                      size="small"
                      onClick={() => openMachineSettings(workoutEx.id)}
                      sx={{
                        bgcolor: 'action.hover',
                        borderRadius: '12px',
                      }}
                    >
                      <SettingsRounded fontSize="small" />
                    </IconButton>

                    {/* Notes toggle */}
                    <IconButton
                      size="small"
                      onClick={() =>
                        setNotesOpen(notesOpen === workoutEx.id ? null : workoutEx.id)
                      }
                      sx={{
                        bgcolor: workoutEx.notes ? 'primary.main' : 'action.hover',
                        color: workoutEx.notes ? 'primary.contrastText' : 'inherit',
                        borderRadius: '12px',
                      }}
                    >
                      <ExpandMoreRounded
                        fontSize="small"
                        sx={{
                          transform: notesOpen === workoutEx.id ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s',
                        }}
                      />
                    </IconButton>

                    {/* Delete exercise */}
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeExerciseFromWorkout(workoutEx.id)}
                      sx={{ borderRadius: '12px' }}
                    >
                      <DeleteRounded fontSize="small" />
                    </IconButton>
                  </Stack>

                  {/* Collapsible notes */}
                  {notesOpen === workoutEx.id && (
                    <TextField
                      value={workoutEx.notes || ''}
                      onChange={(e) => updateExerciseNotes(workoutEx.id, e.target.value)}
                      placeholder={t('workout.notes')}
                      multiline
                      minRows={2}
                      maxRows={4}
                      fullWidth
                      size="small"
                      sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                  )}

                  {/* Sets header row */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '36px 72px 72px 56px 40px 36px 36px',
                      gap: 0.5,
                      alignItems: 'center',
                      mb: 0.5,
                      px: 0.5,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textAlign: 'center' }}>
                      #
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textAlign: 'center' }}>
                      {t('workout.weight')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textAlign: 'center' }}>
                      {t('workout.reps')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textAlign: 'center' }}>
                      RPE
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textAlign: 'center' }}>
                      {t('workout.rest')}
                    </Typography>
                    <Box /> {/* Completed */}
                    <Box /> {/* Delete */}
                  </Box>

                  {/* Sets rows */}
                  {workoutEx.sets.map((set) => (
                    <Box
                      key={set.id}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '36px 72px 72px 56px 40px 36px 36px',
                        gap: 0.5,
                        alignItems: 'center',
                        py: 0.5,
                        px: 0.5,
                        borderRadius: '12px',
                        bgcolor: set.completed ? 'success.main' : 'transparent',
                        ...(set.completed && { bgcolor: (theme) => `${theme.palette.success.main}14` }),
                        transition: 'background-color 0.2s',
                      }}
                    >
                      {/* Set number + type chip */}
                      <Chip
                        label={set.setNumber}
                        size="small"
                        onClick={() => {
                          const currentIndex = SET_TYPES.indexOf(set.type);
                          const nextType = SET_TYPES[(currentIndex + 1) % SET_TYPES.length];
                          updateSet(workoutEx.id, set.id, { type: nextType });
                        }}
                        sx={{
                          bgcolor: SET_TYPE_COLORS[set.type] + '30',
                          color: SET_TYPE_COLORS[set.type],
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          height: 28,
                          minWidth: 28,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          '& .MuiChip-label': { px: 0.5 },
                        }}
                        title={t(`workout.${set.type}`)}
                      />

                      {/* Weight */}
                      <TextField
                        type="number"
                        value={set.weight ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                          updateSet(workoutEx.id, set.id, { weight: val });
                        }}
                        size="small"
                        placeholder="0"
                        inputProps={{ min: 0, step: 0.5, style: { textAlign: 'center', padding: '6px 4px', fontSize: '0.85rem' } }}
                        sx={{
                          '& .MuiOutlinedInput-root': { borderRadius: '10px', height: 34 },
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
                        }}
                      />

                      {/* Reps */}
                      <TextField
                        type="number"
                        value={set.reps ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                          updateSet(workoutEx.id, set.id, { reps: val });
                        }}
                        size="small"
                        placeholder="0"
                        inputProps={{ min: 0, step: 1, style: { textAlign: 'center', padding: '6px 4px', fontSize: '0.85rem' } }}
                        sx={{
                          '& .MuiOutlinedInput-root': { borderRadius: '10px', height: 34 },
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
                        }}
                      />

                      {/* RPE */}
                      <Select
                        value={set.rpe ?? ''}
                        onChange={(e) => {
                          const val = String(e.target.value) === '' ? undefined : Number(e.target.value);
                          updateSet(workoutEx.id, set.id, { rpe: val });
                        }}
                        size="small"
                        displayEmpty
                        sx={{
                          borderRadius: '10px',
                          height: 34,
                          fontSize: '0.8rem',
                          '& .MuiSelect-select': { py: 0.5, textAlign: 'center' },
                        }}
                      >
                        <MenuItem value="">-</MenuItem>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                          <MenuItem key={v} value={v}>
                            {v}
                          </MenuItem>
                        ))}
                      </Select>

                      {/* Rest time (display) */}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}
                      >
                        {set.restAfter ? `${Math.floor(set.restAfter / 60)}:${(set.restAfter % 60).toString().padStart(2, '0')}` : '-'}
                      </Typography>

                      {/* Completed checkbox */}
                      <Checkbox
                        checked={set.completed}
                        onChange={(e) =>
                          updateSet(workoutEx.id, set.id, { completed: e.target.checked })
                        }
                        icon={<Box sx={{ width: 24, height: 24, borderRadius: '8px', border: '2px solid', borderColor: 'divider' }} />}
                        checkedIcon={
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: '8px',
                              bgcolor: 'success.main',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <CheckRounded sx={{ fontSize: 16, color: 'white' }} />
                          </Box>
                        }
                        sx={{ p: 0 }}
                      />

                      {/* Delete set */}
                      <IconButton
                        size="small"
                        onClick={() => removeSet(workoutEx.id, set.id)}
                        sx={{ p: 0.5 }}
                      >
                        <DeleteRounded sx={{ fontSize: 16, color: 'text.disabled' }} />
                      </IconButton>
                    </Box>
                  ))}

                  {/* Set type legend (tiny) */}
                  <Stack direction="row" spacing={0.5} sx={{ mt: 1, mb: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                    {SET_TYPES.map((type) => (
                      <Chip
                        key={type}
                        label={t(`workout.${type}`)}
                        size="small"
                        sx={{
                          bgcolor: SET_TYPE_COLORS[type] + '20',
                          color: SET_TYPE_COLORS[type],
                          fontSize: '0.65rem',
                          height: 20,
                          borderRadius: '6px',
                          fontWeight: 600,
                          '& .MuiChip-label': { px: 0.75 },
                        }}
                      />
                    ))}
                  </Stack>

                  {/* Add Set button */}
                  <Button
                    size="small"
                    startIcon={<AddRounded />}
                    onClick={() => addSet(workoutEx.id)}
                    sx={{
                      mt: 1,
                      borderRadius: '14px',
                      textTransform: 'none',
                      fontWeight: 600,
                      bgcolor: 'action.hover',
                      color: 'text.primary',
                      '&:hover': { bgcolor: 'action.selected' },
                    }}
                    fullWidth
                  >
                    {t('workout.addSet')}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* ============================== */}
      {/* ADD EXERCISE FAB */}
      {/* ============================== */}
      <Fab
        color="primary"
        variant="extended"
        onClick={() => setExercisePickerOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 96,
          left: '50%',
          transform: 'translateX(-50%)',
          borderRadius: '20px',
          px: 3,
          fontWeight: 600,
          textTransform: 'none',
          zIndex: 1000,
          boxShadow: 4,
        }}
      >
        <AddRounded sx={{ mr: 1 }} />
        {t('workout.addExercise')}
      </Fab>

      {/* ============================== */}
      {/* EXERCISE PICKER DIALOG */}
      {/* ============================== */}
      <Dialog
        open={exercisePickerOpen}
        onClose={() => setExercisePickerOpen(false)}
        fullScreen
        TransitionComponent={SlideUp}
        TransitionProps={{ direction: 'up' } as any}
      >
        {/* Picker header */}
        <Box
          sx={{
            px: 2,
            pt: 2,
            pb: 1,
            position: 'sticky',
            top: 0,
            bgcolor: 'background.paper',
            zIndex: 10,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <IconButton onClick={() => setExercisePickerOpen(false)}>
              <CloseRounded />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
              {t('workout.addExercise')}
            </Typography>
          </Stack>

          {/* Search bar */}
          <TextField
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('workout.searchExercise')}
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 1.5,
              '& .MuiOutlinedInput-root': { borderRadius: '16px' },
            }}
          />

          {/* Tabs: All, Favorites, MATRIX, Custom */}
          <Tabs
            value={pickerTab}
            onChange={(_, v) => setPickerTab(v)}
            variant="fullWidth"
            sx={{
              mb: 1,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                borderRadius: '12px',
                minHeight: 40,
              },
              '& .MuiTabs-indicator': { borderRadius: '4px', height: 3 },
            }}
          >
            <Tab label={t('exercise.allExercises')} />
            <Tab label={t('exercise.favorites')} />
            <Tab label="MATRIX" />
            <Tab label={t('exercise.custom')} />
          </Tabs>

          {/* Muscle group chips - horizontal scroll */}
          <Box
            sx={{
              display: 'flex',
              gap: 0.75,
              overflowX: 'auto',
              pb: 1,
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
            }}
          >
            <Chip
              label={t('exercise.allExercises')}
              size="small"
              variant={filterMuscle === 'all' ? 'filled' : 'outlined'}
              color={filterMuscle === 'all' ? 'primary' : 'default'}
              onClick={() => setFilterMuscle('all')}
              sx={{ borderRadius: '10px', fontWeight: 600, flexShrink: 0 }}
            />
            {MUSCLE_GROUPS.map((mg) => (
              <Chip
                key={mg}
                label={t(`exercise.muscles.${mg}`)}
                size="small"
                variant={filterMuscle === mg ? 'filled' : 'outlined'}
                color={filterMuscle === mg ? 'primary' : 'default'}
                onClick={() => setFilterMuscle(filterMuscle === mg ? 'all' : mg)}
                sx={{ borderRadius: '10px', fontWeight: 600, flexShrink: 0 }}
              />
            ))}
          </Box>
        </Box>

        {/* Exercise list */}
        <DialogContent sx={{ px: 0, pt: 0 }}>
          {filteredExercises.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary">{t('common.noResults')}</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {Object.entries(groupedExercises).map(([group, exercises]) => (
                <Box key={group}>
                  <Typography
                    variant="overline"
                    sx={{
                      px: 2,
                      pt: 2,
                      pb: 0.5,
                      display: 'block',
                      fontWeight: 700,
                      color: 'primary.main',
                      letterSpacing: 1.2,
                    }}
                  >
                    {t(`exercise.muscles.${group}`)}
                  </Typography>
                  {exercises.map((exercise) => (
                    <ListItem key={exercise.id} disablePadding>
                      <ListItemButton
                        onClick={() => addExerciseToWorkout(exercise)}
                        sx={{ px: 2, py: 1.25 }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {exercise.name}
                            </Typography>
                          }
                          secondary={
                            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                              <Chip
                                label={t(`exercise.equipmentTypes.${exercise.equipment}`)}
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderRadius: '6px',
                                  fontSize: '0.65rem',
                                  height: 20,
                                  '& .MuiChip-label': { px: 0.75 },
                                }}
                              />
                              {exercise.isMATRIX && (
                                <Chip
                                  label="MATRIX"
                                  size="small"
                                  sx={{
                                    borderRadius: '6px',
                                    fontSize: '0.65rem',
                                    height: 20,
                                    bgcolor: 'secondary.main',
                                    color: 'secondary.contrastText',
                                    fontWeight: 700,
                                    '& .MuiChip-label': { px: 0.75 },
                                  }}
                                />
                              )}
                            </Stack>
                          }
                        />
                        <AddRounded color="primary" />
                      </ListItemButton>
                    </ListItem>
                  ))}
                  <Divider />
                </Box>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================== */}
      {/* MACHINE SETTINGS DIALOG */}
      {/* ============================== */}
      <Dialog
        open={machineSettingsOpen}
        onClose={() => setMachineSettingsOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
          {t('workout.machineSettings')}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t('workout.machineSettings')}
              value={machineSettingsForm.machineName || ''}
              onChange={(e) =>
                setMachineSettingsForm({ ...machineSettingsForm, machineName: e.target.value })
              }
              size="small"
              fullWidth
              placeholder="Machine name"
            />
            <TextField
              label={t('workout.seatHeight')}
              value={machineSettingsForm.seatHeight || ''}
              onChange={(e) =>
                setMachineSettingsForm({ ...machineSettingsForm, seatHeight: e.target.value })
              }
              size="small"
              fullWidth
            />
            <TextField
              label={t('workout.backPad')}
              value={machineSettingsForm.backPadPosition || ''}
              onChange={(e) =>
                setMachineSettingsForm({ ...machineSettingsForm, backPadPosition: e.target.value })
              }
              size="small"
              fullWidth
            />
            <TextField
              label={t('workout.armPosition')}
              value={machineSettingsForm.armPosition || ''}
              onChange={(e) =>
                setMachineSettingsForm({ ...machineSettingsForm, armPosition: e.target.value })
              }
              size="small"
              fullWidth
            />
            <TextField
              label={t('workout.footPlate')}
              value={machineSettingsForm.footPlatePosition || ''}
              onChange={(e) =>
                setMachineSettingsForm({ ...machineSettingsForm, footPlatePosition: e.target.value })
              }
              size="small"
              fullWidth
            />
            <TextField
              label={t('workout.handlePosition')}
              value={machineSettingsForm.handlePosition || ''}
              onChange={(e) =>
                setMachineSettingsForm({ ...machineSettingsForm, handlePosition: e.target.value })
              }
              size="small"
              fullWidth
            />
            <TextField
              label={t('workout.cableHeight')}
              value={machineSettingsForm.cableHeight || ''}
              onChange={(e) =>
                setMachineSettingsForm({ ...machineSettingsForm, cableHeight: e.target.value })
              }
              size="small"
              fullWidth
            />
            <TextField
              label={t('workout.notes')}
              value={machineSettingsForm.notes || ''}
              onChange={(e) =>
                setMachineSettingsForm({ ...machineSettingsForm, notes: e.target.value })
              }
              size="small"
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setMachineSettingsOpen(false)}
            sx={{ borderRadius: '16px' }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={saveMachineSettings}
            sx={{ borderRadius: '16px' }}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================== */}
      {/* FINISH WORKOUT DIALOG */}
      {/* ============================== */}
      <Dialog
        open={finishDialogOpen}
        onClose={() => setFinishDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 600, textAlign: 'center', pb: 0 }}>
          {t('workout.summary')}
        </DialogTitle>
        <DialogContent>
          {/* Summary stats */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 2,
              my: 3,
            }}
          >
            <Card
              sx={{
                borderRadius: '16px',
                bgcolor: 'action.hover',
                textAlign: 'center',
              }}
            >
              <CardContent sx={{ py: 1.5, px: 1, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {formatWeight(summaryVolume).replace(' kg', '')}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {t('workout.totalVolume')} (kg)
                </Typography>
              </CardContent>
            </Card>

            <Card
              sx={{
                borderRadius: '16px',
                bgcolor: 'action.hover',
                textAlign: 'center',
              }}
            >
              <CardContent sx={{ py: 1.5, px: 1, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {summarySets}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {t('workout.totalSets')}
                </Typography>
              </CardContent>
            </Card>

            <Card
              sx={{
                borderRadius: '16px',
                bgcolor: 'action.hover',
                textAlign: 'center',
              }}
            >
              <CardContent sx={{ py: 1.5, px: 1, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {summaryReps}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {t('workout.totalReps')}
                </Typography>
              </CardContent>
            </Card>

            <Card
              sx={{
                borderRadius: '16px',
                bgcolor: 'action.hover',
                textAlign: 'center',
              }}
            >
              <CardContent sx={{ py: 1.5, px: 1, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {formatDuration(summaryDuration)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {t('workout.workoutDuration')}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Mood selector */}
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, textAlign: 'center', mb: 1.5 }}
          >
            {t('workout.mood')}
          </Typography>

          <Stack direction="row" justifyContent="center" spacing={1.5} sx={{ mb: 1 }}>
            {([1, 2, 3, 4, 5] as const).map((mood) => (
              <IconButton
                key={mood}
                onClick={() => setFinishMood(mood)}
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '14px',
                  border: '2px solid',
                  borderColor: finishMood === mood ? 'primary.main' : 'divider',
                  bgcolor: finishMood === mood ? 'primary.main' : 'transparent',
                  color: finishMood === mood ? 'primary.contrastText' : 'text.secondary',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: finishMood === mood ? 'primary.main' : 'action.hover',
                  },
                }}
              >
                {mood <= 2 ? (
                  <SentimentVeryDissatisfiedRounded />
                ) : mood === 3 ? (
                  <SentimentSatisfiedRounded />
                ) : (
                  <SentimentVerySatisfiedRounded />
                )}
              </IconButton>
            ))}
          </Stack>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textAlign: 'center', display: 'block' }}
          >
            {t(`workout.moodLabels.${finishMood}`)}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setFinishDialogOpen(false)}
            sx={{ borderRadius: '16px', flex: 1 }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={finishWorkout}
            startIcon={<DoneAllRounded />}
            sx={{
              borderRadius: '16px',
              flex: 2,
              fontWeight: 600,
              py: 1.2,
            }}
          >
            {t('workout.finish')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
