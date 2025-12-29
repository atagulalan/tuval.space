import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { UsernameRegistration } from './components/UsernameRegistration';
import { Loading } from './components/Loading';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { BoardPage } from './pages/BoardPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { BrowseBoardPage } from './pages/BrowseBoardPage';
import { ImportPage } from './pages/ImportPage';
import { ImportPngPage } from './pages/ImportPngPage';

// Unused component - kept for potential future use
// @ts-expect-error - Unused component kept for potential future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes = () => {
  return (
    <>
      <UsernameRegistration />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/browse" element={<BrowseBoardPage />} />
        <Route path="/board/:boardName" element={<BoardPage />} />
        <Route path="/user/:username" element={<UserProfilePage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/import-png" element={<ImportPngPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};







