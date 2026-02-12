import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTheme } from '@mui/material/styles';
import {
  subDays,
  subMonths,
  subWeeks,
  eachWeekOfInterval,
  eachDayOfInterval,
  format,
  getDay,
} from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Avatar from '@mui/material/Avatar';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import FitnessCenterRoundedIcon from '@mui/icons-material/FitnessCenterRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import WhatshotRoundedIcon from '@mui/icons-material/WhatshotRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import { db } from '../data/db';
import {
  estimate1RM,
  sessionVolume,
  calculateStreak,
  volumeByMuscleGroup,
  formatWeight,
} from '../utils/calculations';

type Period = '1w' | '1m' | '3m' | '6m' | '1y' | 'all';

const PERIODS: { key: Period; labelKey: string }[] = [
  { key: '1w', labelKey: 'analysis.lastWeek' },
  { key: '1m', labelKey: 'analysis.lastMonth' },
  { key: '3m', labelKey: 'analysis.last3Months' },
  { key: '6m', labelKey: 'analysis.last6Months' },
  { key: '1y', labelKey: 'analysis.lastYear' },
  { key: 'all', labelKey: 'analysis.allTime' },
];

function getPeriodStart(period: Period): Date {
  const now = new Date();
  switch (period) {
    case '1w': return subWeeks(now, 1);
    case '1m': return subMonths(now, 1);
    case '3m': return subMonths(now, 3);
    case '6m': return subMonths(now, 6);
    case '1y': return subMonths(now, 12);
    case 'all': return new Date(2020, 0, 1);
  }
}

const PIE_COLORS = ['#6750A4', '#FF6B35', '#006D3B', '#BA1A1A', '#7C5800', '#006874', '#984061', '#0061A4', '#4CAF50', '#FF9800', '#9C27B0', '#00BCD4', '#795548', '#607D8B', '#E91E63', '#3F51B5'];

