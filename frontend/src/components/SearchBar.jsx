import React, { useState, useEffect, useRef } from 'react';
import { searchStocks } from '../api';

export default function SearchBar({ onSelect, autoFocus, compact }) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [focused, setFocused]   = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const debounceRef = useRef(null);
  const inputRef    = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchStocks(query);
        setResults(data.quotes || []);
        setHighlight(-1);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 220);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function select(symbol) {
    setQuery('');
    setResults([]);
    setFocused(false);
    onSelect(symbol);
  }

  function onKeyDown(e) {
    if (!results.length) return;
    if (e.key === 'ArrowDown')  { e.preventDefault(); setHighlight(h => Math.min(h + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); }
    if (e.key === 'Enter' && highlight >= 0) select(results[highlight].symbol);
    if (e.key === 'Escape')     { setResults([]); setFocused(false); }
  }

  const showDropdown = focused && (results.length > 0 || loading);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--surface)',
        border: `1px solid ${focused ? 'var(--border-bright)' : 'var(--border)'}`,
        borderRadius: compact ? 'var(--radius)' : 'var(--radius-lg)',
        padding: compact ? '6px 12px' : '12px 16px',
        gap: 10,
        transition: 'border-color 0.15s',
      }}>
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
          <path d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-.889 3.32 2.558 2.559a.5.5 0 0 1-.707.707L8.404 9.527A4.5 4.5 0 1 1 9.111 9.82Z" fill="currentColor"/>
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={onKeyDown}
          placeholder={compact ? 'Search stocks...' : 'Search any stock — AAPL, Tesla, Shopify...'}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            color: 'var(--text)',
            fontSize: compact ? 13 : 15,
            fontFamily: 'inherit',
          }}
        />
        {loading && (
          <div style={{
            width: 14, height: 14, border: '2px solid var(--border-bright)',
            borderTopColor: 'var(--accent)', borderRadius: '50%',
            animation: 'spin 0.7s linear infinite', flexShrink: 0,
          }} />
        )}
      </div>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0, right: 0,
          background: 'var(--surface)',
          border: '1px solid var(--border-bright)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          zIndex: 200,
          boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
        }}>
          {results.map((r, i) => (
            <div
              key={r.symbol}
              onMouseDown={() => select(r.symbol)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 16px',
                cursor: 'pointer',
                background: highlight === i ? 'var(--surface-2)' : 'transparent',
                borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
                gap: 12,
              }}
              onMouseEnter={() => setHighlight(i)}
            >
              <div style={{
                background: 'var(--surface-3)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '3px 7px',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text)',
                minWidth: 52,
                textAlign: 'center',
                flexShrink: 0,
              }}>
                {r.symbol}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.shortname}
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                {r.exchange}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
