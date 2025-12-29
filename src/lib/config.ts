import { AppConfig } from '@/types';

/**
 * Parse integer from environment variable with validation
 */
function parseIntEnv(name: string, value: string | undefined, defaultValue: number): number {
  if (!value) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 0) {
    console.warn(
      `Invalid value for ${name}: "${value}". Using default: ${defaultValue}`
    );
    return defaultValue;
  }
  return parsed;
}

export const config: AppConfig = {
  defaultPixelQuota: parseIntEnv(
    'VITE_DEFAULT_PIXEL_QUOTA',
    import.meta.env.VITE_DEFAULT_PIXEL_QUOTA,
    100
  ),
  maxPixelAccumulation: parseIntEnv(
    'VITE_MAX_PIXEL_ACCUMULATION',
    import.meta.env.VITE_MAX_PIXEL_ACCUMULATION,
    3
  ),
  maxBoardsPerUser: parseIntEnv(
    'VITE_MAX_BOARDS_PER_USER',
    import.meta.env.VITE_MAX_BOARDS_PER_USER,
    10
  ),
  maxBoardPixels: parseIntEnv(
    'VITE_MAX_BOARD_PIXELS',
    import.meta.env.VITE_MAX_BOARD_PIXELS,
    400000
  ),
  changeMergeWindowHours: parseIntEnv(
    'VITE_CHANGE_MERGE_WINDOW_HOURS',
    import.meta.env.VITE_CHANGE_MERGE_WINDOW_HOURS,
    8
  ),
  defaultBoardWidth: 256,
  defaultBoardHeight: 144,
};

export const getMaxPixelQuota = (): number => {
  return config.defaultPixelQuota * config.maxPixelAccumulation;
};

export const validateBoardDimensions = (
  width: number,
  height: number
): boolean => {
  return width * height <= config.maxBoardPixels;
};


