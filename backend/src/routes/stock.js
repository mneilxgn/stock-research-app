import express from 'express';
import { fhQuote, fhProfile, fhMetrics } from '../lib/finnhub.js';

const router = express.Router();

router.get('/:ticker', async (req, res) => {
  const { ticker } = req.params;

  try {
    const [quote, profile, metricsData] = await Promise.all([
      fhQuote(ticker),
      fhProfile(ticker).catch(() => ({})),
      fhMetrics(ticker).catch(() => ({ metric: {} })),
    ]);

    const m = metricsData.metric || {};

    res.json({
      symbol:    ticker,
      shortName: profile.name || ticker,
      longName:  profile.name || ticker,
      exchange:  profile.exchange || '',
      currency:  profile.currency || 'USD',

      regularMarketPrice:         quote.c,
      regularMarketChange:        quote.d,
      regularMarketChangePercent: quote.dp,
      regularMarketOpen:          quote.o || null,
      regularMarketPreviousClose: quote.pc || null,
      regularMarketDayHigh:       quote.h,
      regularMarketDayLow:        quote.l,
      regularMarketVolume:        m['10DayAverageTradingVolume'] ? Math.round(m['10DayAverageTradingVolume'] * 1e6) : null,
      averageDailyVolume3Month:   m['3MonthAverageTradingVolume'] ? Math.round(m['3MonthAverageTradingVolume'] * 1e6) : null,

      preMarketPrice: null, preMarketChange: null, preMarketChangePercent: null,
      postMarketPrice: null, postMarketChange: null, postMarketChangePercent: null,
      bid: null, ask: null,

      fiftyTwoWeekHigh: m['52WeekHigh'] || null,
      fiftyTwoWeekLow:  m['52WeekLow']  || null,

      marketCap:   profile.marketCapitalization ? profile.marketCapitalization * 1e6 : null,
      beta:        m.beta || null,
      trailingPE:  m.peNormalizedAnnual || m.peTTM || null,
      forwardPE:   m.peBasicExclExtraTTM || null,
      trailingEps: m.epsNormalizedAnnual || m.epsTTM || null,
      forwardEps:  m.epsGrowth5Y || null,
      dividendRate:   m.dividendPerShareAnnual || null,
      dividendYield:  m.dividendYieldIndicatedAnnual || null,
      exDividendDate: null,
      earningsDate:   null,
      targetMeanPrice: m.targetMedianPrice || null,

      sector:   profile.finnhubIndustry || null,
      industry: profile.finnhubIndustry || null,
      website:  profile.weburl || null,
      longBusinessSummary: null,
      fullTimeEmployees:   null,
      logo: profile.logo || null,
    });
  } catch (err) {
    console.error(`Stock error [${ticker}]:`, err.message);
    res.status(500).json({ error: `Failed to fetch data for ${ticker}` });
  }
});

export default router;
