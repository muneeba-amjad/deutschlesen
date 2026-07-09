import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "../config/db.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Topics to rotate through daily
const TOPICS = [
  "daily life in Hamburg",
  "going to the supermarket",
  "using public transport",
  "visiting a doctor in Germany",
  "renting an apartment",
  "German weather and seasons",
  "making friends at work",
  "cooking a German recipe",
  "a trip to Berlin",
  "job interview preparation",
  "opening a bank account",
  "recycling in Germany",
  "weekend at a Christmas market",
  "learning to ride a bike in the city",
  "a conversation at the Bürgeramt",
  // Transit & Travel
  "navigating airport security and baggage claim",
  "buying a monthly transit pass and asking for bus directions",
  "calling a taxi or using a rideshare app during rush hour",
  
  // Daily Errands & Shopping
  "going to a hair salon or barber and describing a haircut",
  "shopping at a local weekly open-air market (Wochenmarkt)",
  "returning a defective product to an electronics store",
  "sending a registered package at the Deutsche Post",
  
  // Work & Professional Life
  "setting up a home office workspace and troubleshooting internet with IT",
  "calling in sick to a manager or calling an employer regarding an absence",
  "handling casual conversation (Smalltalk) at the office coffee machine",
  
  // Social & Culture Interactions
  "inviting neighbors over for a small housewarming get-together",
  "joining a local sports club (Verein) or fitness center and asking about rules",
  "ordering a specific drink and handling a split bill at a busy cafe",
  
  // Domestic & Housing Survival
  "dealing with a broken heater or emergency water leak with the landlord",
  "understanding garbage sorting rules and complaining about missing bins",
  "ordering furniture online and coordinating a delivery window"
];

// Which levels to generate each day
const DAILY_LEVELS = ["A1", "A2", "B1", "B2", "C1"];

// ── Generate ONE story for a given level ─────
export async function generateStory(level) {
 // Use customTopic if it exists, otherwise fall back to the random array
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

const prompt = `You are a German language teacher creating a realistic, context-driven survival reading story for ${level} level learners.

Core Scenario: "${topic}"

Level-Specific Structural Restrictions:
- ${level === "A1" ? "Write exactly 2 short paragraphs (~80 words total). Use ONLY simple present tense, basic subject-verb sentences, and fundamental conversational phrases suitable for absolute beginners." : ""}
- ${level === "A2" ? "Write 2-3 paragraphs (~100 words total). Use simple past (Perfekt) structures, clear practical vocabulary, and foundational sentence transitions." : ""}
- ${level === "B1" ? "Write 3-4 paragraphs (~180 words total). Incorporate common relative clauses, subordinate conjunctions (weil, dass, obwohl), and standard conversational idioms." : ""}
- ${level === "B2" ? "Write 4-5 paragraphs (~250 words total). Incorporate professional vocabulary variation, passive voice layout, and complex clausal arrangements suitable for working conditions." : ""}
- ${level === "C1" ? "Write 5 paragraphs (~350 words total). Use high-level academic register, advanced idiomatic expressions, nuanced modal particles, and highly structured discourse styles." : ""}

General Instructions:
1. Ensure the characters handle the situation realistically using natural, everyday conversational German or narrative style relevant to the setting.
2. Isolate exactly 8-10 essential vocabulary words directly pulled from the generated text that are critical for surviving this specific real-world scenario.

Output Format:
Return ONLY a raw, minified valid JSON object. Do NOT wrap your response in markdown code blocks (such as \`\`\`json). Do NOT add text or conversational explanation outside the JSON format structure.

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
}`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  // const data = JSON.parse(text)

  let data;

  try {
    const cleanText = text.replace(/```json|```/g, "").trim();
    data = JSON.parse(cleanText);
  } catch (err) {
    console.error("❌ JSON parse failed. Raw response:", text);
    throw err;
  }
  // Save to database
  const story = await prisma.story.create({
    data: {
      title: data.title,
      level,
      topic: data.topic,
      source: "AI_GENERATED",
      paragraphs: {
        create: (data.paragraphs || []).map((p) => ({
          order: p.order,
          germanText: p.germanText,
          englishText: p.englishText,
        })),
      },
      vocabulary: {
        create: (data.vocabulary || []).map((v) => ({
          word: v.word,
          translation: v.translation,
          type: v.type,
          gender: v.gender || null,
          example: v.example || null,
          level,
        })),
      },
    },
  });

  console.log(`✅ Generated ${level} story: "${data.title}"`);
  return story;
}

// ── Generate all daily stories ────────────────
export async function generateDailyStories() {
  console.log("🕐 Starting daily story generation...");

  for (const level of DAILY_LEVELS) {
    try {
      await generateStory(level);
      // Small delay between API calls to be kind to rate limits
      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      console.error(`❌ Failed to generate ${level} story:`, err.message);
    }
  }

  console.log("✅ Daily story generation complete!");
}
