/**
 * Direct Yahoo Finance API helpers — no crumb required.
 * Uses curl via shell because Yahoo fingerprints Node.js TLS connections.
 * All requests go through a global throttle + cache layer.
 */
import { exec } from 'child_process';
import { cacheGet, cacheSet } from './cache.js';
import { throttledFetch } from './throttle.js';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function curlGet(url, timeout = 12) {
  return new Promise((resolve, reject) => {
    const escaped = url.replace(/'/g, "'\\''");
    const cmd = `curl -s -m ${timeout} -H 'User-Agent: ${UA}' -H 'Accept: */*' '${escaped}'`;
    exec(cmd, { maxBuffer: 5 * 1024 * 1024 }, (err, stdout) => {
      if (err) return reject(new Error(err.message));
      try { resolve(JSON.parse(stdout)); }
      catch { reject(new Error('Invalid JSON: ' + stdout.slice(0, 100))); }
    });
  });
}

function buildUrl(base, path, params) {
  const url = new URL(path, base);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  return url.toString();
}

/** Search for stocks by query string. Cached 10 min. */
export async function yfSearch(query, { quotesCount = 10, newsCount = 0 } = {}) {
  const key = `search:${query}:${quotesCount}:${newsCount}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const url = buildUrl('https://query1.finance.yahoo.com', '/v1/finance/search', {
    q: query, quotesCount, newsCount, enableFuzzyQuery: false,
  });

  const data = await throttledFetch(() => curlGet(url, 10));
  cacheSet(key, data, 600);
  return data;
}

/** Get quote data from the chart v8 meta (no auth needed). Cached 60s. */
export async function yfQuote(ticker) {
  const key = `quote:${ticker}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const url = buildUrl('https://query2.finance.yahoo.com', `/v8/finance/chart/${ticker}`, {
    interval: '1d', range: '5d', includePrePost: false,
  });

  const data = await throttledFetch(() => curlGet(url, 12));
  const result = data.chart?.result?.[0];
  if (!result) throw new Error(`No data for ${ticker}`);
  const meta = result.meta || {};
  cacheSet(key, meta, 60);
  return meta;
}

/** Batch quote for multiple tickers (all go through the throttle). */
export async function yfQuoteBatch(tickers) {
  const results = [];
  for (const ticker of tickers) {
    try {
      const meta = await yfQuote(ticker);
      results.push(meta);
    } catch { /* skip failed */ }
  }
  return results;
}

/** Get OHLCV chart data. Cached 5 min. */
export async function yfChart(ticker, { period1, interval = '1d' } = {}) {
  const p1 = period1 instanceof Date
    ? Math.floor(period1.getTime() / 1000)
    : Math.floor(new Date(period1).getTime() / 1000);

  const key = `chart:${ticker}:${interval}:${p1}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const url = buildUrl('https://query2.finance.yahoo.com', `/v8/finance/chart/${ticker}`, {
    period1: p1, period2: Math.floor(Date.now() / 1000), interval, includePrePost: false,
  });

  const data = await throttledFetch(() => curlGet(url, 15));
  const r = data.chart?.result?.[0];
  if (!r) { const empty = { quotes: [], meta: {} }; cacheSet(key, empty, 300); return empty; }

  const timestamps = r.timestamp || [];
  const ohlcv = r.indicators?.quote?.[0] || {};

  const quotes = timestamps
    .map((ts, i) => ({
      date:   new Date(ts * 1000),
      open:   ohlcv.open?.[i]   ?? null,
      high:   ohlcv.high?.[i]   ?? null,
      low:    ohlcv.low?.[i]    ?? null,
      close:  ohlcv.close?.[i]  ?? null,
      volume: ohlcv.volume?.[i] ?? 0,
    }))
    .filter(q => q.close != null);

  const result = { quotes, meta: r.meta || {} };
  cacheSet(key, result, 300);
  return result;
}
