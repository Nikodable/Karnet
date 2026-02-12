import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import BottomNav from './BottomNav';
import TopBar from './TopBar';

export default function AppShell() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <TopBar />
      <Box
        component="main"
        sx={{
          flex: 1,
          pb: '96px', // Space for bottom nav
          px: 2,
          pt: 2,
          maxWidth: 600,
          mx: 'auto',
          width: '100%',
        }}
      >
        <Outlet />
      </Box>
      <BottomNav />
    </Box>
  );
}
