import { useState } from 'react';
import { FiUser, FiLogOut, FiGrid, FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/atoms/ui/dropdown-menu';
import { Button } from '@/components/atoms/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/services/auth.service';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { logButtonClick, logError } from '@/services/analytics.service';
import { CreateBoardDialog } from '@/components/organisms/CreateBoardDialog';
import { useCachedImage } from '@/hooks/useCachedImage';

interface UserMenuProps {
  variant?: 'default' | 'board';
  hideCreateBoard?: boolean;
}

export const UserMenu = ({
  variant = 'default',
  hideCreateBoard = false,
}: UserMenuProps) => {
  const { user, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [createBoardDialogOpen, setCreateBoardDialogOpen] = useState(false);

  const photoURL = firebaseUser?.photoURL;
  // Cache profile photo to prevent 429 errors
  const cachedPhotoURL = useCachedImage(photoURL || null);

  if (!user) return null;

  const handleSignOut = async () => {
    logButtonClick('Sign Out', window.location.pathname);
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to sign out';
      logError('Sign Out Failed', errorMessage, 'UserMenu');
      toast({
        title: 'Sign out failed',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const isBoardVariant = variant === 'board';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          style={{ color: '#929bc9' }}
          className="rounded-full hover:opacity-80"
        >
          {cachedPhotoURL ? (
            <img
              src={cachedPhotoURL}
              alt={user.username}
              className="h-8 w-8 rounded-full object-cover"
              onError={(e) => {
                // If image fails to load, hide it to show fallback avatar
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : null}
          {!cachedPhotoURL && <FiUser className="h-5 w-5" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(
          isBoardVariant
            ? 'bg-black/20 backdrop-blur-xl border-white/10 text-white'
            : 'bg-gray-800 border-gray-700 text-gray-100'
        )}
      >
        <DropdownMenuLabel
          className={cn(isBoardVariant ? 'text-white' : 'text-gray-100')}
        >
          <div className="flex items-center gap-3">
            {cachedPhotoURL ? (
              <img
                src={cachedPhotoURL}
                alt={user.username}
                className="h-10 w-10 rounded-full object-cover"
                onError={(e) => {
                  // If image fails to load, hide it to show fallback avatar
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <FiUser className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <p className="font-medium">{user.username}</p>
              <p
                className={cn(
                  'text-xs truncate max-w-[150px]',
                  isBoardVariant ? 'text-white/70' : 'text-gray-400'
                )}
              >
                {user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator
          className={cn(isBoardVariant ? 'bg-white/10' : 'bg-gray-700')}
        />
        {!hideCreateBoard && (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              logButtonClick('Create Board', 'UserMenu');
              setCreateBoardDialogOpen(true);
            }}
            className={cn(
              'font-semibold',
              isBoardVariant
                ? 'text-white hover:bg-white/20 focus:bg-white/20 hover:text-white focus:text-white bg-white/5'
                : 'text-gray-100 hover:bg-gray-600 focus:bg-gray-600 bg-gray-700/50'
            )}
          >
            <FiPlus className="mr-2 h-4 w-4" />
            Create Board
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => {
            logButtonClick('My Profile', 'UserMenu');
            navigate(`/user/${user.username}`);
          }}
          className={cn(
            isBoardVariant
              ? 'text-white hover:bg-white/10 focus:bg-white/10 hover:text-white focus:text-white'
              : 'text-gray-300 hover:bg-gray-700 focus:bg-gray-700'
          )}
        >
          <FiUser className="mr-2 h-4 w-4" />
          My Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            logButtonClick('Browse Boards', 'UserMenu');
            navigate('/browse');
          }}
          className={cn(
            isBoardVariant
              ? 'text-white hover:bg-white/10 focus:bg-white/10 hover:text-white focus:text-white'
              : 'text-gray-300 hover:bg-gray-700 focus:bg-gray-700'
          )}
        >
          <FiGrid className="mr-2 h-4 w-4" />
          Browse Boards
        </DropdownMenuItem>
        <DropdownMenuSeparator
          className={cn(isBoardVariant ? 'bg-white/10' : 'bg-gray-700')}
        />
        <DropdownMenuItem
          onClick={handleSignOut}
          className={cn(
            isBoardVariant
              ? 'text-white hover:bg-white/10 focus:bg-white/10 hover:text-white focus:text-white'
              : 'text-gray-300 hover:bg-gray-700 focus:bg-gray-700'
          )}
        >
          <FiLogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
      <CreateBoardDialog
        open={createBoardDialogOpen}
        onOpenChange={setCreateBoardDialogOpen}
      />
    </DropdownMenu>
  );
};
