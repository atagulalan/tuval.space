import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppRoutes } from './routes';
import { Toaster } from './components/atoms/ui/toaster';
import { TooltipProvider } from './components/atoms/ui/tooltip';
import { ErrorBoundary } from './components/organisms/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router
          basename="/"
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <TooltipProvider>
            <AppRoutes />
            <Toaster />
          </TooltipProvider>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
