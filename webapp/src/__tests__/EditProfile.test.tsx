import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import '@testing-library/jest-dom'
import EditProfile from '../components/profile/EditProfile'
import ProfilePage from '../ProfilePage'
import {act} from "react";

// Mocks
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}))

const mockSetUsername = vi.fn()
const mockSetPhotoURL = vi.fn()

let mockUsername: string | null = 'TestUser';
let mockPhotoURL: string | null = 'avatar_1.png';

// Mock de datos de usuario

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        username: mockUsername,
        photoURL: mockPhotoURL,
        token: 'fake-token',
        setUsername: mockSetUsername,
        setPhotoURL: mockSetPhotoURL,
    }),
}));


// Mock de tres avatares
vi.mock('../components/profile/avatars', () => ({
    AVATARS: ['avatar_1.png', 'avatar_2.png', 'avatar_3.png'],
}))

// Metodos auxiliares

const renderEditProfile = (onCancel = vi.fn()) =>
    render(<EditProfile onCancel={onCancel} />)

const renderProfilePage = () => render(<ProfilePage />)

// EditProfile

describe('EditProfile', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        global.fetch = vi.fn()
    })

    afterEach(() => {
        vi.restoreAllMocks()
        mockUsername = 'TestUser';
        mockPhotoURL = 'avatar_1.png';
    })

    test('renders EditProfile page with current username pre-filled', () => {
        renderEditProfile()

        const input = screen.getByLabelText('profile.username')
        expect(input).toHaveValue('TestUser')
    })

    test('renders avatar grid with all avatars', () => {
        renderEditProfile()

        // Cada avatar es un <img> con alt igual al nombre del archivo
        expect(screen.getByAltText('avatar_1.png')).toBeInTheDocument()
        expect(screen.getByAltText('avatar_2.png')).toBeInTheDocument()
        expect(screen.getByAltText('avatar_3.png')).toBeInTheDocument()
    })

    test('first avatar is selected by default (matches current photoURL)', () => {
        renderEditProfile()

        const selectedButton = screen.getByAltText('avatar_1.png').closest('button')
        // El botón de avatar_1 debe tener la clase de seleccionado
        expect(selectedButton).toHaveClass('avatar-option--selected')
    })

    test('shows error when username is empty and save is clicked', async () => {
        const user = userEvent.setup()
        renderEditProfile()

        const input = screen.getByLabelText('profile.username')
        await user.clear(input)
        await user.click(screen.getByRole('button', { name: 'profile.save' }))

        expect(screen.getByText('profile.usernameRequired')).toBeInTheDocument()
    })

    test('does not call endpoint (fetch) when username is empty', async () => {
        const user = userEvent.setup()
        renderEditProfile()

        const input = screen.getByLabelText('profile.username')
        await user.clear(input)
        await user.click(screen.getByRole('button', { name: 'profile.save' }))

        expect(global.fetch).not.toHaveBeenCalled()
    })

    test('calls fetch with correct data on save', async () => {
        const user = userEvent.setup()

        // Mock de la respuesta del server
        ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => ({}),
        } as Response)

        renderEditProfile()

        const input = screen.getByLabelText('profile.username')
        await user.clear(input)
        await user.type(input, 'NuevoNombre')

        await user.click(screen.getByRole('button', { name: 'profile.save' }))

        // Esperamos que se llame a PUT del endpoint correspondiente
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/users/me/profile'),
                expect.objectContaining({
                    method: 'PUT',
                    headers: expect.objectContaining({
                        Authorization: 'Bearer fake-token',
                        'Content-Type': 'application/json',
                    }),
                    body: JSON.stringify({ username: 'NuevoNombre', photoURL: 'avatar_1.png' }),
                })
            )
        })
    })

    test('updates username and photoURL in context after successful save', async () => {
        const user = userEvent.setup()

        ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => ({}),
        } as Response)

        renderEditProfile()

        // Cambiar username
        const input = screen.getByLabelText('profile.username')
        await user.clear(input)
        await user.type(input, 'NuevoNombre')

        // Cambiar avatar
        await user.click(screen.getByAltText('avatar_2.png').closest('button')!)

        await user.click(screen.getByRole('button', { name: 'profile.save' }))

        // Comprobamos que se ha hecho la petición con los nuevos datos
        await waitFor(() => {
            expect(mockSetUsername).toHaveBeenCalledWith('NuevoNombre')
            expect(mockSetPhotoURL).toHaveBeenCalledWith('avatar_2.png')
        })
    })

    test('shows API error message when server returns error', async () => {
        const user = userEvent.setup()

        ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: false,
            json: async () => ({ error: 'Username already taken' }),
        } as Response)

        renderEditProfile()

        await user.click(screen.getByRole('button', { name: 'profile.save' }))

        await waitFor(() => {
            expect(screen.getByText('Username already taken')).toBeInTheDocument()
        })
    })

    test('shows generic error when API response has no error field', async () => {
        const user = userEvent.setup()

        ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: false,
            json: async () => ({}),
        } as Response)

        renderEditProfile()

        await user.click(screen.getByRole('button', { name: 'profile.save' }))

        await waitFor(() => {
            expect(screen.getByText('profile.saveError')).toBeInTheDocument()
        })
    })

    test('shows generic error when fetch throws a network error', async () => {
        const user = userEvent.setup()

        ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
            new Error('Network error')
        )

        renderEditProfile()

        await user.click(screen.getByRole('button', { name: 'profile.save' }))

        await waitFor(() => {
            expect(screen.getByText('profile.saveError')).toBeInTheDocument()
        })
    })

    test('save button shows loading state while submitting', async () => {
        const user = userEvent.setup()

        // Promesa que nunca resuelve -> el componente se queda en loading
        let resolveFetch!: (p: never) => void
        ;(global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(
            new Promise((resolve) => { resolveFetch = resolve })
        )

        renderEditProfile()

        await user.click(screen.getByRole('button', { name: 'profile.save' }))

        expect(screen.getByRole('button', { name: 'profile.saving' })).toBeDisabled()

        // Resolvemos para que React termine limpiamente
        // Evitamos un warning
        await act(async () => {
            resolveFetch({ ok: true, json: async () => ({}) } as never)
        })
    })

    test('cancel button is disabled while loading', async () => {
        const user = userEvent.setup()

        let resolveFetch!: (p: never) => void
        ;(global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(
            new Promise((resolve) => { resolveFetch = resolve })
        )

        renderEditProfile()

        await user.click(screen.getByRole('button', { name: 'profile.save' }))

        expect(screen.getByRole('button', { name: 'profile.cancel' })).toBeDisabled()

        await act(async () => {
            resolveFetch({ ok: true, json: async () => ({}) } as never)
        })
    })

    test('calls onCancel when cancel button is clicked', async () => {
        const user = userEvent.setup()
        const onCancel = vi.fn()
        renderEditProfile(onCancel)

        await user.click(screen.getByRole('button', { name: 'profile.cancel' }))

        expect(onCancel).toHaveBeenCalledOnce()
    })

    test('trims whitespace from username before saving', async () => {
        const user = userEvent.setup()

        ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => ({}),
        } as Response)

        renderEditProfile()

        const input = screen.getByLabelText('profile.username')
        await user.clear(input)
        await user.type(input, '  NombreConEspacios  ')

        await user.click(screen.getByRole('button', { name: 'profile.save' }))

        await waitFor(() => {
            expect(mockSetUsername).toHaveBeenCalledWith('NombreConEspacios')
        })
    })
})

