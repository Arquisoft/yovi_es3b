import { describe, expect, test } from 'vitest'
import {
    hexToPixel,
    hexCorners,
    generateBoard,
    getSides,
    computeViewBox,
    HEX_SIZE
} from '../components/board/HexGeometryUtils'

describe('hexToPixel', () => {
    test('returns origin for (0,0)', () => {
        expect(hexToPixel(0, 0)).toEqual({ x: 0, y: 0 })
    })

    test('returns pixel position for (1,0) following math formula', () => {
        const { x, y } = hexToPixel(1, 0)
        expect(x).toBeCloseTo(HEX_SIZE * Math.sqrt(3))
        expect(y).toBe(0)
    })

    test('returns pixel position for (0,1) following math formula', () => {
        const { x, y } = hexToPixel(0, 1)
        expect(x).toBeCloseTo(HEX_SIZE * (Math.sqrt(3) / 2))
        expect(y).toBeCloseTo(HEX_SIZE * 1.5)
    })
})

describe('hexCorners', () => {
    test('returns a string with 6 coordinate pairs (hexagon)', () => {
        const result = hexCorners(0, 0)
        const pairs = result.trim().split(' ')
        expect(pairs).toHaveLength(6)
    })

    test('each pair has two numeric values separated by comma', () => {
        const result = hexCorners(100, 100)
        result.split(' ').forEach(pair => {
            const [x, y] = pair.split(',').map(Number)
            expect(isNaN(x)).toBe(false)
            expect(isNaN(y)).toBe(false)
        })
    })
})

describe('generateBoard', () => {
    test('size 1 generates 1 cell', () => {
        expect(generateBoard(1)).toHaveLength(1)
    })

    test('size 3 generates 6 cells', () => {
        expect(generateBoard(3)).toHaveLength(6) // 3+2+1
    })

    test('size 9 generates 45 cells', () => {
        expect(generateBoard(9)).toHaveLength(45) // 9+8+...+1
    })

    test('all cells have q >= 0 and r >= 0 (q,r -> axial coordinates)', () => {
        generateBoard(5).forEach(({ q, r }) => {
            expect(q).toBeGreaterThanOrEqual(0)
            expect(r).toBeGreaterThanOrEqual(0)
        })
    })

    test('no cell exceeds triangular bounds (q + r < size)', () => {
        const size = 5
        generateBoard(size).forEach(({ q, r }) => {
            expect(q + r).toBeLessThan(size)
        })
    })
})

describe('getSides', () => {
    test('interior cell returns empty array', () => {
        expect(getSides(1, 1, 5)).toEqual([])
    })

    // One side cells
    test('q=0 cell belongs to side 0', () => {
        expect(getSides(0, 2, 5)).toContain(0)
    })

    test('r=0 cell belongs to side 1', () => {
        expect(getSides(2, 0, 5)).toContain(1)
    })

    test('z=0 cell belongs to side 2', () => {
        expect(getSides(2, 2, 5)).toContain(2)
    })

    // Corners
    test('corner (0,0) belongs to sides 0 and 1', () => {
        expect(getSides(0, 0, 5)).toEqual([0, 1])
    })

    test('corner (0, size-1) belongs to sides 0 and 2', () => {
        expect(getSides(0, 4, 5)).toEqual([0, 2])
    })

    test('corner (size-1, 0) belongs to sides 1 and 2', () => {
        expect(getSides(4, 0, 5)).toEqual([1, 2])
    })
})

describe('computeViewBox', () => {
    test('returns a string with four numbers: x,y from upper left corner and width, height', () => {
        const result = computeViewBox([{ x: 0, y: 0 }])
        const parts = result.split(' ').map(Number)
        expect(parts).toHaveLength(4)
        // all are numbers
        parts.forEach(n => expect(isNaN(n)).toBe(false))
    })

    test('width and height are positive (upper left corner is the reference)', () => {
        const positions = [{ x: 0, y: 0 }, { x: 100, y: 100 }]
        const [, , width, height] = computeViewBox(positions).split(' ').map(Number)
        expect(width).toBeGreaterThan(0)
        expect(height).toBeGreaterThan(0)
    })

    test('greater padding increases viewBox size (padding is an optional parameter)', () => {
        const positions = [{ x: 0, y: 0 }, { x: 100, y: 100 }]
        const [, , w1] = computeViewBox(positions, 10).split(' ').map(Number)
        const [, , w2] = computeViewBox(positions, 50).split(' ').map(Number)
        expect(w2).toBeGreaterThan(w1)
    })
})