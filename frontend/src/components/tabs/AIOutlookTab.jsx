import React, { useEffect, useState, useRef } from 'react';

function fmt(n, digits = 2) {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

// Simple markdown-ish renderer for the streamed response
function FormattedText({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return (
            <h3 key={i} style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '20px 0 8px', letterSpacing: '-0.01em' }}>
              {line.replace('## ', '')}
            </h3>
          );
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <span style={{ color: 'var(--accent)', flexShrink: 0 }}>·</span>
              <span>{line.replace(/^[-•] /, '')}</span>
            </div>
          );
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{line.replace(/\*\*/g, '')}</p>;
        }
        if (line.trim() === '') return <div key={i} style={{ height: 4 }} />;
        // Highlight "Fair Value Range: $X - $Y"
        if (line.includes('Fair Value Range:')) {
          return (
            <p key={i} style={{ marginBottom: 4 }}>
              {line.split(/(Fair Value Range: \$[\d,.]+ ?- ?\$[\d,.]+)/).map((part, j) =>
                j === 1 ? (
                  <strong key={j} style={{ color: 'var(--accent)', fontSize: 15 }}>{part}</strong>
                ) : part
              )}
            </p>
          );
        }
        return <p key={i} style={{ marginBottom: 4 }}>{line}</p>;
      })}
    </div>
  );
}

// Price target visualization bar
function PriceBar({ stockData }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 300); return () => clearTimeout(t); }, []);

  const low52    = stockData?.fiftyTwoWeekLow;
  const high52   = stockData?.fiftyTwoWeekHigh;
  const current  = stockData?.regularMarketPrice;
  const analyst  = stockData?.targetMeanPrice;

  if (!low52 || !high52 || !current) return null;

  const range = high52 - low52;
  const toPos = v => Math.min(Math.max(((v - low52) / range) * 100, 0), 100);

  return (
    <div style={{ margin: '24px 0' }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        52-Week Price Range
      </div>
      <div style={{ position: 'relative', height: 8, background: 'var(--surface-3)', borderRadius: 4 }}>
        {/* Current price dot */}
        <div style={{
          position: 'absolute',
          left: `${toPos(current)}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 14, height: 14,
          borderRadius: '50%',
          background: 'var(--accent)',
          border: '2px solid #0a0a0a',
          boxShadow: '0 0 8px var(--accent)',
          zIndex: 2,
          transition: animated ? 'left 0.8s ease' : 'none',
        }} />
        {/* Analyst target line */}
        {analyst && (
          <div style={{
            position: 'absolute',
            left: `${toPos(analyst)}%`,
            top: -4,
            transform: 'translateX(-50%)',
            width: 2, height: 16,
            background: 'var(--blue)',
            borderRadius: 1,
          }} />
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
        <div>
          <div style={{ color: 'var(--text)', fontWeight: 600 }}>${fmt(low52)}</div>
          <div>52W Low</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 15 }}>${fmt(current)}</div>
          <div>Current</div>
        </div>
        {analyst && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--blue)', fontWeight: 600 }}>${fmt(analyst)}</div>
            <div>Analyst Target</div>
          </div>
        )}
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'var(--text)', fontWeight: 600 }}>${fmt(high52)}</div>
          <div>52W High</div>
        </div>
      </div>
    </div>
  );
}

export default function AIOutlookTab({ ticker, stockData }) {
  const [text,     setText]     = useState('');
  const [loading,  setLoading]  = useState(true);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState(null);
  const esRef = useRef(null);

  useEffect(() => {
    setText('');
    setLoading(true);
    setDone(false);
    setError(null);

    const es = new EventSource(`/api/stock/${ticker}/ai-outlook`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.error) {
          setError(data.error);
          setLoading(false);
          es.close();
          return;
        }
        if (data.done) {
          setDone(true);
          setLoading(false);
          es.close();
          return;
        }
        if (data.content) {
          setLoading(false);
          setText(prev => prev + data.content);
        }
      } catch {}
    };

    es.onerror = () => {
      setError('Connection to AI service failed. Make sure the backend is running.');
      setLoading(false);
      es.close();
    };

    return () => { es.close(); };
  }, [ticker]);

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, rgba(0,255,136,0.15) 0%, rgba(74,158,255,0.15) 100%)',
          border: '1px solid rgba(0,255,136,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
        }}>✦</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>AI Outlook</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Powered by Llama 3 · {ticker}</div>
        </div>
      </div>

      {/* Price bar */}
      <div className="section-card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <PriceBar stockData={stockData} />
      </div>

      {/* AI analysis */}
      <div className="section-card" style={{ padding: '20px' }}>
        {loading && !text && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 13 }}>
            <div style={{ width: 16, height: 16, border: '2px solid var(--border-bright)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
            Analyzing {ticker} financials...
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--red)', fontSize: 13 }}>{error}</div>
        )}

        {text && (
          <>
            <FormattedText text={text} />
            {!done && (
              <span style={{ display: 'inline-block', width: 6, height: 14, background: 'var(--accent)', marginLeft: 4, animation: 'blink 0.8s step-end infinite', verticalAlign: 'middle' }} />
            )}
          </>
        )}
      </div>

      {/* Disclaimer */}
      {done && (
        <div className="disclaimer" style={{ marginTop: 16 }}>
          ⚠ This AI-generated analysis is produced by Llama 3 (70B) via Groq and is for informational purposes only. It is not financial advice, and should not be the sole basis for investment decisions. Always conduct your own due diligence and consult a licensed financial advisor before investing.
        </div>
      )}

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