// ProfilePage

describe('ProfilePage', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    test('renders username and avatar', () => {
        renderProfilePage()

        expect(screen.getByText('TestUser')).toBeInTheDocument()
        expect(screen.getByAltText('TestUser')).toBeInTheDocument()
    })

    test('renders edit profile button', () => {
        renderProfilePage()

        expect(
            screen.getByRole('button', { name: 'profile.editProfile' })
        ).toBeInTheDocument()
    })

    test('shows EditProfile form when edit button is clicked', async () => {
        const user = userEvent.setup()
        renderProfilePage()

        await user.click(screen.getByRole('button', { name: 'profile.editProfile' }))

        expect(screen.getByLabelText('profile.username')).toBeInTheDocument()
    })

    test('returns to profile view when cancel is clicked inside EditProfile', async () => {
        const user = userEvent.setup()
        renderProfilePage()

        await user.click(screen.getByRole('button', { name: 'profile.editProfile' }))
        expect(screen.getByLabelText('profile.username')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'profile.cancel' }))

        await waitFor(() => {
            expect(screen.queryByLabelText('profile.username')).not.toBeInTheDocument()
            expect(screen.queryByLabelText('profile.chooseAvatar')).not.toBeInTheDocument()
            expect(screen.getByText('TestUser')).toBeInTheDocument()
        })
    })


    test('uses default avatar when photoURL is null', () => {
        mockPhotoURL = null;

        renderProfilePage();

        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', '/avatars/avatar_1.png');
    });

    test('sets default avatar on image error', () => {
        mockPhotoURL = 'broken.png';
        mockUsername = null;

        renderProfilePage();
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', '/avatars/broken.png');

        // simulamos error
        fireEvent.error(img);
        // efecto del onError
        expect(img).toHaveAttribute('src', '/avatars/avatar_1.png');
    });
})