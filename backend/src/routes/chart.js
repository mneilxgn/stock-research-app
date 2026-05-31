import express from 'express';
import { cacheGet, cacheSet } from '../lib/cache.js';

const router = express.Router();

function getRangeParams(range) {
  const now = Math.floor(Date.now() / 1000);
  const day = 86400;
  const map = {
    '1D':  { period1: now - 2 * day,    interval: '5m'  },
    '5D':  { period1: now - 7 * day,    interval: '15m' },
    '1M':  { period1: now - 35 * day,   interval: '1d'  },
    '3M':  { period1: now - 95 * day,   interval: '1d'  },
    '6M':  { period1: now - 185 * day,  interval: '1d'  },
    '1Y':  { period1: now - 370 * day,  interval: '1d'  },
    '2Y':  { period1: now - 740 * day,  interval: '1wk' },
    '5Y':  { period1: now - 1830 * day, interval: '1wk' },
    'MAX': { period1: 0,                interval: '1mo' },
  };
  return { ...map[range] || map['1Y'], period2: now };
}

router.get('/:ticker/chart', async (req, res) => {
  const { ticker } = req.params;
  const range = req.query.range || '1Y';

  try {
    const key = `chart:${ticker}:${range}`;
    const cached = cacheGet(key);
    if (cached) return res.json(cached);

    const { period1, period2, interval } = getRangeParams(range);
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?period1=${period1}&period2=${period2}&interval=${interval}&includePrePost=false`;

    const { exec } = await import('child_process');
    const result = await new Promise((resolve, reject) => {
      exec(
        `curl -s -m 15 '${url}' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'`,
        { maxBuffer: 10 * 1024 * 1024 },
        (err, stdout) => {
          if (err) return reject(err);
          try { resolve(JSON.parse(stdout)); }
          catch { reject(new Error('Chart data unavailable')); }
        }
      );
    });

    const r = result.chart?.result?.[0];
    if (!r || !r.timestamp) {
      return res.json({ ticker, range, interval, data: [] });
    }

    const timestamps = r.timestamp;
    const ohlcv = r.indicators?.quote?.[0] || {};

    const data = timestamps
      .map((ts, i) => ({
        time:   ts,
        open:   ohlcv.open?.[i]   != null ? +ohlcv.open[i].toFixed(4)   : null,
        high:   ohlcv.high?.[i]   != null ? +ohlcv.high[i].toFixed(4)   : null,
        low:    ohlcv.low?.[i]    != null ? +ohlcv.low[i].toFixed(4)    : null,
        close:  ohlcv.close?.[i]  != null ? +ohlcv.close[i].toFixed(4)  : null,
        volume: ohlcv.volume?.[i] || 0,
      }))
      .filter(q => q.close != null);

    const response = { ticker, range, interval, data };
    // Cache longer ranges for longer (they change less often)
    const ttl = ['1D', '5D'].includes(range) ? 120 : 600;
    cacheSet(key, response, ttl);
    res.json(response);
  } catch (err) {
    console.error(`Chart error [${ticker}]:`, err.message);
    res.json({ ticker, range, interval: '1d', data: [] });
  }
});

export default router;
