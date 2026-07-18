const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { ReadableStream } = require('stream/web');
global.ReadableStream = ReadableStream;

// Mock next-intl globally
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

// Mock Firebase globally
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
      return jest.fn(); 
    }),
  })),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback({ uid: 'mock-uid-123' });
    return jest.fn();
  }),
  onIdTokenChanged: jest.fn((auth, callback) => {
    callback({ uid: 'mock-uid-123', getIdToken: jest.fn().mockResolvedValue('mock-token') });
    return jest.fn();
  }),
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

jest.mock('next/server', () => {
  class NextResponse {
    constructor(body, init) {
      this.status = init?.status || 200;
      this.body = body;
    }
    async json() {
      if (typeof this.body === 'string') {
        try {
          return JSON.parse(this.body);
        } catch (e) {
          return this.body;
        }
      }
      return this.body;
    }
    static json(body, init) {
      const response = new NextResponse(body, init);
      response.json = async () => body; 
      return response;
    }
  }
  class NextRequest {
    constructor(url, init) {
      this.url = url;
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers || {});
      this._body = init?.body;
    }
    async json() {
      if (typeof this._body === 'string') {
        return JSON.parse(this._body);
      }
      return this._body;
    }
  }
  return { NextResponse, NextRequest };
});

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => ''),
  useParams: jest.fn(() => ({})),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));