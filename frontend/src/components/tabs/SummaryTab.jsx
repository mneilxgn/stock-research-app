import React, { useEffect, useState } from 'react';
import { getNews } from '../../api';

function fmt(n, digits = 2) {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
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
  return new Date(typeof d === 'object' ? d : d * 1000).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function SummaryTab({ ticker, stockData }) {
  const [news, setNews]     = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);

  useEffect(() => {
    setNewsLoading(true);
    getNews(ticker)
      .then(d => setNews(d.news || []))
      .catch(() => setNews([]))
      .finally(() => setNewsLoading(false));
  }, [ticker]);

  const d = stockData || {};

  const keyStats = [
    ['Previous Close', fmt(d.regularMarketPreviousClose)],
    ['Open',           fmt(d.regularMarketOpen)],
    ['Bid',            d.bid  ? `${fmt(d.bid)} × ${d.bidSize  || ''}` : '—'],
    ['Ask',            d.ask  ? `${fmt(d.ask)} × ${d.askSize  || ''}` : '—'],
    ['Day Range',      d.regularMarketDayLow ? `${fmt(d.regularMarketDayLow)} – ${fmt(d.regularMarketDayHigh)}` : '—'],
    ['52 Week Range',  d.fiftyTwoWeekLow     ? `${fmt(d.fiftyTwoWeekLow)} – ${fmt(d.fiftyTwoWeekHigh)}` : '—'],
    ['Volume',         d.regularMarketVolume?.toLocaleString() ?? '—'],
    ['Avg. Volume',    d.averageDailyVolume3Month?.toLocaleString() ?? '—'],
    ['Market Cap',     fmtMarketCap(d.marketCap)],
    ['Beta (5Y)',      fmt(d.beta)],
    ['P/E Ratio (TTM)',fmt(d.trailingPE)],
    ['Fwd P/E',        fmt(d.forwardPE)],
    ['EPS (TTM)',      fmt(d.trailingEps)],
    ['Fwd EPS',        fmt(d.forwardEps)],
    ['Earnings Date',  fmtDate(d.earningsDate)],
    ['Dividend & Yield', d.dividendRate ? `${fmt(d.dividendRate)} (${(d.dividendYield * 100)?.toFixed(2)}%)` : '—'],
    ['Ex-Div Date',    fmtDate(d.exDividendDate)],
    ['1Y Target',      d.targetMeanPrice ? `$${fmt(d.targetMeanPrice)}` : '—'],
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, paddingBottom: 40 }}>
      {/* Left col */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* About */}
        {d.longBusinessSummary && (
          <div className="section-card">
            <div className="section-header">About</div>
            <div style={{ padding: '16px 20px' }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {d.longBusinessSummary.slice(0, 600)}{d.longBusinessSummary.length > 600 ? '…' : ''}
              </p>
              {d.sector && (
                <div style={{ display: 'flex', gap: 24, marginTop: 14, fontSize: 12 }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Sector: </span><span style={{ color: 'var(--text)' }}>{d.sector}</span></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Industry: </span><span style={{ color: 'var(--text)' }}>{d.industry}</span></div>
                  {d.fullTimeEmployees && <div><span style={{ color: 'var(--text-muted)' }}>Employees: </span><span style={{ color: 'var(--text)' }}>{d.fullTimeEmployees?.toLocaleString()}</span></div>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Key stats table */}
        <div className="section-card">
          <div className="section-header">Key Statistics</div>
          <table className="data-table">
            <tbody>
              {keyStats.map(([label, value]) => (
                <tr key={label}>
                  <td style={{ color: 'var(--text-secondary)' }}>{label}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right col — news */}
      <div>
        <div className="section-card">
          <div className="section-header">Recent News</div>
          {newsLoading ? (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 60, borderRadius: 6 }} />
              ))}
            </div>
          ) : news.length === 0 ? (
            <div style={{ padding: 16, color: 'var(--text-secondary)', fontSize: 13 }}>No news available.</div>
          ) : (
            <div>
              {news.map((item, i) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '12px 20px',
                    borderBottom: i < news.length - 1 ? '1px solid var(--border)' : 'none',
                    textDecoration: 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {item.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt=""
                      style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4, marginBottom: 4 }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {item.publisher} · {item.publishedAt ? new Date(item.publishedAt * 1000).toLocaleDateString() : ''}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
