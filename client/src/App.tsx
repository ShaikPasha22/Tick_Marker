import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import AppShell from './components/layout/AppShell';
import LoadingScreen from './components/ui/LoadingScreen';


// Lazy-loaded pages
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/Auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/Auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/Auth/ResetPasswordPage'));
const OnboardingPage = lazy(() => import('./pages/Onboarding/OnboardingPage'));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const TrackPage = lazy(() => import('./pages/Track/TrackPage'));
const HabitsPage = lazy(() => import('./pages/Habits/HabitsPage'));
const AnalyticsPage = lazy(() => import('./pages/Analytics/AnalyticsPage'));
const GoalsPage = lazy(() => import('./pages/Goals/GoalsPage'));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage'));
const SwotListPage = lazy(() => import('./pages/SWOT/SwotListPage'));
const SwotWorkspace = lazy(() => import('./pages/SWOT/SwotWorkspace'));
const TargetsPage = lazy(() => import('./pages/Targets/TargetsPage'));

// Finance module pages
const FinanceDashboardPage = lazy(() => import('./pages/Finance/FinanceDashboardPage'));
const CalendarPage = lazy(() => import('./pages/Finance/CalendarPage'));
const TransactionsPage = lazy(() => import('./pages/Finance/TransactionsPage'));
const FinanceAnalyticsPage = lazy(() => import('./pages/Finance/FinanceAnalyticsPage'));
const BudgetPage = lazy(() => import('./pages/Finance/BudgetPage'));
const CategoriesPage = lazy(() => import('./pages/Finance/CategoriesPage'));
const FinanceSettingsPage = lazy(() => import('./pages/Finance/FinanceSettingsPage'));

// Trip Finance pages
const TripListPage = lazy(() => import('./pages/Finance/Trips/TripListPage'));
const TripDashboardPage = lazy(() => import('./pages/Finance/Trips/TripDashboardPage'));
const TripTransactionsPage = lazy(() => import('./pages/Finance/Trips/TripTransactionsPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, token, isLoading, _hasHydrated } = useAuthStore();
  // Wait for Zustand to rehydrate from localStorage before making routing decisions
  if (!_hasHydrated || isLoading) return <LoadingScreen />;
  if (!token || !user) return <Navigate to="/login" replace />;
  if (!user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, token, _hasHydrated } = useAuthStore();
  // Don't redirect until hydration is done — token/user may not be loaded yet
  if (!_hasHydrated) return <LoadingScreen />;
  if (token && user) {
    return <Navigate to={user.onboardingCompleted ? '/dashboard' : '/onboarding'} replace />;
  }
  return <>{children}</>;
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { token, _hasHydrated } = useAuthStore();
  if (!_hasHydrated) return <LoadingScreen />;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  const { loadUser, _hasHydrated } = useAuthStore();
  const { applyTheme } = useUIStore();

  useEffect(() => {
    applyTheme();

    // Listen for system theme changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Trigger loadUser once Zustand has finished reading from localStorage.
  // If user data is already persisted, this is nearly instant.
  useEffect(() => {
    if (_hasHydrated) {
      loadUser();
    }
  }, [_hasHydrated]);

  // Each route guard handles the loading state individually — no full-screen
  // spinner needed here. Individual guards show LoadingScreen until hydrated.

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Onboarding */}
        <Route
          path="/onboarding"
          element={
            <OnboardingGuard><OnboardingPage /></OnboardingGuard>
          }
        />

        {/* Protected app routes */}
        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/track" element={<TrackPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/swot" element={<SwotListPage />} />
          <Route path="/swot/:id" element={<SwotWorkspace />} />
          <Route path="/targets" element={<TargetsPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Finance module */}
          <Route path="/finance" element={<FinanceDashboardPage />} />
          <Route path="/finance/calendar" element={<CalendarPage />} />
          <Route path="/finance/transactions" element={<TransactionsPage />} />
          <Route path="/finance/analytics" element={<FinanceAnalyticsPage />} />
          <Route path="/finance/budget" element={<BudgetPage />} />
          <Route path="/finance/categories" element={<CategoriesPage />} />
          <Route path="/finance/trips" element={<TripListPage />} />
          <Route path="/finance/trips/:tripId" element={<TripDashboardPage />} />
          <Route path="/finance/trips/:tripId/transactions" element={<TripTransactionsPage />} />
          <Route path="/finance/settings" element={<FinanceSettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
