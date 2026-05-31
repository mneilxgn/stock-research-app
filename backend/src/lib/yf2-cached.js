/**
 * Cached + throttled Yahoo Finance quoteSummary via curl (shell).
 * Uses fc.yahoo.com cookie trick for crumb auth.
 */
import { exec } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { cacheGet, cacheSet } from './cache.js';
import { throttledFetch } from './throttle.js';

const TTL = 1800;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const COOKIE_FILE = join(tmpdir(), 'yf-cookies.txt');

let crumb = null;
let crumbExpiry = 0;

function shellExec(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 5 * 1024 * 1024 }, (err, stdout) => {
      if (err) return reject(new Error(err.message));
      resolve(stdout);
    });
  });
}

async function ensureCrumb() {
  if (crumb && Date.now() < crumbExpiry) return;

  await shellExec(`curl -s -c '${COOKIE_FILE}' -L 'https://fc.yahoo.com' -H 'User-Agent: ${UA}'`);
  const raw = await shellExec(`curl -s -b '${COOKIE_FILE}' 'https://query2.finance.yahoo.com/v1/test/getcrumb' -H 'User-Agent: ${UA}'`);

  if (!raw || raw.includes('"error"') || raw.trim().length > 100) {
    throw new Error('Failed to get Yahoo crumb');
  }

  crumb = raw.trim();
  crumbExpiry = Date.now() + 3600000;
  console.log('[yf2] Got new crumb');
}

async function curlQuoteSummary(ticker, modules) {
  await ensureCrumb();

  const mods = modules.join(',');
  const encodedCrumb = encodeURIComponent(crumb);
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=${mods}&crumb=${encodedCrumb}`;

  const raw = await shellExec(`curl -s -m 15 -b '${COOKIE_FILE}' '${url}' -H 'User-Agent: ${UA}'`);
  const data = JSON.parse(raw);

  if (data.quoteSummary?.error) {
    if (data.quoteSummary.error.description?.includes('Crumb') || data.quoteSummary.error.description?.includes('Cookie')) {
      crumb = null;
      crumbExpiry = 0;
    }
    throw new Error(data.quoteSummary.error.description || 'quoteSummary error');
  }

  return data.quoteSummary?.result?.[0] || {};
}

export async function cachedQuoteSummary(ticker, modules) {
  const key = `qs:${ticker}:${modules.sort().join(',')}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  try {
    const data = await throttledFetch(() => curlQuoteSummary(ticker, modules));
    cacheSet(key, data, TTL);
    return data;
  } catch (err) {
    console.warn(`[yf2] quoteSummary failed for ${ticker}: ${err.message?.slice(0, 80)}`);
    return {};
  }
}
