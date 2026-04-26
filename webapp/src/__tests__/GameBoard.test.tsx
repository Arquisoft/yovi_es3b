import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test, vi } from 'vitest'
import '@testing-library/jest-dom'
import GameBoard from '../components/board/GameBoard'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

vi.mock("../../context/AuthContext", () => ({
    useAuth: () => ({
        username: 'TestName',
        photoURL: "avatar_1.png",
        token: "fake-token",
    }),
}));

vi.mock('../GameResultApi', () => ({
    saveGame: vi.fn().mockResolvedValue(undefined),
    resolveWinner: vi.fn((w) => w),
}))

const mockBotResponse = (coords = { x: 0, y: 2, z: 6 }) =>
    vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ coords }),
        text: async () => '',
    } as Response)

afterEach(() => {
    vi.restoreAllMocks()
})

describe('GameBoard', () => {
    test('renders sidebar with board size and difficulty', () => {
        global.fetch = mockBotResponse()
        render(<GameBoard size={9} difficulty="easy" />)

        expect(screen.getByText('game.difficulty')).toBeInTheDocument()
        expect(screen.getByText('game.difficultyEasy')).toBeInTheDocument()
        expect(screen.getByText('9 × 9')).toBeInTheDocument()
    })

    test('renders new game button', () => {
        global.fetch = mockBotResponse()
        render(<GameBoard size={9} difficulty="easy" />)

        expect(screen.getByRole('button', { name: 'game.newGame' })).toBeInTheDocument()
    })

    test('renders Game board with hex cells', () => {
        global.fetch = mockBotResponse()
        const { container } = render(<GameBoard size={3} difficulty="easy" />)

        // genera 6 celdas (3+2+1)
        const polygons = container.querySelectorAll('polygon')
        expect(polygons.length).toBe(6)
    })

    test('clicking a cell places a player piece', async () => {
        global.fetch = mockBotResponse()
        const user = userEvent.setup()
        const { container } = render(<GameBoard size={3} difficulty="easy" />)

        const firstCell = container.querySelector('.hex-cell')!
        await user.click(firstCell)

        await waitFor(() => {
            expect(container.querySelector('.hex-cell--occupied')).toBeInTheDocument()
        })
    })

    test('shows winner banner when game ends', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 409,
            json: async () => ({ message: 'Game finished (winner: PlayerId(0))' }),
            text: async () => '',
        } as Response)

        const user = userEvent.setup()
        const { container } = render(<GameBoard size={3} difficulty="easy" />)

        const firstCell = container.querySelector('.hex-cell')!
        await user.click(firstCell)

        await waitFor(() => {
            expect(screen.getByText('game.playerWins')).toBeInTheDocument()
        })
    })

    test('reset button clears the board', async () => {
        global.fetch = mockBotResponse()
        const user = userEvent.setup()
        const { container } = render(<GameBoard size={3} difficulty="easy" />)

        const firstCell = container.querySelector('.hex-cell')!
        await user.click(firstCell)

        // One occupied cell. After reset none, all cells free
        await waitFor(() => {
            expect(container.querySelector('.hex-cell--occupied')).toBeInTheDocument()
        })

        await user.click(screen.getByRole('button', { name: 'game.newGame' }))

        expect(container.querySelector('.hex-cell--occupied')).not.toBeInTheDocument()
    })

    
})