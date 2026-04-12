import { describe, it, expect, afterEach, beforeAll, vi } from 'vitest'
import request from 'supertest'
import mongoose from "mongoose";
import {connectMongo} from "../src/db/mongo";
import {createVerifyToken} from "../src/middleware/auth";
import {detectLanguage} from "../src/middleware/languaje";

vi.mock('../src/db/models/User.js', () => ({
    default: {
        findOne: vi.fn(),
        create: vi.fn(),
        find: vi.fn(),
        findOneAndUpdate: vi.fn()
    }
}))

vi.mock('../src/db/models/Game.js', () => ({
    default: {
        create: vi.fn(),
        find: vi.fn()
    }
}))

vi.mock('../src/middleware/languaje.js', () => ({
    detectLanguage: (req, res, next) => {
        req.t = (key) => key
        next()
    }
}))

let User
let createApp
let appWithAuth
let appWithoutAuth
let Game

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

    const gameModule = await import('../src/db/models/Game')
    Game = gameModule.default

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

    it('returns 500 when an internal server error occurs', async () => {
        User.findOne.mockRejectedValue(new Error('Test error'));

        const res = await request(appWithAuth)
            .get('/users/me')
            .set('Authorization', 'Bearer fake-token');

        expect(res.status).toBe(500);
    });

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

describe('GET /users', () => {
    // Mock para el retorno de users:
    // Recibe una query, aplica sort y limit y devuelve un array
    const mockQuery = (result) => ({
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(result),
    });

    it('returns 401 when no token is provided', async () => {
        const res = await request(appWithoutAuth).get('/users/me')
        expect(res.status).toBe(401)
    })

    it('returns a collection of users when request is correct', async () => {
        const mockUsers = [
            {
                username: 'Pablo',
                gamesPlayed: 10,
                gamesWon: 7,
                gamesLost: 3,
            },
            {
                username: 'Ana',
                gamesPlayed: 8,
                gamesWon: 5,
                gamesLost: 3,
            },
        ];

        User.find.mockReturnValue(
            mockQuery(mockUsers)
        );

        const res = await request(appWithAuth)
            .get('/users')
            .set('Authorization', 'Bearer fake-token');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(2);

        // Esperamos que el primer usuario sea Pablo y que la
        // estructura sea correcta
        expect(res.body[0]).toEqual(
            expect.objectContaining({
                username: 'Pablo',
                gamesPlayed: 10,
                gamesWon: 7,
                gamesLost: 3,
            })
        );
    });

    it('returns 500 when database throws an error', async () => {
        User.find.mockRejectedValue(() => {
            throw new Error('Test error');
        });

        const res = await request(appWithAuth)
            .get('/users')
            .set('Authorization', 'Bearer fake-token');

        expect(res.status).toBe(500);
    });
})

describe('POST /games', () => {

    it('returns 401 when no token is provided', async () => {
        const res = await request(appWithoutAuth)
            .post('/games')
            .send({
                winner: 'player',
                durationMs: 1000,
                turns: 5,
                difficulty: 'easy',
            });

        expect(res.status).toBe(401);
    });


    it('return 201 when game is stored correctly', async () => {
        User.findOne.mockResolvedValue({username: 'Pablo'});
        Game.create.mockResolvedValue({});

        const res = await request(appWithAuth)
            .post('/games')
            .send({
                winner: 'player',
                durationMs: 1200,
                turns: 6,
                difficulty: 'easy',
            });

        expect(res.status).toBe(201);
    })

    it('return 500 when an internal error occurs', async () => {
        User.find.mockRejectedValue(() => {
            throw new Error('Test error');
        });

        const res = await request(appWithAuth)
            .post('/games')
            .set('Authorization', 'Bearer fake-token');

        expect(res.status).toBe(500);
    })
})

describe('GET /games/me', () => {
    const mockQuery = (result) => ({
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(result),
    });

    it('returns 401 when no token is provided', async () => {
        const res = await request(appWithoutAuth).get('/games/me')
        expect(res.status).toBe(401)
    })

    it('returns a collection of games when request is correct', async () => {
        User.findOne.mockResolvedValue({username: 'Pablo'});
        const mockGames = [
            {
                username:   'Pablo',
                winner:     "player",
                durationMs: 10000,
                turns:      20,
                difficulty: "extreme",
            },
            {
                username:   'Pablo',
                winner:     "bot",
                durationMs: 30000,
                turns:      15,
                difficulty: "hard",
            },
        ];

        Game.find.mockReturnValue(
            mockQuery(mockGames)
        );

        const res = await request(appWithAuth)
            .get('/games/me')
            .set('Authorization', 'Bearer fake-token');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(2);

        expect(res.body[0]).toEqual(
            expect.objectContaining({
                username:   'Pablo',
                winner:     "player",
                durationMs: 10000,
                turns:      20,
                difficulty: "extreme",
            })
        );
    });

    it('returns 404 when user not found', async () => {
        User.findOne.mockResolvedValue(null)

        const res = await request(appWithAuth)
            .get('/games/me')
            .set('Authorization', 'Bearer fake-token')

        expect(res.status).toBe(404)
    })

    it('return 500 when an internal error occurs', async () => {
        User.findOne.mockResolvedValue({username: 'Pablo'});
        Game.find.mockReturnValue(
            null
        );

        const res = await request(appWithAuth)
            .get('/games/me')
            .set('Authorization', 'Bearer fake-token');

        expect(res.status).toBe(500);
    })
})

