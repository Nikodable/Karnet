import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuid } from 'uuid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Fab from '@mui/material/Fab';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import InputAdornment from '@mui/material/InputAdornment';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import FitnessCenterRoundedIcon from '@mui/icons-material/FitnessCenterRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { db } from '../data/db';
import type { Program, ProgramWorkout, ProgramExercise, Exercise } from '../types';

export default function ProgramsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const programs = useLiveQuery(() => db.programs.toArray()) ?? [];
  const exercises = useLiveQuery(() => db.exercises.toArray()) ?? [];

  const [createOpen, setCreateOpen] = useState(false);
  const [editProgram, setEditProgram] = useState<Program | null>(null);
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formWorkouts, setFormWorkouts] = useState<ProgramWorkout[]>([]);
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [currentWorkoutIndex, setCurrentWorkoutIndex] = useState(0);
  const [exerciseSearch, setExerciseSearch] = useState('');

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormWorkouts([]);
  };

  const openCreate = () => {
    resetForm();
    setEditProgram(null);
    setCreateOpen(true);
  };

  const openEdit = (program: Program) => {
    setFormName(program.name);
    setFormDescription(program.description || '');
    setFormWorkouts([...program.workouts]);
    setEditProgram(program);
    setCreateOpen(true);
  };

  const addWorkoutTemplate = () => {
    setFormWorkouts([
      ...formWorkouts,
      {
        id: uuid(),
        name: `${t('workout.title')} ${formWorkouts.length + 1}`,
        order: formWorkouts.length,
        exercises: [],
      },
    ]);
  };

  const removeWorkoutTemplate = (index: number) => {
    setFormWorkouts(formWorkouts.filter((_, i) => i !== index));
  };

  const updateWorkoutName = (index: number, name: string) => {
    const updated = [...formWorkouts];
    updated[index] = { ...updated[index], name };
    setFormWorkouts(updated);
  };

  const addExerciseToWorkout = (exercise: Exercise) => {
    const updated = [...formWorkouts];
    const workout = updated[currentWorkoutIndex];
    const programExercise: ProgramExercise = {
      id: uuid(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      order: workout.exercises.length,
      targetSets: 3,
      targetReps: 10,
    };
    workout.exercises = [...workout.exercises, programExercise];
    setFormWorkouts(updated);
    setExercisePickerOpen(false);
  };

  const removeExerciseFromWorkout = (workoutIndex: number, exerciseIndex: number) => {
    const updated = [...formWorkouts];
    updated[workoutIndex].exercises = updated[workoutIndex].exercises.filter(
      (_, i) => i !== exerciseIndex
    );
    setFormWorkouts(updated);
  };

  const updateExerciseTarget = (
    workoutIndex: number,
    exerciseIndex: number,
    field: 'targetSets' | 'targetReps' | 'targetWeight',
    value: number
  ) => {
    const updated = [...formWorkouts];
    updated[workoutIndex].exercises[exerciseIndex] = {
      ...updated[workoutIndex].exercises[exerciseIndex],
      [field]: value,
    };
    setFormWorkouts(updated);
  };

  const saveProgram = async () => {
    if (!formName.trim()) return;

    const now = new Date().toISOString();
    if (editProgram) {
      await db.programs.update(editProgram.id, {
        name: formName,
        description: formDescription || undefined,
        workouts: formWorkouts,
        updatedAt: now,
      });
    } else {
      const program: Program = {
        id: uuid(),
        name: formName,
        description: formDescription || undefined,
        workouts: formWorkouts,
        frequency: formWorkouts.length,
        isActive: programs.length === 0,
        createdAt: now,
        updatedAt: now,
      };
      await db.programs.add(program);
    }
    setCreateOpen(false);
    resetForm();
  };

  const toggleActive = async (programId: string) => {
    // Deactivate all others
    for (const p of programs) {
      if (p.id !== programId && p.isActive) {
        await db.programs.update(p.id, { isActive: false });
      }
    }
    const current = programs.find((p) => p.id === programId);
    await db.programs.update(programId, { isActive: !current?.isActive });
  };

  const deleteProgram = async (programId: string) => {
    await db.programs.delete(programId);
    setDeleteConfirm(null);
  };

  const filteredExercises = exercises.filter(
    (ex) =>
      ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      ex.nameEn.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackRoundedIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t('program.myPrograms')}
        </Typography>
      </Box>

      {programs.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <FitnessCenterRoundedIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.4 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
            {t('home.noActiveProgram')}
          </Typography>
          <Button variant="contained" onClick={openCreate} startIcon={<AddRoundedIcon />} sx={{ borderRadius: 20 }}>
            {t('program.createProgram')}
          </Button>
        </Box>
      ) : (
        <Stack spacing={2}>
          {programs.map((program) => (
            <Card key={program.id} sx={{ borderRadius: 5 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {program.name}
                    </Typography>
                    {program.description && (
                      <Typography variant="body2" color="text.secondary">
                        {program.description}
                      </Typography>
                    )}
                  </Box>
                  {program.isActive && (
                    <Chip
                      icon={<StarRoundedIcon />}
                      label={t('program.active')}
                      color="primary"
                      size="small"
                      sx={{ borderRadius: 8 }}
                    />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {program.workouts.length} {t('program.sessionsPerWeek')}
                </Typography>

                <Collapse in={expandedProgram === program.id}>
                  <Divider sx={{ my: 2 }} />
                  {program.workouts.map((workout, wi) => (
                    <Box key={workout.id} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        {workout.name}
                      </Typography>
                      {workout.exercises.map((ex) => (
                        <Box key={ex.id} sx={{ display: 'flex', justifyContent: 'space-between', pl: 2, py: 0.5 }}>
                          <Typography variant="body2">{ex.exerciseName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {ex.targetSets}x{ex.targetReps}
                            {ex.targetWeight ? ` @ ${ex.targetWeight}kg` : ''}
                          </Typography>
                        </Box>
                      ))}
                      {wi < program.workouts.length - 1 && <Divider sx={{ mt: 1 }} />}
                    </Box>
                  ))}
                </Collapse>
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Box>
                  <IconButton size="small" onClick={() => openEdit(program)}>
                    <EditRoundedIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => setDeleteConfirm(program.id)} color="error">
                    <DeleteRoundedIcon fontSize="small" />
                  </IconButton>
                  <Button
                    size="small"
                    onClick={() => toggleActive(program.id)}
                    sx={{ borderRadius: 20, ml: 1 }}
                  >
                    {program.isActive ? t('program.active') : t('program.setAsActive')}
                  </Button>
                </Box>
                <IconButton
                  size="small"
                  onClick={() =>
                    setExpandedProgram(expandedProgram === program.id ? null : program.id)
                  }
                >
                  {expandedProgram === program.id ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                </IconButton>
              </CardActions>
            </Card>
          ))}
        </Stack>
      )}

      {/* FAB */}
      {programs.length > 0 && (
        <Fab
          color="primary"
          onClick={openCreate}
          sx={{ position: 'fixed', bottom: 96, right: 16, borderRadius: 4 }}
        >
          <AddRoundedIcon />
        </Fab>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullScreen>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => setCreateOpen(false)}>
            <ArrowBackRoundedIcon />
          </IconButton>
          {editProgram ? t('program.editProgram') : t('program.createProgram')}
        </DialogTitle>
        <DialogContent sx={{ px: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t('program.programName')}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label={t('program.programDescription')}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />

            <Divider />

            {formWorkouts.map((workout, wi) => (
              <Card key={workout.id} variant="outlined" sx={{ borderRadius: 4, p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TextField
                    value={workout.name}
                    onChange={(e) => updateWorkoutName(wi, e.target.value)}
                    size="small"
                    variant="standard"
                    sx={{ flex: 1, '& .MuiInputBase-input': { fontWeight: 600 } }}
                  />
                  <IconButton size="small" color="error" onClick={() => removeWorkoutTemplate(wi)}>
                    <DeleteRoundedIcon fontSize="small" />
                  </IconButton>
                </Box>

                {workout.exercises.map((ex, ei) => (
                  <Box
                    key={ex.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      py: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                      {ex.exerciseName}
                    </Typography>
                    <TextField
                      type="number"
                      value={ex.targetSets}
                      onChange={(e) => updateExerciseTarget(wi, ei, 'targetSets', parseInt(e.target.value) || 0)}
                      size="small"
                      sx={{ width: 60 }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">s</InputAdornment>,
                      }}
                    />
                    <TextField
                      type="number"
                      value={ex.targetReps || ''}
                      onChange={(e) => updateExerciseTarget(wi, ei, 'targetReps', parseInt(e.target.value) || 0)}
                      size="small"
                      sx={{ width: 60 }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">r</InputAdornment>,
                      }}
                    />
                    <IconButton size="small" onClick={() => removeExerciseFromWorkout(wi, ei)}>
                      <DeleteRoundedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}

                <Button
                  startIcon={<AddRoundedIcon />}
                  onClick={() => {
                    setCurrentWorkoutIndex(wi);
                    setExercisePickerOpen(true);
                  }}
                  size="small"
                  sx={{ mt: 1, borderRadius: 20 }}
                >
                  {t('workout.addExercise')}
                </Button>
              </Card>
            ))}

            <Button
              variant="outlined"
              startIcon={<AddRoundedIcon />}
              onClick={addWorkoutTemplate}
              sx={{ borderRadius: 20 }}
            >
              {t('program.addWorkout')}
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={saveProgram} disabled={!formName.trim()}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Exercise Picker */}
      <Dialog open={exercisePickerOpen} onClose={() => setExercisePickerOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('workout.addExercise')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder={t('workout.searchExercise')}
            value={exerciseSearch}
            onChange={(e) => setExerciseSearch(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon />
                </InputAdornment>
              ),
            }}
          />
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredExercises.map((exercise) => (
              <ListItemButton
                key={exercise.id}
                onClick={() => addExerciseToWorkout(exercise)}
                sx={{ borderRadius: 3, mb: 0.5 }}
              >
                <ListItemText
                  primary={exercise.name}
                  secondary={exercise.isMATRIX ? 'MATRIX' : undefined}
                />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>{t('program.confirmDelete')}</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => deleteConfirm && deleteProgram(deleteConfirm)}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
