import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import FitnessCenterRoundedIcon from '@mui/icons-material/FitnessCenterRounded';

const routes = [
  { path: '/', icon: <HomeRoundedIcon />, labelKey: 'nav.home' },
  { path: '/history', icon: <CalendarMonthRoundedIcon />, labelKey: 'nav.history' },
  { path: '/workout', icon: <FitnessCenterRoundedIcon />, labelKey: 'nav.workout' },
  { path: '/objectives', icon: <FlagRoundedIcon />, labelKey: 'nav.objectives' },
  { path: '/analysis', icon: <BarChartRoundedIcon />, labelKey: 'nav.analysis' },
];

export default function BottomNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const currentIndex = routes.findIndex((r) => r.path === location.pathname);
  const value = currentIndex >= 0 ? currentIndex : 0;

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        borderRadius: '20px 20px 0 0',
        overflow: 'hidden',
      }}
      elevation={3}
    >
      <BottomNavigation
        value={value}
        onChange={(_, newValue) => navigate(routes[newValue].path)}
        showLabels
        sx={{
          height: 80,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '6px 0',
            gap: '4px',
            '&.Mui-selected': {
              '& .MuiSvgIcon-root': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                borderRadius: '16px',
                padding: '4px 16px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              },
            },
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.75rem',
            fontWeight: 500,
            '&.Mui-selected': {
              fontSize: '0.75rem',
              fontWeight: 600,
            },
          },
        }}
      >
        {routes.map((route) => (
          <BottomNavigationAction
            key={route.path}
            icon={route.icon}
            label={t(route.labelKey)}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
