import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LoadingSkeleton } from '../components/common/StateBlocks';
import { useAuth } from '../contexts/AuthContext';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { BalancePage } from '../pages/BalancePage';
import { HabitsPage } from '../pages/HabitsPage';
import { HealthPage } from '../pages/HealthPage';
import { HomePage } from '../pages/HomePage';
import { JournalPage } from '../pages/JournalPage';
import { MemoriesPage } from '../pages/MemoriesPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PlannerPage } from '../pages/PlannerPage';
import { ProfilePage } from '../pages/ProfilePage';
import { ProgressPage } from '../pages/ProgressPage';
import { StudyPage } from '../pages/StudyPage';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <AuthLayout>
        <div style={{ marginTop: 20 }}>
          <LoadingSkeleton lines={3} />
        </div>
      </AuthLayout>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const PublicOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnly>
            <RegisterPage />
          </PublicOnly>
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/study" element={<StudyPage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/memories" element={<MemoriesPage />} />
        <Route path="/balance" element={<BalancePage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

