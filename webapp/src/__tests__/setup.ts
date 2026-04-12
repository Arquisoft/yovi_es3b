import { vi } from 'vitest'

/**
 * Usado globalmente por todos los test. Soluciona problemas
 * con los mock en algunas ejecuciones de test, relacionados
 * principalmente con la inicialización de firebase
 */

// Mock Firebase globally before any tests run
vi.mock('../firebase/firebase', () => ({
  auth: {},
  app: {},
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  initializeAuth: vi.fn(() => ({})),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  updateProfile: vi.fn(),
  updateEmail: vi.fn(),
  updatePassword: vi.fn(),
}))

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}))

// Mock i18next globally
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  Trans: ({ children }: any) => children,
}))
