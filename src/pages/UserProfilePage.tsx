import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Board } from '@/types';
import { getUserByUsername, getUserBoards, invalidateUsernameCache } from '@/services/user.service';
import { useAuth } from '@/contexts/AuthContext';
import { logPageView, logButtonClick, logError } from '@/services/analytics.service';
import { BoardList } from '@/components/BoardList';
import { CreateBoardDialog } from '@/components/CreateBoardDialog';
import { Loading } from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { FiArrowLeft, FiUser, FiRefreshCw, FiPlus } from 'react-icons/fi';
import { config, getMaxPixelQuota } from '@/lib/config';
import { useCachedImage } from '@/hooks/useCachedImage';

export const UserProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser, firebaseUser: currentFirebaseUser, loading: authLoading, refreshUser } = useAuth();
  
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createBoardDialogOpen, setCreateBoardDialogOpen] = useState(false);

  // Memoize isOwnProfile to prevent unnecessary recalculations
  const isOwnProfile = useMemo(
    () => currentUser?.username === username,
    [currentUser?.username, username]
  );
  
  // Cache profile photo to prevent 429 errors
  const cachedPhotoURL = useCachedImage(
    isOwnProfile && currentFirebaseUser?.photoURL ? currentFirebaseUser.photoURL : null
  );

  // Track current username and mounted state to prevent race conditions
  const currentUsernameRef = useRef<string | undefined>(username);
  const isMountedRef = useRef(true);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (!username || authLoading) return;

    setRefreshing(true);
    logButtonClick('Refresh Profile', 'UserProfilePage');

    try {
      // Always invalidate memory cache first to force fresh fetch from Firestore
      invalidateUsernameCache(username);

      // If viewing own profile, refresh from AuthContext (which will fetch fresh data from Firestore)
      if (isOwnProfile && currentUser) {
        // Refresh user data from AuthContext (this will fetch fresh data from Firestore and update state)
        // Memory cache is already invalidated above, so getUser will fetch fresh data
        await refreshUser();
        // After refreshUser, AuthContext state will update and component will re-render
        // with the new currentUser. We'll use the updated currentUser from the next render.
        // For now, update with current data (will be updated on next render)
        setProfileUser(currentUser);
        const userBoards = getUserBoards(currentUser);
        setBoards(userBoards);
      } else {
        // For other users' profiles, fetch fresh data (cache already invalidated)
        const user = await getUserByUsername(username);
        
        if (user) {
          setProfileUser(user);
          const userBoards = getUserBoards(user);
          
          // Filter out private boards if viewing someone else's profile
          const visibleBoards = userBoards.filter(board => {
            if (board.isPublic) return true;
            if (currentUser && currentUser.uid === user.uid) return true;
            return false;
          });
          
          setBoards(visibleBoards);
        } else {
          setProfileUser(null);
        }
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh profile';
      logError('Profile Refresh Error', errorMessage, 'UserProfilePage', { username });
    } finally {
      // Keep button disabled and spinning for 2 seconds after refresh completes
      refreshTimeoutRef.current = setTimeout(() => {
        setRefreshing(false);
        refreshTimeoutRef.current = null;
      }, 2000);
    }
  }, [username, authLoading, isOwnProfile, currentUser, refreshUser]);

  // Update profile when currentUser changes after refresh (for own profile)
  useEffect(() => {
    if (isOwnProfile && currentUser && !refreshing) {
      setProfileUser(currentUser);
      const userBoards = getUserBoards(currentUser);
      setBoards(userBoards);
    }
  }, [isOwnProfile, currentUser, refreshing]);

  // Analytics: Only log when username changes
  useEffect(() => {
    if (username) {
      logPageView('User Profile Page', { username, is_own_profile: isOwnProfile });
    }
  }, [username, isOwnProfile]);

  useEffect(() => {
    // Update ref when username changes
    currentUsernameRef.current = username;
    isMountedRef.current = true;
    setLoading(true);

    const fetchData = async () => {
      if (!username) {
        if (isMountedRef.current) {
          setLoading(false);
        }
        return;
      }

      // Wait for auth to finish loading before determining if it's own profile
      if (authLoading) {
        // Auth is still loading, wait for it to complete
        // The effect will re-run when authLoading becomes false
        return;
      }

      // If viewing own profile, use data from AuthContext (already has real-time listener)
      if (isOwnProfile && currentUser) {
        // Check if still mounted and username hasn't changed
        if (!isMountedRef.current || currentUsernameRef.current !== username) {
          return;
        }
        setProfileUser(currentUser);
        const userBoards = getUserBoards(currentUser);
        setBoards(userBoards); // Own boards are always visible
        setLoading(false);
        return;
      }

      // For other users' profiles, fetch once (no listener needed)
      // Only fetch if we're sure it's not our own profile (auth has loaded and isOwnProfile is false)
      try {
        const user = await getUserByUsername(username);
        
        // Check if still mounted and username hasn't changed (race condition prevention)
        if (!isMountedRef.current || currentUsernameRef.current !== username) {
          return;
        }

        if (user) {
          setProfileUser(user);
          // Get boards from denormalized user data (no additional query needed!)
          const userBoards = getUserBoards(user);
          
          // Filter out private boards if viewing someone else's profile
          const visibleBoards = userBoards.filter(board => {
            if (board.isPublic) return true;
            if (currentUser && currentUser.uid === user.uid) return true;
            return false;
          });
          
          setBoards(visibleBoards);
        } else {
          // User not found
          setProfileUser(null);
        }
      } catch (error) {
        // Only handle error if still mounted and username hasn't changed
        if (!isMountedRef.current || currentUsernameRef.current !== username) {
          return;
        }
        console.error('Error fetching user data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user data';
        logError('User Profile Fetch Error', errorMessage, 'UserProfilePage', { username });
        setProfileUser(null);
      } finally {
        // Only update loading state if still mounted and username hasn't changed
        if (isMountedRef.current && currentUsernameRef.current === username) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      isMountedRef.current = false;
    };
  }, [
    username,
    authLoading,
    // Only depend on currentUser when viewing own profile to avoid unnecessary re-fetches
    // when viewing someone else's profile. isOwnProfile is derived from these, so we don't need it separately.
    isOwnProfile ? currentUser : null,
  ]);

  // Cleanup refresh timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return <Loading message="Loading profile..." />;
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-dark">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-white">User not found</h2>
          <p className="text-slate-300 mb-4">
            The user "{username}" does not exist
          </p>
          <Button
            onClick={() => {
              logButtonClick('Back to Home', 'UserProfilePage');
              navigate('/');
            }}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark text-white">
      {/* Header */}
      <header className="border-b border-border-dark bg-background-dark/80 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                logButtonClick('Back to Home', 'UserProfilePage');
                navigate('/');
              }}
              className="text-white hover:bg-surface-dark"
            >
              <FiArrowLeft />
            </Button>
            <h1 className="text-2xl font-bold text-white flex-1">
              {isOwnProfile ? 'My Profile' : `${username}'s Profile`}
            </h1>
            <Button
              variant="ghost"
              onClick={refreshProfile}
              disabled={refreshing || loading}
              className="text-white hover:bg-surface-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Refresh profile"
            >
              <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Profile Info */}
      <section className="border-b border-border-dark bg-surface-dark/50">
        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {cachedPhotoURL ? (
                <img
                  src={cachedPhotoURL}
                  alt={profileUser.username}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    // If image fails to load, hide it to show fallback avatar
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : null}
              {!cachedPhotoURL && (
                <FiUser className="h-12 w-12 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2 text-white">{profileUser.username}</h2>
              <p className="text-slate-300 mb-4">{profileUser.email}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-dark rounded-lg p-4 border border-border-dark">
                  <p className="text-sm text-slate-300">Boards</p>
                  <p className="text-2xl font-bold text-white">
                    {boards.length} / {config.maxBoardsPerUser}
                  </p>
                </div>
                {isOwnProfile && (
                  <>
                    <div className="bg-surface-dark rounded-lg p-4 border border-border-dark">
                      <p className="text-sm text-slate-300">
                        Pixel Quota
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {profileUser.pixelQuota}
                      </p>
                    </div>
                    <div className="bg-surface-dark rounded-lg p-4 border border-border-dark">
                      <p className="text-sm text-slate-300">
                        Max Quota
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {getMaxPixelQuota()}
                      </p>
                    </div>
                    <div className="bg-surface-dark rounded-lg p-4 border border-border-dark">
                      <p className="text-sm text-slate-300">
                        Daily Refill
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {config.defaultPixelQuota}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Boards Section */}
      <section className="max-w-[1200px] mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-white">
              {isOwnProfile ? 'My Boards' : `${username}'s Boards`}
            </h2>
            {isOwnProfile && (
              <>
                <Button
                  onClick={() => {
                    logButtonClick('New Board', 'UserProfilePage');
                    setCreateBoardDialogOpen(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <FiPlus className="h-4 w-4" />
                  New Board
                </Button>
                <CreateBoardDialog
                  open={createBoardDialogOpen}
                  onOpenChange={setCreateBoardDialogOpen}
                />
              </>
            )}
          </div>
          <p className="text-slate-300">
            {boards.length} board{boards.length !== 1 ? 's' : ''}
          </p>
        </div>

        <BoardList boards={boards} loading={false} />
      </section>
    </div>
  );
};




