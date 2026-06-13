import React, { useState } from 'react';
import HeroPortrait from '../heroRender/HeroPortrait';
import honkLogo from '../assets/images/honk/honkCoin.webp';
import HeroCard from './HeroCard';

// Helper function to format prices
const formatPrice = (price) => {
  if (price === undefined || price === null) return '';
  return price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const BulkListingDetailModal = ({
  isOpen,
  onClose,
  bulkListing,
  onBuyBulkListing,
  onCancelBulkListing,
  isConnected,
  pendingTransactions,
  honkLogo: honkLogoOverride,
  isSeller = false,
}) => {
  const [selectedTab, setSelectedTab] = useState('overview');

  if (!isOpen || !bulkListing) return null;

  // Add safety checks for bulkListing properties
  const heroes = bulkListing.heroes || [];
  const totalPrice = bulkListing.totalPrice || 0;
  const heroCount = bulkListing.heroCount || heroes.length || 0;
  const avgPrice = heroCount > 0 ? totalPrice / heroCount : 0;

  const handleBuyBulk = () => {
    if (onBuyBulkListing) {
      onBuyBulkListing(bulkListing.bulkListingId);
    }
  };

  const isPending = pendingTransactions?.has(bulkListing.bulkListingId);

  // Group heroes by class for better overview - add safety checks
  const herosByClass = heroes.reduce((acc, hero) => {
    if (!hero) return acc;
    const mainClass = hero.mainClass || hero.class || 'Unknown';
    if (!acc[mainClass]) {
      acc[mainClass] = [];
    }
    acc[mainClass].push(hero);
    return acc;
  }, {});

  // Get rarity distribution with proper sorting - add safety checks
  const rarityDistribution = heroes.reduce((acc, hero) => {
    if (!hero) return acc;
    const rarity = hero.rarity || 'common';
    acc[rarity] = (acc[rarity] || 0) + 1;
    return acc;
  }, {});

  // Sort rarities by priority (highest to lowest)
  const rarityOrder = { mythic: 5, legendary: 4, rare: 3, uncommon: 2, common: 1 };
  const sortedRarityEntries = Object.entries(rarityDistribution).sort(([a], [b]) => {
    const aValue = rarityOrder[a?.toLowerCase()] || 0;
    const bValue = rarityOrder[b?.toLowerCase()] || 0;
    return bValue - aValue;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex justify-center items-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-900 px-6 py-4 flex justify-between items-center border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Bulk Listing #{bulkListing.bulkListingId}
            </h2>
            <p className="text-gray-400">{heroCount} heroes</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2">
                <img src={honkLogoOverride || honkLogo} alt="HONK" className="w-8 h-8" />
                <span className="text-3xl font-bold text-white">
                  {totalPrice.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                ~
                {avgPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}{' '}
                per hero
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl font-bold p-2"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-2 bg-gray-750 border-b border-gray-700">
          <div className="flex space-x-6">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`py-2 px-4 font-medium ${
                selectedTab === 'overview'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedTab('heroes')}
              className={`py-2 px-4 font-medium ${
                selectedTab === 'heroes'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Heroes ({heroCount})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-white mb-3">Price Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Price:</span>
                      <span className="text-white font-bold">
                        {totalPrice.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}{' '}
                        HONK
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Average per Hero:</span>
                      <span className="text-white">
                        {avgPrice.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}{' '}
                        HONK
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Heroes Count:</span>
                      <span className="text-white">{heroCount}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-white mb-3">Class Distribution</h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto bulk-modal-scrollable-content">
                    {Object.entries(herosByClass).map(([className, heroes]) => (
                        <div key={className} className="flex justify-between pr-2">
                          <span className="text-gray-400">{className}:</span>
                          <span className="text-white">{heroes.length}</span>
                        </div>
                      ))}

                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-white mb-3">Rarity Distribution</h3>
                  <div className="space-y-2">
                    {sortedRarityEntries.map(([rarity, count]) => (
                      <div key={rarity} className="flex justify-between">
                        <span className="text-gray-400 capitalize">{rarity}:</span>
                        <span className="text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hero Preview Grid */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-3">Hero Preview</h3>
                <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                  {heroes.map((hero, index) => {
                    // Get rarity border color
                    const getRarityBorderColor = (rarity) => {
                      const rarityColors = {
                        mythic: '#ff00ff', // Bright magenta/purple
                        legendary: '#ffa500', // Bright orange
                        rare: '#0080ff', // Bright blue
                        uncommon: '#00ff00', // Bright green
                        common: '#808080', // Gray
                      };
                      return rarityColors[rarity?.toLowerCase()] || rarityColors['common'];
                    };

                    // Shorten hero ID for display (show last 6 digits)
                    const getShortHeroId = (id) => {
                      if (!id) return 'N/A';
                      const idStr = id.toString();
                      if (idStr.length > 6) {
                        return idStr.slice(-6);
                      }
                      return idStr;
                    };

                    const rarityBorderColor = getRarityBorderColor(hero?.rarity);
                    const shortHeroId = getShortHeroId(hero?.id);

                    return (
                      <div
                        key={hero?.id || `hero-${index}`}
                        className="relative flex flex-col items-center"
                      >
                        <div className="w-16 h-16 rounded" style={{ border: `3px solid ${rarityBorderColor}`, overflow: 'hidden' }}>
                          <HeroPortrait hero={hero} />
                        </div>
                        <div
                          className="mt-1 px-2 py-1 text-white text-xs rounded"
                          style={{
                            backgroundColor: rarityBorderColor,
                            color: '#000',
                            fontWeight: 'bold',
                            fontSize: '10px',
                          }}
                        >
                          #{shortHeroId}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'heroes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {heroes.map((hero) => {
                // Ensure individual HeroCard rendering by removing bulk listing flags
                const sanitizedHero = { ...hero };
                delete sanitizedHero.isBulkListing;
                delete sanitizedHero.bulkListingId;
                return (
                  <div key={sanitizedHero?.id || `hero-${Math.random()}`} className="transform scale-75 origin-top">
                    <HeroCard
                      hero={sanitizedHero}
                      isBuyPage={true}
                      honkLogo={honkLogoOverride || honkLogo}
                      inModal={false}
                      formatPrice={formatPrice}
                      isConnected={isConnected}
                      onBuyHero={() => {}}
                      pendingTransactions={new Set()}
                      purchasedHeroes={new Set()}
                      listedHeroes={new Set()}
                      pendingCancellations={new Set()}
                      pendingPriceUpdates={new Set()}
                      disableBuying={true}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Action Buttons */}
        <div className="bg-gray-900 px-6 py-4 border-t border-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {isSeller
                ? `This bulk listing contains ${heroCount} of your heroes`
                : `By purchasing this bulk listing, you will receive all ${heroCount} heroes`}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
              >
                Close
              </button>
              {isSeller ? (
                <button
                  onClick={() =>
                    onCancelBulkListing &&
                    onCancelBulkListing(bulkListing.bulkListingId, bulkListing.heroes)
                  }
                  disabled={!onCancelBulkListing || isPending}
                  className="px-8 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <>
                      <span>Cancel Bulk Listing</span>
                    </>
                  )}
                </button>
              ) : (
                onBuyBulkListing && (
                  <button
                    onClick={handleBuyBulk}
                    disabled={!isConnected || isPending}
                    className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>Purchasing...</span>
                      </>
                    ) : (
                      <>
                        <img src={honkLogoOverride || honkLogo} alt="HONK" className="w-5 h-5" />
                        <span>
                          Buy All for{' '}
                          {totalPrice.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}{' '}
                          HONK
                        </span>
                      </>
                    )}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkListingDetailModal;
