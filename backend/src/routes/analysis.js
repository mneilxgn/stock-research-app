import express from 'express';
import { fhRecommendations, fhEarnings, fhMetrics, fhQuote } from '../lib/finnhub.js';

const router = express.Router();

router.get('/:ticker/analysis', async (req, res) => {
  const { ticker } = req.params;
  try {
    const [recs, earnings, metricsData, quote] = await Promise.all([
      fhRecommendations(ticker).catch(() => []),
      fhEarnings(ticker).catch(() => []),
      fhMetrics(ticker).catch(() => ({ metric: {} })),
      fhQuote(ticker).catch(() => ({})),
    ]);

    const latest = recs[0] || {};
    const m = metricsData.metric || {};
    const currentPrice = quote.c || null;

    // Recommendation history (last 6 months of data)
    const recommendationHistory = (recs || []).slice(0, 6).map(r => ({
      period: r.period,
      strongBuy: r.strongBuy || 0,
      buy: r.buy || 0,
      hold: r.hold || 0,
      sell: r.sell || 0,
      strongSell: r.strongSell || 0,
    }));

    // 52-week range data (always available)
    const week52High = m['52WeekHigh'] || null;
    const week52Low = m['52WeekLow'] || null;
    const week52HighDate = m['52WeekHighDate'] || null;
    const week52LowDate = m['52WeekLowDate'] || null;

    // Calculate position within 52W range
    let positionIn52W = null;
    if (week52High && week52Low && currentPrice) {
      positionIn52W = ((currentPrice - week52Low) / (week52High - week52Low)) * 100;
    }

    // Key metrics for context
    const keyMetrics = {
      peRatio:       m.peNormalizedAnnual || m.peTTM || null,
      epsTTM:        m.epsTTM || m.epsNormalizedAnnual || null,
      beta:          m.beta || null,
      dividendYield: m.dividendYieldIndicatedAnnual || null,
      epsGrowth5Y:   m.epsGrowth5Y || null,
      revenueGrowth: m.revenueGrowthTTMYoy || null,
    };

    res.json({
      recommendations: {
        strongBuy: latest.strongBuy || 0,
        buy: latest.buy || 0,
        hold: latest.hold || 0,
        sell: latest.sell || 0,
        strongSell: latest.strongSell || 0,
      },
      recommendationHistory,
      priceRange: {
        current: currentPrice,
        week52High,
        week52Low,
        week52HighDate,
        week52LowDate,
        positionIn52W,
      },
      earningsHistory: (earnings || []).slice(0, 8).map(e => ({
        date: e.period,
        epsEstimate: e.estimate || null,
        epsActual: e.actual || null,
        surprisePercent: e.surprisePercent || null,
      })),
      keyMetrics,
    });
  } catch (err) {
    console.error(`Analysis error [${ticker}]:`, err.message);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

export default router;
