import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterForm from '../RegisterForm'
import { afterEach, describe, expect, test, vi } from 'vitest' 
import '@testing-library/jest-dom'

describe('RegisterForm', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('shows validation error when username is empty', async () => {
    render(<RegisterForm />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /lets go!/i }))
    expect(screen.getByText(/please enter a username/i)).toBeInTheDocument()
  })

  test('submits username and calls onSuccess', async () => {
    const user = userEvent.setup()

    // Mock fetch to resolve automatically
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Hello Pablo! Welcome to the course!' }),
    }))

    const onSuccess = vi.fn()

    render(<RegisterForm onSuccess={onSuccess} />)

    // Wrap interaction + assertion inside waitFor
    await user.type(screen.getByLabelText(/whats your name\?/i), 'Pablo')
    await user.click(screen.getByRole('button', { name: /lets go!/i }))

    // Response message should appear
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })
})