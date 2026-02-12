import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuid } from 'uuid';
import { format } from 'date-fns';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Fab from '@mui/material/Fab';
import TextField from '@mui/material/TextField';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import DirectionsRunRoundedIcon from '@mui/icons-material/DirectionsRunRounded';
import MonitorWeightRoundedIcon from '@mui/icons-material/MonitorWeightRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { db } from '../data/db';
import type { Objective, ObjectiveType, BodyMeasurement } from '../types';

const typeIcons: Record<ObjectiveType, React.ReactNode> = {
  performance: <TrendingUpRoundedIcon />,
  frequency: <DirectionsRunRoundedIcon />,
  body: <MonitorWeightRoundedIcon />,
};

const typeColors: Record<ObjectiveType, string> = {
  performance: '#6750A4',
  frequency: '#006D3B',
  body: '#BA1A1A',
};

export default function ObjectivesPage() {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editObjective, setEditObjective] = useState<Objective | null>(null);
  const [measurementOpen, setMeasurementOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const tabTypes: ObjectiveType[] = ['performance', 'frequency', 'body'];
  const currentType = tabTypes[tabValue];

  const objectives = useLiveQuery(
    () => db.objectives.where('type').equals(currentType).toArray(),
    [currentType]
  );

  const measurements = useLiveQuery(
    () => db.bodyMeasurements.orderBy('date').reverse().toArray(),
    []
  );

  const exercises = useLiveQuery(() => db.exercises.toArray(), []);

  // Form state
  const [form, setForm] = useState({
    type: 'performance' as ObjectiveType,
    title: '',
    description: '',
    targetValue: 0,
    currentValue: 0,
    unit: 'kg',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    targetDate: '',
    exerciseId: '',
    exerciseName: '',
  });

  // Measurement form
  const [measForm, setMeasForm] = useState<Partial<BodyMeasurement>>({
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const resetForm = () => {
    setForm({
      type: currentType,
      title: '',
      description: '',
      targetValue: 0,
      currentValue: 0,
      unit: currentType === 'body' ? 'kg' : currentType === 'frequency' ? 'fois' : 'kg',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      targetDate: '',
      exerciseId: '',
      exerciseName: '',
    });
  };

  const openCreate = () => {
    resetForm();
    setEditObjective(null);
    setCreateOpen(true);
  };

  const openEdit = (obj: Objective) => {
    setForm({
      type: obj.type,
      title: obj.title,
      description: obj.description || '',
      targetValue: obj.targetValue,
      currentValue: obj.currentValue,
      unit: obj.unit,
      startDate: obj.startDate,
      targetDate: obj.targetDate,
      exerciseId: obj.exerciseId || '',
      exerciseName: obj.exerciseName || '',
    });
    setEditObjective(obj);
    setCreateOpen(true);
  };

  const saveObjective = async () => {
    if (!form.title.trim()) return;
    const now = new Date().toISOString();

    if (editObjective) {
      await db.objectives.update(editObjective.id, {
        ...form,
        description: form.description || undefined,
        exerciseId: form.exerciseId || undefined,
        exerciseName: form.exerciseName || undefined,
        updatedAt: now,
      });
    } else {
      const objective: Objective = {
        id: uuid(),
        ...form,
        description: form.description || undefined,
        exerciseId: form.exerciseId || undefined,
        exerciseName: form.exerciseName || undefined,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };
      await db.objectives.add(objective);
    }
    setCreateOpen(false);
  };

  const toggleStatus = async (obj: Objective, newStatus: 'completed' | 'abandoned') => {
    await db.objectives.update(obj.id, { status: newStatus, updatedAt: new Date().toISOString() });
  };

  const deleteObjective = async (id: string) => {
    await db.objectives.delete(id);
    setDeleteConfirm(null);
  };

  const saveMeasurement = async () => {
    const now = new Date().toISOString();
    const measurement: BodyMeasurement = {
      id: uuid(),
      date: measForm.date || format(new Date(), 'yyyy-MM-dd'),
      weight: measForm.weight,
      bodyFat: measForm.bodyFat,
      chest: measForm.chest,
      waist: measForm.waist,
      hips: measForm.hips,
      bicepsLeft: measForm.bicepsLeft,
      bicepsRight: measForm.bicepsRight,
      thighLeft: measForm.thighLeft,
      thighRight: measForm.thighRight,
      calfLeft: measForm.calfLeft,
      calfRight: measForm.calfRight,
      neck: measForm.neck,
      shoulders: measForm.shoulders,
      notes: measForm.notes,
      createdAt: now,
    };
    await db.bodyMeasurements.add(measurement);
    setMeasurementOpen(false);
    setMeasForm({ date: format(new Date(), 'yyyy-MM-dd') });
  };

  const activeObjectives = objectives?.filter((o) => o.status === 'active') ?? [];
  const completedObjectives = objectives?.filter((o) => o.status === 'completed') ?? [];
  const lastMeasurement = measurements?.[0];

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        {t('objectives.title')}
      </Typography>

      {/* Type tabs */}
      <Tabs
        value={tabValue}
        onChange={(_, v) => setTabValue(v)}
        variant="fullWidth"
        sx={{
          mb: 2,
          bgcolor: 'background.paper',
          borderRadius: 3,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, borderRadius: 3 },
          '& .MuiTabs-indicator': { borderRadius: 4, height: 3 },
        }}
      >
        <Tab label={t('objectives.performance')} />
        <Tab label={t('objectives.frequency')} />
        <Tab label={t('objectives.body')} />
      </Tabs>

      {/* Active objectives */}
      {activeObjectives.length === 0 && completedObjectives.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <FlagRoundedIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.4 }} />
          <Typography color="text.secondary" sx={{ mt: 2, mb: 3 }}>
            {t('common.noResults')}
          </Typography>
          <Button variant="contained" onClick={openCreate} startIcon={<AddRoundedIcon />} sx={{ borderRadius: 5 }}>
            {t('objectives.createObjective')}
          </Button>
        </Box>
      ) : (
        <Stack spacing={2}>
          {activeObjectives.map((obj) => {
            const progress = obj.targetValue > 0 ? Math.min((obj.currentValue / obj.targetValue) * 100, 100) : 0;
            const daysLeft = obj.targetDate
              ? Math.max(0, Math.ceil((new Date(obj.targetDate).getTime() - Date.now()) / 86400000))
              : null;

            return (
              <Card key={obj.id} sx={{ borderRadius: 5 }}>
                <CardContent>
                  <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 3,
                        bgcolor: typeColors[obj.type] + '18',
                        color: typeColors[obj.type],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        mt: 0.5,
                      }}
                    >
                      {typeIcons[obj.type]}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {obj.title}
                      </Typography>
                      {obj.description && (
                        <Typography variant="body2" color="text.secondary">
                          {obj.description}
                        </Typography>
                      )}
                      {obj.exerciseName && (
                        <Chip label={obj.exerciseName} size="small" sx={{ mt: 0.5, borderRadius: 2 }} />
                      )}

                      {/* Progress */}
                      <Box sx={{ mt: 1.5 }}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {obj.currentValue} / {obj.targetValue} {obj.unit}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: typeColors[obj.type] }}>
                            {Math.round(progress)}%
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{
                            borderRadius: 2,
                            height: 8,
                            bgcolor: typeColors[obj.type] + '18',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: typeColors[obj.type],
                              borderRadius: 2,
                            },
                          }}
                        />
                      </Box>

                      {daysLeft !== null && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          {daysLeft} {t('objectives.daysUnit')} restants
                        </Typography>
                      )}
                    </Box>
                  </Stack>

                  {/* Actions */}
                  <Stack direction="row" spacing={1} sx={{ mt: 1.5, justifyContent: 'flex-end' }}>
                    <IconButton size="small" onClick={() => openEdit(obj)}>
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      startIcon={<CheckCircleRoundedIcon />}
                      onClick={() => toggleStatus(obj, 'completed')}
                      sx={{ borderRadius: 3 }}
                    >
                      {t('objectives.markComplete')}
                    </Button>
                    <IconButton size="small" color="error" onClick={() => setDeleteConfirm(obj.id)}>
                      <DeleteRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}

          {/* Completed objectives */}
          {completedObjectives.length > 0 && (
            <>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                {t('objectives.completed')} ({completedObjectives.length})
              </Typography>
              {completedObjectives.map((obj) => (
                <Card key={obj.id} sx={{ borderRadius: 5, opacity: 0.7 }}>
                  <CardContent sx={{ py: 1.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <EmojiEventsRoundedIcon sx={{ color: '#FFB300' }} />
                      <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
                        {obj.title}
                      </Typography>
                      <Chip label={t('objectives.completed')} size="small" color="success" sx={{ borderRadius: 2 }} />
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </Stack>
      )}

      {/* Body Measurements section (only on Body tab) */}
      {currentType === 'body' && (
        <Box sx={{ mt: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('objectives.bodyMeasurements')}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddRoundedIcon />}
              onClick={() => setMeasurementOpen(true)}
              sx={{ borderRadius: 4 }}
            >
              {t('objectives.addMeasurement')}
            </Button>
          </Stack>

          {lastMeasurement ? (
            <Card sx={{ borderRadius: 5 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  {format(new Date(lastMeasurement.date), 'dd/MM/yyyy')}
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
                  {lastMeasurement.weight != null && (
                    <Box>
                      <MeasBox label={t('objectives.bodyWeight')} value={`${lastMeasurement.weight} kg`} />
                    </Box>
                  )}
                  {lastMeasurement.bodyFat != null && (
                    <Box>
                      <MeasBox label={t('objectives.bodyFat')} value={`${lastMeasurement.bodyFat}%`} />
                    </Box>
                  )}
                  {lastMeasurement.chest != null && (
                    <Box>
                      <MeasBox label={t('objectives.measureChest')} value={`${lastMeasurement.chest} cm`} />
                    </Box>
                  )}
                  {lastMeasurement.waist != null && (
                    <Box>
                      <MeasBox label={t('objectives.measureWaist')} value={`${lastMeasurement.waist} cm`} />
                    </Box>
                  )}
                  {lastMeasurement.hips != null && (
                    <Box>
                      <MeasBox label={t('objectives.measureHips')} value={`${lastMeasurement.hips} cm`} />
                    </Box>
                  )}
                  {lastMeasurement.bicepsRight != null && (
                    <Box>
                      <MeasBox label={t('objectives.measureBiceps')} value={`${lastMeasurement.bicepsRight} cm`} />
                    </Box>
                  )}
                  {lastMeasurement.thighRight != null && (
                    <Box>
                      <MeasBox label={t('objectives.measureThigh')} value={`${lastMeasurement.thighRight} cm`} />
                    </Box>
                  )}
                  {lastMeasurement.shoulders != null && (
                    <Box>
                      <MeasBox label={t('objectives.measureShoulders')} value={`${lastMeasurement.shoulders} cm`} />
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ borderRadius: 5 }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <MonitorWeightRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">{t('common.noResults')}</Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Create/Edit objective FAB */}
      <Fab
        color="primary"
        onClick={openCreate}
        sx={{ position: 'fixed', bottom: 96, right: 16, borderRadius: 4 }}
      >
        <AddRoundedIcon />
      </Fab>

      {/* Create/Edit Objective Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editObjective ? t('objectives.editObjective') : t('objectives.createObjective')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={form.type}
                label="Type"
                onChange={(e) => setForm({ ...form, type: e.target.value as ObjectiveType })}
              >
                <MenuItem value="performance">{t('objectives.performance')}</MenuItem>
                <MenuItem value="frequency">{t('objectives.frequency')}</MenuItem>
                <MenuItem value="body">{t('objectives.body')}</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label={t('objectives.objectiveTitle')}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />

            {form.type === 'performance' && exercises && (
              <FormControl fullWidth size="small">
                <InputLabel>{t('analysis.selectExercise')}</InputLabel>
                <Select
                  value={form.exerciseId}
                  label={t('analysis.selectExercise')}
                  onChange={(e) => {
                    const ex = exercises.find((x) => x.id === e.target.value);
                    setForm({
                      ...form,
                      exerciseId: e.target.value as string,
                      exerciseName: ex?.name || '',
                    });
                  }}
                >
                  {exercises.map((ex) => (
                    <MenuItem key={ex.id} value={ex.id}>
                      {ex.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Stack direction="row" spacing={2}>
              <TextField
                label={t('objectives.targetValue')}
                type="number"
                value={form.targetValue || ''}
                onChange={(e) => setForm({ ...form, targetValue: parseFloat(e.target.value) || 0 })}
                fullWidth
              />
              <TextField
                label={t('objectives.currentValue')}
                type="number"
                value={form.currentValue || ''}
                onChange={(e) => setForm({ ...form, currentValue: parseFloat(e.target.value) || 0 })}
                fullWidth
              />
              <TextField
                label={t('objectives.unit')}
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                sx={{ minWidth: 80 }}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                label={t('objectives.startDate')}
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label={t('objectives.targetDate')}
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={saveObjective} disabled={!form.title.trim()}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Measurement Dialog */}
      <Dialog open={measurementOpen} onClose={() => setMeasurementOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t('objectives.addMeasurement')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Date"
              type="date"
              value={measForm.date}
              onChange={(e) => setMeasForm({ ...measForm, date: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              {[
                { key: 'weight', label: t('objectives.bodyWeight'), unit: 'kg' },
                { key: 'bodyFat', label: t('objectives.bodyFat'), unit: '%' },
                { key: 'chest', label: t('objectives.measureChest'), unit: 'cm' },
                { key: 'waist', label: t('objectives.measureWaist'), unit: 'cm' },
                { key: 'hips', label: t('objectives.measureHips'), unit: 'cm' },
                { key: 'shoulders', label: t('objectives.measureShoulders'), unit: 'cm' },
                { key: 'bicepsRight', label: `${t('objectives.measureBiceps')} (D)`, unit: 'cm' },
                { key: 'bicepsLeft', label: `${t('objectives.measureBiceps')} (G)`, unit: 'cm' },
                { key: 'thighRight', label: `${t('objectives.measureThigh')} (D)`, unit: 'cm' },
                { key: 'thighLeft', label: `${t('objectives.measureThigh')} (G)`, unit: 'cm' },
                { key: 'neck', label: t('objectives.measureNeck'), unit: 'cm' },
              ].map(({ key, label, unit }) => (
                <Box key={key}>
                  <TextField
                    label={`${label} (${unit})`}
                    type="number"
                    value={(measForm as Record<string, unknown>)[key] ?? ''}
                    onChange={(e) =>
                      setMeasForm({
                        ...measForm,
                        [key]: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    fullWidth
                    size="small"
                  />
                </Box>
              ))}
            </Box>
            <TextField
              label={t('workout.notes')}
              value={measForm.notes || ''}
              onChange={(e) => setMeasForm({ ...measForm, notes: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setMeasurementOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={saveMeasurement}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>{t('common.confirm')}</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</Button>
          <Button color="error" variant="contained" onClick={() => deleteConfirm && deleteObjective(deleteConfirm)}>
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function MeasBox({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ textAlign: 'center', bgcolor: 'action.hover', borderRadius: 2, p: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
        {label}
      </Typography>
    </Box>
  );
}
