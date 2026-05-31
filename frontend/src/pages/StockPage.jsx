import React, { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import StockHeader from '../components/StockHeader';
import SummaryTab    from '../components/tabs/SummaryTab';
import ChartTab      from '../components/tabs/ChartTab';
import StatisticsTab from '../components/tabs/StatisticsTab';
import FinancialsTab from '../components/tabs/FinancialsTab';
import AnalysisTab   from '../components/tabs/AnalysisTab';
import HoldersTab    from '../components/tabs/HoldersTab';
import FilingsTab    from '../components/tabs/FilingsTab';
import AIOutlookTab  from '../components/tabs/AIOutlookTab';
import { getStock }  from '../api';

const TABS = [
  { id: 'summary',    label: 'Summary'    },
  { id: 'chart',      label: 'Chart'      },
  { id: 'statistics', label: 'Statistics' },
  { id: 'financials', label: 'Financials' },
  { id: 'analysis',   label: 'Analysis'   },
  { id: 'holders',    label: 'Holders'    },
  { id: 'filings',    label: 'Filings'    },
  { id: 'ai',         label: 'AI Outlook' },
];

export default function StockPage({ ticker, onBack, onNavigate }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setStockData(null);
    setActiveTab('summary');
    getStock(ticker)
      .then(setStockData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [ticker]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top nav */}
      <div style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        height: 56,
        position: 'sticky',
        top: 0,
        background: 'var(--bg)',
        zIndex: 100,
      }}>
        <button onClick={onBack} style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: 20,
          lineHeight: 1,
          padding: '0 4px',
          display: 'flex',
          alignItems: 'center',
        }}>←</button>
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', marginRight: 8 }}>
          Equity<span style={{ color: 'var(--accent)' }}>Lens</span>
        </span>
        <div style={{ flex: 1, maxWidth: 400 }}>
          <SearchBar onSelect={onNavigate} compact />
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Stock header */}
        <StockHeader data={stockData} loading={loading} error={error} />

        {/* Tab bar */}
        <div style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid var(--border)',
          marginBottom: 28,
          overflowX: 'auto',
        }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id
                  ? '2px solid var(--accent)'
                  : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--text)' : 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '12px 16px',
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 600 : 400,
                whiteSpace: 'nowrap',
                transition: 'color 0.15s',
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="tab-content" key={activeTab}>
          {activeTab === 'summary'    && <SummaryTab    ticker={ticker} stockData={stockData} />}
          {activeTab === 'chart'      && <ChartTab      ticker={ticker} stockData={stockData} />}
          {activeTab === 'statistics' && <StatisticsTab ticker={ticker} stockData={stockData} />}
          {activeTab === 'financials' && <FinancialsTab ticker={ticker} />}
          {activeTab === 'analysis'   && <AnalysisTab   ticker={ticker} stockData={stockData} />}
          {activeTab === 'holders'    && <HoldersTab    ticker={ticker} />}
          {activeTab === 'filings'    && <FilingsTab    ticker={ticker} />}
          {activeTab === 'ai'         && <AIOutlookTab  ticker={ticker} stockData={stockData} />}
        </div>
      </div>
    </div>
  );
}
