import Groq from 'groq-sdk';
import { fhQuote, fhProfile } from '../lib/finnhub.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

let picksCache = { picks: [], generatedAt: null, date: null };
let generating = false;

// Mix of sectors: growth tech, biotech, fintech, energy, defense, consumer, cannabis, space, AI, crypto-adjacent
const WATCHLIST = [
  // Mega-cap anchors (4)
  'NVDA', 'TSLA', 'META', 'AMZN',
  // Mid-cap growth / momentum (6)
  'PLTR', 'CRWD', 'NET', 'SHOP', 'DKNG', 'RKLB',
  // Biotech / pharma (4)
  'MRNA', 'CRSP', 'HIMS', 'RXRX',
  // Fintech / crypto-adjacent (4)
  'COIN', 'SOFI', 'HOOD', 'MSTR',
  // Energy / industrial (3)
  'FSLR', 'SMR', 'LUNR',
  // AI / semiconductor (4)
  'ARM', 'SMCI', 'IONQ', 'SOUN',
];

async function fetchSnapshot(ticker) {
  try {
    const [quote, profile] = await Promise.all([
      fhQuote(ticker),
      fhProfile(ticker).catch(() => ({})),
    ]);
    return {
      ticker,
      name: profile.name || ticker,
      sector: profile.finnhubIndustry || '',
      price: quote.c,
      change: quote.d,
      changePercent: quote.dp,
      prevClose: quote.pc,
      dayHigh: quote.h,
      dayLow: quote.l,
    };
  } catch { return null; }
}

export async function refreshDailyPicks() {
  const today = new Date().toISOString().split('T')[0];

  if (picksCache.date === today && picksCache.picks.length > 0) return picksCache.picks;
  if (generating) { await new Promise(r => setTimeout(r, 3000)); return picksCache.picks || []; }

  generating = true;
  console.log('[Picks] Generating for', today);

  try {
    // Fetch all quotes in parallel batches of 8 (Finnhub allows 60 req/min)
    const snapshots = [];
    const batchSize = 8;
    for (let i = 0; i < WATCHLIST.length; i += batchSize) {
      const batch = WATCHLIST.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(fetchSnapshot));
      snapshots.push(...results.filter(Boolean));
      if (i + batchSize < WATCHLIST.length) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    if (!snapshots.length) throw new Error('No snapshots fetched');

    const prompt = `Today is ${today}. You are an expert stock screener. From these ${snapshots.length} stocks, pick the 6 most compelling trades for today.

PRIORITIZE niche, high-conviction picks over obvious mega-cap names. Favor:
- Unusual movers (big % change, breakouts from recent range)
- Sector-specific catalysts (biotech, AI, space, fintech)
- Momentum plays with clear directional bias
- Contrarian opportunities (oversold bounce setups)

Only include a mega-cap if it had a truly exceptional day.

${JSON.stringify(snapshots, null, 2)}

Return ONLY valid JSON, no other text:
[{"ticker":"TICKER","reason":"One punchy sentence — be specific about why TODAY","confidence":"High"|"Medium"|"Speculative"}]`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4, max_tokens: 500,
    });

    const raw = completion.choices[0].message.content.trim();
    const match = raw.match(/\[[\s\S]*?\]/);
    if (!match) throw new Error('No JSON in response');

    const picks = JSON.parse(match[0])
      .map(p => {
        const snap = snapshots.find(s => s.ticker === p.ticker);
        if (!snap) return null;
        return {
          ticker: snap.ticker, name: snap.name, sector: snap.sector,
          price: snap.price, change: snap.change, changePercent: snap.changePercent,
          reason: p.reason, confidence: p.confidence || 'Medium',
        };
      })
      .filter(Boolean);

    picksCache = { picks, generatedAt: new Date().toISOString(), date: today };
    console.log(`[Picks] Done — ${picks.length} picks generated`);
    return picks;
  } catch (err) {
    console.error('[Picks] Error:', err.message);
    return picksCache.picks || [];
  } finally {
    generating = false;
  }
}

export function getCache() { return picksCache; }
