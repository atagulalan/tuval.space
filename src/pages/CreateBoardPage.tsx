import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CreateBoardDialog } from '@/components/organisms/CreateBoardDialog';
import { logPageView } from '@/services/analytics.service';

export const CreateBoardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Create Board Page');
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // This page primarily serves as a redirect trigger
  // The actual creation happens via the dialog component
  return (
    <div className="min-h-screen flex items-center justify-center">
      <CreateBoardDialog />
    </div>
  );
};
