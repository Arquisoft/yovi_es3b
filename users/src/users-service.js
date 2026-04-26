import 'dotenv/config'
import path from 'node:path'
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

function switchBranch(caseExpr, value) {
  const obj = { case: caseExpr }
  obj['then'] = value
  return obj
}

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

  app.get('/users', middleware, async (req, res) => {
    const VALID_DIFFICULTIES = ['easy', 'hard', 'extreme', 'impossible']
    const { difficulty } = req.query

    if (difficulty !== undefined && !VALID_DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({ error: req.t('invalidDifficulty') })
    }

    try {
      const safeDifficulty = VALID_DIFFICULTIES.find(d => d === difficulty)

      const pipeline = []
      if (safeDifficulty) pipeline.push({ $match: { difficulty: safeDifficulty } })

      pipeline.push(
        {
          $group: {
            _id: '$userId',
            rawPoints: {
              $sum: {
                $switch: {
                  branches: [
                    switchBranch({ $eq: ['$winner', 'bot'] }, -200),
                    switchBranch({ $and: [{ $eq: ['$winner', 'player'] }, { $eq: ['$gameMode', 'classic'] }] }, 1000),
                    switchBranch({ $and: [{ $eq: ['$winner', 'player'] }, { $eq: ['$gameMode', 'master'] }] }, 600),
                    switchBranch({ $and: [{ $eq: ['$winner', 'player'] }, { $eq: ['$gameMode', 'fortune'] }] }, 400),
                  ],
                  default: 0,
                },
              },
            },
            gamesPlayed: { $sum: 1 },
            gamesWon: { $sum: { $cond: [{ $eq: ['$winner', 'player'] }, 1, 0] } },
            gamesLost: { $sum: { $cond: [{ $eq: ['$winner', 'bot'] }, 1, 0] } },
          },
        },
        { $addFields: { points: { $max: ['$rawPoints', 0] } } },
        { $sort: { points: -1, gamesWon: -1 } },
        { $limit: 50 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        {
          $project: {
            _id: '$user._id',
            username: '$user.username',
            photoURL: '$user.photoURL',
            points: 1,
            gamesPlayed: 1,
            gamesWon: 1,
            gamesLost: 1,
          },
        },
      )

      const ranking = await Game.aggregate(pipeline)
      res.json(ranking)
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
      const user = await User.create({ firebaseUid: uid, username })
      res.status(201).json({ 
        message: req.t('welcomeUser', { username }),
        user: { username: user.username, _id: user._id }
      })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  app.post('/games', middleware, async (req, res) => {
    const { winner, durationMs, turns, difficulty, gameMode } = req.body
    const VALID_WINNERS = ['player', 'bot']
    const VALID_DIFFICULTIES = ['easy', 'hard', 'extreme', 'impossible']
    const VALID_GAME_MODES = ['classic', 'master', 'fortune']

    if (gameMode !== undefined && !VALID_GAME_MODES.includes(gameMode)) {
      return res.status(400).json({ error: req.t('invalidGameMode') })
    }

    try {
      const user = await User.findOne({ firebaseUid: req.user.uid })
      if (!user) return res.status(404).json({ error: req.t('userNotFound') })

      const safeWinner = VALID_WINNERS.find(w => w === winner)
      const safeDifficulty = VALID_DIFFICULTIES.find(d => d === difficulty)
      const safeGameMode = VALID_GAME_MODES.find(m => m === gameMode)

      const gameDoc = {
        userId: user._id,
        winner: safeWinner,
        durationMs: Number(durationMs),
        turns: Number(turns),
        difficulty: safeDifficulty,
      }
      if (safeGameMode) gameDoc.gameMode = safeGameMode

      const game = await Game.create(gameDoc)

      const wonField = safeWinner === 'player' ? 'gamesWon' : 'gamesLost'
      await User.updateOne(
        { _id: user._id },
        { $inc: { gamesPlayed: 1, [wonField]: 1 } }
      )

      res.status(201).json(game)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  app.get('/games/me', middleware, async (req, res) => {
    try {
      const user = await User.findOne({ firebaseUid: req.user.uid })
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

      const games = await Game.find({ userId: user._id })
          .sort({ createdAt: -1 })
          .limit(50)
      res.json(games)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // ------------- PERFIL ------------------
  app.put('/users/me/profile', middleware, async (req, res) => {
    const { uid } = req.user
    const { username, photoURL } = req.body

    try {
      const user = await User.findOneAndUpdate(
          { firebaseUid: uid },
          { $set: { ...(username && { username }), ...(photoURL && { photoURL }) } },
          { new: true, projection: { username: 1, photoURL: 1 } }
      )
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
      res.json(user)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

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