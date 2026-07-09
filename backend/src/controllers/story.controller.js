import prisma from '../config/db.js'

// ── Get all stories (with optional level filter) ──
export async function getStories(req, res) {
  try {
    const { level, page = 1, limit = 10 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = {
      isPublished: true,
      ...(level && { level })   // only add level filter if provided
    }

    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        where,
        skip,
        take: parseInt(limit),
       orderBy: [
          { level: 'asc' },     // Sorts A1 -> A2 -> B1 -> B2 -> C1
          { createdAt: 'desc' } // Newest stories within each level show up first
        ],
        select: {
          id: true, title: true, level: true,
          topic: true, source: true, createdAt: true,
          _count: { select: { paragraphs: true, vocabulary: true } }
        }
      }),
      prisma.story.count({ where })
    ])

    res.json({
      stories,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) }
    })

  } catch (err) {
    console.error('getStories error:', err)
    res.status(500).json({ error: 'Could not fetch stories.' })
  }
}

// ── Get single story with all content ────────
export async function getStory(req, res) {
  try {
    const { id } = req.params

    const story = await prisma.story.findUnique({
      where: { id },
      include: {
        paragraphs: { orderBy: { order: 'asc' } },
        vocabulary: true
      }
    })

    if (!story) {
      return res.status(404).json({ error: 'Story not found.' })
    }

    // If user is logged in, mark as read
    if (req.user) {
      await prisma.readStory.upsert({
        where: { userId_storyId: { userId: req.user.userId, storyId: id } },
        create: { userId: req.user.userId, storyId: id },
        update: { readAt: new Date() }
      })

      // Update streak
      await updateStreak(req.user.userId)
    }

    res.json(story)

  } catch (err) {
    console.error('getStory error:', err)
    res.status(500).json({ error: 'Could not fetch story.' })
  }
}

// ── Get today's story ────────────────────────
export async function getTodaysStory(req, res) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const story = await prisma.story.findFirst({
      where: {
        isPublished: true,
        createdAt: { gte: today }
      },
      include: {
        paragraphs: { orderBy: { order: 'asc' } },
        vocabulary: true
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!story) {
      return res.status(404).json({ error: 'No story for today yet. Check back soon!' })
    }

    res.json(story)

  } catch (err) {
    console.error('getTodaysStory error:', err)
    res.status(500).json({ error: 'Could not fetch today\'s story.' })
  }
}

// ── Helper: update user reading streak ───────
async function updateStreak(userId) {
  const streak = await prisma.streak.findUnique({ where: { userId } })
  if (!streak) return

  const now  = new Date()
  const last = new Date(streak.lastReadAt)

  // Normalize dates to UTC midnights so hours/minutes don't break diffDays math
  const d1 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const d2 = Date.UTC(last.getFullYear(), last.getMonth(), last.getDate())
  const diffDays = Math.floor((d1 - d2) / (1000 * 60 * 60 * 24))

  // const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24))

  let newDays = streak.currentDays

  if (diffDays === 1) {
    // Read yesterday too — continue streak
    newDays = streak.currentDays + 1
  } else if (diffDays > 1) {
    // Missed a day — reset streak
    newDays = 1
  }
  // diffDays === 0 means already read today, no change

  await prisma.streak.update({
    where: { userId },
    data: {
      currentDays: newDays,
      longestDays: Math.max(newDays, streak.longestDays),
      lastReadAt: now
    }
  })
}
