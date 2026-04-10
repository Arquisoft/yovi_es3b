import { describe, expect, test, vi, afterEach } from 'vitest'
import {renderHook, waitFor} from '@testing-library/react'
import { useGameY, buildYEN, type Board } from '../components/board/GameBoardLogic'
import {act} from "react";

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

const mockBotResponse = (coords = { x: 0, y: 1, z: 7 }) =>
    vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ coords }),
        text: async () => '',
    } as Response)

afterEach(() => {
    vi.restoreAllMocks()
})

describe('buildYEN', () => {
    test('empty board returns all dots for given size', () => {
        const result = buildYEN(3, {})
        expect(result.layout).toBe('./../...')
        expect(result.size).toBe(3)
        expect(result.turn).toBe(1)
        expect(result.players).toEqual(['B', 'R'])
    })

    test('board with single player 1 piece', () => {
        // Top of the triangle (y=2, x=0)
        const board: Board = { '2,0': 1 }
        const result = buildYEN(3, board)
        expect(result.layout).toBe('B/../...')
    })

    test('board with single player 2 (bot) piece', () => {
        const board: Board = { '1,0': 2 }
        const result = buildYEN(3, board)
        expect(result.layout).toBe('./R./...')
    })

    test('board with mixed pieces', () => {
        const board: Board = { '0,0': 1, '0,1': 2, '1,0': 2 }
        const result = buildYEN(3, board)
        expect(result.layout).toBe('./R./BR.')
    })

    test('fully occupied board', () => {
        const board: Board = {
            '0,0': 1,
            '0,1': 2,
            '0,2': 2,
            '1,0': 2,
            '1,1': 1,
            '2,0': 1,
        }
        const result = buildYEN(3, board)
        expect(result.layout).toBe('B/RB/BRR')
    })

    test('larger board size 5 with some moves', () => {
        const board: Board = { '0,0': 1, '2,1': 2 }
        const result = buildYEN(5, board)
        // Size 5 triangle: 5 rows with 5,4,3,2,1 cells each
        const lines = result.layout.split('/')
        expect(lines).toHaveLength(5)
        expect(lines[4]).toBe('B....')
        expect(lines[2]).toBe('.R.')
    })

    test('piece positions map correctly to rows (row 1 -> line 1)', () => {
        const board: Board = { '1,1': 1 }
        const result = buildYEN(4, board)
        const lines = result.layout.split('/')
        expect(lines[2]).toBe('.B.')  // row 1 (0-indexed from top)
    })
})

describe('useGameY — resetGame', async () => {
    test('resets all state to initial values', async () => {
        // Llamada al hook de creación del juego
        const { result } = renderHook(() => useGameY(9, 'random_bot', 'easy'))

        result.current.resetGame()

        await waitFor(() => {
            expect(result.current.board).toEqual({})
            expect(result.current.currentPlayer).toBe(1)
            expect(result.current.loadingBot).toBe(false)
            expect(result.current.gameOver).toBe(false)
            expect(result.current.winner).toBeNull()
        })
    })
})

