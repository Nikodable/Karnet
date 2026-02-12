import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import Box from '@mui/material/Box';

interface TopBarProps {
  title?: string;
  showSettings?: boolean;
}

export default function TopBar({ title = 'Karnet', showSettings = true }: TopBarProps) {
  const navigate = useNavigate();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: 'background.default',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="h5"
            component="h1"
            sx={{
              fontWeight: 700,
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {title}
          </Typography>
        </Box>
        {showSettings && (
          <IconButton onClick={() => navigate('/settings')} color="inherit">
            <SettingsRoundedIcon />
          </IconButton>
        )}
      </Toolbar>
    </AppBar>
  );
}
