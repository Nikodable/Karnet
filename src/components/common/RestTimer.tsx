import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Slide from '@mui/material/Slide';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import { useTimer } from '../../hooks/useTimer';
import { formatTime } from '../../utils/calculations';

interface RestTimerProps {
  defaultSeconds?: number;
  sound?: boolean;
  vibration?: boolean;
}

export default function RestTimer({
  defaultSeconds = 90,
  sound = true,
  vibration = true,
}: RestTimerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const timer = useTimer(defaultSeconds, { sound, vibration });

  const presets = [30, 60, 90, 120, 180];

  return (
    <>
      {/* Floating Timer Button */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 96,
          right: 16,
          zIndex: 1050,
        }}
      >
        <Button
          variant="contained"
          onClick={() => setOpen(true)}
          sx={{
            borderRadius: 16,
            minWidth: timer.isRunning ? 120 : 56,
            height: 56,
            px: timer.isRunning ? 2 : 0,
            boxShadow: 3,
            transition: 'all 0.3s ease',
          }}
        >
          {timer.isRunning ? (
            <Typography variant="h6" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(timer.timeLeft)}
            </Typography>
          ) : (
            <TimerRoundedIcon />
          )}
        </Button>
      </Box>

      {/* Timer Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        TransitionComponent={Slide}
        fullWidth
        maxWidth="xs"
      >
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            {t('timer.rest')}
          </Typography>

          {/* Circular Timer */}
          <Box sx={{ position: 'relative', display: 'inline-flex', my: 3 }}>
            <CircularProgress
              variant="determinate"
              value={100}
              size={200}
              thickness={4}
              sx={{ color: 'surfaceVariant.main', opacity: 0.3, position: 'absolute' }}
            />
            <CircularProgress
              variant="determinate"
              value={timer.progress}
              size={200}
              thickness={4}
              sx={{
                color: timer.isFinished ? 'success.main' : 'primary.main',
                transition: 'all 0.3s ease',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  color: timer.isFinished ? 'success.main' : 'text.primary',
                }}
              >
                {formatTime(timer.timeLeft)}
              </Typography>
              {timer.isFinished && (
                <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                  {t('timer.timeUp')}
                </Typography>
              )}
            </Box>
          </Box>

          {/* +/- 30s buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RemoveRoundedIcon />}
              onClick={() => timer.addTime(-30)}
              disabled={timer.timeLeft < 30}
            >
              30s
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddRoundedIcon />}
              onClick={() => timer.addTime(30)}
            >
              30s
            </Button>
          </Box>

          {/* Controls */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
            <IconButton onClick={() => timer.reset()} color="default" size="large">
              <RestartAltRoundedIcon />
            </IconButton>
            {timer.isRunning ? (
              <IconButton
                onClick={timer.pause}
                color="primary"
                size="large"
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': { backgroundColor: 'primary.dark' },
                  width: 64,
                  height: 64,
                }}
              >
                <PauseRoundedIcon fontSize="large" />
              </IconButton>
            ) : (
              <IconButton
                onClick={() => (timer.timeLeft > 0 && !timer.isFinished ? timer.resume() : timer.start())}
                color="primary"
                size="large"
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': { backgroundColor: 'primary.dark' },
                  width: 64,
                  height: 64,
                }}
              >
                <PlayArrowRoundedIcon fontSize="large" />
              </IconButton>
            )}
          </Box>

          {/* Presets */}
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Presets
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
            {presets.map((sec) => (
              <Button
                key={sec}
                variant={timer.totalTime === sec ? 'contained' : 'outlined'}
                size="small"
                onClick={() => timer.start(sec)}
                sx={{ borderRadius: 20, minWidth: 60 }}
              >
                {formatTime(sec)}
              </Button>
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
