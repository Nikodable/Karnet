import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './i18n';
import { useKarnetTheme } from './hooks/useTheme';
import { db, getSettings } from './data/db';
import { seedExercises } from './data/exercises';
import AppShell from './components/layout/AppShell';
import HomePage from './pages/HomePage';
import WorkoutPage from './pages/WorkoutPage';
import HistoryPage from './pages/HistoryPage';
import ObjectivesPage from './pages/ObjectivesPage';
import AnalysisPage from './pages/AnalysisPage';
import SettingsPage from './pages/SettingsPage';
import ProgramsPage from './pages/ProgramsPage';
import RestTimer from './components/common/RestTimer';

export default function App() {
  const { theme } = useKarnetTheme();

  // Initialize database: seed exercises and create default settings
  useEffect(() => {
    const init = async () => {
      await getSettings();
      await seedExercises(db);
    };
    init();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/workout" element={<WorkoutPage />} />
            <Route path="/workout/:id" element={<WorkoutPage />} />
            <Route path="/workout/new" element={<WorkoutPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/history/:id" element={<HistoryPage />} />
            <Route path="/objectives" element={<ObjectivesPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/programs" element={<ProgramsPage />} />
            <Route path="/programs/new" element={<ProgramsPage />} />
            <Route path="/programs/:id" element={<ProgramsPage />} />
          </Route>
        </Routes>
        <RestTimer />
      </BrowserRouter>
    </ThemeProvider>
  );
}
