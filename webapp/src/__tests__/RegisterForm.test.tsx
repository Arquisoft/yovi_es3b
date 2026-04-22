import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterForm from '../components/auth/RegisterForm'
import { afterEach, describe, expect, test, vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock del módulo firebase/firebase para que no intente inicializar Firebase
vi.mock('../firebase/firebase', () => ({
  auth: {}
}))

// Mock de firebase/auth
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn()
}))

// Mock del contexto AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    setUsername: vi.fn(),
    user: null,
    loading: false,
    token: null,
    username: null,
    photoURL: null,
    setPhotoURL: vi.fn()
  })
}))

// Mock para i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}))

describe('RegisterForm', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('shows validation error when fields are empty', async () => {
    render(
        <RegisterForm
            onSuccess={vi.fn()}
            onSwitchToLogin={vi.fn()}
        />
    )

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /register/i }))

    expect(
        screen.getByText('auth.fillAllFields')
    ).toBeInTheDocument()
  })

  test('registers user and calls onSuccess', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()

    const mockCredential = {
      user: {
        getIdToken: vi.fn().mockResolvedValue('fake-token')
      }
    }

    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth')
    ;(createUserWithEmailAndPassword as any).mockResolvedValue(mockCredential)
    // añadimos mock de updateProfile cuando tiene el username
    ;(updateProfile as any).mockResolvedValue(undefined)

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: { username: 'Pablo', _id: '123' } })
    } as Response)

    render(
        <RegisterForm
            onSuccess={onSuccess}
            onSwitchToLogin={vi.fn()}
        />
    )

    await user.type(screen.getByLabelText(/username/i), 'Pablo')
    await user.type(screen.getByLabelText(/email/i), 'pablo@test.com')
    await user.type(screen.getByLabelText(/password/i), '123456')

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
      expect(updateProfile).toHaveBeenCalledWith(mockCredential.user, { displayName: 'Pablo' })
    })
  })
})