import { describe, it, expect, afterEach, beforeAll, vi } from 'vitest'
import request from 'supertest'

vi.mock('../src/db/models/User.js', () => ({
    default: {
        findOne: vi.fn(),
        create: vi.fn(),
        find: vi.fn()
    }
}))

vi.mock('../src/db/models/Game.js', () => ({
    default: {
        create: vi.fn(),
        find: vi.fn()
    }
}))

let User
let createApp
let appWithAuth
let appWithoutAuth

const fakeVerifyToken = (req, res, next) => {
    req.user = { uid: 'test-uid-123', email: 'test@test.com' }
    next()
}

const fakeRejectToken = (req, res) => {
    res.status(401).json({ error: 'Token no proporcionado' })
}

beforeAll(async () => {
    const userModule = await import('../src/db/models/User.js')
    User = userModule.default

    const svc = await import('../src/users-service.js')
    createApp = svc.createApp

    appWithAuth = createApp(fakeVerifyToken)
    appWithoutAuth = createApp(fakeRejectToken)
})

afterEach(() => {
    vi.clearAllMocks()
})

describe('GET /users/me', () => {
    it('returns 401 when no token is provided', async () => {
        const res = await request(appWithoutAuth).get('/users/me')
        expect(res.status).toBe(401)
    })

    it('returns 200 with user profile when token is valid', async () => {
        User.findOne.mockResolvedValue({
            username: 'Pablo',
            gamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0
        })

        const res = await request(appWithAuth)
            .get('/users/me')
            .set('Authorization', 'Bearer fake-token')

        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('username', 'Pablo')
    })

    it('returns 404 when user not found', async () => {
        User.findOne.mockResolvedValue(null)

        const res = await request(appWithAuth)
            .get('/users/me')
            .set('Authorization', 'Bearer fake-token')

        expect(res.status).toBe(404)
    })
})

describe('POST /register', () => {
    it('returns 401 when no token is provided', async () => {
        const res = await request(appWithoutAuth)
            .post('/register')
            .send({ username: 'Pablo' })

        expect(res.status).toBe(401)
    })

    it('creates user and returns 201', async () => {
        User.findOne.mockResolvedValue(null)
        User.create.mockResolvedValue({ firebaseUid: 'test-uid-123', username: 'Pablo' })

        const res = await request(appWithAuth)
            .post('/register')
            .set('Authorization', 'Bearer fake-token')
            .send({ username: 'Pablo' })

        expect(res.status).toBe(201)
        expect(res.body).toHaveProperty('message')
    })

    it('returns 409 if user already exists', async () => {
        User.findOne.mockResolvedValue({ firebaseUid: 'test-uid-123', username: 'Pablo' })

        const res = await request(appWithAuth)
            .post('/register')
            .set('Authorization', 'Bearer fake-token')
            .send({ username: 'Pablo' })

        expect(res.status).toBe(409)
    })
})