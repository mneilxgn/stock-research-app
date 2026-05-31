import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';

import searchRoute from './src/routes/search.js';
import stockRoute from './src/routes/stock.js';
import chartRoute from './src/routes/chart.js';
import financialsRoute from './src/routes/financials.js';
import analysisRoute from './src/routes/analysis.js';
import newsRoute from './src/routes/news.js';
import holdersRoute from './src/routes/holders.js';
import filingsRoute from './src/routes/filings.js';
import aiRoute from './src/routes/ai.js';
import picksRoute from './src/routes/picks.js';
import { refreshDailyPicks } from './src/jobs/dailyPicks.js';
import { cacheStats } from './src/lib/cache.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/search', searchRoute);
app.use('/api/stock', stockRoute);
app.use('/api/stock', chartRoute);
app.use('/api/stock', financialsRoute);
app.use('/api/stock', analysisRoute);
app.use('/api/stock', newsRoute);
app.use('/api/stock', holdersRoute);
app.use('/api/stock', filingsRoute);
app.use('/api/stock', aiRoute);
app.use('/api/picks', picksRoute);

app.get('/api/health', (req, res) => res.json({ status: 'ok', cache: cacheStats() }));

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
