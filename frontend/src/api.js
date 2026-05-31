const BASE = '/api';

export async function searchStocks(query) {
  const res = await fetch(`${BASE}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function getStock(ticker) {
  const res = await fetch(`${BASE}/stock/${ticker}`);
  if (!res.ok) throw new Error('Failed to load stock');
  return res.json();
}

export async function getChart(ticker, range = '1Y') {
  const res = await fetch(`${BASE}/stock/${ticker}/chart?range=${range}`);
  if (!res.ok) throw new Error('Failed to load chart');
  return res.json();
}

export async function getFinancials(ticker) {
  const res = await fetch(`${BASE}/stock/${ticker}/financials`);
  if (!res.ok) throw new Error('Failed to load financials');
  return res.json();
}

export async function getAnalysis(ticker) {
  const res = await fetch(`${BASE}/stock/${ticker}/analysis`);
  if (!res.ok) throw new Error('Failed to load analysis');
  return res.json();
}

export async function getNews(ticker) {
  const res = await fetch(`${BASE}/stock/${ticker}/news`);
  if (!res.ok) throw new Error('Failed to load news');
  return res.json();
}

export async function getHolders(ticker) {
  const res = await fetch(`${BASE}/stock/${ticker}/holders`);
  if (!res.ok) throw new Error('Failed to load holders');
  return res.json();
}

export async function getFilings(ticker) {
  const res = await fetch(`${BASE}/stock/${ticker}/filings`);
  if (!res.ok) throw new Error('Failed to load filings');
  return res.json();
}

export async function getDailyPicks() {
  const res = await fetch(`${BASE}/picks`);
  if (!res.ok) throw new Error('Failed to load picks');
  return res.json();
}
