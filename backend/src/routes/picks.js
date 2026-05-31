import express from 'express';
import { getCache, refreshDailyPicks } from '../jobs/dailyPicks.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const cache = getCache();
    const today = new Date().toISOString().split('T')[0];

    if (cache.date === today && cache.picks.length > 0) {
      // Picks ready — serve immediately
      return res.json({ picks: cache.picks, generatedAt: cache.generatedAt, date: cache.date });
    }

    // Picks not ready — kick off generation in background, return loading state
    refreshDailyPicks().catch(console.error);
    res.json({ picks: [], generatedAt: null, date: null, loading: true });
  } catch (err) {
    console.error('Picks route error:', err.message);
    res.status(500).json({ error: 'Failed to fetch daily picks' });
  }
});

export default router;
