/**
 * Modular Logger System
 * 
 * Allows enabling/disabling logging per module.
 * Usage:
 *   logger('auth').log('🎬 useEffect initialized')
 *   logger('auth').error('Error occurred', error)
 * 
 * Control:
 *   logger.enable('auth', 'board')
 *   logger.disable('auth')
 *   logger.toggle('auth')
 *   logger.isEnabled('auth')
 * 
 * Global access:
 *   window.tuvalLogger.enable('auth')
 */

type LogLevel = 'log' | 'warn' | 'error' | 'debug' | 'info';

interface LoggerModule {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
}

interface LoggerConfig {
  enabledModules: Set<string>;
  storageKey: string;
  defaultEnabled: boolean;
}

class ModularLogger {
  private config: LoggerConfig;

  constructor() {
    this.config = {
      enabledModules: new Set(),
      storageKey: 'tuval_logger_modules',
      defaultEnabled: true, // All modules enabled by default
    };

    const hadStoredConfig = typeof window !== 'undefined' && !!localStorage.getItem(this.config.storageKey);
    this.loadFromStorage();
    
    // Disable auth logs by default on first run (can be enabled via window.tuvalLogger.enable('auth'))
    if (!hadStoredConfig) {
      // First time - disable auth by default
      this.config.defaultEnabled = false;
      // Don't add 'auth' to enabledModules, so it stays disabled
      this.saveToStorage();
    }
    
    this.setupGlobalAccess();
  }

  /**
   * Load enabled modules from localStorage
   * If localStorage is empty, all modules are enabled by default
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const data = JSON.parse(stored) as { enabled?: string[]; allDisabled?: boolean };
        if (data.allDisabled) {
          // All modules explicitly disabled
          this.config.enabledModules = new Set();
          this.config.defaultEnabled = false;
        } else if (data.enabled) {
          // Specific modules enabled
          this.config.enabledModules = new Set(data.enabled);
          this.config.defaultEnabled = false;
        }
      }
      // If nothing stored, defaultEnabled remains true (all modules enabled)
    } catch (error) {
      console.warn('[Logger] Failed to load from localStorage:', error);
    }
  }

  /**
   * Save enabled modules to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      if (this.config.defaultEnabled && this.config.enabledModules.size === 0) {
        // All modules enabled by default, clear storage
        localStorage.removeItem(this.config.storageKey);
      } else {
        const data = {
          enabled: Array.from(this.config.enabledModules),
          allDisabled: !this.config.defaultEnabled && this.config.enabledModules.size === 0,
        };
        localStorage.setItem(this.config.storageKey, JSON.stringify(data));
      }
    } catch (error) {
      console.warn('[Logger] Failed to save to localStorage:', error);
    }
  }

  /**
   * Check if a module is enabled
   */
  private isModuleEnabled(module: string): boolean {
    // If defaultEnabled is true and no explicit config, all modules are enabled
    if (this.config.defaultEnabled && this.config.enabledModules.size === 0) {
      return true;
    }
    // Otherwise, check if module is in the enabled set
    return this.config.enabledModules.has(module);
  }

  /**
   * Create a logger instance for a specific module
   */
  private createModuleLogger(module: string): LoggerModule {
    const isProduction = import.meta.env.PROD;
    
    const createLogMethod = (level: LogLevel) => {
      return (...args: unknown[]) => {
        // In production, only log errors and warnings
        if (isProduction && level !== 'error' && level !== 'warn') {
          return;
        }

        if (!this.isModuleEnabled(module)) {
          return; // Module disabled, don't log
        }

        // Use the appropriate console method
        const consoleMethod = console[level] || console.log;
        consoleMethod(...args);
      };
    };

    return {
      log: createLogMethod('log'),
      warn: createLogMethod('warn'),
      error: createLogMethod('error'),
      debug: createLogMethod('debug'),
      info: createLogMethod('info'),
    };
  }

  /**
   * Get logger for a specific module
   */
  getModule(module: string): LoggerModule {
    return this.createModuleLogger(module);
  }

  /**
   * Enable one or more modules
   */
  enable(...modules: string[]): void {
    // If we're enabling modules, we're no longer in "all enabled" default mode
    this.config.defaultEnabled = false;
    modules.forEach((module) => {
      this.config.enabledModules.add(module);
    });
    this.saveToStorage();
  }

  /**
   * Disable one or more modules
   */
  disable(...modules: string[]): void {
    modules.forEach((module) => {
      this.config.enabledModules.delete(module);
    });
    this.saveToStorage();
  }

  /**
   * Toggle a module's enabled state
   */
  toggle(module: string): boolean {
    if (this.isModuleEnabled(module)) {
      this.disable(module);
      return false;
    } else {
      this.enable(module);
      return true;
    }
  }

  /**
   * Check if a module is enabled
   */
  isEnabled(module: string): boolean {
    return this.isModuleEnabled(module);
  }

  /**
   * Get all enabled modules
   */
  getEnabledModules(): string[] {
    return Array.from(this.config.enabledModules);
  }

  /**
   * Enable all modules (reset to default state)
   */
  enableAll(): void {
    this.config.enabledModules.clear();
    this.config.defaultEnabled = true;
    this.saveToStorage();
  }

  /**
   * Disable all modules
   */
  disableAll(): void {
    this.config.enabledModules.clear();
    this.config.defaultEnabled = false;
    this.saveToStorage();
  }

  /**
   * Setup global access via window.tuvalLogger
   */
  private setupGlobalAccess(): void {
    if (typeof window === 'undefined') return;

    (window as unknown as { tuvalLogger: ModularLogger }).tuvalLogger = this;
  }
}

// Create singleton instance
const loggerInstance = new ModularLogger();

// Export as function that returns module logger
export const logger = ((module: string) => {
  return loggerInstance.getModule(module);
}) as ((module: string) => LoggerModule) & {
  enable: (...modules: string[]) => void;
  disable: (...modules: string[]) => void;
  toggle: (module: string) => boolean;
  isEnabled: (module: string) => boolean;
  getEnabledModules: () => string[];
  enableAll: () => void;
  disableAll: () => void;
};

// Attach methods to the function
logger.enable = (...modules: string[]) => loggerInstance.enable(...modules);
logger.disable = (...modules: string[]) => loggerInstance.disable(...modules);
logger.toggle = (module: string) => loggerInstance.toggle(module);
logger.isEnabled = (module: string) => loggerInstance.isEnabled(module);
logger.getEnabledModules = () => loggerInstance.getEnabledModules();
logger.enableAll = () => loggerInstance.enableAll();
logger.disableAll = () => loggerInstance.disableAll();

