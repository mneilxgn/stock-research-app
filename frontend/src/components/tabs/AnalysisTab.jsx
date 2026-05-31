import React, { useEffect, useState, useRef } from 'react';
import { getAnalysis } from '../../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

function fmt(n, digits = 2) {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(typeof d === 'number' ? d * 1000 : d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

// 52-week price range visualization
function PriceRangeBar({ low52, high52, current, lowDate, highDate }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (!low52 || !high52 || !current) return null;

  const range = high52 - low52;
  if (range <= 0) return null;
  const position = ((current - low52) / range) * 100;
  const clampedPos = Math.min(Math.max(position, 0), 100);

  return (
    <div style={{ margin: '20px 0' }}>
      {/* Bar */}
      <div style={{ position: 'relative', height: 8, background: 'var(--surface-3)', borderRadius: 4 }}>
        {/* Filled portion from low to current */}
        <div style={{
          position: 'absolute',
          left: 0,
          width: `${animated ? clampedPos : 0}%`,
          height: '100%',
          background: `linear-gradient(90deg, var(--red), var(--accent))`,
          borderRadius: 4,
          transition: animated ? 'width 0.8s ease' : 'none',
          opacity: 0.6,
        }} />

        {/* Current price marker */}
        <div style={{
          position: 'absolute',
          left: `${clampedPos}%`,
          transform: 'translateX(-50%)',
          width: 14, height: 14,
          borderRadius: '50%',
          background: 'var(--accent)',
          top: -3,
          boxShadow: '0 0 8px var(--accent)',
          transition: animated ? 'left 0.8s ease' : 'none',
          border: '2px solid #0a0a0a',
        }} />
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, alignItems: 'flex-start' }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--red)' }}>${fmt(low52)}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>52W Low{lowDate ? ` · ${fmtDate(lowDate)}` : ''}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>${fmt(current)}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Current · {position.toFixed(0)}% of range</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--blue)' }}>${fmt(high52)}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>52W High{highDate ? ` · ${fmtDate(highDate)}` : ''}</div>
        </div>
      </div>
    </div>
  );
}

