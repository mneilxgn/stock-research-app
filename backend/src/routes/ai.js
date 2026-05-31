import express from 'express';
import Groq from 'groq-sdk';
import { fhQuote, fhProfile, fhMetrics } from '../lib/finnhub.js';

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.get('/:ticker/ai-outlook', async (req, res) => {
  const { ticker } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const [quote, profile, metricsData] = await Promise.all([
      fhQuote(ticker).catch(() => ({})),
      fhProfile(ticker).catch(() => ({})),
      fhMetrics(ticker).catch(() => ({ metric: {} })),
    ]);

    const m = metricsData.metric || {};

    const ctx = {
      ticker,
      companyName: profile.name || ticker,
      sector: profile.finnhubIndustry || 'N/A',
      industry: profile.finnhubIndustry || 'N/A',
      currentPrice: quote.c || 'N/A',
      change: quote.d || 'N/A',
      changePercent: quote.dp || 'N/A',
      marketCap: profile.marketCapitalization ? `$${(profile.marketCapitalization / 1000).toFixed(1)}B` : 'N/A',
      fiftyTwoWeekHigh: m['52WeekHigh'] || 'N/A',
      fiftyTwoWeekLow: m['52WeekLow'] || 'N/A',
      beta: m.beta || 'N/A',
      peRatio: m.peNormalizedAnnual || m.peTTM || 'N/A',
      eps: m.epsNormalizedAnnual || m.epsTTM || 'N/A',
      dividendYield: m.dividendYieldIndicatedAnnual || 'N/A',
      revenueGrowth: m.revenueGrowthTTMYoy || 'N/A',
      grossMargin: m.grossMarginTTM || 'N/A',
      operatingMargin: m.operatingMarginTTM || 'N/A',
      netMargin: m.netProfitMarginTTM || 'N/A',
      roe: m.roeTTM || 'N/A',
      debtToEquity: m.totalDebtToEquityQuarterly || 'N/A',
    };

    const prompt = `You are a professional equity research analyst. Analyze ${ctx.companyName} (${ticker}).

Data: ${JSON.stringify(ctx, null, 2)}

Format your response exactly like this:

## Business Health Summary
[2-3 sentences on financial health and competitive position]

## Revenue & Earnings Trends
[Specific numbers-driven analysis]

## Key Risks
- [Risk 1]
- [Risk 2]
- [Risk 3]

## Fair Value Estimate
Fair Value Range: $X - $Y
[Brief valuation reasoning]`;

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      stream: true, max_tokens: 1024, temperature: 0.3,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) send({ content });
    }

    send({ done: true });
    res.end();
  } catch (err) {
    console.error(`AI error [${ticker}]:`, err.message);
    send({ error: 'AI analysis failed: ' + err.message });
    res.end();
  }
});

export default router;
