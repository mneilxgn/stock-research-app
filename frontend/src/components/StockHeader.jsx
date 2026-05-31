import React from 'react';

function fmt(n, digits = 2) {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtPct(n) {
  if (n == null) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${(n * 1).toFixed(2)}%`;
}

export default function StockHeader({ data, loading, error }) {
  if (error) {
    return (
      <div style={{ padding: '32px 0', color: 'var(--red)', fontSize: 14 }}>
        Could not load stock: {error}
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div style={{ padding: '28px 0 24px' }}>
        <div className="skeleton" style={{ width: 180, height: 18, marginBottom: 10 }} />
        <div className="skeleton" style={{ width: 120, height: 40, marginBottom: 10 }} />
        <div className="skeleton" style={{ width: 220, height: 14 }} />
      </div>
    );
  }

  const isUp = data.regularMarketChange >= 0;
  const color = isUp ? 'var(--accent)' : 'var(--red)';

  return (
    <div style={{ padding: '28px 0 24px' }} className="fade-in">
      {/* Company name + exchange */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
          {data.symbol}
        </span>
        <span style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 4,
          padding: '1px 6px',
        }}>
          {data.exchange}
        </span>
        {data.currency && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{data.currency}</span>
        )}
      </div>

      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
        {data.longName}
      </div>

      {/* Price row */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)' }}>
          {fmt(data.regularMarketPrice)}
        </span>
        <span style={{ fontSize: 18, fontWeight: 600, color }}>
          {data.regularMarketChange >= 0 ? '+' : ''}{fmt(data.regularMarketChange)}
        </span>
        <span style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'white',
          background: isUp ? 'rgba(0,255,136,0.12)' : 'rgba(255,69,69,0.12)',
          border: `1px solid ${isUp ? 'rgba(0,255,136,0.2)' : 'rgba(255,69,69,0.2)'}`,
          borderRadius: 6,
          padding: '3px 8px',
        }}>
          {fmtPct(data.regularMarketChangePercent)}
        </span>
      </div>

      {/* Pre/post market */}
      {(data.preMarketPrice || data.postMarketPrice) && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 16 }}>
          {data.preMarketPrice && (
            <span>
              Pre-market: <strong style={{ color: data.preMarketChange >= 0 ? 'var(--accent)' : 'var(--red)' }}>
                {fmt(data.preMarketPrice)} ({fmtPct(data.preMarketChangePercent)})
              </strong>
            </span>
          )}
          {data.postMarketPrice && (
            <span>
              After-hours: <strong style={{ color: data.postMarketChange >= 0 ? 'var(--accent)' : 'var(--red)' }}>
                {fmt(data.postMarketPrice)} ({fmtPct(data.postMarketChangePercent)})
              </strong>
            </span>
          )}
        </div>
      )}

      {/* Quick stats row */}
      <div style={{
        display: 'flex',
        gap: 24,
        marginTop: 20,
        paddingTop: 16,
        borderTop: '1px solid var(--border)',
        flexWrap: 'wrap',
        fontSize: 12,
        color: 'var(--text-secondary)',
      }}>
        {[
          ['Open',          fmt(data.regularMarketOpen)],
          ['Prev Close',    fmt(data.regularMarketPreviousClose)],
          ['Day Range',     `${fmt(data.regularMarketDayLow)} – ${fmt(data.regularMarketDayHigh)}`],
          ['52W Range',     `${fmt(data.fiftyTwoWeekLow)} – ${fmt(data.fiftyTwoWeekHigh)}`],
          ['Volume',        data.regularMarketVolume?.toLocaleString() ?? '—'],
          ['Avg Volume',    data.averageDailyVolume3Month?.toLocaleString() ?? '—'],
          ['Market Cap',    formatMarketCap(data.marketCap)],
        ].map(([label, value]) => (
          <div key={label}>
            <div style={{ marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10 }}>{label}</div>
            <div style={{ color: 'var(--text)', fontWeight: 500 }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatMarketCap(n) {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}
