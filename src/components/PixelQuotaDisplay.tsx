import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { config, getMaxPixelQuota } from '@/lib/config';

interface PixelQuotaDisplayProps {
  pendingPixelsCount?: number;
  pendingPixelsNeedingQuota?: number;
  shouldFlash?: boolean;
  onFlashComplete?: () => void;
}

export const PixelQuotaDisplay: React.FC<PixelQuotaDisplayProps> = ({ 
  pendingPixelsCount = 0,
  pendingPixelsNeedingQuota = 0,
  shouldFlash: externalShouldFlash = false,
  onFlashComplete
}) => {
  const { user } = useAuth();
  const [shouldFlash, setShouldFlash] = useState(false);
  const prevOverQuotaRef = useRef(false);
  const hasFlashedRef = useRef(false);

  if (!user) return null;

  const maxQuota = getMaxPixelQuota();
  // Calculate remaining quota considering pending pixels that need quota
  // Allow negative values to show how much over quota (e.g., -2)
  const remainingQuota = user.pixelQuota - pendingPixelsNeedingQuota;
  const isOverQuota = pendingPixelsNeedingQuota > user.pixelQuota;
  
  // Trigger flash animation when quota is exceeded (from external signal or when going over quota)
  useEffect(() => {
    if (externalShouldFlash) {
      // External signal to flash - trigger flash animation
      setShouldFlash(true);
      const timer = setTimeout(() => {
        setShouldFlash(false);
        if (onFlashComplete) {
          onFlashComplete();
        }
      }, 800); // Flash for 600ms (3 pulses at 200ms each)
      return () => clearTimeout(timer);
    }
  }, [externalShouldFlash, onFlashComplete]);

  // Trigger flash when quota is exceeded (first time only, even if circle is empty)
  useEffect(() => {
    if (isOverQuota && !prevOverQuotaRef.current) {
      // Quota just exceeded - trigger flash animation once
      setShouldFlash(true);
      hasFlashedRef.current = true;
      const timer = setTimeout(() => {
        setShouldFlash(false);
      }, 600); // Flash for 600ms (3 pulses at 200ms each)
      return () => clearTimeout(timer);
    }
    // Reset flash flag when quota is no longer exceeded
    if (!isOverQuota && prevOverQuotaRef.current) {
      hasFlashedRef.current = false;
    }
    prevOverQuotaRef.current = isOverQuota;
  }, [isOverQuota]);
  
  // If over quota or flashing, show full circle (100% filled) in red
  const showFullRed = isOverQuota || shouldFlash;
  const percentage = showFullRed ? 100 : (remainingQuota / maxQuota) * 100;
  
  // Determine color based on percentage and over-quota state
  const getColor = () => {
    if (showFullRed) return '#ef4444'; // red when over quota or flashing
    if (percentage <= 10) return '#ef4444'; // red
    if (percentage <= 25) return '#eab308'; // yellow
    return '#929bc9'; // default blue
  };

  const color = getColor();
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = showFullRed 
    ? 0 // Full circle when over quota or flashing
    : circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      {/* Circular Progress Bar */}
      <div className="relative w-10 h-10">
        <svg 
          className={`w-10 h-10 transform -rotate-90 scale-y-[-1] ${isOverQuota ? 'animate-pulse' : shouldFlash ? 'animate-pulse' : ''}`}
        >
          {/* Background circle */}
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="3"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke={color}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
      </div>
      
      {/* Text info */}
      <div className="flex flex-col">
        <span className="text-sm font-medium" style={{ color: '#929bc9' }}>
          {remainingQuota} / {maxQuota}
        </span>
        <span className="text-xs" style={{ color: '#929bc9', opacity: 0.7 }}>
          {pendingPixelsCount > 0 ? (
            `${pendingPixelsCount} değişiklik`
          ) : (
            `+${config.defaultPixelQuota}/day`
          )}
        </span>
      </div>
    </div>
  );
};



