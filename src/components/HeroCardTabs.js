import React from 'react';
import '../components/styles/HeroCardTabs.css';

/**
 * HeroCardTabs component for displaying tab icons on the back of the hero card
 * @param {Object} props - Component props
 * @param {string} props.activeTab - Currently active tab
 * @param {Function} props.onTabChange - Function to call when tab is changed
 */
const HeroCardTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'stats', symbol: '📊', label: 'Stats' },
    { id: 'growth', symbol: '📈', label: 'Growth' },
    { id: 'abilities', symbol: '⚔️', label: 'Abilities' },
    { id: 'recessive1', symbol: '🧬', label: 'Recessive 1' },
    { id: 'recessive2', symbol: '🧬2', label: 'Recessive 2' },
  ];

  return (
    <div className="hero-card-tabs">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`hero-card-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation(); // Stop event propagation to prevent card flip
            onTabChange(tab.id);
          }}
          title={tab.label}
        >
          {tab.id === 'recessive1' ? (
            <span className="tab-symbol tab-symbol-recessive-gene" style={{ color: '#9c27b0' }}>
              🧬
            </span>
          ) : tab.id === 'recessive2' ? (
            <span
              className="tab-symbol tab-symbol-recessive-gene"
              style={{
                color: '#9c27b0',
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'flex-end',
              }}
            >
              🧬
              <span
                style={{
                  fontSize: '9px',
                  color: '#fff',
                  position: 'absolute',
                  left: '60%',
                  fontWeight: 700,
                  pointerEvents: 'none',
                  bottom: '-4px',
                }}
              >
                2
              </span>
            </span>
          ) : (
            <span className="tab-symbol">{tab.symbol}</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default HeroCardTabs;