describe('PUT /users/me/profile', () => {
    it('returns 401 when no token is provided', async () => {
        const res = await request(appWithoutAuth)
            .put('/users/me/profile')
            .send({ username: 'NuevoNombre' });

        expect(res.status).toBe(401);
    });

    it('updates username and photoURL successfully', async () => {
        User.findOneAndUpdate.mockResolvedValue({
            username: 'NuevoNombre',
            photoURL: 'avatar_2.png',
        });

        const res = await request(appWithAuth)
            .put('/users/me/profile')
            .send({
                username: 'NuevoNombre',
                photoURL: 'avatar_2.png',
            });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            username: 'NuevoNombre',
            photoURL: 'avatar_2.png',
        });
    });

    it('updates only username when photoURL is not provided', async () => {
        User.findOneAndUpdate.mockResolvedValue({
            username: 'SoloNombre',
            photoURL: 'avatar_1.png',
        });

        const res = await request(appWithAuth)
            .put('/users/me/profile')
            .send({ username: 'SoloNombre' });

        expect(res.status).toBe(200);
        expect(res.body.username).toBe('SoloNombre');
        expect(res.body.photoURL).toBe('avatar_1.png');
    });

    it('updates only photoURL when username is not provided', async () => {
        User.findOneAndUpdate.mockResolvedValue({
            username: 'Pablo',
            photoURL: 'avatar_3.png',
        });

        const res = await request(appWithAuth)
            .put('/users/me/profile')
            .send({ photoURL: 'avatar_3.png' });

        expect(res.status).toBe(200);
        expect(res.body.photoURL).toBe('avatar_3.png');
        expect(res.body.username).toBe('Pablo');
    });

    it('returns 404 when user does not exist', async () => {
        User.findOneAndUpdate.mockResolvedValue(null);

        const res = await request(appWithAuth)
            .put('/users/me/profile')
            .send({ username: 'NuevoNombre' });

        expect(res.status).toBe(404);
    });

    it('returns 500 when database throws an error', async () => {
        User.findOneAndUpdate.mockRejectedValue(
            new Error('Test error')
        );

        const res = await request(appWithAuth)
            .put('/users/me/profile')
            .send({ username: 'NuevoNombre' });

        expect(res.status).toBe(500);
    });
})

describe('connectMongo', () => {
    it('connects to mongo with default URL', async () => {
        // Para observar la función connect y comprobar que se ha llamado
        const connectSpy = vi.spyOn(mongoose, 'connect').mockResolvedValue(undefined)

        delete process.env.MONGO_URL
        await connectMongo()

        expect(connectSpy).toHaveBeenCalledWith(
            'mongodb://localhost:27017/yovi'
        )
    })

    it('connects using MONGO_URL env variable', async () => {
        const connectSpy = vi.spyOn(mongoose, 'connect').mockResolvedValue(undefined)
        process.env.MONGO_URL = 'mongodb://custom:27017/test'

        await connectMongo()

        expect(connectSpy).toHaveBeenCalledWith(
            'mongodb://custom:27017/test'
        )
    })
})

describe('verifyToken middleware', () => {
    const mockReq = (headers = {}) => ({
        headers,
        t: (key) => key,
    })

    // Si no ponemos mock da error porque firebase no se inicializa
    const mockAdmin = {
        auth: () => ({
            verifyIdToken: vi.fn()
        })
    }

    // Para tener status y json en la res
    const mockRes = () => {
        const res = {}
        res.status = vi.fn().mockReturnValue(res)
        res.json = vi.fn().mockReturnValue(res)
        return res
    }

    it('returns 401 when Authorization header is missing', async () => {
        const verifyToken = createVerifyToken(mockAdmin)
        const req = mockReq({})
        const res = mockRes()
        const next = vi.fn()

        await verifyToken(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(next).not.toHaveBeenCalled()
    })

    it('returns 401 when header does not start with Bearer token', async () => {
        const verifyToken = createVerifyToken(mockAdmin)
        const req = mockReq({ authorization: 'Basic abc123' })
        const res = mockRes()
        const next = vi.fn()

        await verifyToken(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
    })

    it('calls next() and sets req.user when token is valid', async () => {
        const decodedToken = { uid: 'test-uid-123', email: 'test@test.com' }

        // Mock para la funcion verifyIdToken que usa Auth.js
        const adminWithValidToken = {
            auth: () => ({
                verifyIdToken: vi.fn().mockResolvedValue(decodedToken)
            })
        }

        const verifyToken = createVerifyToken(adminWithValidToken)
        const req = mockReq({ authorization: 'Bearer valid-token' })
        const res = mockRes()
        const next = vi.fn()

        await verifyToken(req, res, next)

        expect(next).toHaveBeenCalled()
        expect(req.user).toEqual(decodedToken)
        expect(res.status).not.toHaveBeenCalled()
    })

    it('returns 401 when token verification fails (fake or bad token)', async () => {
        const adminWithBadToken = {
            auth: () => ({
                verifyIdToken: vi.fn().mockRejectedValue(
                    new Error('invalid token')
                )
            })
        }

        const verifyToken = createVerifyToken(adminWithBadToken)
        const req = mockReq({ authorization: 'Bearer bad-token' })
        const res = mockRes()
        const next = vi.fn()

        await verifyToken(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ error: 'tokenInvalid' })
        expect(next).not.toHaveBeenCalled()
    })
})

// languaje.test.js
describe('detectLanguage middleware', () => {
    it('sets req.t as a function that returns locals text by languaje', () => {
        const req = { headers: {} }
        const res = {}
        const next = vi.fn()

        detectLanguage(req, res, next)

        expect(typeof req.t).toBe('function')
        expect(next).toHaveBeenCalled()
    })
})