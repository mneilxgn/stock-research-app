import express from 'express';
import axios from 'axios';

const router = express.Router();

const EDGAR_HEADERS = {
  'User-Agent': 'EquityLens contact@equitylens.com',
  'Accept-Encoding': 'gzip, deflate',
};

async function getCik(ticker) {
  const url = 'https://www.sec.gov/files/company_tickers.json';
  const { data } = await axios.get(url, { headers: EDGAR_HEADERS });
  const upperTicker = ticker.toUpperCase().replace('.TO', '').replace('.V', '');
  const entry = Object.values(data).find(e => e.ticker.toUpperCase() === upperTicker);
  if (!entry) return null;
  return String(entry.cik_str).padStart(10, '0');
}

router.get('/:ticker/filings', async (req, res) => {
  const { ticker } = req.params;

  try {
    const cik = await getCik(ticker);
    if (!cik) {
      return res.json({ filings: [], cik: null, message: 'No CIK found for this ticker.' });
    }

    const url = `https://data.sec.gov/submissions/CIK${cik}.json`;
    const { data } = await axios.get(url, { headers: EDGAR_HEADERS });

    const recent    = data.filings?.recent || {};
    const forms     = recent.form             || [];
    const dates     = recent.filingDate       || [];
    const accNums   = recent.accessionNumber  || [];
    const documents = recent.primaryDocument  || [];

    const targetForms = ['10-K', '10-Q', '8-K'];
    const filings = [];

    for (let i = 0; i < forms.length && filings.length < 30; i++) {
      if (targetForms.includes(forms[i])) {
        const accNum = accNums[i].replace(/-/g, '');
        const docLink = `https://www.sec.gov/Archives/edgar/data/${parseInt(cik)}/${accNum}/${documents[i]}`;
        filings.push({
          form:            forms[i],
          date:            dates[i],
          accessionNumber: accNums[i],
          link:            docLink,
        });
      }
    }

    res.json({ filings, cik: parseInt(cik), companyName: data.name });
  } catch (err) {
    console.error(`Filings error [${ticker}]:`, err.message);
    res.status(500).json({ error: 'Failed to fetch SEC filings' });
  }
});

export default router;
