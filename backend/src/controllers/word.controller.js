import axios  from 'axios'
import prisma  from '../config/db.js'

// ── Translate a word via DeepL ────────────────
// export async function translateWord(req, res) {
//   try {
//     const { word } = req.params

//     // 1. Check if word already in our database
//     const existing = await prisma.vocabulary.findFirst({
//       where: { word: { equals: word, mode: 'insensitive' } }
//     })

//     if (existing) {
//       return res.json(existing)
//     }

//     // 2. Call DeepL API for fresh translation
//     const deepLRes = await axios.post(
//       'https://api-free.deepl.com/v2/translate',
//       new URLSearchParams({
//         auth_key: process.env.DEEPL_API_KEY,
//         text:     word,
//         source_lang: 'DE',
//         target_lang: 'EN'
//       })
//     )

//     const translation = deepLRes.data.translations[0].text

//     // 3. Return the result (we don't save standalone lookups to DB)
//     res.json({ word, translation, type: 'lookup', gender: null })

//   } catch (err) {
//     console.error('translateWord error:', err)
//     res.status(500).json({ error: 'Could not translate word.' })
//   }
// }
// ── Translate a word via MyMEmmoryAPI ────────────────

export async function translateWord(req, res) {
  try {
    const { word } = req.params

    // Check database first
    const existing = await prisma.vocabulary.findFirst({
      where: { word: { equals: word, mode: 'insensitive' } }
    })
    if (existing) return res.json(existing)

    // MyMemory API — completely free, no key needed!
    const response = await axios.get(
      `https://api.mymemory.translated.net/get`,
      { params: { q: word, langpair: 'de|en' } }
    )

    const translation = response.data.responseData.translatedText

    res.json({ word, translation, type: 'lookup', gender: null })

  } catch (err) {
    res.status(500).json({ error: 'Could not translate word.' })
  }
}

// ── Save a word to user's vocabulary ─────────
export async function saveWord(req, res) {
  try {
    const { vocabularyId } = req.body
    const userId = req.user.userId

    const saved = await prisma.savedWord.upsert({
      where: { userId_vocabularyId: { userId, vocabularyId } },
      create: { userId, vocabularyId, nextReview: new Date() },
      update: {}
    })

    res.json({ message: 'Word saved!', saved })

  } catch (err) {
    console.error('saveWord error:', err)
    res.status(500).json({ error: 'Could not save word.' })
  }
}

// ── Get user's saved vocabulary list ─────────
export async function getSavedWords(req, res) {
  try {
    const userId = req.user.userId

    const words = await prisma.savedWord.findMany({
      where: { userId },
      include: { vocabulary: true },
      orderBy: { savedAt: 'desc' }
    })

    res.json(words)

  } catch (err) {
    console.error('getSavedWords error:', err)
    res.status(500).json({ error: 'Could not fetch saved words.' })
  }
}
