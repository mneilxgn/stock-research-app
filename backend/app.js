import express from 'express';
import cors from 'cors';

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
import { cacheStats } from './src/lib/cache.js';

const app = express();

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

export default app;
