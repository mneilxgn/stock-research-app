import React from 'react';

function fmt(n, digits = 2) {
  if (n == null) return '—';
  if (typeof n === 'object' && n.fmt) return n.fmt;
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtPct(n) {
  if (n == null) return '—';
  return `${(n * 100).toFixed(2)}%`;
}

function fmtMarketCap(n) {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(typeof d === 'number' ? d * 1000 : d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function StatSection({ title, rows }) {
  return (
    <div className="section-card">
      <div className="section-header">{title}</div>
      <table className="data-table">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td style={{ color: 'var(--text-secondary)' }}>{label}</td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function StatisticsTab({ ticker, stockData }) {
  const d = stockData || {};

  if (!stockData) {
    return (
      <div style={{ display: 'grid', gap: 16, paddingBottom: 40 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />
        ))}
      </div>
    );
  }

  const sections = [
    {
      title: 'Valuation Measures',
      rows: [
        ['Market Cap',              fmtMarketCap(d.marketCap)],
        ['Trailing P/E',            fmt(d.trailingPE)],
        ['Forward P/E',             fmt(d.forwardPE)],
        ['Beta (5Y Monthly)',       fmt(d.beta)],
        ['52-Week High',            `$${fmt(d.fiftyTwoWeekHigh)}`],
        ['52-Week Low',             `$${fmt(d.fiftyTwoWeekLow)}`],
      ],
    },
    {
      title: 'Trading Information',
      rows: [
        ['Volume',                  d.regularMarketVolume?.toLocaleString() ?? '—'],
        ['Avg Volume (3M)',         d.averageDailyVolume3Month?.toLocaleString() ?? '—'],
        ['Open',                    `$${fmt(d.regularMarketOpen)}`],
        ['Previous Close',          `$${fmt(d.regularMarketPreviousClose)}`],
        ['Day Range',               d.regularMarketDayLow ? `$${fmt(d.regularMarketDayLow)} – $${fmt(d.regularMarketDayHigh)}` : '—'],
        ['Bid / Ask',               d.bid ? `$${fmt(d.bid)} / $${fmt(d.ask)}` : '—'],
      ],
    },
    {
      title: 'Dividends & Earnings',
      rows: [
        ['Trailing EPS',            fmt(d.trailingEps)],
        ['Forward EPS',             fmt(d.forwardEps)],
        ['Dividend Rate',           d.dividendRate ? `$${fmt(d.dividendRate)}` : '—'],
        ['Dividend Yield',          d.dividendYield ? fmtPct(d.dividendYield) : '—'],
        ['Ex-Dividend Date',        fmtDate(d.exDividendDate)],
        ['Next Earnings Date',      fmtDate(d.earningsDate)],
        ['1Y Target Estimate',      d.targetMeanPrice ? `$${fmt(d.targetMeanPrice)}` : '—'],
      ],
    },
  ];

  return (
    <div style={{ display: 'grid', gap: 16, paddingBottom: 40, maxWidth: 700 }}>
      {sections.map(s => (
        <StatSection key={s.title} title={s.title} rows={s.rows} />
      ))}
    </div>
  );
}
