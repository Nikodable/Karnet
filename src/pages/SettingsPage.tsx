import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Switch from '@mui/material/Switch';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import FitnessCenterRoundedIcon from '@mui/icons-material/FitnessCenterRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import VibrationRoundedIcon from '@mui/icons-material/VibrationRounded';
import CloudSyncRoundedIcon from '@mui/icons-material/CloudSyncRounded';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import { getSettings, updateSettings, db } from '../data/db';
import type { UserSettings } from '../types';
import { formatTime } from '../utils/calculations';

const SEED_COLORS = [
  '#FF6B35', // Orange (default)
  '#6750A4', // Purple
  '#006D3B', // Green
  '#0061A4', // Blue
  '#BA1A1A', // Red
  '#7C5800', // Amber
  '#006874', // Teal
  '#984061', // Pink
];

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const handleUpdate = async (updates: Partial<UserSettings>) => {
    await updateSettings(updates);
    setSettings((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  if (!settings) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackRoundedIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t('settings.title')}
        </Typography>
      </Box>

      {/* Appearance */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, ml: 1 }}>
        {t('settings.appearance')}
      </Typography>
      <Card sx={{ borderRadius: 5, mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <List disablePadding>
            <ListItem>
              <ListItemIcon><DarkModeRoundedIcon /></ListItemIcon>
              <ListItemText primary={t('settings.theme')} />
              <ListItemSecondaryAction>
                <Select
                  value={settings.theme}
                  onChange={(e) => handleUpdate({ theme: e.target.value as 'light' | 'dark' | 'system' })}
                  size="small"
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="system">{t('settings.system')}</MenuItem>
                  <MenuItem value="light">{t('settings.light')}</MenuItem>
                  <MenuItem value="dark">{t('settings.dark')}</MenuItem>
                </Select>
              </ListItemSecondaryAction>
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem>
              <ListItemIcon><PaletteRoundedIcon /></ListItemIcon>
              <ListItemText
                primary={t('settings.seedColor')}
                secondary={t('settings.dynamicColor')}
              />
            </ListItem>
            <ListItem>
              <Stack direction="row" spacing={1.5} sx={{ pl: 7, pb: 1 }}>
                {SEED_COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => handleUpdate({ seedColor: color })}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: color,
                      cursor: 'pointer',
                      border: settings.seedColor === color ? '3px solid' : '2px solid transparent',
                      borderColor: settings.seedColor === color ? 'text.primary' : 'transparent',
                      transition: 'all 0.2s ease',
                      '&:hover': { transform: 'scale(1.15)' },
                    }}
                  />
                ))}
              </Stack>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* General */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, ml: 1 }}>
        {t('settings.general')}
      </Typography>
      <Card sx={{ borderRadius: 5, mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <List disablePadding>
            <ListItem>
              <ListItemIcon><LanguageRoundedIcon /></ListItemIcon>
              <ListItemText primary={t('settings.language')} />
              <ListItemSecondaryAction>
                <Select
                  value={i18n.language?.startsWith('fr') ? 'fr' : 'en'}
                  onChange={(e) => {
                    i18n.changeLanguage(e.target.value as string);
                    handleUpdate({ language: e.target.value as string });
                  }}
                  size="small"
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="fr">Français</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                </Select>
              </ListItemSecondaryAction>
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem>
              <ListItemIcon><FitnessCenterRoundedIcon /></ListItemIcon>
              <ListItemText primary={t('settings.weightUnit')} />
              <ListItemSecondaryAction>
                <Select
                  value={settings.weightUnit}
                  onChange={(e) => handleUpdate({ weightUnit: e.target.value as 'kg' | 'lbs' })}
                  size="small"
                  sx={{ minWidth: 80 }}
                >
                  <MenuItem value="kg">kg</MenuItem>
                  <MenuItem value="lbs">lbs</MenuItem>
                </Select>
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Timer */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, ml: 1 }}>
        {t('settings.timer')}
      </Typography>
      <Card sx={{ borderRadius: 5, mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <List disablePadding>
            <ListItem>
              <ListItemIcon><TimerRoundedIcon /></ListItemIcon>
              <ListItemText
                primary={t('settings.defaultRestTime')}
                secondary={formatTime(settings.defaultRestTimer)}
              />
            </ListItem>
            <ListItem sx={{ px: 3 }}>
              <Slider
                value={settings.defaultRestTimer}
                onChange={(_, v) => handleUpdate({ defaultRestTimer: v as number })}
                min={15}
                max={300}
                step={15}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => formatTime(v)}
                sx={{ ml: 4 }}
              />
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem>
              <ListItemIcon><VolumeUpRoundedIcon /></ListItemIcon>
              <ListItemText primary={t('settings.sound')} />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.timerSound}
                  onChange={(e) => handleUpdate({ timerSound: e.target.checked })}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem>
              <ListItemIcon><VibrationRoundedIcon /></ListItemIcon>
              <ListItemText primary={t('settings.vibration')} />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.timerVibration}
                  onChange={(e) => handleUpdate({ timerVibration: e.target.checked })}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Data */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, ml: 1 }}>
        {t('settings.data')}
      </Typography>
      <Card sx={{ borderRadius: 5, mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <List disablePadding>
            <ListItem>
              <ListItemIcon><CloudSyncRoundedIcon /></ListItemIcon>
              <ListItemText
                primary={t('settings.account')}
                secondary={t('settings.signIn')}
              />
              <ListItemSecondaryAction>
                <Button variant="outlined" size="small" sx={{ borderRadius: 20 }}>
                  {t('settings.signIn')}
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem
              component="div"
              onClick={() => setDeleteDialogOpen(true)}
              sx={{ cursor: 'pointer' }}
            >
              <ListItemIcon><DeleteForeverRoundedIcon color="error" /></ListItemIcon>
              <ListItemText
                primary={t('settings.deleteAllData')}
                primaryTypographyProps={{ color: 'error' }}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* About */}
      <Card sx={{ borderRadius: 5, mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <List disablePadding>
            <ListItem>
              <ListItemIcon><InfoRoundedIcon /></ListItemIcon>
              <ListItemText
                primary={t('settings.about')}
                secondary="Karnet v1.0.0"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('settings.deleteAllData')}</DialogTitle>
        <DialogContent>
          <Typography>{t('settings.confirmDeleteAll')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={async () => {
              await db.workoutSessions.clear();
              await db.programs.clear();
              await db.objectives.clear();
              await db.bodyMeasurements.clear();
              await db.personalRecords.clear();
              setDeleteDialogOpen(false);
            }}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
