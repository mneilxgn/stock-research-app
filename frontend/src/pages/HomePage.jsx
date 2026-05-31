import React from 'react';
import SearchBar from '../components/SearchBar';
import DailyPicks from '../components/DailyPicks';

export default function HomePage({ onSelectStock }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        height: 56,
      }}>
        <span style={{
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--text)',
        }}>
          Equity<span style={{ color: 'var(--accent)' }}>Lens</span>
        </span>
      </div>

      {/* Hero search */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '80px 24px 60px',
      }}>
        <p style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          marginBottom: 16,
        }}>
          Real-time stock analysis
        </p>
        <h1 style={{
          fontSize: 40,
          fontWeight: 700,
          letterSpacing: '-0.03em',
          color: 'var(--text)',
          marginBottom: 8,
          textAlign: 'center',
        }}>
          Know your stocks.
        </h1>
        <p style={{
          fontSize: 16,
          color: 'var(--text-secondary)',
          marginBottom: 40,
          textAlign: 'center',
        }}>
          Live data, AI analysis, and daily picks — all in one place.
        </p>

        <div style={{ width: '100%', maxWidth: 560 }}>
          <SearchBar onSelect={onSelectStock} autoFocus />
        </div>
      </div>

      {/* Daily picks */}
      <div style={{ padding: '0 32px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <DailyPicks onSelect={onSelectStock} />
      </div>
    </div>
  );
}
