import express from 'express';
import { fhMetrics } from '../lib/finnhub.js';

const router = express.Router();

router.get('/:ticker/financials', async (req, res) => {
  const { ticker } = req.params;
  try {
    const data = await fhMetrics(ticker);
    const m = data.metric || {};
    const s = data.series?.annual || {};

    // Build time-series from Finnhub's series.annual data
    // Each key has [{period: "2024-09-28", v: 0.1234}, ...]
    function buildSeries(key) {
      return (s[key] || []).map(entry => ({
        period: entry.period,
        value: entry.v,
      }));
    }

    // Profitability over time
    const profitability = {
      grossMargin:     buildSeries('grossMargin'),
      operatingMargin: buildSeries('operatingMargin'),
      netMargin:       buildSeries('netMargin'),
      roe:             buildSeries('roe'),
      roa:             buildSeries('roa'),
      roic:            buildSeries('roic'),
    };

    // Valuation over time
    const valuation = {
      pe:           buildSeries('pe'),
      ps:           buildSeries('ps'),
      pb:           buildSeries('pb'),
      ev:           buildSeries('ev'),
      eps:          buildSeries('eps'),
      salesPerShare: buildSeries('salesPerShare'),
      bookValue:    buildSeries('bookValue'),
    };

    // Leverage & liquidity over time
    const leverage = {
      currentRatio:     buildSeries('currentRatio'),
      cashRatio:        buildSeries('cashRatio'),
      totalDebtToEquity: buildSeries('totalDebtToEquity'),
    };

    // Current TTM metrics snapshot
    const currentMetrics = {
      // Valuation
      peRatio:              m.peNormalizedAnnual || m.peTTM || null,
      psRatio:              m.psTTM || null,
      pbRatio:              m.pbQuarterly || m.pbAnnual || null,
      evToEbitda:           m.enterpriseValueEBITDATTM || null,
      evToRevenue:          m.enterpriseValueRevenueAnnual || null,
      // Per share
      epsTTM:               m.epsTTM || m.epsNormalizedAnnual || null,
      epsGrowth5Y:          m.epsGrowth5Y || null,
      revenuePerShare:      m.revenuePerShareTTM || null,
      bookValuePerShare:    m.bookValuePerShareQuarterly || null,
      // Profitability
      grossMarginTTM:       m.grossMarginTTM || null,
      operatingMarginTTM:   m.operatingMarginTTM || null,
      netMarginTTM:         m.netProfitMarginTTM || null,
      roeTTM:               m.roeTTM || null,
      roaTTM:               m.roaTTM || null,
      roicTTM:              m.roicTTM || null,
      // Growth
      revenueGrowthTTM:     m.revenueGrowthTTMYoy || null,
      revenueGrowth3Y:      m.revenueGrowth3Y || null,
      revenueGrowth5Y:      m.revenueGrowth5Y || null,
      epsGrowthTTM:         m.epsGrowthTTMYoy || null,
      // Leverage
      currentRatio:         m.currentRatioQuarterly || null,
      debtToEquity:         m.totalDebt_totalEquityQuarterly || m.totalDebtToEquityQuarterly || null,
      cashRatio:            m.cashRatioQuarterly || null,
      // Dividend
      dividendYield:        m.dividendYieldIndicatedAnnual || null,
      dividendPerShare:     m.dividendPerShareAnnual || null,
      payoutRatio:          m.payoutRatioAnnual || null,
      // Size
      marketCap:            m.marketCapitalization || null,
      beta:                 m.beta || null,
      '52WeekHigh':         m['52WeekHigh'] || null,
      '52WeekLow':          m['52WeekLow'] || null,
      '52WeekHighDate':     m['52WeekHighDate'] || null,
      '52WeekLowDate':      m['52WeekLowDate'] || null,
    };

    res.json({
      profitability,
      valuation,
      leverage,
      currentMetrics,
    });
  } catch (err) {
    console.error(`Financials error [${ticker}]:`, err.message);
    res.status(500).json({ error: 'Failed to fetch financials' });
  }
});

export default router;
