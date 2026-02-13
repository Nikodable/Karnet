import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import LinearProgress from '@mui/material/LinearProgress';
import FitnessCenterRounded from '@mui/icons-material/FitnessCenterRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import EmojiEventsRounded from '@mui/icons-material/EmojiEventsRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import WhatshotRounded from '@mui/icons-material/WhatshotRounded';

import { db } from '../data/db';
import {
  sessionsThisWeek,
  calculateStreak,
  sessionVolume,
  formatDuration,
  formatWeight,
} from '../utils/calculations';
import type { WorkoutSession } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'home.greetingMorning';
  if (hour < 18) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

function formatDate(locale: string): string {
  return new Date().toLocaleDateString(locale.startsWith('fr') ? 'fr-FR' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function weeklyVolume(sessions: WorkoutSession[]): number {
  const now = new Date();
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = day === 0 ? 6 : day - 1;
  startOfWeek.setDate(startOfWeek.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);

  return sessions
    .filter((s) => s.status === 'completed' && new Date(s.date) >= startOfWeek)
    .reduce((total, s) => total + sessionVolume(s), 0);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();

  // ---- Database queries (live / reactive) ----

  const allSessions = useLiveQuery(
    () =>
      db.workoutSessions
        .orderBy('date')
        .reverse()
        .toArray(),
    [],
  );

  const activeSession = useLiveQuery(
    () =>
      db.workoutSessions
        .where('status')
        .equals('in_progress')
        .first(),
    [],
  );

  const activeProgram = useLiveQuery(
    () =>
      db.programs
        .where('isActive')
        .equals(1)
        .first(),
    [],
  );

  const recentRecords = useLiveQuery(
    () =>
      db.personalRecords
        .orderBy('date')
        .reverse()
        .limit(5)
        .toArray(),
    [],
  );

  // ---- Derived data ----

  const sessions = allSessions ?? [];
  const completedSessions = useMemo(
    () => sessions.filter((s) => s.status === 'completed'),
    [sessions],
  );
  const recentWorkouts = useMemo(() => completedSessions.slice(0, 3), [completedSessions]);
  const weekSessions = useMemo(() => sessionsThisWeek(sessions), [sessions]);
  const weekVolume = useMemo(() => weeklyVolume(sessions), [sessions]);
  const streak = useMemo(() => calculateStreak(sessions), [sessions]);

  // ---- M3 colour tokens from theme ----

  const colors = useMemo(() => {
    const p = theme.palette;
    return {
      primaryContainer: p.mode === 'dark' ? '#2C1A0E' : '#FFE0CC',
      onPrimaryContainer: p.mode === 'dark' ? '#FFE0CC' : '#2C1A0E',
      secondaryContainer: p.mode === 'dark' ? '#1A2C1A' : '#D4F5D4',
      onSecondaryContainer: p.mode === 'dark' ? '#D4F5D4' : '#1A2C1A',
      tertiaryContainer: p.mode === 'dark' ? '#1A1A2C' : '#D4D4F5',
      onTertiaryContainer: p.mode === 'dark' ? '#D4D4F5' : '#1A1A2C',
      surfaceContainerLow: p.mode === 'dark' ? '#1C1B1F' : '#F7F2FA',
      onSurface: p.text.primary,
      onSurfaceVariant: p.text.secondary,
      primary: p.primary.main,
      onPrimary: p.primary.contrastText,
      surface: p.background.default,
      outline: p.divider,
    };
  }, [theme.palette]);

  // ---- Date string ----
  const todayFormatted = useMemo(() => formatDate(i18n.language), [i18n.language]);

  // =====================================================================
  // RENDER
  // =====================================================================

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pb: 2 }}>
      {/* ======================================== */}
      {/* 1. WELCOME / HERO CARD                   */}
      {/* ======================================== */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '16px',
          background: `linear-gradient(135deg, ${colors.primaryContainer} 0%, ${colors.primary}22 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Typography
            variant="body2"
            sx={{ color: colors.onPrimaryContainer, opacity: 0.7, mb: 0.5, fontWeight: 500 }}
          >
            {todayFormatted}
          </Typography>
          <Typography
            variant="h4"
            sx={{
              color: colors.onPrimaryContainer,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.3,
            }}
          >
            {t(getGreetingKey())}
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: colors.onPrimaryContainer, opacity: 0.8, mt: 1 }}
          >
            {completedSessions.length > 0
              ? t('home.welcomeBack', { count: weekSessions })
              : t('home.welcomeFirst')}
          </Typography>
        </CardContent>
      </Card>

      {/* ======================================== */}
      {/* 2. TODAY'S WORKOUT / ACTIVE SESSION       */}
      {/* ======================================== */}
      <Box>
        <Typography
          variant="subtitle2"
          sx={{
            color: colors.onSurfaceVariant,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            mb: 1,
            px: 0.5,
          }}
        >
          {t('home.todayWorkout')}
        </Typography>

        {activeSession ? (
          /* --- Active session in progress --- */
          <Card
            elevation={0}
            sx={{
              borderRadius: '16px',
              backgroundColor: colors.primaryContainer,
              border: `2px solid ${colors.primary}44`,
              cursor: 'pointer',
            }}
            onClick={() => navigate(`/workout/${activeSession.id}`)}
          >
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar
                  sx={{
                    bgcolor: colors.primary,
                    color: colors.onPrimary,
                    width: 48,
                    height: 48,
                  }}
                >
                  <FitnessCenterRounded />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: colors.onPrimaryContainer,
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {activeSession.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.onPrimaryContainer, opacity: 0.7 }}>
                    {t('home.inProgress')}
                  </Typography>
                </Box>
                <Chip
                  label={t('home.resume')}
                  size="small"
                  sx={{
                    bgcolor: colors.primary,
                    color: colors.onPrimary,
                    fontWeight: 600,
                    '& .MuiChip-label': { px: 1.5 },
                  }}
                />
              </Stack>
              <LinearProgress
                variant="indeterminate"
                sx={{
                  mt: 2,
                  borderRadius: 4,
                  height: 4,
                  bgcolor: `${colors.primary}22`,
                  '& .MuiLinearProgress-bar': { bgcolor: colors.primary },
                }}
              />
            </CardContent>
          </Card>
        ) : (
          /* --- No active session --- */
          <Card
            elevation={0}
            sx={{
              borderRadius: '16px',
              backgroundColor: colors.surfaceContainerLow,
            }}
          >
            <CardContent
              sx={{
                p: 2.5,
                '&:last-child': { pb: 2.5 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Avatar
                sx={{
                  bgcolor: `${colors.primary}18`,
                  color: colors.primary,
                  width: 56,
                  height: 56,
                }}
              >
                <FitnessCenterRounded fontSize="large" />
              </Avatar>
              <Typography
                variant="body2"
                sx={{ color: colors.onSurfaceVariant, textAlign: 'center' }}
              >
                {t('home.noActiveWorkout')}
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrowRounded />}
                onClick={() => navigate('/workout/new')}
                sx={{
                  borderRadius: '16px',
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  bgcolor: colors.primary,
                  color: colors.onPrimary,
                  '&:hover': {
                    bgcolor: colors.primary,
                    filter: 'brightness(1.1)',
                  },
                }}
              >
                {t('home.startWorkout')}
              </Button>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* ======================================== */}
      {/* 3. QUICK STATS (horizontal scroll)        */}
      {/* ======================================== */}
      <Box>
        <Typography
          variant="subtitle2"
          sx={{
            color: colors.onSurfaceVariant,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            mb: 1,
            px: 0.5,
          }}
        >
          {t('home.quickStats')}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            mx: -2,
            px: 2,
            pb: 1,
            scrollSnapType: 'x mandatory',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}
        >
          {/* Sessions this week */}
          <StatCard
            icon={<FitnessCenterRounded fontSize="small" />}
            label={t('home.statSessions')}
            value={String(weekSessions)}
            bgColor={colors.primaryContainer}
            fgColor={colors.onPrimaryContainer}
            iconBg={`${colors.primary}22`}
            iconColor={colors.primary}
          />

          {/* Total volume this week */}
          <StatCard
            icon={<TrendingUpRounded fontSize="small" />}
            label={t('home.statVolume')}
            value={weekVolume > 0 ? formatWeight(weekVolume) : '-'}
            bgColor={colors.secondaryContainer}
            fgColor={colors.onSecondaryContainer}
            iconBg={`${theme.palette.secondary.main}22`}
            iconColor={theme.palette.secondary.main}
          />

          {/* Current streak */}
          <StatCard
            icon={<WhatshotRounded fontSize="small" />}
            label={t('home.statStreak')}
            value={streak > 0 ? t('home.streakDays', { count: streak }) : '-'}
            bgColor={colors.tertiaryContainer}
            fgColor={colors.onTertiaryContainer}
            iconBg={`${theme.palette.error.main}22`}
            iconColor={theme.palette.error.main}
          />
        </Box>
      </Box>

      {/* ======================================== */}
      {/* 4. ACTIVE PROGRAM                         */}
      {/* ======================================== */}
      <Box>
        <Typography
          variant="subtitle2"
          sx={{
            color: colors.onSurfaceVariant,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            mb: 1,
            px: 0.5,
          }}
        >
          {t('home.activeProgram')}
        </Typography>

        {activeProgram ? (
          <Card
            elevation={0}
            sx={{
              borderRadius: '16px',
              backgroundColor: colors.surfaceContainerLow,
              cursor: 'pointer',
            }}
            onClick={() => navigate(`/programs/${activeProgram.id}`)}
          >
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar
                  sx={{
                    bgcolor: `${colors.primary}18`,
                    color: colors.primary,
                    width: 44,
                    height: 44,
                  }}
                >
                  <FitnessCenterRounded />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      color: colors.onSurface,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {activeProgram.name}
                  </Typography>
                  {activeProgram.description && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: colors.onSurfaceVariant,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block',
                      }}
                    >
                      {activeProgram.description}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={0.5}>
                  {activeProgram.frequency && (
                    <Chip
                      label={t('home.sessionsPerWeek', { count: activeProgram.frequency })}
                      size="small"
                      sx={{
                        bgcolor: `${colors.primary}14`,
                        color: colors.primary,
                        fontWeight: 500,
                        fontSize: '0.7rem',
                      }}
                    />
                  )}
                </Stack>
              </Stack>
              {activeProgram.workouts.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={
                      activeProgram.frequency
                        ? Math.min((weekSessions / activeProgram.frequency) * 100, 100)
                        : 0
                    }
                    sx={{
                      borderRadius: 4,
                      height: 6,
                      bgcolor: `${colors.primary}18`,
                      '& .MuiLinearProgress-bar': {
                        bgcolor: colors.primary,
                        borderRadius: 4,
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ color: colors.onSurfaceVariant, mt: 0.5, display: 'block' }}
                  >
                    {activeProgram.frequency
                      ? t('home.weeklyProgress', {
                          done: weekSessions,
                          total: activeProgram.frequency,
                        })
                      : t('home.workoutsCount', { count: activeProgram.workouts.length })}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        ) : (
          /* --- No active program (empty state) --- */
          <Card
            elevation={0}
            sx={{
              borderRadius: '16px',
              backgroundColor: colors.surfaceContainerLow,
              border: `1px dashed ${colors.outline}`,
            }}
          >
            <CardContent
              sx={{
                p: 2.5,
                '&:last-child': { pb: 2.5 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" sx={{ color: colors.onSurfaceVariant }}>
                {t('home.noProgramYet')}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/programs/new')}
                sx={{
                  borderRadius: '16px',
                  borderColor: colors.primary,
                  color: colors.primary,
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                {t('home.createProgram')}
              </Button>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* ======================================== */}
      {/* 5. RECENT WORKOUTS                        */}
      {/* ======================================== */}
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1, px: 0.5 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: colors.onSurfaceVariant,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {t('home.recentWorkouts')}
          </Typography>
          {completedSessions.length > 3 && (
            <Button
              size="small"
              onClick={() => navigate('/history')}
              sx={{
                color: colors.primary,
                fontWeight: 600,
                textTransform: 'none',
                minWidth: 'auto',
                px: 1,
              }}
            >
              {t('home.viewAll')}
            </Button>
          )}
        </Stack>

        {recentWorkouts.length > 0 ? (
          <Card
            elevation={0}
            sx={{
              borderRadius: '16px',
              backgroundColor: colors.surfaceContainerLow,
              overflow: 'hidden',
            }}
          >
            {recentWorkouts.map((session, index) => (
              <Box key={session.id}>
                <Box
                  sx={{
                    px: 2.5,
                    py: 2,
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                    '&:active': { bgcolor: `${colors.primary}08` },
                  }}
                  onClick={() => navigate(`/history/${session.id}`)}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar
                      sx={{
                        bgcolor: `${colors.primary}14`,
                        color: colors.primary,
                        width: 40,
                        height: 40,
                        fontSize: '0.85rem',
                        fontWeight: 700,
                      }}
                    >
                      {session.exercises.length}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          color: colors.onSurface,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {session.name}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" sx={{ color: colors.onSurfaceVariant }}>
                          {new Date(session.date).toLocaleDateString(
                            i18n.language?.startsWith('fr') ? 'fr-FR' : 'en-US',
                            { weekday: 'short', day: 'numeric', month: 'short' },
                          )}
                        </Typography>
                        {session.duration != null && session.duration > 0 && (
                          <>
                            <Box
                              component="span"
                              sx={{
                                width: 3,
                                height: 3,
                                borderRadius: '50%',
                                bgcolor: colors.onSurfaceVariant,
                                opacity: 0.4,
                              }}
                            />
                            <Typography variant="caption" sx={{ color: colors.onSurfaceVariant }}>
                              {formatDuration(session.duration)}
                            </Typography>
                          </>
                        )}
                      </Stack>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{ color: colors.onSurfaceVariant, fontWeight: 500, whiteSpace: 'nowrap' }}
                    >
                      {session.totalVolume != null && session.totalVolume > 0
                        ? formatWeight(session.totalVolume)
                        : `${sessionVolume(session) > 0 ? formatWeight(sessionVolume(session)) : ''}`}
                    </Typography>
                  </Stack>
                </Box>
                {index < recentWorkouts.length - 1 && (
                  <Divider sx={{ mx: 2.5, borderColor: colors.outline, opacity: 0.3 }} />
                )}
              </Box>
            ))}
          </Card>
        ) : (
          /* --- Empty state --- */
          <Card
            elevation={0}
            sx={{
              borderRadius: '16px',
              backgroundColor: colors.surfaceContainerLow,
            }}
          >
            <CardContent
              sx={{
                p: 3,
                '&:last-child': { pb: 3 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                textAlign: 'center',
              }}
            >
              <Avatar
                sx={{
                  bgcolor: `${colors.primary}10`,
                  color: colors.onSurfaceVariant,
                  width: 48,
                  height: 48,
                  mb: 0.5,
                }}
              >
                <FitnessCenterRounded />
              </Avatar>
              <Typography variant="body2" sx={{ color: colors.onSurfaceVariant }}>
                {t('home.noRecentWorkouts')}
              </Typography>
              <Typography variant="caption" sx={{ color: colors.onSurfaceVariant, opacity: 0.6 }}>
                {t('home.noRecentWorkoutsHint')}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* ======================================== */}
      {/* 6. PERSONAL RECORDS                       */}
      {/* ======================================== */}
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1, px: 0.5 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: colors.onSurfaceVariant,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {t('home.personalRecords')}
          </Typography>
          {(recentRecords?.length ?? 0) > 0 && (
            <Button
              size="small"
              onClick={() => navigate('/records')}
              sx={{
                color: colors.primary,
                fontWeight: 600,
                textTransform: 'none',
                minWidth: 'auto',
                px: 1,
              }}
            >
              {t('home.viewAll')}
            </Button>
          )}
        </Stack>

        {recentRecords && recentRecords.length > 0 ? (
          <Card
            elevation={0}
            sx={{
              borderRadius: '16px',
              backgroundColor: colors.surfaceContainerLow,
              overflow: 'hidden',
            }}
          >
            {recentRecords.map((pr, index) => (
              <Box key={pr.id}>
                <Box sx={{ px: 2.5, py: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar
                      sx={{
                        bgcolor: '#FFF3E0',
                        color: '#E65100',
                        width: 40,
                        height: 40,
                      }}
                    >
                      <EmojiEventsRounded fontSize="small" />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          color: colors.onSurface,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {pr.exerciseName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: colors.onSurfaceVariant }}>
                        {t(`home.prType.${pr.type}`)}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${pr.value} ${pr.unit}`}
                      size="small"
                      sx={{
                        bgcolor: '#FFF3E0',
                        color: '#E65100',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    />
                  </Stack>
                </Box>
                {index < recentRecords.length - 1 && (
                  <Divider sx={{ mx: 2.5, borderColor: colors.outline, opacity: 0.3 }} />
                )}
              </Box>
            ))}
          </Card>
        ) : (
          /* --- Empty state --- */
          <Card
            elevation={0}
            sx={{
              borderRadius: '16px',
              backgroundColor: colors.surfaceContainerLow,
            }}
          >
            <CardContent
              sx={{
                p: 3,
                '&:last-child': { pb: 3 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                textAlign: 'center',
              }}
            >
              <Avatar
                sx={{
                  bgcolor: '#FFF3E0',
                  color: '#E65100',
                  width: 48,
                  height: 48,
                  mb: 0.5,
                }}
              >
                <EmojiEventsRounded />
              </Avatar>
              <Typography variant="body2" sx={{ color: colors.onSurfaceVariant }}>
                {t('home.noRecordsYet')}
              </Typography>
              <Typography variant="caption" sx={{ color: colors.onSurfaceVariant, opacity: 0.6 }}>
                {t('home.noRecordsHint')}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// StatCard sub-component
// ---------------------------------------------------------------------------

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  bgColor: string;
  fgColor: string;
  iconBg: string;
  iconColor: string;
}

function StatCard({ icon, label, value, bgColor, fgColor, iconBg, iconColor }: StatCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: '16px',
        backgroundColor: bgColor,
        minWidth: 140,
        flexShrink: 0,
        scrollSnapAlign: 'start',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Avatar
          sx={{
            bgcolor: iconBg,
            color: iconColor,
            width: 36,
            height: 36,
            mb: 1.5,
          }}
        >
          {icon}
        </Avatar>
        <Typography
          variant="h5"
          sx={{
            color: fgColor,
            fontWeight: 700,
            lineHeight: 1.2,
            mb: 0.25,
          }}
        >
          {value}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: fgColor,
            opacity: 0.7,
            fontWeight: 500,
            display: 'block',
          }}
        >
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}
