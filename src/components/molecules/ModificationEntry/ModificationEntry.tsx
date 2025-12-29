import { useState, useRef, useEffect } from 'react';
import { DenseModification, Board } from '@/types';
import { formatTimestamp } from '@/lib/utils';
import { Button } from '@/components/atoms/ui/button';
import { FiX, FiUser, FiEye, FiEyeOff } from 'react-icons/fi';
import {
  getModificationCount,
  toggleModificationEnabled,
  decodePixelsFromBase36,
} from '@/services/modification.service';
import { useToast } from '@/hooks/use-toast';

interface ModificationEntryProps {
  modification: DenseModification;
  onDismiss?: (modificationId: string) => void;
  currentUserId?: string;
  boardOwnerId?: string;
  boardId?: string;
  board?: Board | null;
}

export const ModificationEntry: React.FC<ModificationEntryProps> = ({
  modification,
  onDismiss,
  currentUserId,
  boardOwnerId,
  boardId,
  board,
}) => {
  const { toast } = useToast();
  const [isToggling, setIsToggling] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelCount = getModificationCount(modification);
  const isBoardOwner =
    currentUserId && boardOwnerId && currentUserId === boardOwnerId;

  const formatModificationTime = () => {
    const date = modification.createdAt.toDate();
    return formatTimestamp(date);
  };

  // Draw preview on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const padding = 2; // Padding in pixels
    const maxSize = 48; // Maximum preview size in pixels
    const availableSize = maxSize - padding * 2; // Available size after padding
    const scale = Math.min(
      availableSize / modification.w,
      availableSize / modification.h,
      1
    );
    const contentWidth = modification.w * scale;
    const contentHeight = modification.h * scale;
    const previewWidth = Math.floor(contentWidth + padding * 2);
    const previewHeight = Math.floor(contentHeight + padding * 2);
    const pixelSize = scale;

    canvas.width = previewWidth;
    canvas.height = previewHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, previewWidth, previewHeight);

    // Decode base36 string to colors array
    if (!board) return;
    const decodedPixels = decodePixelsFromBase36(modification.pixels, board);

    // Draw each pixel with padding offset
    for (let row = 0; row < modification.h; row++) {
      for (let col = 0; col < modification.w; col++) {
        const pixelIndex = row * modification.w + col;
        const pixelColor = decodedPixels[pixelIndex];

        if (pixelColor !== null) {
          ctx.fillStyle = pixelColor;
          ctx.fillRect(
            Math.floor(col * pixelSize) + padding,
            Math.floor(row * pixelSize) + padding,
            Math.ceil(pixelSize),
            Math.ceil(pixelSize)
          );
        }
      }
    }
  }, [modification, board]);

  const handleToggleEnabled = async () => {
    if (!boardId || !currentUserId || !isBoardOwner) return;

    setIsToggling(true);
    const newEnabled = !modification.enabled;
    const result = await toggleModificationEnabled(
      boardId,
      modification.id,
      currentUserId,
      newEnabled
    );

    if (result.success) {
      toast({
        title: newEnabled ? 'Modification enabled' : 'Modification disabled',
        description: `The modification has been ${newEnabled ? 'enabled' : 'disabled'}`,
      });
    } else {
      toast({
        title: 'Failed to toggle modification',
        description: result.error || 'An error occurred',
        variant: 'destructive',
      });
    }
    setIsToggling(false);
  };

  return (
    <div className="border border-white/10 rounded-xl p-3 bg-white/10 hover:bg-white/15 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <div className="w-8 h-8 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
            <FiUser className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">
                {modification.username}
              </span>
              {!modification.enabled && (
                <span className="text-xs bg-red-500/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-red-400">
                  Disabled
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pixelCount} pixel{pixelCount !== 1 ? 's' : ''} changed
            </p>
            <p className="text-xs text-muted-foreground">
              Region: ({modification.x}, {modification.y}) {modification.w}×
              {modification.h}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatModificationTime()}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 flex-shrink-0">
          {/* Preview */}
          <canvas
            ref={canvasRef}
            className="flex-shrink-0 border border-white/20 rounded"
            style={{
              maxWidth: '48px',
              maxHeight: '48px',
              imageRendering: 'pixelated',
            }}
          />

          {/* Action buttons */}
          <div className="flex flex-col items-center gap-1">
            {isBoardOwner && boardId && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={handleToggleEnabled}
                disabled={isToggling}
                title={
                  modification.enabled
                    ? 'Disable modification'
                    : 'Enable modification'
                }
              >
                {modification.enabled ? (
                  <FiEyeOff className="h-4 w-4" />
                ) : (
                  <FiEye className="h-4 w-4" />
                )}
              </Button>
            )}
            {currentUserId && onDismiss && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => onDismiss(modification.id)}
              >
                <FiX className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
