import React, { useEffect, useState } from 'react';
import { getFinancials } from '../../api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function fmtPct(n) {
  if (n == null) return '—';
  return `${n.toFixed(2)}%`;
}

function fmtNum(n) {
  if (n == null) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${n < 0 ? '-' : ''}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${n < 0 ? '-' : ''}$${(abs / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtVal(n, suffix = '') {
  if (n == null) return '—';
  return `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function MetricCard({ label, value, color }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '14px 16px',
      minWidth: 0,
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || 'var(--text)' }}>
        {value}
      </div>
    </div>
  );
}

function TrendChart({ title, series, valueLabel, formatFn }) {
  // series: [{period, value}] — reverse so oldest is first
  const chartData = (series || []).slice(0, 10).reverse().map(entry => ({
    period: fmtDate(entry.period),
    value: entry.value,
  })).filter(d => d.value != null);

  if (chartData.length === 0) return null;

  return (
    <div className="section-card" style={{ padding: '16px 20px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        {title}
      </div>
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid vertical={false} stroke="#1e1e1e" />
            <XAxis dataKey="period" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => formatFn ? formatFn(v) : `${v.toFixed(1)}%`} />
            <Tooltip
              contentStyle={{ background: '#161616', border: '1px solid #2e2e2e', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#999' }}
              formatter={(v) => [formatFn ? formatFn(v) : `${v.toFixed(2)}%`, valueLabel || 'Value']}
            />
            <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MultiLineChart({ title, lines, formatFn }) {
  // lines: [{ key, label, color, data: [{period, value}] }]
  // Merge all lines' data by period
  const periodMap = {};
  lines.forEach(line => {
    (line.data || []).slice(0, 10).forEach(entry => {
      if (!periodMap[entry.period]) periodMap[entry.period] = { period: entry.period };
      periodMap[entry.period][line.key] = entry.value;
    });
  });

  const chartData = Object.values(periodMap)
    .sort((a, b) => a.period.localeCompare(b.period))
    .map(d => ({ ...d, periodLabel: fmtDate(d.period) }));

  if (chartData.length === 0) return null;

  const COLORS = ['#00ff88', '#4a9eff', '#f5a623', '#ff6b6b', '#c084fc', '#38bdf8'];

  return (
    <div className="section-card" style={{ padding: '16px 20px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        {title}
      </div>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid vertical={false} stroke="#1e1e1e" />
            <XAxis dataKey="periodLabel" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => formatFn ? formatFn(v) : `${v.toFixed(1)}%`} />
            <Tooltip
              contentStyle={{ background: '#161616', border: '1px solid #2e2e2e', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#999' }}
              formatter={(v, name) => {
                const line = lines.find(l => l.key === name);
                return [formatFn ? formatFn(v) : `${v?.toFixed(2)}%`, line?.label || name];
              }}
            />
            {lines.map((line, i) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                stroke={line.color || COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ fill: line.color || COLORS[i % COLORS.length], r: 2 }}
                activeDot={{ r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
        {lines.map((line, i) => (
          <span key={line.key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-secondary)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: line.color || COLORS[i % COLORS.length], display: 'inline-block' }} />
            {line.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function EPSChart({ data }) {
  const chartData = (data || []).slice(0, 10).reverse().map(entry => ({
    period: fmtDate(entry.period),
    eps: entry.value,
  })).filter(d => d.eps != null);

  if (chartData.length === 0) return null;

  return (
    <div className="section-card" style={{ padding: '16px 20px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        Earnings Per Share (Annual)
      </div>
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={2}>
            <CartesianGrid vertical={false} stroke="#1e1e1e" />
            <XAxis dataKey="period" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toFixed(1)}`} />
            <Tooltip
              contentStyle={{ background: '#161616', border: '1px solid #2e2e2e', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#999' }}
              formatter={(v) => [`$${v.toFixed(2)}`, 'EPS']}
            />
            <Bar dataKey="eps" fill="rgba(0,255,136,0.7)" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function FinancialsTab({ ticker }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [tab,     setTab]     = useState('overview');

  useEffect(() => {
    setLoading(true);
    getFinancials(ticker)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 40 }}>
    {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-lg)' }} />)}
  </div>;

  if (error) return <div style={{ color: 'var(--text-secondary)', padding: '20px 0', fontSize: 13 }}>{error}</div>;
  if (!data)  return null;

  const cm = data.currentMetrics || {};

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Tab controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          ['overview',      'Overview'],
          ['profitability', 'Profitability'],
          ['valuation',     'Valuation'],
          ['leverage',      'Leverage'],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            background: tab === id ? 'var(--accent-dim)' : 'var(--surface)',
            border: `1px solid ${tab === id ? 'rgba(0,255,136,0.2)' : 'var(--border)'}`,
            color: tab === id ? 'var(--accent)' : 'var(--text-secondary)',
            borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: tab === id ? 600 : 400,
          }}>{label}</button>
        ))}
      </div>

      {/* Overview tab — key metrics grid */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Key metrics cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            <MetricCard label="P/E Ratio" value={fmtVal(cm.peRatio, 'x')} />
            <MetricCard label="EPS (TTM)" value={cm.epsTTM != null ? `$${cm.epsTTM.toFixed(2)}` : '—'} />
            <MetricCard label="P/S Ratio" value={fmtVal(cm.psRatio, 'x')} />
            <MetricCard label="P/B Ratio" value={fmtVal(cm.pbRatio, 'x')} />
            <MetricCard label="Beta" value={fmtVal(cm.beta)} />
            <MetricCard label="Dividend Yield" value={cm.dividendYield != null ? fmtPct(cm.dividendYield) : '—'} />
            <MetricCard label="Gross Margin" value={cm.grossMarginTTM != null ? fmtPct(cm.grossMarginTTM) : '—'} color={cm.grossMarginTTM > 0 ? 'var(--accent)' : 'var(--red)'} />
            <MetricCard label="Net Margin" value={cm.netMarginTTM != null ? fmtPct(cm.netMarginTTM) : '—'} color={cm.netMarginTTM > 0 ? 'var(--accent)' : 'var(--red)'} />
            <MetricCard label="ROE (TTM)" value={cm.roeTTM != null ? fmtPct(cm.roeTTM) : '—'} color={cm.roeTTM > 0 ? 'var(--accent)' : 'var(--red)'} />
            <MetricCard label="ROA (TTM)" value={cm.roaTTM != null ? fmtPct(cm.roaTTM) : '—'} color={cm.roaTTM > 0 ? 'var(--accent)' : 'var(--red)'} />
            <MetricCard label="Revenue Growth" value={cm.revenueGrowthTTM != null ? fmtPct(cm.revenueGrowthTTM) : '—'} color={cm.revenueGrowthTTM > 0 ? 'var(--accent)' : 'var(--red)'} />
            <MetricCard label="Current Ratio" value={fmtVal(cm.currentRatio, 'x')} />
            <MetricCard label="Debt/Equity" value={fmtVal(cm.debtToEquity, 'x')} />
            <MetricCard label="EPS Growth (5Y)" value={cm.epsGrowth5Y != null ? fmtPct(cm.epsGrowth5Y) : '—'} color={cm.epsGrowth5Y > 0 ? 'var(--accent)' : 'var(--red)'} />
            <MetricCard label="52W High" value={cm['52WeekHigh'] != null ? `$${cm['52WeekHigh'].toFixed(2)}` : '—'} />
            <MetricCard label="52W Low" value={cm['52WeekLow'] != null ? `$${cm['52WeekLow'].toFixed(2)}` : '—'} />
          </div>

          {/* EPS chart */}
          <EPSChart data={data.valuation?.eps} />
        </div>
      )}

      {/* Profitability tab */}
      {tab === 'profitability' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Current snapshot */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            <MetricCard label="Gross Margin (TTM)" value={cm.grossMarginTTM != null ? fmtPct(cm.grossMarginTTM) : '—'} color={cm.grossMarginTTM > 0 ? 'var(--accent)' : 'var(--red)'} />
            <MetricCard label="Operating Margin" value={cm.operatingMarginTTM != null ? fmtPct(cm.operatingMarginTTM) : '—'} color={cm.operatingMarginTTM > 0 ? 'var(--accent)' : 'var(--red)'} />
            <MetricCard label="Net Margin (TTM)" value={cm.netMarginTTM != null ? fmtPct(cm.netMarginTTM) : '—'} color={cm.netMarginTTM > 0 ? 'var(--accent)' : 'var(--red)'} />
            <MetricCard label="ROE (TTM)" value={cm.roeTTM != null ? fmtPct(cm.roeTTM) : '—'} color={cm.roeTTM > 0 ? 'var(--accent)' : 'var(--red)'} />
            <MetricCard label="ROA (TTM)" value={cm.roaTTM != null ? fmtPct(cm.roaTTM) : '—'} color={cm.roaTTM > 0 ? 'var(--accent)' : 'var(--red)'} />
            <MetricCard label="ROIC (TTM)" value={cm.roicTTM != null ? fmtPct(cm.roicTTM) : '—'} color={cm.roicTTM > 0 ? 'var(--accent)' : 'var(--red)'} />
          </div>

          {/* Margin trends over time */}
          <MultiLineChart
            title="Margin Trends (Annual)"
            lines={[
              { key: 'grossMargin', label: 'Gross Margin', color: '#00ff88', data: data.profitability?.grossMargin || [] },
              { key: 'operatingMargin', label: 'Operating Margin', color: '#4a9eff', data: data.profitability?.operatingMargin || [] },
              { key: 'netMargin', label: 'Net Margin', color: '#f5a623', data: data.profitability?.netMargin || [] },
            ]}
          />

          {/* ROE/ROA trends */}
          <MultiLineChart
            title="Return on Capital (Annual)"
            lines={[
              { key: 'roe', label: 'ROE', color: '#00ff88', data: data.profitability?.roe || [] },
              { key: 'roa', label: 'ROA', color: '#4a9eff', data: data.profitability?.roa || [] },
              { key: 'roic', label: 'ROIC', color: '#f5a623', data: data.profitability?.roic || [] },
            ]}
          />
        </div>
      )}

      {/* Valuation tab */}
      {tab === 'valuation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            <MetricCard label="P/E Ratio" value={fmtVal(cm.peRatio, 'x')} />
            <MetricCard label="P/S Ratio" value={fmtVal(cm.psRatio, 'x')} />
            <MetricCard label="P/B Ratio" value={fmtVal(cm.pbRatio, 'x')} />
            <MetricCard label="EV/EBITDA" value={fmtVal(cm.evToEbitda, 'x')} />
            <MetricCard label="EV/Revenue" value={fmtVal(cm.evToRevenue, 'x')} />
            <MetricCard label="EPS (TTM)" value={cm.epsTTM != null ? `$${cm.epsTTM.toFixed(2)}` : '—'} />
          </div>

          {/* P/E trend */}
          <TrendChart
            title="P/E Ratio (Annual)"
            series={data.valuation?.pe}
            valueLabel="P/E"
            formatFn={v => `${v.toFixed(1)}x`}
          />

          {/* EPS trend */}
          <EPSChart data={data.valuation?.eps} />

          {/* Book value trend */}
          <TrendChart
            title="Book Value Per Share (Annual)"
            series={data.valuation?.bookValue}
            valueLabel="Book Value"
            formatFn={v => `$${v.toFixed(1)}`}
          />
        </div>
      )}

      {/* Leverage tab */}
      {tab === 'leverage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            <MetricCard label="Current Ratio" value={fmtVal(cm.currentRatio, 'x')} />
            <MetricCard label="Debt/Equity" value={fmtVal(cm.debtToEquity, 'x')} />
            <MetricCard label="Cash Ratio" value={fmtVal(cm.cashRatio, 'x')} />
            <MetricCard label="Payout Ratio" value={cm.payoutRatio != null ? fmtPct(cm.payoutRatio) : '—'} />
            <MetricCard label="Div/Share" value={cm.dividendPerShare != null ? `$${cm.dividendPerShare.toFixed(2)}` : '—'} />
          </div>

          <MultiLineChart
            title="Leverage Trends (Annual)"
            lines={[
              { key: 'currentRatio', label: 'Current Ratio', color: '#00ff88', data: data.leverage?.currentRatio || [] },
              { key: 'totalDebtToEquity', label: 'Debt/Equity', color: '#ff6b6b', data: data.leverage?.totalDebtToEquity || [] },
              { key: 'cashRatio', label: 'Cash Ratio', color: '#4a9eff', data: data.leverage?.cashRatio || [] },
            ]}
            formatFn={v => `${v.toFixed(1)}x`}
          />
        </div>
      )}
    </div>
  );
}
