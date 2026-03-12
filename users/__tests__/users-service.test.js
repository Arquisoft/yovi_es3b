import { describe, it, expect, afterEach, beforeAll, vi } from 'vitest'
import request from 'supertest'

// Mock del modelo ANTES de importar el servicio
vi.mock('../src/db/models/User.js', () => ({
    default: {
        findOne: vi.fn(),
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
    // Importa el mock (mismo módulo que usará require en el servicio)
    const userModule = await import('../src/db/models/User.js')
    User = userModule.default

    // Importa el servicio DESPUÉS del mock
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

})

describe('POST /register', () => {

    it('returns 401 when no token is provided', async () => {
        const res = await request(appWithoutAuth)
            .post('/register')
            .send({ username: 'Pablo' })

        expect(res.status).toBe(401)
    })
})