describe('useGameY — handleCellClick', () => {
    test('does nothing when clicking an occupied cell', async () => {
        global.fetch = mockBotResponse()
        const { result } = renderHook(() => useGameY(9, 'random_bot', 'easy'))

        await act(async () => {
            await result.current.handleCellClick(1, 1)
        })
        const boardAfterFirst = { ...result.current.board }

        // Intentamos clickar la misma celda de nuevo
        await act(async () => {
            await result.current.handleCellClick(1, 1)
        })

        expect(result.current.board).toEqual(boardAfterFirst)
    })

    test('sets clicked cell to player 1 property', async () => {
        global.fetch = mockBotResponse({ x: 0, y: 1, z: 7 })
        const { result } = renderHook(() => useGameY(9, 'random_bot', 'easy'))

        await act(async () => {
            await result.current.handleCellClick(2, 2)
        })

        expect(result.current.board['2,2']).toBe(1)
    })

    test('does nothing when game is already over', async () => {
        global.fetch = mockBotResponse()
        const { result } = renderHook(() => useGameY(9, 'random_bot', 'easy'))

        // Simulamos fin de partida forzando gameOver
        // mediante una respuesta 409 del bot
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 409,
            json: async () => ({ message: 'Game finished (winner: PlayerId(0))' }),
            text: async () => '',
        } as Response)

        await act(async () => {
            await result.current.handleCellClick(1, 0)
        })

        expect(result.current.gameOver).toBe(true)

        // Hacemos copia del board, intentamos hacer click en una celda
        // y comprobamos que el board sigue igual
        const boardSnapshot = { ...result.current.board }
        await act(async () => {
            await result.current.handleCellClick(2, 0)
        })
        expect(result.current.board).toEqual(boardSnapshot)
    })

    test('sets loadingBot to false after bot responds', async () => {
        global.fetch = mockBotResponse()
        const { result } = renderHook(() => useGameY(9, 'random_bot', 'easy'))

        await act(async () => {
            await result.current.handleCellClick(3, 3)
        })

        expect(result.current.loadingBot).toBe(false)
        expect(result.current.currentPlayer).toBe(1)
    })

    test('sets gameOver when bot returns 409 with winner', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 409,
            json: async () => ({ message: 'Game finished (winner: PlayerId(1))' }),
            text: async () => '',
        } as Response)

        const { result } = renderHook(() => useGameY(9, 'random_bot', 'easy'))

        await act(async () => {
            await result.current.handleCellClick(1, 1)
        })

        expect(result.current.gameOver).toBe(true)
        expect(result.current.winner).toBe('1')
    })

    test('ignores invalid bot coordinates (z does not sum correctly)', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ coords: { x: 0, y: 1, z: 99 } }),
            text: async () => '',
        } as Response)

        const { result } = renderHook(() => useGameY(9, 'random_bot', 'easy'))

        await act(async () => {
            await result.current.handleCellClick(1, 1)
        })

        // Board debería tener solo el mov. de player, el de bot es inválido
        expect(result.current.board['1,1']).toBe(1)
        expect(Object.keys(result.current.board)).toHaveLength(1)
    })

    test('ignores incomplete bot coordinates (missing x coord)', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ coords: { y: 1, z: 7 } }),
            text: async () => '',
        } as Response)

        const { result } = renderHook(() => useGameY(9, 'random_bot', 'easy'))

        await act(async () => {
            await result.current.handleCellClick(2, 2)
        })

        // Solo mov. de player
        expect(Object.keys(result.current.board)).toHaveLength(1)
        expect(result.current.board['2,2']).toBe(1)
    })

    test('handles bot response with status.Finished when winner is included', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                status: { Finished: { winner: 0 } }
            }),
            text: async () => '',
        } as Response)

        const { result } = renderHook(() => useGameY(9, 'random_bot', 'easy'))

        await act(async () => {
            await result.current.handleCellClick(1, 1)
        })

        // Game over y ganador player
        expect(result.current.gameOver).toBe(true)
        expect(result.current.winner).toBe('0')
    })

    test('handles HTTP error response without game failing', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({}),
            text: async () => 'Internal Server Error',
        } as Response)

        const { result } = renderHook(() => useGameY(9, 'random_bot', 'easy'))

        await act(async () => {
            await result.current.handleCellClick(1, 1)
        })

        // El movimiento se coloca y vuelve el turno a player
        expect(result.current.board['1,1']).toBe(1)
        expect(result.current.loadingBot).toBe(false)
        expect(result.current.currentPlayer).toBe(1)
    })

    test('handles game finished 409 with no winner (should not happen)', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 409,
            json: async () => ({ message: 'Game finished without clear winner' }),
            text: async () => '',
        } as Response)

        const { result } = renderHook(() => useGameY(9, 'random_bot', 'easy'))

        await act(async () => {
            await result.current.handleCellClick(1, 1)
        })

        expect(result.current.gameOver).toBe(true)
        expect(result.current.winner).toBe('')
    })

    test('updates board with valid bot move and updates turns', async () => {
        global.fetch = mockBotResponse({ x: 3, y: 2, z: 3 })
        const { result } = renderHook(() => useGameY(9, 'random_bot', 'easy'))

        await act(async () => {
            await result.current.handleCellClick(1, 1)
        })

        // 2 cells ocupadas
        expect(Object.keys(result.current.board)).toHaveLength(2)
        expect(result.current.board['3,2']).toBe(2)
        expect(result.current.board['1,1']).toBe(1)
    })

    test('does not add bot move if cell is already occupied', async () => {
        // Ocupamos una celda
        global.fetch = mockBotResponse({ x: 0, y: 0, z: 8 })
        const { result } = renderHook(() => useGameY(9, 'random_bot', 'easy'))

        await act(async () => {
            await result.current.handleCellClick(1, 1)
        })

        // Intentamos ocupar la misma celda que antes
        global.fetch = mockBotResponse({ x: 0, y: 0, z: 8 })
        await act(async () => {
            await result.current.handleCellClick(2, 2)
        })

        // Solo 3 celdas: el 2º movimiento del bot no se refleja en el board
        expect(Object.keys(result.current.board)).toHaveLength(3)
    })

    test('correctly alternates currentPlayer between 1 and 2', async () => {
        global.fetch = mockBotResponse()
        const { result } = renderHook(() => useGameY(9, 'random_bot', 'easy'))

        expect(result.current.currentPlayer).toBe(1)

        // Mientras la petición se resuelve será 2 y luego vuelve a 1
        await act(async () => {
            await result.current.handleCellClick(1, 1)
        })

        expect(result.current.currentPlayer).toBe(1)
    })

    test('extracts winner number correctly from 409 message', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 409,
            json: async () => ({ message: 'Game finished (winner: PlayerId(2))  ' }),
            text: async () => '',
        } as Response)

        const { result } = renderHook(() => useGameY(9, 'random_bot', 'easy'))

        await act(async () => {
            await result.current.handleCellClick(1, 1)
        })

        expect(result.current.winner).toBe('2')
    })
})