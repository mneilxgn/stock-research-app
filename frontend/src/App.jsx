import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import StockPage from './pages/StockPage';

export default function App() {
  const [currentTicker, setCurrentTicker] = useState(null);

  return currentTicker ? (
    <StockPage
      ticker={currentTicker}
      onBack={() => setCurrentTicker(null)}
      onNavigate={setCurrentTicker}
    />
  ) : (
    <HomePage onSelectStock={setCurrentTicker} />
  );
}