export default function AnalysisTab({ ticker, stockData }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    getAnalysis(ticker)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 40 }}>
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-lg)' }} />)}
    </div>
  );

  if (error) return <div style={{ color: 'var(--text-secondary)', fontSize: 13, padding: '20px 0' }}>{error}</div>;
  if (!data)  return null;

  const rec = data.recommendations || {};
  const total = (rec.strongBuy + rec.buy + rec.hold + rec.sell + rec.strongSell) || 1;

  const recBars = [
    { label: 'Strong Buy',  value: rec.strongBuy,  color: '#00ff88' },
    { label: 'Buy',         value: rec.buy,        color: '#4aff9a' },
    { label: 'Hold',        value: rec.hold,        color: '#f5a623' },
    { label: 'Sell',        value: rec.sell,        color: '#ff8080' },
    { label: 'Strong Sell', value: rec.strongSell,  color: '#ff4545' },
  ];

  // Calculate consensus label
  const bullish = (rec.strongBuy || 0) + (rec.buy || 0);
  const bearish = (rec.sell || 0) + (rec.strongSell || 0);
  let consensus = 'Hold';
  let consensusColor = '#f5a623';
  if (bullish > bearish + (rec.hold || 0) * 0.5) { consensus = 'Buy'; consensusColor = '#00ff88'; }
  if (bullish > total * 0.6) { consensus = 'Strong Buy'; consensusColor = '#00ff88'; }
  if (bearish > bullish + (rec.hold || 0) * 0.5) { consensus = 'Sell'; consensusColor = '#ff4545'; }

  const earnings = data.earningsHistory || [];
  const earningsChart = earnings.slice(0, 8).reverse().map(e => ({
    period: fmtDate(e.date),
    estimate: e.epsEstimate,
    actual:   e.epsActual,
    surprise: e.surprisePercent,
  }));

  const pr = data.priceRange || {};
  const km = data.keyMetrics || {};

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, paddingBottom: 40 }}>
      {/* Left col */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Analyst Consensus */}
        <div className="section-card">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Analyst Consensus</span>
            <span style={{
              fontSize: 13, fontWeight: 700, color: consensusColor,
              background: `${consensusColor}15`,
              padding: '3px 10px',
              borderRadius: 6,
            }}>
              {consensus}
            </span>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: 8, height: 100, alignItems: 'flex-end', marginBottom: 8 }}>
              {recBars.map(bar => (
                <div key={bar.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{bar.value}</div>
                  <div style={{
                    width: '100%',
                    height: `${(bar.value / Math.max(...recBars.map(b=>b.value||0), 1)) * 80}px`,
                    background: bar.color,
                    borderRadius: '3px 3px 0 0',
                    opacity: 0.8,
                    minHeight: bar.value ? 4 : 0,
                    transition: 'height 0.6s ease',
                  }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {recBars.map(bar => (
                <div key={bar.label} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: 'var(--text-muted)' }}>
                  {bar.label.replace('Strong ', 'Str. ')}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
              {total} analyst{total !== 1 ? 's' : ''} covering this stock
            </div>
          </div>
        </div>

        {/* 52-Week Price Range */}
        <div className="section-card">
          <div className="section-header">52-Week Price Range</div>
          <div style={{ padding: '20px' }}>
            <PriceRangeBar
              low52={pr.week52Low}
              high52={pr.week52High}
              current={pr.current}
              lowDate={pr.week52LowDate}
              highDate={pr.week52HighDate}
            />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="section-card">
          <div className="section-header">Key Metrics</div>
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['P/E Ratio',       km.peRatio != null ? `${km.peRatio.toFixed(1)}x` : '—'],
                ['EPS (TTM)',        km.epsTTM != null ? `$${km.epsTTM.toFixed(2)}` : '—'],
                ['Beta',             km.beta != null ? km.beta.toFixed(2) : '—'],
                ['Dividend Yield',   km.dividendYield != null ? `${km.dividendYield.toFixed(2)}%` : '—'],
                ['Revenue Growth',   km.revenueGrowth != null ? `${km.revenueGrowth.toFixed(1)}%` : '—'],
                ['EPS Growth (5Y)',  km.epsGrowth5Y != null ? `${km.epsGrowth5Y.toFixed(1)}%` : '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right col — EPS chart */}
      <div>
        <div className="section-card">
          <div className="section-header">EPS: Estimate vs Actual</div>
          <div style={{ padding: '20px' }}>
            {earningsChart.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No earnings history available.</div>
            ) : (
              <>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={earningsChart} barGap={3}>
                      <CartesianGrid vertical={false} stroke="#1e1e1e" />
                      <XAxis dataKey="period" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#161616', border: '1px solid #2e2e2e', borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: '#999' }}
                        formatter={(v) => [`$${fmt(v)}`, '']}
                      />
                      <ReferenceLine y={0} stroke="#2e2e2e" />
                      <Bar dataKey="estimate" name="Estimate" fill="rgba(255,255,255,0.15)" radius={[2,2,0,0]} />
                      <Bar dataKey="actual" name="Actual" fill="var(--accent)" radius={[2,2,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(255,255,255,0.15)', display: 'inline-block' }} />Estimate
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent)', display: 'inline-block' }} />Actual
                  </span>
                </div>

                {/* EPS table */}
                <table className="data-table" style={{ marginTop: 20 }}>
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th style={{ textAlign: 'right' }}>Estimate</th>
                      <th style={{ textAlign: 'right' }}>Actual</th>
                      <th style={{ textAlign: 'right' }}>Surprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earningsChart.slice().reverse().slice(0, 6).map((e, i) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--text-secondary)' }}>{e.period}</td>
                        <td style={{ textAlign: 'right' }}>{fmt(e.estimate)}</td>
                        <td style={{ textAlign: 'right' }}>{fmt(e.actual)}</td>
                        <td style={{ textAlign: 'right', color: (e.surprise || 0) >= 0 ? 'var(--accent)' : 'var(--red)' }}>
                          {e.surprise != null ? `${e.surprise >= 0 ? '+' : ''}${(e.surprise * 100).toFixed(1)}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>

        {/* Recommendation History */}
        {data.recommendationHistory?.length > 1 && (
          <div className="section-card" style={{ marginTop: 20 }}>
            <div className="section-header">Recommendation History</div>
            <div style={{ padding: '16px 20px', overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th style={{ textAlign: 'right', color: '#00ff88' }}>Str. Buy</th>
                    <th style={{ textAlign: 'right', color: '#4aff9a' }}>Buy</th>
                    <th style={{ textAlign: 'right', color: '#f5a623' }}>Hold</th>
                    <th style={{ textAlign: 'right', color: '#ff8080' }}>Sell</th>
                    <th style={{ textAlign: 'right', color: '#ff4545' }}>Str. Sell</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recommendationHistory.slice(0, 6).map((r, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--text-secondary)' }}>{fmtDate(r.period)}</td>
                      <td style={{ textAlign: 'right' }}>{r.strongBuy}</td>
                      <td style={{ textAlign: 'right' }}>{r.buy}</td>
                      <td style={{ textAlign: 'right' }}>{r.hold}</td>
                      <td style={{ textAlign: 'right' }}>{r.sell}</td>
                      <td style={{ textAlign: 'right' }}>{r.strongSell}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
