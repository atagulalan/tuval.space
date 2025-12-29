// Mock HTMLCanvasElement.getContext BEFORE jsdom tries to use canvas
// This must be done before any other imports that might use canvas
// We need to mock it on the prototype before jsdom initializes
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn().mockImplementation((contextType) => {
    if (contextType === '2d') {
      return {
        canvas: document.createElement('canvas'),
        clearRect: jest.fn(),
        fillRect: jest.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        fillText: jest.fn(),
        strokeText: jest.fn(),
        measureText: jest.fn(() => ({ width: 0 })),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn(),
        stroke: jest.fn(),
        fill: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
        translate: jest.fn(),
        rotate: jest.fn(),
        scale: jest.fn(),
        drawImage: jest.fn(),
        getImageData: jest.fn(() => ({
          data: new Uint8ClampedArray(4),
          width: 1,
          height: 1,
        })),
        putImageData: jest.fn(),
        createImageData: jest.fn(() => ({
          data: new Uint8ClampedArray(4),
          width: 1,
          height: 1,
        })),
        setTransform: jest.fn(),
        resetTransform: jest.fn(),
        arc: jest.fn(),
        arcTo: jest.fn(),
        bezierCurveTo: jest.fn(),
        quadraticCurveTo: jest.fn(),
        rect: jest.fn(),
        clip: jest.fn(),
        createLinearGradient: jest.fn(() => ({
          addColorStop: jest.fn(),
        })),
        createRadialGradient: jest.fn(() => ({
          addColorStop: jest.fn(),
        })),
        createPattern: jest.fn(),
      } as unknown as CanvasRenderingContext2D;
    }
    return null;
  }),
  writable: true,
  configurable: true,
});

import '@testing-library/jest-dom';

// Mock firebase/firestore before any imports
jest.mock('firebase/firestore', () => ({
  Timestamp: {
    now: jest.fn(() => ({
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0,
      toDate: jest.fn(() => new Date()),
      toMillis: jest.fn(() => Date.now()),
      isEqual: jest.fn(() => false),
      toJSON: jest.fn(() => ({})),
    })),
    fromDate: jest.fn((date: Date) => ({
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
      toDate: jest.fn(() => date),
      toMillis: jest.fn(() => date.getTime()),
      isEqual: jest.fn(() => false),
      toJSON: jest.fn(() => ({})),
    })),
  },
  initializeFirestore: jest.fn(() => ({})),
  persistentLocalCache: jest.fn((options?: unknown) => options || {}),
  persistentMultipleTabManager: jest.fn(() => ({})),
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(),
  collection: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  increment: jest.fn(),
}));

// Mock firebase/auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn(() => jest.fn()),
    signOut: jest.fn(() => Promise.resolve()),
  })),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({
    setCustomParameters: jest.fn(),
    providerId: 'google.com',
  })),
  User: class MockUser {},
}));

// Mock firebase/app
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  getApp: jest.fn(),
  registerVersion: jest.fn(),
}));

// Mock firebase/analytics
jest.mock('firebase/analytics', () => ({
  getAnalytics: jest.fn(() => ({
    app: {},
    logEvent: jest.fn(),
    setCurrentScreen: jest.fn(),
    setUserId: jest.fn(),
    setUserProperties: jest.fn(),
  })),
  Analytics: class MockAnalytics {},
  isSupported: jest.fn(() => Promise.resolve(false)),
}));

// Mock import.meta.env for Vite
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_FIREBASE_API_KEY: 'test-api-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'test-auth-domain',
        VITE_FIREBASE_PROJECT_ID: 'test-project-id',
        VITE_FIREBASE_STORAGE_BUCKET: 'test-storage-bucket',
        VITE_FIREBASE_MESSAGING_SENDER_ID: 'test-sender-id',
        VITE_FIREBASE_APP_ID: 'test-app-id',
        VITE_FIREBASE_MEASUREMENT_ID: 'test-measurement-id',
        VITE_DEFAULT_PIXEL_QUOTA: '100',
        DEV: true,
        PROD: false,
        MODE: 'test',
      },
    },
  },
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
