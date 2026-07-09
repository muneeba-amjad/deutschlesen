import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import authRoutes    from './routes/auth.routes.js'
import storyRoutes   from './routes/story.routes.js'
import wordRoutes    from './routes/word.routes.js'
import userRoutes    from './routes/user.routes.js'
import writingRoutes from './routes/writing.routes.js'
import { generateDailyStories } from './utils/storyGenerator.js'

import { startCronJobs } from './utils/cron.js'

const app  = express()
const PORT = process.env.PORT || 3000

// ── Middleware ────────────────────────────────
app.use(cors({ origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true}))
app.use(express.json())

// ── Routes ────────────────────────────────────
app.use('/api/auth',    authRoutes)
app.use('/api/stories', storyRoutes)
app.use('/api/words',   wordRoutes)
app.use('/api/user',    userRoutes)
app.use('/api/writing', writingRoutes)

// ── Health check ─────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// ── Start cron jobs (daily story generation) ─
startCronJobs()

// ── Start server ──────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
})
app.get('/api/admin/generate', async (req, res) => {
  await generateDailyStories()
  res.json({ message: 'Stories generated!' })
})