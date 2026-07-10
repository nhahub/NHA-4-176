import { Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { GeneratorPage } from './pages/GeneratorPage';
import { HistoryPage } from './pages/HistoryPage';
import { RestaurantsPage } from './pages/RestaurantsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/app" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="generate" element={<GeneratorPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="restaurants" element={<RestaurantsPage />} />
          </Route>
        </Route>
        <Route path="/dashboard" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ThemeProvider>
  );
}
