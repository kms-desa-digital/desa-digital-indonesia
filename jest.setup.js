const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { ReadableStream } = require('stream/web');
global.ReadableStream = ReadableStream;

// Mock next-intl globally to prevent translation context errors and ES Module syntax issues
jest.mock('next-intl', () => ({
  useTranslations: () => (key) => key,
  useFormatter: () => ({
    dateTime: (val) => val,
    number: (val) => val,
  }),
  useLocale: () => 'id',
  useTimeZone: () => 'Asia/Jakarta',
  useNow: () => new Date(),
  useMessages: () => ({}),
  NextIntlClientProvider: ({ children }) => children,
}));

// Mock Firebase globally to prevent invalid API key errors
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => [{}]),
  getApp: jest.fn(() => ({})),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: {
      uid: 'mock-uid-123',
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
    },
    onAuthStateChanged: jest.fn((callback) => {
      callback({ uid: 'mock-uid-123' });
      return jest.fn(); // unsubscribe mock
    }),
  })),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
  setDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ empty: true, docs: [] })),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytesResumable: jest.fn(),
  getDownloadURL: jest.fn(),
}));

// Mock clientApp globally
jest.mock('src/firebase/clientApp', () => ({
  auth: {
    currentUser: {
      uid: 'mock-uid-123',
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
    },
    onAuthStateChanged: jest.fn((callback) => {
      callback({ uid: 'mock-uid-123' });
      return jest.fn();
    }),
  },
  firestore: {},
  storage: {},
}));
