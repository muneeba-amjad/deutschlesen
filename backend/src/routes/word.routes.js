import { Router } from 'express'
import { translateWord, saveWord, getSavedWords } from '../controllers/word.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

// GET  /api/words/translate/:word  — translate a word (public)
router.get('/translate/:word', translateWord)

// POST /api/words/save             — save word to vocab (auth required)
router.post('/save', authenticate, saveWord)

// GET  /api/words/saved            — get saved words (auth required)
router.get('/saved', authenticate, getSavedWords)

export default router
