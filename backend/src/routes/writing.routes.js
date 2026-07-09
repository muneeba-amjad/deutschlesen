import { Router } from 'express'
import {
  checkWriting,
  getDailyPrompt,
  getWritingHistory,
  deleteWritingEntry,
  getPracticeSentences,
} from '../controllers/writing.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

// POST /api/writing/check        — check grammar (auth optional)
router.post('/check', (req, res, next) => {
  const token = req.headers['authorization']
  if (token) return authenticate(req, res, next)
  next()
}, checkWriting)

// GET  /api/writing/daily        — today's translation challenge (public)
router.get('/daily', getDailyPrompt)

// GET  /api/writing/practice     — quick practice sentences (public, no saving)
router.get('/practice', getPracticeSentences)

// GET  /api/writing/history      — user's saved writing (auth required)
router.get('/history', authenticate, getWritingHistory)

// DELETE /api/writing/:id        — delete an entry (auth required)
router.delete('/:id', authenticate, deleteWritingEntry)

export default router
