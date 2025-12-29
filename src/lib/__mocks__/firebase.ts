// Helper to create mock functions that work in both Jest and Storybook
const createMockFn = (impl?: any) => {
  if (typeof jest !== 'undefined' && jest.fn) {
    return jest.fn(impl);
  }
  return (impl || (() => {})) as any;
};

// Mock Firebase Auth
export const mockAuth = {
  currentUser: null,
  onAuthStateChanged: createMockFn((_callback: any) => {
    // Return unsubscribe function
    return createMockFn();
  }),
  signOut: createMockFn(() => Promise.resolve()),
};

// Mock Firebase Firestore
export const mockDb = {};

// Mock Firebase Analytics
export const mockAnalytics = null;

// Mock Firestore functions
export const mockGetDoc = createMockFn(() =>
  Promise.resolve({
    exists: () => true,
    data: () => ({}),
    id: 'mock-id',
  })
);

export const mockGetDocs = createMockFn(() =>
  Promise.resolve({
    docs: [],
    empty: true,
    size: 0,
  })
);

export const mockOnSnapshot = createMockFn((_callback: any) => {
  // Return unsubscribe function
  return createMockFn();
});

export const mockDoc = createMockFn((path: any) => path);
export const mockCollection = createMockFn((path: any) => path);
export const mockQuery = createMockFn((query: any) => query);
export const mockWhere = createMockFn((field: any, op: any, value: any) => ({
  field,
  op,
  value,
}));
export const mockSetDoc = createMockFn(() => Promise.resolve());
export const mockUpdateDoc = createMockFn(() => Promise.resolve());
export const mockIncrement = createMockFn((value: any) => value);

// Export mock Firebase app
export const mockApp = {};

// Export mock Google provider
export const mockGoogleProvider = {
  setCustomParameters: jest.fn(),
};

// Export for use in tests and Storybook
export const auth = mockAuth;
export const db = mockDb;
export const analytics = mockAnalytics;
export const app = mockApp;
export const googleProvider = mockGoogleProvider;
export const getDoc = mockGetDoc;
export const getDocs = mockGetDocs;
export const onSnapshot = mockOnSnapshot;
