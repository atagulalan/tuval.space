import { logEvent, setUserProperties, setUserId } from 'firebase/analytics';
import { analytics } from '@/lib/firebase';
import { User } from '@/types';

/**
 * Analytics service for tracking user interactions, page views, and errors
 */

// Check if analytics is available
const isAnalyticsAvailable = (): boolean => {
  return analytics !== null && typeof window !== 'undefined';
};

/**
 * Log a page view event
 */
export const logPageView = (pageName: string, additionalParams?: Record<string, any>) => {
  if (!isAnalyticsAvailable()) return;

  try {
    logEvent(analytics!, 'page_view', {
      page_title: pageName,
      page_location: window.location.href,
      page_path: window.location.pathname,
      ...additionalParams,
    });
  } catch (error) {
    console.error('Error logging page view:', error);
  }
};

/**
 * Log a button click event
 */
export const logButtonClick = (
  buttonName: string,
  buttonLocation?: string,
  additionalParams?: Record<string, any>
) => {
  if (!isAnalyticsAvailable()) return;

  try {
    logEvent(analytics!, 'button_click', {
      button_name: buttonName,
      button_location: buttonLocation || window.location.pathname,
      ...additionalParams,
    });
  } catch (error) {
    console.error('Error logging button click:', error);
  }
};

/**
 * Log an error event
 */
export const logError = (
  errorName: string,
  errorMessage: string,
  errorLocation?: string,
  additionalParams?: Record<string, any>
) => {
  if (!isAnalyticsAvailable()) return;

  try {
    logEvent(analytics!, 'error', {
      error_name: errorName,
      error_message: errorMessage,
      error_location: errorLocation || window.location.pathname,
      ...additionalParams,
    });
  } catch (error) {
    console.error('Error logging error event:', error);
  }
};

/**
 * Set user ID for analytics
 */
export const setAnalyticsUserId = (userId: string) => {
  if (!isAnalyticsAvailable()) return;

  try {
    setUserId(analytics!, userId);
  } catch (error) {
    console.error('Error setting analytics user ID:', error);
  }
};

/**
 * Set user properties for analytics
 */
export const setAnalyticsUserProperties = (user: User) => {
  if (!isAnalyticsAvailable()) return;

  try {
    setUserProperties(analytics!, {
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error('Error setting analytics user properties:', error);
  }
};

/**
 * Log a custom event
 */
export const logCustomEvent = (
  eventName: string,
  params?: Record<string, any>
) => {
  if (!isAnalyticsAvailable()) return;

  try {
    logEvent(analytics!, eventName, params);
  } catch (error) {
    console.error('Error logging custom event:', error);
  }
};






