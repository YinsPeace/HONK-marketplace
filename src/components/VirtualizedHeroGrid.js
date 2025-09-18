import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import HeroCard from './HeroCard';
import BulkHeroCard from './BulkHeroCard';
import './styles/VirtualizedGrid.css';

const HERO_CARD_HEIGHT = 650; // Further increased to ensure buttons are visible
const HERO_CARD_WIDTH = 300;
const GRID_GAP = 24;
const MINIMUM_COLUMNS = 3;

const VirtualizedHeroGrid = ({
  heroes,
  isBuyPage,
  honkLogo,
  onList,
  onCancelListing,
  onUpdatePrice,
  onBuyHero,
  formatPrice,
  lastHeroRef,
  isConnected,
  purchasedHeroes,
  listedHeroes,
  pendingTransactions,
  pendingCancellations,
  pendingPriceUpdates,
  // Bulk listing props
  isBulkMode,
  selectedHeroes,
  onToggleSelection,
  onBuyBulkListing,
  onCancelBulkListing,
  onBulkListingClick,
}) => {
  const parentRef = useRef(null);
  const [columnCount, setColumnCount] = useState(MINIMUM_COLUMNS);
  const [totalHeight, setTotalHeight] = useState(0);
  const [renderStats, setRenderStats] = useState({
    visibleItems: 0,
    totalItems: heroes.length,
    renderTime: 0,
  });

  // Calculate number of columns based on container width
  const calculateColumns = useCallback(() => {
    if (parentRef.current) {
      const containerWidth = parentRef.current.offsetWidth - 32; // Account for padding
      const newColumnCount = Math.max(
        MINIMUM_COLUMNS,
        Math.floor((containerWidth + GRID_GAP) / (HERO_CARD_WIDTH + GRID_GAP))
      );
      setColumnCount(newColumnCount);
    }
  }, []);

  useEffect(() => {
    calculateColumns();
    const resizeObserver = new ResizeObserver(calculateColumns);
    if (parentRef.current) {
      resizeObserver.observe(parentRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [calculateColumns]);

  // Calculate total rows needed
  const rowCount = Math.ceil(heroes.length / columnCount);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => HERO_CARD_HEIGHT,
    overscan: 3,
    onChange: (instance) => {
      const virtualItems = instance.getVirtualItems();
      const lastItem = virtualItems[virtualItems.length - 1];

      // If we're near the end, call the lastHeroRef
      if (lastItem && lastItem.index === rowCount - 1 && lastHeroRef) {
        const lastHeroElement = document.querySelector(
          `[data-hero-id="${heroes[heroes.length - 1].id}"]`
        );
        if (lastHeroElement) {
          lastHeroRef(lastHeroElement);
        }
      }

      setRenderStats((prev) => ({
        ...prev,
        visibleItems: virtualItems.length * columnCount,
      }));
    },
  });

  // Update total height when row count or column count changes
  useEffect(() => {
    setTotalHeight(rowCount * HERO_CARD_HEIGHT);
  }, [rowCount]);

  return (
    <div ref={parentRef} className="virtualized-grid-container">
      <div
        className="virtualized-grid-content"
        style={{
          height: `${totalHeight}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const rowStartIndex = virtualRow.index * columnCount;
          const rowHeroes = heroes.slice(rowStartIndex, rowStartIndex + columnCount);

          return (
            <div
              key={virtualRow.index}
              data-index={virtualRow.index}
              className="virtualized-grid-row"
              style={{
                height: `${HERO_CARD_HEIGHT}px`,
                transform: `translateX(-50%) translateY(${virtualRow.start}px)`,
              }}
            >
              {rowHeroes.map((hero) => (
                <div
                  key={hero.id}
                  className="hero-card-wrapper"
                  data-hero-id={hero.id}
                  style={{
                    height: `${HERO_CARD_HEIGHT}px`,
                    marginBottom: '20px', // Add some margin between rows
                  }}
                >
                  {hero.isBulkListing ? (
                    <BulkHeroCard
                      bulkListing={hero}
                      formatPrice={formatPrice}
                      onBuyBulkListing={onBuyBulkListing}
                      onCancelBulkListing={onCancelBulkListing}
                      isBuyPage={isBuyPage}
                      pendingCancellations={pendingCancellations}
                      isConnected={isConnected}
                      onClick={onBulkListingClick}
                    />
                  ) : (
                    <HeroCard
                      hero={hero}
                      isBuyPage={isBuyPage}
                      honkLogo={honkLogo}
                      onList={onList}
                      onCancelListing={onCancelListing}
                      onUpdatePrice={onUpdatePrice}
                      onBuyHero={onBuyHero}
                      formatPrice={formatPrice}
                      purchasedHeroes={purchasedHeroes}
                      listedHeroes={listedHeroes}
                      pendingTransactions={pendingTransactions}
                      pendingCancellations={pendingCancellations}
                      pendingPriceUpdates={pendingPriceUpdates}
                      isBulkMode={isBulkMode}
                      selectedHeroes={selectedHeroes}
                      onToggleSelection={onToggleSelection}
                      isConnected={isConnected}
                    />
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(VirtualizedHeroGrid);
