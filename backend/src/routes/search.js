import express from 'express';
import { fhSearch } from '../lib/finnhub.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { q } = req.query;
  if (!q?.trim()) return res.json({ quotes: [] });
  try {
    const data = await fhSearch(q);
    const quotes = (data.result || [])
      .filter(r => r.type === 'Common Stock' || r.type === 'ADR' || r.type === 'ETF')
      .slice(0, 10)
      .map(r => ({ symbol: r.symbol, shortname: r.description || r.symbol, exchange: r.displaySymbol || '', quoteType: r.type }));
    res.json({ quotes });
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
