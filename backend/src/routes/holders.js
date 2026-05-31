import express from 'express';
import { fhPeers, fhInsiderTransactions } from '../lib/finnhub.js';

const router = express.Router();

// Finnhub transaction codes
const TX_CODES = {
  P:  'Purchase',
  S:  'Sale',
  A:  'Grant/Award',
  D:  'Sold to issuer',
  F:  'Tax payment',
  I:  'Discretionary',
  M:  'Option exercise',
  C:  'Conversion',
  W:  'Inherited',
  G:  'Gift',
  J:  'Other',
  K:  'Equity swap',
  U:  'Disposition to trust',
  X:  'Option expiration',
};

router.get('/:ticker/holders', async (req, res) => {
  const { ticker } = req.params;
  try {
    const [peers, insiderData] = await Promise.all([
      fhPeers(ticker).catch(() => []),
      fhInsiderTransactions(ticker).catch(() => ({ data: [] })),
    ]);

    // Map insider transactions
    const insiderTransactions = (insiderData.data || [])
      .filter(tx => tx.name && tx.change !== 0)
      .slice(0, 30)
      .map(tx => ({
        name:            tx.name || 'Unknown',
        shares:          Math.abs(tx.change || 0),
        changeAmount:    tx.change || 0,
        transactionDate: tx.transactionDate || null,
        transactionPrice: tx.transactionPrice || null,
        transactionCode: tx.transactionCode || '',
        transactionType: TX_CODES[tx.transactionCode] || tx.transactionCode || 'Unknown',
        filingDate:      tx.filingDate || null,
        isAcquisition:   (tx.change || 0) > 0,
      }));

    // Summarize insider activity
    const last6Months = insiderTransactions.filter(tx => {
      if (!tx.transactionDate) return false;
      const txDate = new Date(tx.transactionDate);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return txDate >= sixMonthsAgo;
    });

    const buyCount = last6Months.filter(tx => tx.isAcquisition && (tx.transactionCode === 'P')).length;
    const sellCount = last6Months.filter(tx => !tx.isAcquisition && (tx.transactionCode === 'S')).length;
    const totalBuyShares = last6Months.filter(tx => tx.transactionCode === 'P').reduce((sum, tx) => sum + tx.shares, 0);
    const totalSellShares = last6Months.filter(tx => tx.transactionCode === 'S').reduce((sum, tx) => sum + tx.shares, 0);

    res.json({
      insiderSummary: {
        buyCount,
        sellCount,
        totalBuyShares,
        totalSellShares,
        totalTransactions: last6Months.length,
        period: '6 months',
      },
      insiderTransactions,
      peers: (peers || []).filter(p => p !== ticker).slice(0, 10),
    });
  } catch (err) {
    console.error(`Holders error [${ticker}]:`, err.message);
    res.status(500).json({ error: 'Failed to fetch holders' });
  }
});

export default router;
