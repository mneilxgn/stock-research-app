import express from 'express';
import { fhNews } from '../lib/finnhub.js';

const router = express.Router();

router.get('/:ticker/news', async (req, res) => {
  const { ticker } = req.params;
  try {
    const articles = await fhNews(ticker, 14);
    const news = (articles || []).slice(0, 15).map(item => ({
      title: item.headline,
      link: item.url,
      publisher: item.source,
      publishedAt: item.datetime,
      thumbnail: item.image || null,
    }));
    res.json({ news });
  } catch (err) {
    console.error(`News error [${ticker}]:`, err.message);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

export default router;
