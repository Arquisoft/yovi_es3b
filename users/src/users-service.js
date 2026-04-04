import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'node:fs'
import express from 'express'
import swaggerUi from 'swagger-ui-express'
import YAML from 'js-yaml'
import promBundle from 'express-prom-bundle'
import { connectMongo } from './db/mongo.js'
import User from './db/models/User.js'
import Game from './db/models/Game.js'
import { verifyToken } from './middleware/auth.js'
import { detectLanguage } from './middleware/languaje.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function createApp(middleware = verifyToken) {
  const app = express()

  const metricsMiddleware = process.env.NODE_ENV === 'test'
      ? (req, res, next) => next()
      : promBundle({ includeMethod: true })
  app.use(metricsMiddleware)

  try {
    const swaggerDocument = YAML.load(
        fs.readFileSync(path.resolve(__dirname, '../openapi.yaml'), 'utf8')
    )
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
  } catch (e) {
    console.log(e)
  }

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Max-Age', '86400')
    if (req.method === 'OPTIONS') return res.sendStatus(204)
    next()
  })

  app.use(express.json())
  app.use(detectLanguage)

  app.get('/users/me', middleware, async (req, res) => {
    try {
      const user = await User.findOne(
          { firebaseUid: req.user.uid },
          { username: 1, gamesPlayed: 1, gamesWon: 1, gamesLost: 1, createdAt: 1, photoURL: 1 }
      )
      if (!user) return res.status(404).json({ error: req.t('userNotFound') })
      res.json(user)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  app.get('/users', middleware, async (_req, res) => {
    try {
      const users = await User.find({}, { username: 1, gamesPlayed: 1, gamesWon: 1, gamesLost: 1 })
          .sort({ gamesWon: -1 })
          .limit(50)
      res.json(users)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  app.post('/register', middleware, async (req, res) => {
    const { username } = req.body
    const { uid } = req.user
    try {
      const existing = await User.findOne({ firebaseUid: uid })
      if (existing) {
        return res.status(409).json({ error: req.t('userAlreadyRegistered') })
      }
      await User.create({ firebaseUid: uid, username })
      res.status(201).json({ message: req.t('welcomeUser', { username }) })
    } catch (err) {
      res.status(400).json({ error: err.message })
    }
  })

  app.post('/games', middleware, async (req, res) => {
    const { winner, durationMs, turns, difficulty } = req.body
    try {
      const user = await User.findOne({ firebaseUid: req.user.uid })
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

      const game = await Game.create({
        username: user.username,
        winner,
        durationMs,
        turns,
        difficulty,
      })
      res.status(201).json(game)
    } catch (err) {
      res.status(400).json({ error: err.message })
    }
  })

  app.get('/games/me', middleware, async (req, res) => {
    try {
      const user = await User.findOne({ firebaseUid: req.user.uid })
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

      const games = await Game.find({ username: user.username })
          .sort({ createdAt: -1 })
          .limit(50)
      res.json(games)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // ------------- PERFIL ------------------


  return app
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.env.NODE_ENV !== 'test') {
    connectMongo().catch((e) => {
      console.error('[users] Mongo connection error:', e)
      process.exit(1)
    })
  }
  const app = createApp()
  app.listen(3000, '0.0.0.0', () => {
    console.log('User Service listening on port 3000')
  })
}