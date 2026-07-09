import 'dotenv/config'
import prisma from '../config/db.js'
import { generateStory } from './storyGenerator.js'

// ── 3 guaranteed unique topics per level ─────────────────────
// These override the random pick inside storyGenerator
// by temporarily patching the topic before each call

const SEED_PLAN = [
  { level: 'A1', topic: 'ordering food at a German bakery' },
  { level: 'A1', topic: 'introducing yourself to a new neighbor' },
  { level: 'A1', topic: 'shopping at a supermarket' },

  { level: 'A2', topic: 'taking the U-Bahn in Hamburg' },
  { level: 'A2', topic: 'a picnic in the park with friends' },
  { level: 'A2', topic: 'visiting a German Christmas market' },

  { level: 'B1', topic: 'job interview at a Hamburg company' },
  { level: 'B1', topic: 'renting a flat and talking to the landlord' },
  { level: 'B1', topic: 'making friends at a German language course' },

  { level: 'B2', topic: 'discussing climate change with colleagues' },
  { level: 'B2', topic: 'navigating the German healthcare system' },
  { level: 'B2', topic: 'work-life balance in Germany vs abroad' },

  { level: 'C1', topic: 'digitalization and its impact on German industry' },
  { level: 'C1', topic: 'immigration and integration policies in Germany' },
  { level: 'C1', topic: 'the role of culture in shaping German identity' },
]

// ── Wrap generateStory to accept a specific topic ─────────────
// This avoids touching storyGenerator.js at all —
// we just call prisma directly with the forced topic
// after getting the AI content via a tweaked prompt

import { GoogleGenerativeAI } from '@google/generative-ai'
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

async function generateStoryWithTopic(level, topic) {
  const prompt = `You are a German language teacher creating a reading story for ${level} level learners.

Write a short German story about: "${topic}"

Requirements:
- ${level === 'A1' ? '2 paragraphs, ~80 words total, very simple present tense vocabulary' : ''}
- ${level === 'A2' ? '3 paragraphs, ~120 words total, simple vocabulary' : ''}
- ${level === 'B1' ? '3-4 paragraphs, ~180 words total, everyday vocabulary with some complex structures' : ''}
- ${level === 'B2' ? '4-5 paragraphs, ~250 words total, varied vocabulary with subordinate clauses' : ''}
- ${level === 'C1' ? '5 paragraphs, ~350 words total, sophisticated vocabulary and complex arguments' : ''}
- Natural, engaging writing that teaches real German
- Include 8-10 notable vocabulary words with translations

Return ONLY valid JSON, no markdown, no explanation:
{
  "title": "Story title in German",
  "topic": "${topic}",
  "paragraphs": [
    { "germanText": "German paragraph text", "englishText": "English translation", "order": 1 }
  ],
  "vocabulary": [
    {
      "word": "German word",
      "translation": "English meaning",
      "type": "noun OR verb OR adjective OR adverb",
      "gender": "der OR die OR das OR null",
      "example": "Short example sentence"
    }
  ]
}`

  const model  = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const result = await model.generateContent(prompt)
  const text   = result.response.text()

  let data
  try {
    const cleanText = text.replace(/```json|```/g, '').trim()
    data = JSON.parse(cleanText)
  } catch (err) {
    console.error('❌ JSON parse failed. Raw response:', text)
    throw err
  }

  const story = await prisma.story.create({
    data: {
      title:  data.title,
      level,
      topic,
      source: 'AI_GENERATED',
      paragraphs: {
        create: (data.paragraphs || []).map(p => ({
          order:       p.order,
          germanText:  p.germanText,
          englishText: p.englishText,
        }))
      },
      vocabulary: {
        create: (data.vocabulary || []).map(v => ({
          word:        v.word,
          translation: v.translation,
          type:        v.type,
          gender:      v.gender || null,
          example:     v.example || null,
          level,
        }))
      }
    }
  })

  console.log(`✅ ${level} — "${data.title}"`)
  return story
}

// ── Main ──────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Seeding 15 stories (3 per level, all unique topics)...\n')
const targetLevels = ['A1', 'A2', 'B1', 'B2', 'C1'];
  let success = 0
  let failed  = 0

  for (const level of targetLevels) {
   for(let i=0; i<3; i++){
     try {
      // await generateStoryWithTopic(level, topic)
      await generateStory(level)
      success++
      await new Promise(r => setTimeout(r, 3000))
    } catch (err) {
      console.error(`❌ Failed [${level}] "${topic}": ${err.message}`)
      failed++
      await new Promise(r => setTimeout(r, 5000))
    }
   }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`✅ Success: ${success} / 15`)
  if (failed > 0) console.log(`❌ Failed:  ${failed}`)
  console.log('\n🎉 Done! Run "npm run db:studio" to view your data.')

  await prisma.$disconnect()
}

seed()
