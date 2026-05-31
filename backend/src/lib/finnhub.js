/**
 * Finnhub API client with caching.
 * Free tier: 60 requests/minute.
 */
import { cacheGet, cacheSet } from './cache.js';

const TOKEN = process.env.FINNHUB_API_KEY;
const BASE = 'https://finnhub.io/api/v1';

async function fhGet(path, params = {}, ttl = 60) {
  const qs = new URLSearchParams({ ...params, token: TOKEN }).toString();
  const url = `${BASE}${path}?${qs}`;
  const key = `fh:${path}:${JSON.stringify(params)}`;

  const cached = cacheGet(key);
  if (cached) return cached;

  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error('Finnhub rate limit');
    throw new Error(`Finnhub ${res.status}: ${await res.text().catch(() => '')}`);
  }

  const data = await res.json();
  cacheSet(key, data, ttl);
  return data;
}

/** Real-time quote: price, change, high, low, prev close */
export async function fhQuote(symbol) {
  return fhGet('/quote', { symbol }, 30);
}

/** Search symbols */
export async function fhSearch(query) {
  return fhGet('/search', { q: query }, 600);
}

/** Company profile: name, industry, market cap, logo, etc. */
export async function fhProfile(symbol) {
  return fhGet('/stock/profile2', { symbol }, 3600);
}

/** Basic financials / metrics: P/E, EPS, 52W, beta, margins, etc. */
export async function fhMetrics(symbol) {
  return fhGet('/stock/metric', { symbol, metric: 'all' }, 1800);
}

/** Analyst recommendations (buy/sell/hold) */
export async function fhRecommendations(symbol) {
  return fhGet('/stock/recommendation', { symbol }, 1800);
}

/** Earnings history (EPS actual vs estimate) */
export async function fhEarnings(symbol) {
  return fhGet('/stock/earnings', { symbol }, 1800);
}

/** Company news */
export async function fhNews(symbol, daysBack = 7) {
  const to = new Date().toISOString().split('T')[0];
  const from = new Date(Date.now() - daysBack * 86400000).toISOString().split('T')[0];
  return fhGet('/company-news', { symbol, from, to }, 300);
}

/** Peer companies */
export async function fhPeers(symbol) {
  return fhGet('/stock/peers', { symbol }, 3600);
}

/** Insider transactions */
export async function fhInsiderTransactions(symbol) {
  return fhGet('/stock/insider-transactions', { symbol }, 1800);
}

/** Stock candles (OHLCV) for charting */
export async function fhCandle(symbol, resolution, from, to) {
  return fhGet('/stock/candle', { symbol, resolution, from, to }, 300);
}
