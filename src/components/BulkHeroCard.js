import React from 'react';
import HeroPortrait from '../heroRender/HeroPortrait';
import honkLogo from '../assets/images/honk/honkCoin.webp';

const BulkHeroCard = ({
  bulkListing,
  formatPrice,
  onBuyBulkListing,
  onCancelBulkListing,
  isBuyPage = false,
  pendingCancellations,
  isConnected,
  onClick,
}) => {
  const handleCancelBulk = () => {
    if (onCancelBulkListing) {
      onCancelBulkListing(bulkListing.bulkListingId, bulkListing.heroes);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(bulkListing);
    }
  };

  const isCancelling = pendingCancellations?.has(bulkListing.bulkListingId);
  const isPendingCreate = !!bulkListing.isPending;



  return (
    <div
      className={`bulk-hero-card bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors ${isBuyPage ? 'cursor-pointer' : ''} relative`}
      onClick={isBuyPage ? handleCardClick : undefined}
    >
      {/* Private listing indicator */}
      {(bulkListing.isPrivate || (bulkListing.allowedBuyer && bulkListing.allowedBuyer !== '0x0000000000000000000000000000000000000000')) && (
        <div 
          className="private-indicator absolute top-2 right-2 bg-gray-200 text-purple-700 rounded-full p-1 shadow-lg" 
          title={isBuyPage 
            ? `Private listing by: ${bulkListing.owner || 'Unknown'}`
            : bulkListing.allowedBuyer ? `Private listing for: ${bulkListing.allowedBuyer}` : 'Private listing'
          }
        >
          <span>🔒</span>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          Bulk Listing #{bulkListing.bulkListingId}
          {isPendingCreate && (
            <span className="inline-flex items-center text-yellow-300 text-xs" title="Finalizing bulk listing">
              <span className="animate-spin rounded-full h-3 w-3 border-2 border-yellow-300 border-t-transparent mr-1"></span>
              Finalizing
            </span>
          )}
        </h3>
        <div className="text-sm text-gray-400">{bulkListing.heroCount} heroes</div>
      </div>

      {/* Hero thumbnails grid */}
      <div className="hero-thumbnails mb-4">
        <div className="grid grid-cols-4 gap-1">
          {bulkListing.heroes.slice(0, 8).map((hero, index) => (
            <div key={hero.id} className="relative w-12 h-12 rounded border overflow-hidden">
              <HeroPortrait hero={hero} />
            </div>
          ))}
          {bulkListing.heroes.length > 8 && (
            <div className="w-12 h-12 rounded border bg-gray-800 flex items-center justify-center text-white text-xs">
              +{bulkListing.heroes.length - 8}
            </div>
          )}
        </div>
      </div>

      {/* Bulk details */}
      <div className="bulk-details mb-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Classes:</span>
          <span className="text-white text-right">
            {(() => {
              const allClasses = [...new Set(bulkListing.heroes.map((h) => h.mainClass))];
              const displayClasses = allClasses.slice(0, 3);
              const hasMore = allClasses.length > 3;
              return (
                <span
                  title={
                    hasMore ? `All classes: ${allClasses.join(', ')}` : displayClasses.join(', ')
                  }
                >
                  {displayClasses.join(', ')}
                  {hasMore ? '...' : ''}
                </span>
              );
            })()}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Levels:</span>
          <span className="text-white">
            {Math.min(...bulkListing.heroes.map((h) => h.level || 1))} -{' '}
            {Math.max(...bulkListing.heroes.map((h) => h.level || 1))}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Rarities:</span>
          <span className="text-white text-right">
            {(() => {
              // Define rarity order (highest to lowest)
              const rarityOrder = { mythic: 5, legendary: 4, rare: 3, uncommon: 2, common: 1 };
              const allRarities = [...new Set(bulkListing.heroes.map((h) => h.rarity))];

              // Sort rarities by priority (highest first)
              const sortedRarities = allRarities.sort((a, b) => {
                const aValue = rarityOrder[a?.toLowerCase()] || 0;
                const bValue = rarityOrder[b?.toLowerCase()] || 0;
                return bValue - aValue;
              });

              const displayRarities = sortedRarities.slice(0, 3);
              const hasMore = sortedRarities.length > 3;

              return (
                <span
                  title={
                    hasMore
                      ? `All rarities: ${sortedRarities.join(', ')}`
                      : displayRarities.join(', ')
                  }
                >
                  {displayRarities.join(', ')}
                  {hasMore ? '...' : ''}
                </span>
              );
            })()}
          </span>
        </div>
      </div>

      {/* Price section - Only show total price */}
      <div className="price-section mb-4 bg-gray-800 rounded p-3">
        <div className="flex items-center justify-center mb-1">
          <img src={honkLogo} alt="HONK" className="w-6 h-6 mr-2" />
          <span className="text-2xl font-bold text-white">
            {bulkListing.totalPrice.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="text-xs text-gray-400 text-center">
          Total for {bulkListing.heroCount} heroes
        </div>
      </div>

      {/* Action buttons */}
      <div className="action-buttons">
        {isBuyPage ? (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click when clicking button
              handleCardClick();
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            View Details
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onBuyBulkListing) {
                  onBuyBulkListing(bulkListing.bulkListingId);
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              View Details
            </button>
            <button
              onClick={handleCancelBulk}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isPendingCreate || isCancelling}
            >
              {isCancelling ? 'Cancelling...' : isPendingCreate ? 'Finalizing…' : 'Cancel Bulk Listing'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkHeroCard;
