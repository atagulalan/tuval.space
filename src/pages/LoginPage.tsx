import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginButton } from '@/components/LoginButton';
import { useAuth } from '@/contexts/AuthContext';
import { logPageView } from '@/services/analytics.service';
import { Loading } from '@/components/Loading';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const LoginPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Login Page');
  }, []);

  useEffect(() => {
    if (user) {
      console.log('✅ [LOGIN PAGE] User authenticated, redirecting to home...');
      navigate('/');
    }
  }, [user, navigate]);

  if (loading) {
    return <Loading message="Loading..." bgColor="bg-muted/30" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/logo.svg" alt="tuval.space logo" className="h-8 w-8" />
            <CardTitle className="text-3xl">tuval.space</CardTitle>
          </div>
          <CardDescription>
            Sign in to start creating collaborative pixel art
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <LoginButton />
        </CardContent>
      </Card>
    </div>
  );
};



