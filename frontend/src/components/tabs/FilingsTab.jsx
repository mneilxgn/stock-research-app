import React, { useEffect, useState } from 'react';
import { getFilings } from '../../api';

const FORM_DESCRIPTIONS = {
  '10-K':  'Annual Report',
  '10-Q':  'Quarterly Report',
  '8-K':   'Current Report',
  'DEF 14A': 'Proxy Statement',
  'S-1':   'IPO Registration',
};

const FORM_COLORS = {
  '10-K': 'rgba(0,255,136,0.12)',
  '10-Q': 'rgba(74,158,255,0.12)',
  '8-K':  'rgba(245,166,35,0.12)',
};

const FORM_TEXT_COLORS = {
  '10-K': '#00ff88',
  '10-Q': '#4a9eff',
  '8-K':  '#f5a623',
};

export default function FilingsTab({ ticker }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filter,  setFilter]  = useState('All');

  useEffect(() => {
    setLoading(true);
    getFilings(ticker)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 40 }}>
      {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 'var(--radius)' }} />)}
    </div>
  );

  if (error)  return <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{error}</div>;
  if (!data)   return null;

  const filings = data.filings || [];

  if (filings.length === 0) {
    return (
      <div style={{ color: 'var(--text-secondary)', fontSize: 13, padding: '20px 0' }}>
        {data.message || 'No SEC filings found for this ticker.'}
      </div>
    );
  }

  const formTypes = ['All', ...new Set(filings.map(f => f.form))];
  const visible   = filter === 'All' ? filings : filings.filter(f => f.form === filter);

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {formTypes.map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            style={{
              background: filter === type
                ? (FORM_COLORS[type] || 'var(--surface-2)')
                : 'var(--surface)',
              border: `1px solid ${filter === type ? 'var(--border-bright)' : 'var(--border)'}`,
              color: filter === type
                ? (FORM_TEXT_COLORS[type] || 'var(--text)')
                : 'var(--text-secondary)',
              borderRadius: 6,
              padding: '5px 12px',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: filter === type ? 600 : 400,
            }}
          >
            {type}
          </button>
        ))}
        {data.companyName && (
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>
            {data.companyName} · CIK {data.cik}
          </span>
        )}
      </div>

      {/* Filings list */}
      <div className="section-card">
        {visible.map((filing, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '14px 20px',
              borderBottom: i < visible.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            {/* Form badge */}
            <div style={{
              background: FORM_COLORS[filing.form] || 'var(--surface-2)',
              color: FORM_TEXT_COLORS[filing.form] || 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: 11,
              borderRadius: 5,
              padding: '3px 8px',
              minWidth: 40,
              textAlign: 'center',
              flexShrink: 0,
            }}>
              {filing.form}
            </div>

            {/* Description + date */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                {FORM_DESCRIPTIONS[filing.form] || filing.form}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Filed: {filing.date}
              </div>
            </div>

            {/* Links */}
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              <a
                href={filing.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12,
                  color: 'var(--accent)',
                  background: 'var(--accent-dim)',
                  border: '1px solid rgba(0,255,136,0.15)',
                  borderRadius: 5,
                  padding: '4px 10px',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-glow)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-dim)'}
              >
                View Filing ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
