import cron from 'node-cron'
import { generateDailyStories } from './storyGenerator.js'

export function startCronJobs() {

  // ── Run every day at midnight (German time) ──
  // Format: 'second minute hour day month weekday'
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Cron triggered: generating daily stories...')
    await generateDailyStories()
  }, {
    timezone: 'Europe/Berlin'  // Hamburg is in this timezone!
  })

  console.log('📅 Cron jobs scheduled (daily stories at midnight Berlin time)')
}
