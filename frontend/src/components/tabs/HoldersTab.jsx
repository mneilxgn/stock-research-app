import React, { useEffect, useState } from 'react';
import { getHolders } from '../../api';

function fmtShares(n) {
  if (n == null) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${n < 0 ? '-' : ''}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${n < 0 ? '-' : ''}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${n < 0 ? '-' : ''}${(abs / 1e3).toFixed(0)}K`;
  return n.toLocaleString();
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtPrice(n) {
  if (n == null || n === 0) return '—';
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function HoldersTab({ ticker }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    getHolders(ticker)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 40 }}>
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />)}
    </div>
  );

  if (error) return <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{error}</div>;
  if (!data)  return null;

  const summary = data.insiderSummary || {};
  const transactions = data.insiderTransactions || [];
  const peers = data.peers || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>
      {/* Insider Activity Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
        {[
          ['Insider Buys',  summary.buyCount,        'var(--accent)'],
          ['Insider Sales', summary.sellCount,       'var(--red)'],
          ['Shares Bought', fmtShares(summary.totalBuyShares),  'var(--accent)'],
          ['Shares Sold',   fmtShares(summary.totalSellShares), 'var(--red)'],
          ['Total Transactions', summary.totalTransactions, 'var(--text)'],
        ].map(([label, value, color]) => (
          <div key={label} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '14px 16px',
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              {label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color }}>{value ?? '—'}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        Insider activity over the last {summary.period || '6 months'}
      </div>

      {/* Insider Transactions Table */}
      <div className="section-card">
        <div className="section-header">Recent Insider Transactions</div>
        {transactions.length === 0 ? (
          <div style={{ padding: 16, fontSize: 13, color: 'var(--text-secondary)' }}>No insider transactions found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Insider</th>
                  <th style={{ textAlign: 'center' }}>Type</th>
                  <th style={{ textAlign: 'right' }}>Shares</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 20).map((tx, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text)', fontWeight: 500, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {tx.name}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        background: tx.transactionCode === 'P' ? 'rgba(0,255,136,0.1)' :
                                    tx.transactionCode === 'S' ? 'rgba(255,69,69,0.1)' :
                                    'rgba(255,255,255,0.05)',
                        color: tx.transactionCode === 'P' ? 'var(--accent)' :
                               tx.transactionCode === 'S' ? 'var(--red)' :
                               'var(--text-secondary)',
                      }}>
                        {tx.transactionType}
                      </span>
                    </td>
                    <td style={{
                      textAlign: 'right',
                      color: tx.isAcquisition ? 'var(--accent)' : 'var(--red)',
                      fontWeight: 500,
                    }}>
                      {tx.isAcquisition ? '+' : '-'}{fmtShares(tx.shares)}
                    </td>
                    <td style={{ textAlign: 'right' }}>{fmtPrice(tx.transactionPrice)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{fmtDate(tx.transactionDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Peer Companies */}
      {peers.length > 0 && (
        <div className="section-card">
          <div className="section-header">Peer Companies</div>
          <div style={{ padding: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {peers.map(peer => (
              <span key={peer} style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text)',
                cursor: 'default',
              }}>
                {peer}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