export default function AnalysisPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [period, setPeriod] = useState<Period>('1m');
  const [selectedExercise, setSelectedExercise] = useState('');

  const allSessions = useLiveQuery(
    () => db.workoutSessions.where('status').equals('completed').toArray(),
    []
  );
  const personalRecords = useLiveQuery(() => db.personalRecords.orderBy('date').reverse().toArray(), []);
  const exercises = useLiveQuery(() => db.exercises.toArray(), []);

  const periodStart = useMemo(() => getPeriodStart(period), [period]);

  const filteredSessions = useMemo(() => {
    if (!allSessions) return [];
    return allSessions.filter((s) => new Date(s.date) >= periodStart);
  }, [allSessions, periodStart]);

  // Exercise map for lookups
  const exerciseMap = useMemo(() => {
    if (!exercises) return new Map();
    return new Map(exercises.map((e) => [e.id, e]));
  }, [exercises]);

  // Summary stats
  const totalSessions = filteredSessions.length;
  const totalVolume = filteredSessions.reduce((sum, s) => sum + (s.totalVolume || sessionVolume(s)), 0);
  const streak = useMemo(() => calculateStreak(allSessions ?? []), [allSessions]);
  const avgSessionsPerWeek = useMemo(() => {
    if (totalSessions === 0) return 0;
    const dayRange = Math.max(1, Math.ceil((Date.now() - periodStart.getTime()) / 86400000));
    return Math.round((totalSessions / dayRange) * 7 * 10) / 10;
  }, [totalSessions, periodStart]);

  // Volume over time
  const volumeData = useMemo(() => {
    if (filteredSessions.length === 0) return [];
    const weeks = eachWeekOfInterval({
      start: periodStart,
      end: new Date(),
    }, { weekStartsOn: 1 });

    return weeks.map((weekStart) => {
      const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
      const weekSessions = filteredSessions.filter((s) => {
        const d = new Date(s.date);
        return d >= weekStart && d < weekEnd;
      });
      const vol = weekSessions.reduce((sum, s) => sum + (s.totalVolume || sessionVolume(s)), 0);
      return {
        week: format(weekStart, 'dd/MM'),
        volume: Math.round(vol),
        sessions: weekSessions.length,
      };
    });
  }, [filteredSessions, periodStart]);

  // Muscle distribution
  const muscleData = useMemo(() => {
    const dist = volumeByMuscleGroup(filteredSessions, exerciseMap as Map<string, { category: string }>);
    return Object.entries(dist)
      .map(([group, value]) => ({
        name: t(`exercise.muscles.${group}`),
        value: Math.round(value),
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredSessions, exerciseMap, t]);

  // Exercise progression
  const progressionData = useMemo(() => {
    if (!selectedExercise || !filteredSessions.length) return [];
    return filteredSessions
      .flatMap((s) =>
        s.exercises
          .filter((e) => e.exerciseId === selectedExercise)
          .map((e) => {
            const bestSet = e.sets
              .filter((set) => set.completed && set.weight && set.reps)
              .sort((a, b) => (b.weight || 0) - (a.weight || 0))[0];
            if (!bestSet) return null;
            return {
              date: format(new Date(s.date), 'dd/MM'),
              weight: bestSet.weight || 0,
              reps: bestSet.reps || 0,
              est1RM: estimate1RM(bestSet.weight || 0, bestSet.reps || 0),
            };
          })
          .filter(Boolean)
      )
      .reverse();
  }, [selectedExercise, filteredSessions]);

  // Activity heatmap (last 12 weeks)
  const heatmapData = useMemo(() => {
    if (!allSessions) return [];
    const end = new Date();
    const start = subDays(end, 84); // 12 weeks
    const days = eachDayOfInterval({ start, end });

    const sessionVolumeByDate = new Map<string, number>();
    for (const s of allSessions) {
      const key = s.date.split('T')[0];
      const vol = s.totalVolume || sessionVolume(s);
      sessionVolumeByDate.set(key, (sessionVolumeByDate.get(key) || 0) + vol);
    }

    const maxVol = Math.max(...Array.from(sessionVolumeByDate.values()), 1);

    return days.map((day) => {
      const key = format(day, 'yyyy-MM-dd');
      const vol = sessionVolumeByDate.get(key) || 0;
      const dayOfWeek = getDay(day);
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday=0
      return {
        date: day,
        dayOfWeek: adjustedDay,
        volume: vol,
        intensity: vol > 0 ? Math.max(0.15, vol / maxVol) : 0,
      };
    });
  }, [allSessions]);

  // Exercises that appear in sessions (for dropdown)
  const usedExercises = useMemo(() => {
    const ids = new Set<string>();
    for (const s of filteredSessions) {
      for (const e of s.exercises) {
        ids.add(e.exerciseId);
      }
    }
    return (exercises || []).filter((e) => ids.has(e.id));
  }, [filteredSessions, exercises]);

  const noData = !allSessions || allSessions.length === 0;

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        {t('analysis.title')}
      </Typography>

      {/* Period selector */}
      <Box sx={{ display: 'flex', gap: 0.75, overflowX: 'auto', mb: 2, pb: 0.5, '&::-webkit-scrollbar': { display: 'none' } }}>
        {PERIODS.map((p) => (
          <Chip
            key={p.key}
            label={t(p.labelKey)}
            size="small"
            variant={period === p.key ? 'filled' : 'outlined'}
            color={period === p.key ? 'primary' : 'default'}
            onClick={() => setPeriod(p.key)}
            sx={{ borderRadius: 3, fontWeight: 600, flexShrink: 0 }}
          />
        ))}
      </Box>

      {/* Tabs */}
      <Tabs
        value={tabValue}
        onChange={(_, v) => setTabValue(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 2,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minWidth: 'auto' },
          '& .MuiTabs-indicator': { borderRadius: 4, height: 3 },
        }}
      >
        <Tab label={t('analysis.overview')} />
        <Tab label={t('analysis.progression')} />
        <Tab label={t('analysis.distribution')} />
        <Tab label={t('analysis.records')} />
      </Tabs>

      {noData ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <FitnessCenterRoundedIcon sx={{ fontSize: 64, color: 'text.disabled', opacity: 0.4 }} />
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            {t('analysis.noData')}
          </Typography>
        </Box>
      ) : (
        <>
          {/* OVERVIEW */}
          {tabValue === 0 && (
            <Stack spacing={2}>
              {/* Summary cards */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                <SummaryCard icon={<FitnessCenterRoundedIcon />} label={t('analysis.sessionsPerWeek')} value={`${avgSessionsPerWeek}`} color={theme.palette.primary.main} />
                <SummaryCard icon={<TrendingUpRoundedIcon />} label={t('analysis.totalTonnage')} value={formatWeight(totalVolume)} color={theme.palette.secondary.main} />
                <SummaryCard icon={<WhatshotRoundedIcon />} label={t('home.streak')} value={`${streak} j`} color='#E65100' />
                <SummaryCard icon={<TimerRoundedIcon />} label="Sessions" value={`${totalSessions}`} color='#006874' />
              </Box>

              {/* Volume chart */}
              <Card sx={{ borderRadius: 5 }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    {t('analysis.volumeOverTime')}
                  </Typography>
                  {volumeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={volumeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis dataKey="week" fontSize={10} tick={{ fill: theme.palette.text.secondary }} />
                        <YAxis fontSize={10} tick={{ fill: theme.palette.text.secondary }} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            backgroundColor: theme.palette.background.paper,
                          }}
                        />
                        <Bar dataKey="volume" fill={theme.palette.primary.main} radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      {t('analysis.noData')}
                    </Typography>
                  )}
                </CardContent>
              </Card>

              {/* Activity heatmap */}
              <Card sx={{ borderRadius: 5 }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    {t('analysis.heatmap')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.25, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                    {/* Group by week */}
                    {(() => {
                      const weeks: typeof heatmapData[] = [];
                      let currentWeek: typeof heatmapData = [];
                      for (const day of heatmapData) {
                        if (day.dayOfWeek === 0 && currentWeek.length > 0) {
                          weeks.push(currentWeek);
                          currentWeek = [];
                        }
                        currentWeek.push(day);
                      }
                      if (currentWeek.length > 0) weeks.push(currentWeek);

                      return (
                        <Box sx={{ display: 'flex', gap: '3px' }}>
                          {weeks.map((week, wi) => (
                            <Box key={wi} sx={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              {Array.from({ length: 7 }).map((_, di) => {
                                const day = week.find((d) => d.dayOfWeek === di);
                                return (
                                  <Box
                                    key={di}
                                    sx={{
                                      width: 14,
                                      height: 14,
                                      borderRadius: '3px',
                                      bgcolor: day && day.intensity > 0
                                        ? theme.palette.primary.main
                                        : theme.palette.action.hover,
                                      opacity: day ? (day.intensity > 0 ? day.intensity : 0.3) : 0.1,
                                      transition: 'all 0.2s',
                                    }}
                                    title={day ? `${format(day.date, 'dd/MM')}: ${day.volume} kg` : ''}
                                  />
                                );
                              })}
                            </Box>
                          ))}
                        </Box>
                      );
                    })()}
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          )}

          {/* PROGRESSION */}
          {tabValue === 1 && (
            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('analysis.selectExercise')}</InputLabel>
                <Select
                  value={selectedExercise}
                  label={t('analysis.selectExercise')}
                  onChange={(e) => setSelectedExercise(e.target.value)}
                >
                  {usedExercises.map((ex) => (
                    <MenuItem key={ex.id} value={ex.id}>{ex.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedExercise && progressionData.length > 0 ? (
                <>
                  <Card sx={{ borderRadius: 5 }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                        {t('analysis.exerciseProgression')}
                      </Typography>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={progressionData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                          <XAxis dataKey="date" fontSize={10} tick={{ fill: theme.palette.text.secondary }} />
                          <YAxis fontSize={10} tick={{ fill: theme.palette.text.secondary }} />
                          <Tooltip
                            contentStyle={{
                              borderRadius: 12,
                              border: 'none',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              backgroundColor: theme.palette.background.paper,
                            }}
                          />
                          <Line type="monotone" dataKey="weight" stroke={theme.palette.primary.main} strokeWidth={2.5} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: 5 }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                        {t('analysis.estimated1RM')}
                      </Typography>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={progressionData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                          <XAxis dataKey="date" fontSize={10} tick={{ fill: theme.palette.text.secondary }} />
                          <YAxis fontSize={10} tick={{ fill: theme.palette.text.secondary }} />
                          <Tooltip
                            contentStyle={{
                              borderRadius: 12,
                              border: 'none',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              backgroundColor: theme.palette.background.paper,
                            }}
                          />
                          <Line type="monotone" dataKey="est1RM" stroke={theme.palette.secondary.main} strokeWidth={2.5} dot={{ r: 4 }} name="1RM estimé" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography color="text.secondary">
                    {selectedExercise ? t('analysis.noData') : t('analysis.selectExercise')}
                  </Typography>
                </Box>
              )}
            </Stack>
          )}

          {/* DISTRIBUTION */}
          {tabValue === 2 && (
            <Stack spacing={2}>
              <Card sx={{ borderRadius: 5 }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    {t('analysis.muscleDistribution')}
                  </Typography>
                  {muscleData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={muscleData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            innerRadius={50}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {muscleData.map((_, index) => (
                              <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              borderRadius: 12,
                              border: 'none',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              backgroundColor: theme.palette.background.paper,
                            }}
                            formatter={(value) => `${formatWeight(Number(value))}`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Legend */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 1 }}>
                        {muscleData.map((item, index) => (
                          <Chip
                            key={item.name}
                            label={`${item.name}: ${formatWeight(item.value)}`}
                            size="small"
                            sx={{
                              bgcolor: PIE_COLORS[index % PIE_COLORS.length] + '20',
                              color: PIE_COLORS[index % PIE_COLORS.length],
                              fontWeight: 600,
                              borderRadius: 2,
                              fontSize: '0.7rem',
                            }}
                          />
                        ))}
                      </Box>
                    </>
                  ) : (
                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      {t('analysis.noData')}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Stack>
          )}

          {/* RECORDS */}
          {tabValue === 3 && (
            <Stack spacing={1.5}>
              {personalRecords && personalRecords.length > 0 ? (
                personalRecords.map((pr) => {
                  const isRecent = (Date.now() - new Date(pr.date).getTime()) < 30 * 86400000;
                  return (
                    <Card key={pr.id} sx={{ borderRadius: 4 }}>
                      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar
                            sx={{
                              bgcolor: isRecent ? '#FFF3E0' : 'action.hover',
                              color: isRecent ? '#E65100' : 'text.secondary',
                              width: 36,
                              height: 36,
                            }}
                          >
                            <EmojiEventsRoundedIcon fontSize="small" />
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                              {pr.exerciseName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(pr.date), 'dd/MM/yyyy')}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                              {pr.value} {pr.unit}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {pr.type.replace('_', ' ')}
                            </Typography>
                          </Box>
                          {isRecent && (
                            <Chip label="NEW" size="small" color="warning" sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.65rem' }} />
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <EmojiEventsRoundedIcon sx={{ fontSize: 64, color: 'text.disabled', opacity: 0.4 }} />
                  <Typography color="text.secondary" sx={{ mt: 2 }}>
                    {t('analysis.noData')}
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </>
      )}
    </Box>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card sx={{ borderRadius: 4 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Avatar sx={{ bgcolor: color + '18', color, width: 32, height: 32, mb: 1 }}>
          {icon}
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}
