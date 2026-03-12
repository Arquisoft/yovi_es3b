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
  createUserWithEmailAndPassword: vi.fn()
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
        screen.getByText(/please fill in all fields/i)
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

    const { createUserWithEmailAndPassword } = await import('firebase/auth')
    ;(createUserWithEmailAndPassword as any).mockResolvedValue(mockCredential)

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({})
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
    })
  })
})