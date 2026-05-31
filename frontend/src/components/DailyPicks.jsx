import React, { useEffect, useState, useRef } from 'react';
import { getDailyPicks } from '../api';

function fmt(n) {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function DailyPicks({ onSelect }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const retryRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPicks() {
      try {
        const res = await getDailyPicks();
        if (cancelled) return;

        if (res.loading || (!res.picks?.length && !res.date)) {
          // Backend is still generating — retry in 3s
          retryRef.current = setTimeout(fetchPicks, 3000);
          return;
        }

        setData(res);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        // Network error — retry in 4s
        retryRef.current = setTimeout(fetchPicks, 4000);
      }
    }

    fetchPicks();
    return () => { cancelled = true; clearTimeout(retryRef.current); };
  }, []);

  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--accent)',
              boxShadow: '0 0 8px var(--accent)',
              display: 'inline-block',
            }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              Today's AI Picks
            </h2>
          </div>
          {data?.generatedAt && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, marginLeft: 18 }}>
              Generated {new Date(data.generatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · {data.date}
            </p>
          )}
        </div>
      </div>

      {loading && (
        <>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
            Scanning 25 stocks across tech, biotech, fintech, energy & more...
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        </>
      )}

      {error && (
        <div style={{ color: 'var(--text-secondary)', fontSize: 13, padding: '20px 0' }}>
          Could not load picks — backend may still be starting up.
        </div>
      )}

      {!loading && !error && data?.picks && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {data.picks.map(pick => {
              const isUp = pick.changePercent >= 0;
              return (
                <div
                  key={pick.ticker}
                  onClick={() => onSelect(pick.ticker)}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px 18px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--border-bright)';
                    e.currentTarget.style.background = 'var(--surface-2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.background = 'var(--surface)';
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{pick.ticker}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1, maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pick.name}</div>
                    </div>
                    <ConfidenceBadge level={pick.confidence} />
                  </div>

                  {/* Price row */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>${fmt(pick.price)}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: isUp ? 'var(--accent)' : 'var(--red)' }}>
                      {isUp ? '+' : ''}{pick.changePercent?.toFixed(2)}%
                    </span>
                  </div>

                  {/* Reason */}
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {pick.reason}
                  </p>
                </div>
              );
            })}
          </div>

          <p style={{ marginTop: 16, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            AI-generated stock picks are for informational purposes only and are not financial advice. Past performance does not guarantee future results. Always do your own research before investing.
          </p>
        </>
      )}
    </div>
  );
}

function ConfidenceBadge({ level }) {
  const map = {
    High:        'badge badge-high',
    Medium:      'badge badge-medium',
    Speculative: 'badge badge-speculative',
  };
  return <span className={map[level] || 'badge badge-medium'}>{level || 'Medium'}</span>;
}
