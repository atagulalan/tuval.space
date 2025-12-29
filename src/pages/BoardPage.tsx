import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { PixelBoardRef } from '@/components/PixelBoard';
import { Board } from '@/types';
import { getBoardByName } from '@/services/board.service';
import { placeMultiplePixels } from '@/services/pixel.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logPageView, logButtonClick, logError } from '@/services/analytics.service';
import { logger } from '@/lib/logger';
import { PixelBoard } from '@/components/PixelBoard';
import { ColorPicker, COLOR_PALETTES } from '@/components/ColorPicker';
import { PixelQuotaDisplay } from '@/components/PixelQuotaDisplay';
import { ModificationHistory } from '@/components/ModificationHistory';
import { BoardControlPanel } from '@/components/BoardControlPanel';
import { CanvasControls } from '@/components/CanvasControls';
import { LoginButton } from '@/components/LoginButton';
import { Loading } from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { FiArrowLeft, FiCheck, FiX } from 'react-icons/fi';
import { useBoardPixels } from '@/hooks/useBoardPixels';
import { useBoardModifications } from '@/hooks/useBoardModifications';

export const BoardPage = () => {
  const { boardName } = useParams<{ boardName: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { toast } = useToast();
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const pixelBoardRef = useRef<PixelBoardRef>(null);
  
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingPixelsCount, setPendingPixelsCount] = useState(0);
  const [pendingPixelsNeedingQuota, setPendingPixelsNeedingQuota] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [historyLength, setHistoryLength] = useState(1);
  const [visibleMenus, setVisibleMenus] = useState<Set<string>>(new Set());
  const [shouldFlashQuota, setShouldFlashQuota] = useState(false);
  
  // Track when menus were opened and timeout refs
  const menuOpenTimesRef = useRef<Map<string, number>>(new Map());
  const menuTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const visibleMenusRef = useRef<Set<string>>(new Set());

  const pixels = useBoardPixels(board?.id || null);
  const { modifications } = useBoardModifications(board?.id || null);

  // Area definitions with thresholds
  const OPEN_THRESHOLD = 0.3; // Threshold to open menus (0-1)
  const CLOSE_THRESHOLD = 0.1; // Threshold to close menus (0-1) - lower = harder to close
  const CORNER_SIZE = 0.15; // Size of corner areas (0-1)
  const MENU_TIMEOUT = 2000; // Time in ms before menu can close after opening
  
  type Area = 'top-left' | 'top' | 'top-right' | 'left' | 'right' | 'bottom-left' | 'bottom' | 'bottom-right';
  
  const menuAreas: Record<Area, string[]> = {
    'top-left': ['title'],
    'top': ['quota'],
    'top-right': ['control-panel'],
    'left': [],
    'right': [],
    'bottom-left': ['info-display'],
    'bottom': ['color-picker'],
    'bottom-right': ['canvas-controls'],
  };

  // Calculate certainty for each area based on mouse position
  const calculateAreaCertainty = useCallback((x: number, y: number, width: number, height: number): Record<Area, number> => {
    const normalizedX = x / width;
    const normalizedY = y / height;
    
    const certainties: Record<Area, number> = {
      'top-left': 0,
      'top': 0,
      'top-right': 0,
      'left': 0,
      'right': 0,
      'bottom-left': 0,
      'bottom': 0,
      'bottom-right': 0,
    };

    // Top-left corner
    if (normalizedX < CORNER_SIZE && normalizedY < CORNER_SIZE) {
      const distX = normalizedX / CORNER_SIZE;
      const distY = normalizedY / CORNER_SIZE;
      certainties['top-left'] = 1 - Math.sqrt(distX * distX + distY * distY);
    }

    // Top-right corner
    if (normalizedX > 1 - CORNER_SIZE && normalizedY < CORNER_SIZE) {
      const distX = (1 - normalizedX) / CORNER_SIZE;
      const distY = normalizedY / CORNER_SIZE;
      certainties['top-right'] = 1 - Math.sqrt(distX * distX + distY * distY);
    }

    // Bottom-left corner
    if (normalizedX < CORNER_SIZE && normalizedY > 1 - CORNER_SIZE) {
      const distX = normalizedX / CORNER_SIZE;
      const distY = (1 - normalizedY) / CORNER_SIZE;
      certainties['bottom-left'] = 1 - Math.sqrt(distX * distX + distY * distY);
    }

    // Bottom-right corner
    if (normalizedX > 1 - CORNER_SIZE && normalizedY > 1 - CORNER_SIZE) {
      const distX = (1 - normalizedX) / CORNER_SIZE;
      const distY = (1 - normalizedY) / CORNER_SIZE;
      certainties['bottom-right'] = 1 - Math.sqrt(distX * distX + distY * distY);
    }

    // Top edge (but not corners)
    if (normalizedY < OPEN_THRESHOLD && normalizedX >= CORNER_SIZE && normalizedX <= 1 - CORNER_SIZE) {
      certainties['top'] = 1 - (normalizedY / OPEN_THRESHOLD);
    }

    // Bottom edge (but not corners)
    if (normalizedY > 1 - OPEN_THRESHOLD && normalizedX >= CORNER_SIZE && normalizedX <= 1 - CORNER_SIZE) {
      certainties['bottom'] = 1 - ((1 - normalizedY) / OPEN_THRESHOLD);
    }

    // Left edge (but not corners)
    if (normalizedX < OPEN_THRESHOLD && normalizedY >= CORNER_SIZE && normalizedY <= 1 - CORNER_SIZE) {
      certainties['left'] = 1 - (normalizedX / OPEN_THRESHOLD);
    }

    // Right edge (but not corners)
    if (normalizedX > 1 - OPEN_THRESHOLD && normalizedY >= CORNER_SIZE && normalizedY <= 1 - CORNER_SIZE) {
      certainties['right'] = 1 - ((1 - normalizedX) / OPEN_THRESHOLD);
    }

    return certainties;
  }, []);

  // Track mouse position and update visible menus
  useEffect(() => {
    if (!isFullscreen) {
      const allMenus = new Set(['title', 'quota', 'control-panel', 'color-picker', 'canvas-controls', 'info-display']);
      visibleMenusRef.current = allMenus;
      setVisibleMenus(allMenus);
      return;
    }

    // Initialize with all menus visible when entering fullscreen
    const initialMenus = new Set(['title', 'quota', 'control-panel', 'color-picker', 'canvas-controls', 'info-display']);
    visibleMenusRef.current = initialMenus;
    setVisibleMenus(initialMenus);
    
    // Record opening time for all menus
    const now = Date.now();
    initialMenus.forEach(menu => {
      menuOpenTimesRef.current.set(menu, now);
    });

    const handleMouseMove = (e: MouseEvent) => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const certainties = calculateAreaCertainty(e.clientX, e.clientY, width, height);
      const now = Date.now();
      const currentVisibleMenus = new Set(visibleMenusRef.current);
      const newVisibleMenus = new Set<string>();
      
      // Check each area and determine menu visibility
      Object.entries(certainties).forEach(([area, certainty]) => {
        const menus = menuAreas[area as Area];
        
        menus.forEach(menu => {
          const isCurrentlyVisible = currentVisibleMenus.has(menu);
          const menuOpenTime = menuOpenTimesRef.current.get(menu) || 0;
          const timeSinceOpen = now - menuOpenTime;
          const isWithinTimeout = timeSinceOpen < MENU_TIMEOUT;
          
          // Clear any existing timeout for this menu
          const existingTimeout = menuTimeoutsRef.current.get(menu);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            menuTimeoutsRef.current.delete(menu);
          }
          
          // Determine if menu should be visible
          let shouldBeVisible = false;
          
          if (certainty >= OPEN_THRESHOLD) {
            // Mouse is in open zone - always show menu
            shouldBeVisible = true;
            if (!isCurrentlyVisible) {
              // Menu just opened - record time
              menuOpenTimesRef.current.set(menu, now);
            }
          } else if (isCurrentlyVisible) {
            // Menu is currently visible
            if (isWithinTimeout) {
              // Still within timeout period - keep it open
              shouldBeVisible = true;
            } else if (certainty >= CLOSE_THRESHOLD) {
              // Outside timeout but still above close threshold - keep open
              shouldBeVisible = true;
            } else {
              // Below close threshold and timeout passed - close it
              shouldBeVisible = false;
              menuOpenTimesRef.current.delete(menu);
            }
          }
          
          if (shouldBeVisible) {
            newVisibleMenus.add(menu);
          }
        });
      });
      
      // Clean up menus that are no longer visible
      currentVisibleMenus.forEach(menu => {
        if (!newVisibleMenus.has(menu)) {
          menuOpenTimesRef.current.delete(menu);
          const timeout = menuTimeoutsRef.current.get(menu);
          if (timeout) {
            clearTimeout(timeout);
            menuTimeoutsRef.current.delete(menu);
          }
        }
      });
      
      visibleMenusRef.current = newVisibleMenus;
      setVisibleMenus(newVisibleMenus);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      // Clean up all timeouts
      menuTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      menuTimeoutsRef.current.clear();
      menuOpenTimesRef.current.clear();
    };
  }, [isFullscreen, calculateAreaCertainty]);

  useEffect(() => {
    if (boardName) {
      logPageView('Board Page', { board_name: boardName });
    }
  }, [boardName]);

  useEffect(() => {
    const fetchBoard = async () => {
      if (!boardName) return;
      
      // Wait for auth to load before checking access
      if (authLoading) return;

      try {
        const boardData = await getBoardByName(boardName);
        if (boardData) {
          // Check if the board is private and user is not the owner
          if (!boardData.isPublic && (!user || user.uid !== boardData.ownerId)) {
            toast({
              title: 'Access denied',
              description: 'This board is private',
              variant: 'destructive',
            });
            navigate('/');
            return;
          }
          
          // Set initial color to first color of the palette
          // Check customPalette first, then fall back to classic palette
          if (boardData.customPalette && boardData.customPalette.length > 0) {
            setSelectedColor(boardData.customPalette[0]);
          } else {
            if (COLOR_PALETTES[0].colors.length > 0) {
              setSelectedColor(COLOR_PALETTES[0].colors[0]);
            }
          }
          
          setBoard(boardData);
        } else {
          logError('Board Not Found', `No board found with name "${boardName}"`, 'BoardPage');
          toast({
            title: 'Board not found',
            description: `No board found with name "${boardName}"`,
            variant: 'destructive',
          });
          navigate('/');
        }
      } catch (error) {
        logger('board').error('Error fetching board:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load board';
        logError('Board Fetch Error', errorMessage, 'BoardPage', { board_name: boardName });
        toast({
          title: 'Error',
          description: 'Failed to load board',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();
  }, [boardName, navigate, toast, user, authLoading]);

  const handleBatchPixelPlace = async (
    pixelsToPlace: { x: number; y: number; color: string }[]
  ) => {
    if (!board || !user) return;

    const result = await placeMultiplePixels(
      board.id,
      user.uid,
      user.username,
      pixelsToPlace
    );

    if (result.success) {
      toast({
        title: 'Pixels applied!',
        description: `Successfully placed ${pixelsToPlace.length} pixel${pixelsToPlace.length !== 1 ? 's' : ''}`,
      });
      // Refresh user data to update quota
      await refreshUser();
    } else {
      logError('Batch Pixel Place Failed', result.error || 'Unknown error', 'BoardPage', {
        board_id: board.id,
        pixel_count: pixelsToPlace.length,
      });
      toast({
        title: 'Failed to place pixels',
        description: result.error,
        variant: 'destructive',
      });
      throw new Error(result.error);
    }
  };

  const handleApplyChanges = () => {
    logButtonClick('Apply Changes', 'BoardPage', { board_name: boardName });
    pixelBoardRef.current?.applyChanges();
  };

  const handleClearPending = () => {
    logButtonClick('Clear Pending', 'BoardPage', { board_name: boardName });
    pixelBoardRef.current?.clearPending();
  };

  const handleZoomIn = () => {
    logButtonClick('Zoom In', 'BoardPage');
    pixelBoardRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    logButtonClick('Zoom Out', 'BoardPage');
    pixelBoardRef.current?.zoomOut();
  };

  const handleResetView = () => {
    logButtonClick('Reset View', 'BoardPage');
    pixelBoardRef.current?.resetView();
  };

  const handleFullscreenToggle = useCallback(() => {
    const container = pageContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        logger('board').error('Error entering fullscreen:', err);
        toast({
          title: 'Fullscreen Error',
          description: 'Could not enter fullscreen mode',
          variant: 'destructive',
        });
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }, [toast]);

  // Listen for fullscreen changes (e.g., F11 key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreenNow = !!document.fullscreenElement;
      setIsFullscreen(isFullscreenNow);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (loading) {
    return <Loading message="Loading board..." bgColor="bg-gray-900" textColor="text-gray-300" />;
  }

  if (!board) {
    return null;
  }

  return (
    <div ref={pageContainerRef} className="h-screen relative overflow-hidden">
      {/* Full-screen Canvas */}
      <PixelBoard
        ref={pixelBoardRef}
        board={board}
        pixels={pixels}
        selectedColor={selectedColor}
        onBatchPixelPlace={handleBatchPixelPlace}
        isGuest={!user}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onPendingPixelsChange={setPendingPixelsCount}
        onPendingPixelsNeedingQuotaChange={setPendingPixelsNeedingQuota}
        onQuotaExceeded={() => setShouldFlashQuota(true)}
        currentUserId={user?.uid}
        availableQuota={user ? Math.max(0, user.pixelQuota - pendingPixelsNeedingQuota) : 0}
        onFullscreenChange={setIsFullscreen}
        onHistoryStateChange={(index: number, length: number) => {
          setHistoryIndex(index);
          setHistoryLength(length);
        }}
        onUndoRequest={() => {
          pixelBoardRef.current?.undo();
        }}
        onRedoRequest={() => {
          pixelBoardRef.current?.redo();
        }}
        showInfoDisplay={!isFullscreen || visibleMenus.has('info-display')}
      />

      {/* Top-Left Menu */}
      <div className="absolute top-4 left-4 z-30 pointer-events-auto">
        <div className={`flex items-center gap-2 bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl px-2 py-2 transition-all duration-300 ease-out ${
          isFullscreen 
            ? (visibleMenus.has('title') 
                ? 'translate-x-0 translate-y-0 opacity-100' 
                : '-translate-x-full -translate-y-full opacity-0') 
            : 'translate-x-0 translate-y-0 opacity-100'
        }`}>
          <button
            onClick={() => {
              logButtonClick('Back to Home', 'BoardPage');
              navigate('/');
            }}
            title="Back to Home"
            className="p-3 hover:bg-white/20 transition-all rounded-xl"
          >
            <FiArrowLeft className="h-5 w-5" style={{ color: '#929bc9' }} />
          </button>
          <div className="border-l pl-3 pr-2">
            <h1 className="text-lg font-bold leading-tight text-white">{board.name}</h1>
            <p className="text-xs" style={{ color: '#929bc9', opacity: 0.7 }}>
              by {board.ownerUsername} • {board.width} × {board.height}
            </p>
          </div>
        </div>
      </div>

      {/* Top-Center Menu */}
      {user && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <div className={`flex items-center gap-3 transition-all duration-300 ease-out ${
            isFullscreen 
              ? (visibleMenus.has('quota') 
                  ? 'translate-x-0 translate-y-0 opacity-100' 
                  : 'translate-x-0 -translate-y-full opacity-0') 
              : 'translate-x-0 translate-y-0 opacity-100'
          }`}>
            {/* Vazgeç Button - Left side */}
            {pendingPixelsCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearPending}
                    style={{ color: '#929bc9', borderColor: 'rgba(146, 155, 201, 0.2)' }}
                    className="rounded-full w-10 h-10 p-0 bg-black/20 backdrop-blur-xl border border-white/10 hover:bg-white/20"
                  >
                    <FiX className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Vazgeç</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Pixel Quota Display - Center */}
            <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3">
              <PixelQuotaDisplay 
                pendingPixelsCount={pendingPixelsCount} 
                pendingPixelsNeedingQuota={pendingPixelsNeedingQuota}
                shouldFlash={shouldFlashQuota}
                onFlashComplete={() => setShouldFlashQuota(false)}
              />
            </div>

            {/* Uygula Button - Right side */}
            {pendingPixelsCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={handleApplyChanges}
                    className="rounded-full w-10 h-10 p-0 bg-black/20 backdrop-blur-xl border border-white/10 hover:bg-white/20"
                  >
                    <FiCheck className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Uygula</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      )}

      {/* Top-Right Menu */}
      <div className="absolute top-4 right-4 z-30 pointer-events-auto">
          <div className={`transition-all duration-300 ease-out ${
            isFullscreen 
              ? (visibleMenus.has('control-panel') 
                  ? 'translate-x-0 translate-y-0 opacity-100' 
                  : 'translate-x-full -translate-y-full opacity-0') 
              : 'translate-x-0 translate-y-0 opacity-100'
          }`}>
            <BoardControlPanel
              user={user}
              historyOpen={historyOpen}
              modificationCount={modifications.length}
              onHistoryToggle={setHistoryOpen}
              onSettingsClick={() => {
                // Only show settings if user is the owner
                if (user && board && user.uid === board.ownerId) {
                  setSettingsOpen(true);
                } else {
                  toast({
                    title: 'Access denied',
                    description: 'Only the board owner can access settings',
                    variant: 'destructive',
                  });
                }
              }}
            />
          </div>
      </div>

      {/* Bottom-Center Menu */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <div className={`w-auto max-w-2xl bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl transition-all duration-300 ease-out ${
          isFullscreen 
            ? (visibleMenus.has('color-picker') 
                ? 'translate-x-0 translate-y-0 opacity-100' 
                : 'translate-x-0 translate-y-full opacity-0') 
            : 'translate-x-0 translate-y-0 opacity-100'
        }`}>
          <ColorPicker
            selectedColor={selectedColor}
            onColorChange={setSelectedColor}
            colors={board.customPalette && board.customPalette.length > 0 
              ? board.customPalette 
              : COLOR_PALETTES[0].colors}
          />
          
          {!user && (
            <div className="mx-4 mb-4 p-3 bg-white/10 rounded-xl">
              <p className="text-sm mb-2 text-center" style={{ color: '#929bc9', opacity: 0.7 }}>
                Sign in to place pixels
              </p>
              <div className="flex justify-center">
                <LoginButton />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom-Right Menu */}
      <div className="absolute bottom-6 right-4 z-30 pointer-events-auto">
        <div className={`transition-all duration-300 ease-out ${
          isFullscreen 
            ? (visibleMenus.has('canvas-controls') 
                ? 'translate-x-0 translate-y-0 opacity-100' 
                : 'translate-x-full translate-y-full opacity-0') 
            : 'translate-x-0 translate-y-0 opacity-100'
        }`}>
          <CanvasControls
            isGuest={!user}
            isFullscreen={isFullscreen}
            historyIndex={historyIndex}
            historyLength={historyLength}
            onUndo={() => {
              (window as any).__pixelBoardUndo?.();
            }}
            onRedo={() => {
              pixelBoardRef.current?.redo();
            }}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFullscreenToggle={handleFullscreenToggle}
          />
        </div>
      </div>

      {/* Modification History Panel */}
      {historyOpen && (
        <ModificationHistory
          modifications={modifications}
          board={board}
          onClose={() => setHistoryOpen(false)}
        />
      )}
      {/* Board Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl bg-background/80 backdrop-blur-xl border border-white/10">
          <DialogHeader>
            <DialogTitle>Board Settings</DialogTitle>
            <DialogDescription>{board.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Board Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{board.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dimensions:</span>
                  <span className="font-medium">{board.width} × {board.height}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Pixels:</span>
                  <span className="font-medium">{board.maxPixels.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">{board.createdAt.toDate().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Privacy:</span>
                  <span className="font-medium">{board.isPublic ? 'Public' : 'Private'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Owner:</span>
                  <span className="font-medium">{board.ownerUsername}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                More settings coming soon...
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};



