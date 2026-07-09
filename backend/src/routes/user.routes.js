import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import prisma from '../config/db.js'

const router = Router()

// GET /api/user/profile  — get user profile + streak
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true, name: true, email: true, createdAt: true,
        streaks:    true,
        _count: {
          select: { savedWords: true, readStories: true }
        }
      }
    })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch profile.' })
  }
})

export default router
