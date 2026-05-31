import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { getChart } from '../../api';

const RANGES = ['1D', '5D', '1M', '3M', '6M', '1Y', '2Y', '5Y', 'MAX'];

export default function ChartTab({ ticker, stockData }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const seriesRef    = useRef(null);
  const volumeRef    = useRef(null);

  const [range,     setRange]     = useState('1Y');
  const [chartType, setChartType] = useState('line');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  // Build chart once
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#111111' },
        textColor:  '#888888',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1e1e1e' },
        horzLines:  { color: '#1e1e1e' },
      },
      crosshair: {
        vertLine: { color: '#2e2e2e', width: 1, style: 1, labelBackgroundColor: '#1c1c1c' },
        horzLine: { color: '#2e2e2e', width: 1, style: 1, labelBackgroundColor: '#1c1c1c' },
      },
      rightPriceScale: {
        borderColor: '#1e1e1e',
        textColor: '#666666',
      },
      timeScale: {
        borderColor: '#1e1e1e',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll:  { mouseWheel: true, pressedMouseMove: true },
      handleScale:   { mouseWheel: true, pinch: true },
    });

    chartRef.current = chart;

    // Resize observer
    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // Load data when range or chartType changes
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;

    setLoading(true);
    setError(null);

    getChart(ticker, range)
      .then(({ data }) => {
        if (!data || data.length === 0) throw new Error('No chart data');

        // Remove old series
        if (seriesRef.current) {
          try { chart.removeSeries(seriesRef.current); } catch {}
          seriesRef.current = null;
        }
        if (volumeRef.current) {
          try { chart.removeSeries(volumeRef.current); } catch {}
          volumeRef.current = null;
        }

        const isUp = data.length >= 2 && data[data.length - 1].close >= data[0].close;
        const upColor   = '#00ff88';
        const downColor = '#ff4545';
        const mainColor = isUp ? upColor : downColor;

        if (chartType === 'candlestick') {
          const series = chart.addCandlestickSeries({
            upColor,
            downColor,
            wickUpColor:   upColor,
            wickDownColor: downColor,
            borderVisible: false,
          });
          series.setData(data.map(d => ({
            time:  d.time,
            open:  d.open,
            high:  d.high,
            low:   d.low,
            close: d.close,
          })));
          seriesRef.current = series;
        } else {
          const series = chart.addAreaSeries({
            lineColor:       mainColor,
            topColor:        `${mainColor}22`,
            bottomColor:     `${mainColor}00`,
            lineWidth:       2,
            crosshairMarkerRadius: 4,
            crosshairMarkerBorderColor: mainColor,
            crosshairMarkerBackgroundColor: '#0a0a0a',
          });
          series.setData(data.map(d => ({ time: d.time, value: d.close })));
          seriesRef.current = series;
        }

        // Volume histogram
        const volumeSeries = chart.addHistogramSeries({
          color: '#2e2e2e',
          priceFormat: { type: 'volume' },
          priceScaleId: 'volume',
        });
        chart.priceScale('volume').applyOptions({
          scaleMargins: { top: 0.85, bottom: 0 },
        });
        volumeSeries.setData(
          data.map(d => ({
            time: d.time,
            value: d.volume,
            color: d.close >= d.open ? 'rgba(0,255,136,0.2)' : 'rgba(255,69,69,0.2)',
          }))
        );
        volumeRef.current = volumeSeries;

        chart.timeScale().fitContent();
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [ticker, range, chartType]);

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Range buttons */}
        <div style={{ display: 'flex', gap: 4 }}>
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                background:   range === r ? 'var(--accent-dim)' : 'none',
                border:       `1px solid ${range === r ? 'rgba(0,255,136,0.2)' : 'transparent'}`,
                color:        range === r ? 'var(--accent)' : 'var(--text-secondary)',
                borderRadius: 6,
                padding:      '5px 10px',
                fontSize:     12,
                fontWeight:   range === r ? 600 : 400,
                cursor:       'pointer',
                fontFamily:   'inherit',
                transition:   'all 0.1s',
              }}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Chart type toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          overflow: 'hidden',
          marginLeft: 'auto',
        }}>
          {['line', 'candlestick'].map(type => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              style={{
                background: chartType === type ? 'var(--surface-2)' : 'transparent',
                border: 'none',
                color: chartType === type ? 'var(--text)' : 'var(--text-secondary)',
                padding: '5px 12px',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textTransform: 'capitalize',
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Chart container */}
      <div style={{ position: 'relative', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--surface)', zIndex: 10,
          }}>
            <div style={{ width: 24, height: 24, border: '2px solid var(--border-bright)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        )}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 360, color: 'var(--text-secondary)', fontSize: 13 }}>
            No chart data available for this range.
          </div>
        )}
        <div ref={containerRef} style={{ width: '100%', height: 420 }} />
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
