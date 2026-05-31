import 'dotenv/config';
import cron from 'node-cron';
import app from './app.js';
import { refreshDailyPicks } from './src/jobs/dailyPicks.js';

const PORT = process.env.PORT || 3001;

// Daily picks cron — 9:30am ET on weekdays
cron.schedule('30 13 * * 1-5', async () => {
  console.log('[CRON] Running daily picks refresh...');
  await refreshDailyPicks();
}, { timezone: 'America/New_York' });

// Generate picks immediately on startup
refreshDailyPicks().catch(console.error);

app.listen(PORT, () => {
  console.log(`EquityLens backend running on http://localhost:${PORT}`);
});
