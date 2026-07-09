import { GoogleGenerativeAI } from '@google/generative-ai'
import prisma from '../config/db.js'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// ── Check grammar + spelling of user's German text ──────────
export async function checkWriting(req, res) {
  try {
    const { text, mode, level, promptText } = req.body
    const userId = req.user?.userId // optional — user may not be logged in

    if (!text?.trim()) {
      return res.status(400).json({ error: 'Please write something first!' })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `You are a German language teacher checking a ${level || 'B1'} level student's writing.

${mode === 'translate' && promptText
  ? `The student was asked to translate this English sentence into German:\n"${promptText}"\n\nTheir German attempt:`
  : 'The student wrote this in German (free writing):'
}

"${text}"

Analyze their German writing carefully. Check for:
1. Spelling mistakes
2. Grammar errors (verb conjugation, case endings, article gender, word order)
3. Sentence structure
4. Vocabulary appropriateness for ${level || 'B1'} level
${mode === 'translate' ? '5. Accuracy of translation' : ''}

Return ONLY valid JSON, no markdown:
{
  "score": 85,
  "correctedText": "The fully corrected German text here",
  "isCorrect": false,
  "errors": [
    {
      "original": "the wrong word/phrase",
      "correction": "the correct version",
      "explanation": "Why this is wrong in simple English",
      "type": "grammar | spelling | vocabulary | word-order | translation"
    }
  ],
  "tips": [
    "One positive thing about their writing",
    "One specific tip to improve"
  ],
  "encouragement": "A short warm encouraging message in English"
}`

    const result    = await model.generateContent(prompt)
    const raw       = result.response.text().trim()
    const cleaned   = raw.replace(/```json|```/g, '').trim()
    const feedback  = JSON.parse(cleaned)

    // Save to DB if user is logged in and mode is "free"
    let savedEntry = null
    if (userId && mode === 'free') {
      savedEntry = await prisma.writingEntry.create({
        data: {
          userId,
          mode,
          level:         level || 'B1',
          promptText:    promptText || null,
          userText:      text,
          correctedText: feedback.correctedText,
          feedback:      feedback,
        }
      })
    }

    res.json({ feedback, entryId: savedEntry?.id || null })

  } catch (err) {
    console.error('checkWriting error:', err)
    res.status(500).json({ error: 'Could not check your writing. Try again.' })
  }
}

// ── Get or generate today's daily prompt ─────────────────────
export async function getDailyPrompt(req, res) {
  try {
    const { level = 'A2' } = req.query
    const today = new Date().toISOString().split('T')[0] // "2026-05-04"
    const key   = `${today}-${level}` // unique per day + level

    // Check if today's prompt already exists
    const existing = await prisma.dailyPrompt.findUnique({
      where: { date: key }
    })
    if (existing) return res.json(existing)

    // Generate a new one with Gemini
    const model  = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const prompt = `Generate a German language writing challenge for a ${level} level learner.

Create one English sentence that the student should translate into German.
The sentence should:
- Be appropriate for ${level} level
- Use vocabulary and grammar structures typical for ${level}
- Be practical and related to everyday life in Germany
- Not be too long (max 15 words in English)

Return ONLY valid JSON, no markdown:
{
  "englishText": "The English sentence to translate",
  "hints": ["grammatical hint 1", "vocabulary hint 2"],
  "sampleAnswer": "One correct German translation"
}`

    const result  = await model.generateContent(prompt)
    const raw     = result.response.text().trim()
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const data    = JSON.parse(cleaned)

    const dailyPrompt = await prisma.dailyPrompt.create({
      data: {
        date:         key,
        level,
        englishText:  data.englishText,
        hints:        data.hints,
        sampleAnswer: data.sampleAnswer,
      }
    })

    res.json(dailyPrompt)

  } catch (err) {
    console.error('getDailyPrompt error:', err)
    res.status(500).json({ error: 'Could not load daily prompt.' })
  }
}

// ── Get user's writing history ────────────────────────────────
export async function getWritingHistory(req, res) {
  try {
    const userId = req.user.userId
    const { page = 1, limit = 10 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [entries, total] = await Promise.all([
      prisma.writingEntry.findMany({
        where:   { userId },
        skip,
        take:    parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.writingEntry.count({ where: { userId } })
    ])

    res.json({ entries, total, page: parseInt(page) })

  } catch (err) {
    console.error('getWritingHistory error:', err)
    res.status(500).json({ error: 'Could not load writing history.' })
  }
}

// ── Delete a writing entry ────────────────────────────────────
export async function deleteWritingEntry(req, res) {
  try {
    const { id }   = req.params
    const userId   = req.user.userId

    // Make sure the entry belongs to this user
    const entry = await prisma.writingEntry.findUnique({ where: { id } })
    if (!entry || entry.userId !== userId) {
      return res.status(404).json({ error: 'Entry not found.' })
    }

    await prisma.writingEntry.delete({ where: { id } })
    res.json({ message: 'Entry deleted.' })

  } catch (err) {
    console.error('deleteWritingEntry error:', err)
    res.status(500).json({ error: 'Could not delete entry.' })
  }
}

// ── Quick practice sentences (no saving) ──────────────────────
export async function getPracticeSentences(req, res) {
  try {
    const { level = 'A2', count = 5 } = req.query

    const model  = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const prompt = `Generate ${count} German grammar practice sentences for ${level} level learners.

These are quick practice sentences — no saving needed, just for immediate practice.
Mix different types: some to translate EN→DE, some to correct broken German.

Return ONLY valid JSON, no markdown:
{
  "sentences": [
    {
      "type": "translate",
      "english": "I would like a coffee please.",
      "hint": "Use 'möchte' for would like"
    },
    {
      "type": "correct",
      "broken": "Ich gehe heute zu Schule mit Bus.",
      "hint": "Check articles and prepositions"
    }
  ]
}`

    const result  = await model.generateContent(prompt)
    const raw     = result.response.text().trim()
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const data    = JSON.parse(cleaned)

    res.json(data)

  } catch (err) {
    console.error('getPracticeSentences error:', err)
    res.status(500).json({ error: 'Could not generate practice sentences.' })
  }
}
