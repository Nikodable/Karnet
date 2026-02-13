import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import FitnessCenterRoundedIcon from '@mui/icons-material/FitnessCenterRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  getDay,
  isToday,
} from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { db } from '../data/db';
import type { WorkoutSession } from '../types';
import {
  sessionVolume,
  sessionTotalSets,
  sessionTotalReps,
  formatDuration,
  formatWeight,
} from '../utils/calculations';

export default function HistoryPage() {
  const { t, i18n } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [detailSession, setDetailSession] = useState<WorkoutSession | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const locale = i18n.language?.startsWith('fr') ? fr : undefined;

  const sessions = useLiveQuery(
    () => db.workoutSessions.where('status').equals('completed').reverse().sortBy('date'),
    []
  );

  // Calendar data
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const sessionDates = useMemo(() => {
    if (!sessions) return new Set<string>();
    return new Set(sessions.map((s) => s.date.split('T')[0]));
  }, [sessions]);

  const monthSessions = useMemo(() => {
    if (!sessions) return [];
    return sessions.filter((s) => {
      const d = new Date(s.date);
      return isSameMonth(d, currentMonth);
    });
  }, [sessions, currentMonth]);

  const selectedDaySessions = useMemo(() => {
    if (!sessions || !selectedDate) return [];
    return sessions.filter((s) => isSameDay(new Date(s.date), selectedDate));
  }, [sessions, selectedDate]);

  // Group sessions by month for list view
  const groupedSessions = useMemo(() => {
    if (!sessions) return {};
    const groups: Record<string, WorkoutSession[]> = {};
    for (const s of sessions) {
      const key = format(new Date(s.date), 'yyyy-MM');
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    }
    return groups;
  }, [sessions]);

  const handleDelete = async (id: string) => {
    await db.workoutSessions.delete(id);
    setDeleteConfirm(null);
    setDetailSession(null);
  };

  // Monday = 0, shift getDay so Monday is first
  const getWeekDayIndex = (date: Date) => {
    const day = getDay(date);
    return day === 0 ? 6 : day - 1;
  };

  const firstDayOffset = getWeekDayIndex(calendarDays[0]);
  const weekDayLabels = locale
    ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        {t('history.title')}
      </Typography>

      {/* Tabs */}
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
        <Tab label={t('history.calendar')} />
        <Tab label={t('history.list')} />
      </Tabs>

      {/* CALENDAR VIEW */}
      {tabValue === 0 && (
        <Box>
          {/* Month navigation */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <IconButton onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeftRoundedIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
              {format(currentMonth, 'MMMM yyyy', { locale })}
            </Typography>
            <IconButton onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRightRoundedIcon />
            </IconButton>
          </Stack>

          {/* Workout count */}
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
            {monthSessions.length} {t('history.workoutsThisMonth')}
          </Typography>

          {/* Calendar grid */}
          <Card sx={{ borderRadius: 3, mb: 2 }}>
            <CardContent sx={{ p: 1.5 }}>
              {/* Day labels */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 1 }}>
                {weekDayLabels.map((label) => (
                  <Typography
                    key={label}
                    variant="caption"
                    sx={{ textAlign: 'center', fontWeight: 600, color: 'text.secondary' }}
                  >
                    {label}
                  </Typography>
                ))}
              </Box>

              {/* Day cells */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                {/* Empty cells for offset */}
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <Box key={`empty-${i}`} />
                ))}

                {calendarDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const hasWorkout = sessionDates.has(dateStr);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const today = isToday(day);

                  return (
                    <Box
                      key={dateStr}
                      onClick={() => setSelectedDate(isSelected ? null : day)}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 44,
                        borderRadius: 3,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        bgcolor: isSelected
                          ? 'primary.main'
                          : today
                          ? 'action.hover'
                          : 'transparent',
                        color: isSelected ? 'primary.contrastText' : 'text.primary',
                        border: today && !isSelected ? '2px solid' : 'none',
                        borderColor: 'primary.main',
                        '&:hover': {
                          bgcolor: isSelected ? 'primary.main' : 'action.selected',
                        },
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: today ? 700 : 400 }}>
                        {format(day, 'd')}
                      </Typography>
                      {hasWorkout && (
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: isSelected ? 'primary.contrastText' : 'primary.main',
                            mt: 0.25,
                          }}
                        />
                      )}
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>

          {/* Selected day sessions */}
          {selectedDate && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                {format(selectedDate, 'EEEE d MMMM', { locale })}
              </Typography>
              {selectedDaySessions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t('history.noWorkouts')}
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {selectedDaySessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      locale={locale}
                      t={t}
                      onClick={() => setDetailSession(session)}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* LIST VIEW */}
      {tabValue === 1 && (
        <Box>
          {!sessions || sessions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <FitnessCenterRoundedIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.4 }} />
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                {t('history.noWorkouts')}
              </Typography>
            </Box>
          ) : (
            Object.entries(groupedSessions).map(([monthKey, monthSessions]) => (
              <Box key={monthKey} sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: 'primary.main',
                    textTransform: 'capitalize',
                    mb: 1,
                  }}
                >
                  {format(new Date(monthKey + '-01'), 'MMMM yyyy', { locale })}
                </Typography>
                <Stack spacing={1.5}>
                  {monthSessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      locale={locale}
                      t={t}
                      onClick={() => setDetailSession(session)}
                    />
                  ))}
                </Stack>
              </Box>
            ))
          )}
        </Box>
      )}

      {/* SESSION DETAIL DIALOG */}
      <Dialog
        open={!!detailSession}
        onClose={() => setDetailSession(null)}
        fullWidth
        maxWidth="sm"
      >
        {detailSession && (
          <>
            <DialogTitle sx={{ fontWeight: 700 }}>
              {detailSession.name || t('workout.title')}
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {format(new Date(detailSession.date), 'EEEE d MMMM yyyy', { locale })}
              </Typography>

              {/* Stats */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
                <StatBox label={t('workout.totalVolume')} value={formatWeight(detailSession.totalVolume || sessionVolume(detailSession))} />
                <StatBox label={t('workout.workoutDuration')} value={formatDuration(detailSession.duration || 0)} />
                <StatBox label={t('workout.totalSets')} value={String(detailSession.totalSets || sessionTotalSets(detailSession))} />
                <StatBox label={t('workout.totalReps')} value={String(detailSession.totalReps || sessionTotalReps(detailSession))} />
              </Box>

              {detailSession.mood && (
                <Chip
                  label={`${t('workout.mood')}: ${t(`workout.moodLabels.${detailSession.mood}`)}`}
                  sx={{ mb: 2, borderRadius: 3 }}
                />
              )}

              <Divider sx={{ mb: 2 }} />

              {/* Exercises */}
              <Stack spacing={2}>
                {detailSession.exercises.map((ex) => (
                  <Box key={ex.id}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {ex.exerciseName}
                    </Typography>
                    {ex.sets
                      .filter((s) => s.completed)
                      .map((set) => (
                        <Typography key={set.id} variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                          {t('workout.set')} {set.setNumber}: {set.weight ?? '-'} kg x {set.reps ?? '-'}
                          {set.rpe ? ` @ RPE ${set.rpe}` : ''}
                        </Typography>
                      ))}
                  </Box>
                ))}
              </Stack>

              {detailSession.notes && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {t('workout.notes')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {detailSession.notes}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                color="error"
                startIcon={<DeleteRoundedIcon />}
                onClick={() => setDeleteConfirm(detailSession.id)}
                sx={{ borderRadius: 4 }}
              >
                {t('common.delete')}
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button onClick={() => setDetailSession(null)} sx={{ borderRadius: 4 }}>
                {t('common.close')}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* DELETE CONFIRM */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>{t('history.confirmDelete')}</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// --- Sub-components ---

function SessionCard({
  session,
  locale,
  t,
  onClick,
}: {
  session: WorkoutSession;
  locale: import('date-fns').Locale | undefined;
  t: (key: string) => string;
  onClick: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      sx={{
        borderRadius: 4,
        cursor: 'pointer',
        '&:hover': { boxShadow: 2 },
        transition: 'box-shadow 0.2s',
      }}
    >
      <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
              {session.name || t('workout.title')}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {format(new Date(session.date), 'EEE d MMM', { locale })}
              </Typography>
              {(session.duration || 0) > 0 && (
                <>
                  <Box
                    component="span"
                    sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.disabled' }}
                  />
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <TimerRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {formatDuration(session.duration || 0)}
                    </Typography>
                  </Stack>
                </>
              )}
            </Stack>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatWeight(session.totalVolume || sessionVolume(session))}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {session.exercises.length} ex. / {session.totalSets || sessionTotalSets(session)} sets
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        bgcolor: 'action.hover',
        borderRadius: 3,
        p: 1.5,
        textAlign: 'center',
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}
