import { Router }   from 'express'
import { getStories, getStory, getTodaysStory } from '../controllers/story.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

// GET /api/stories          — all stories (public)
router.get('/', getStories)

// GET /api/stories/today    — today's story (public)
router.get('/today', getTodaysStory)

// GET /api/stories/:id      — single story (auth optional, used for streak tracking)
router.get('/:id', (req, res, next) => {
  // try to authenticate but don't block if no token
  const authHeader = req.headers['authorization']
  if (authHeader) {
    return authenticate(req, res, next)
  }
  next()
}, getStory)

export default router
