import { useState, useEffect, useCallback } from 'react';
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
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import FitnessCenterRoundedIcon from '@mui/icons-material/FitnessCenterRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import VibrationRoundedIcon from '@mui/icons-material/VibrationRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import RestoreRoundedIcon from '@mui/icons-material/RestoreRounded';
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
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const handleUpdate = async (updates: Partial<UserSettings>) => {
    await updateSettings(updates);
    setSettings((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  // --- Backup: export all data as JSON ---
  const handleBackup = useCallback(async () => {
    try {
      const data = {
        version: __APP_VERSION__,
        exportDate: new Date().toISOString(),
        workoutSessions: await db.workoutSessions.toArray(),
        exercises: await db.exercises.filter((e) => e.isCustom).toArray(),
        programs: await db.programs.toArray(),
        objectives: await db.objectives.toArray(),
        bodyMeasurements: await db.bodyMeasurements.toArray(),
        personalRecords: await db.personalRecords.toArray(),
        userSettings: await db.userSettings.toArray(),
      };
      const json = JSON.stringify(data, null, 2);
      const date = new Date().toISOString().split('T')[0];
      const filename = `karnet-backup-${date}.json`;

      // Sur Android (Capacitor WebView), navigator.share est disponible et
      // plus fiable que <a download> pour sauvegarder dans les fichiers.
      if (navigator.share && navigator.canShare?.({ files: [new File([json], filename, { type: 'application/json' })] })) {
        await navigator.share({
          files: [new File([json], filename, { type: 'application/json' })],
          title: filename,
        });
      } else {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      setSnackbar({ open: true, message: t('settings.backupSuccess'), severity: 'success' });
    } catch (err) {
      // L'utilisateur a annulé le share → pas une erreur
      if (err instanceof Error && err.name === 'AbortError') return;
      setSnackbar({ open: true, message: t('common.error'), severity: 'error' });
    }
  }, [t]);

  // --- Restore: import JSON backup ---
  const handleRestoreClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setPendingRestoreFile(file);
        setRestoreDialogOpen(true);
      }
    };
    input.click();
  }, []);

  const handleRestoreConfirm = useCallback(async () => {
    if (!pendingRestoreFile) return;
    try {
      const text = await pendingRestoreFile.text();
      const data = JSON.parse(text);
      if (!data.version || !data.exportDate) throw new Error('Invalid backup file');

      // Vérification de compatibilité : on accepte les backups dont le major
      // est ≤ au major de l'app courante (format rétrocompatible).
      const [fileMajor] = (data.version as string).split('.').map(Number);
      const [appMajor] = __APP_VERSION__.split('.').map(Number);
      if (fileMajor > appMajor) throw new Error('Backup version too recent');

      if (data.workoutSessions?.length) {
        await db.workoutSessions.clear();
        await db.workoutSessions.bulkPut(data.workoutSessions);
      }
      if (data.exercises?.length) {
        await db.exercises.bulkPut(data.exercises);
      }
      if (data.programs?.length) {
        await db.programs.clear();
        await db.programs.bulkPut(data.programs);
      }
      if (data.objectives?.length) {
        await db.objectives.clear();
        await db.objectives.bulkPut(data.objectives);
      }
      if (data.bodyMeasurements?.length) {
        await db.bodyMeasurements.clear();
        await db.bodyMeasurements.bulkPut(data.bodyMeasurements);
      }
      if (data.personalRecords?.length) {
        await db.personalRecords.clear();
        await db.personalRecords.bulkPut(data.personalRecords);
      }
      if (data.userSettings?.length) {
        await db.userSettings.bulkPut(data.userSettings);
        const refreshed = await getSettings();
        setSettings(refreshed);
      }

      setSnackbar({ open: true, message: t('settings.restoreSuccess'), severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: t('settings.restoreError'), severity: 'error' });
    } finally {
      setRestoreDialogOpen(false);
      setPendingRestoreFile(null);
    }
  }, [pendingRestoreFile, t]);

  if (!settings) return null;

  return (
    <Box sx={{ pb: 2 }}>
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
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <List disablePadding>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 40 }}><DarkModeRoundedIcon /></ListItemIcon>
              <ListItemText primary={t('settings.theme')} sx={{ mr: 2 }} />
              <Select
                value={settings.theme}
                onChange={(e) => handleUpdate({ theme: e.target.value as 'light' | 'dark' | 'system' })}
                size="small"
                sx={{ minWidth: 110 }}
              >
                <MenuItem value="system">{t('settings.system')}</MenuItem>
                <MenuItem value="light">{t('settings.light')}</MenuItem>
                <MenuItem value="dark">{t('settings.dark')}</MenuItem>
              </Select>
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem>
              <ListItemIcon sx={{ minWidth: 40 }}><PaletteRoundedIcon /></ListItemIcon>
              <ListItemText
                primary={t('settings.seedColor')}
                secondary={t('settings.dynamicColor')}
              />
            </ListItem>
            <ListItem>
              <Stack direction="row" spacing={1} sx={{ pl: 5, pb: 1, flexWrap: 'wrap', gap: 1 }}>
                {SEED_COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => handleUpdate({ seedColor: color })}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      backgroundColor: color,
                      cursor: 'pointer',
                      border: settings.seedColor === color ? '3px solid' : '2px solid transparent',
                      borderColor: settings.seedColor === color ? 'text.primary' : 'transparent',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
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
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <List disablePadding>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 40 }}><LanguageRoundedIcon /></ListItemIcon>
              <ListItemText primary={t('settings.language')} sx={{ mr: 2 }} />
              <Select
                value={i18n.language?.startsWith('fr') ? 'fr' : 'en'}
                onChange={(e) => {
                  i18n.changeLanguage(e.target.value as string);
                  handleUpdate({ language: e.target.value as string });
                }}
                size="small"
                sx={{ minWidth: 110 }}
              >
                <MenuItem value="fr">Français</MenuItem>
                <MenuItem value="en">English</MenuItem>
              </Select>
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem>
              <ListItemIcon sx={{ minWidth: 40 }}><FitnessCenterRoundedIcon /></ListItemIcon>
              <ListItemText primary={t('settings.weightUnit')} sx={{ mr: 2 }} />
              <Select
                value={settings.weightUnit}
                onChange={(e) => handleUpdate({ weightUnit: e.target.value as 'kg' | 'lbs' })}
                size="small"
                sx={{ minWidth: 80 }}
              >
                <MenuItem value="kg">kg</MenuItem>
                <MenuItem value="lbs">lbs</MenuItem>
              </Select>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Timer */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, ml: 1 }}>
        {t('settings.timer')}
      </Typography>
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <List disablePadding>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 40 }}><TimerRoundedIcon /></ListItemIcon>
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
              <ListItemIcon sx={{ minWidth: 40 }}><VolumeUpRoundedIcon /></ListItemIcon>
              <ListItemText primary={t('settings.sound')} sx={{ mr: 2 }} />
              <Switch
                checked={settings.timerSound}
                onChange={(e) => handleUpdate({ timerSound: e.target.checked })}
              />
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem>
              <ListItemIcon sx={{ minWidth: 40 }}><VibrationRoundedIcon /></ListItemIcon>
              <ListItemText primary={t('settings.vibration')} sx={{ mr: 2 }} />
              <Switch
                checked={settings.timerVibration}
                onChange={(e) => handleUpdate({ timerVibration: e.target.checked })}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Data */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, ml: 1 }}>
        {t('settings.data')}
      </Typography>
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <List disablePadding>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 40 }}><SaveRoundedIcon /></ListItemIcon>
              <ListItemText primary={t('settings.exportData')} sx={{ mr: 2 }} />
              <Button variant="outlined" size="small" onClick={handleBackup} sx={{ borderRadius: 20, flexShrink: 0 }}>
                {t('settings.exportData')}
              </Button>
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem>
              <ListItemIcon sx={{ minWidth: 40 }}><RestoreRoundedIcon /></ListItemIcon>
              <ListItemText primary={t('settings.importData')} sx={{ mr: 2 }} />
              <Button variant="outlined" size="small" onClick={handleRestoreClick} sx={{ borderRadius: 20, flexShrink: 0 }}>
                {t('settings.importData')}
              </Button>
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem>
              <ListItemIcon sx={{ minWidth: 40 }}><CloudSyncRoundedIcon /></ListItemIcon>
              <ListItemText
                primary={t('settings.account')}
                secondary={t('settings.signIn')}
                sx={{ mr: 2 }}
              />
              <Button variant="outlined" size="small" sx={{ borderRadius: 20, flexShrink: 0 }}>
                {t('settings.signIn')}
              </Button>
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem
              component="div"
              onClick={() => setDeleteDialogOpen(true)}
              sx={{ cursor: 'pointer' }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}><DeleteForeverRoundedIcon color="error" /></ListItemIcon>
              <ListItemText
                primary={t('settings.deleteAllData')}
                primaryTypographyProps={{ color: 'error' }}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* About */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <List disablePadding>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 40 }}><InfoRoundedIcon /></ListItemIcon>
              <ListItemText
                primary={t('settings.about')}
                secondary="Karnet v0.2.0"
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

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialogOpen} onClose={() => { setRestoreDialogOpen(false); setPendingRestoreFile(null); }}>
        <DialogTitle>{t('settings.importData')}</DialogTitle>
        <DialogContent>
          <Typography>{t('settings.confirmRestore')}</Typography>
          {pendingRestoreFile && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {pendingRestoreFile.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setRestoreDialogOpen(false); setPendingRestoreFile(null); }}>
            {t('common.cancel')}
          </Button>
          <Button variant="contained" onClick={handleRestoreConfirm}>
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 10 }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ borderRadius: 3 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
