import React, { useState, useMemo } from 'react';
import { web3 } from '../Web3Config';
import ConfirmationModal from './ConfirmationModal';
import { formatPrice, getFirstName, getLastName, classMapping } from '../utils/heroUtils';
import honkLogo from '../assets/images/honk/honkCoin.webp';
import '../components/styles/HeroCard.css';

const BulkListingModal = ({
  isOpen,
  onClose,
  selectedHeroes,
  bulkPrices,
  setHeroPrice,
  setBulkPrice,
  executeBulkListing,
  isBulkListing,
  bulkProgress,
  heroes,
  getTotalEstimatedValue,
  // Private sale props
  isPrivateSale,
  setIsPrivateSale,
  recipient,
  setRecipient,
}) => {
  const [globalPrice, setGlobalPrice] = useState('');
  const [totalBulkPrice, setTotalBulkPrice] = useState('');
  const [pricingMode, setPricingMode] = useState('individual'); // 'individual' or 'bulk'
  const [confirmationState, setConfirmationState] = useState({
    isOpen: false,
    title: '',
    messages: [],
    onConfirm: () => {},
  });

  const selectedHeroesArray = useMemo(() => {
    return Array.from(selectedHeroes).map((heroId) => {
      const hero = heroes.find((h) => h.id === heroId);
      return hero || { id: heroId, name: `Hero #${heroId}` };
    });
  }, [selectedHeroes, heroes]);

  // Calculate total value from current bulk prices
  const totalValue = useMemo(() => {
    return Array.from(selectedHeroes).reduce((total, heroId) => {
      const price = bulkPrices[heroId];
      return total + (price ? parseFloat(price) : 0);
    }, 0);
  }, [selectedHeroes, bulkPrices]);

  const handleGlobalPriceApply = () => {
    if (globalPrice && parseFloat(globalPrice) > 0) {
      setBulkPrice(globalPrice);
    }
  };

  const handleTotalBulkPriceApply = () => {
    if (totalBulkPrice && parseFloat(totalBulkPrice) > 0) {
      const pricePerHero = (parseFloat(totalBulkPrice) / selectedHeroes.size).toFixed(18);
      // Clear all individual prices first
      Array.from(selectedHeroes).forEach((heroId) => {
        setHeroPrice(heroId, '');
      });
      // Then set the calculated price per hero
      Array.from(selectedHeroes).forEach((heroId) => {
        setHeroPrice(heroId, pricePerHero);
      });
    }
  };

  const handleExecuteBulkListingAttempt = async () => {
    if (!executeBulkListing) {
      console.error('BulkListingModal: executeBulkListing function is not available.');
      return;
    }

    console.log('BulkListingModal: Attempting executeBulkListing(false)...');
    const initialResponse = await executeBulkListing(false); // bypassWarnings = false
    console.log('BulkListingModal: executeBulkListing(false) response:', initialResponse);

    if (initialResponse && initialResponse.warnings && initialResponse.warnings.length > 0) {
      console.log('BulkListingModal: Warnings found. Showing confirmation modal.');
      setConfirmationState({
        isOpen: true,
        title: 'Equipment Warning',
        messages: initialResponse.warnings, // Pass all warnings
        onConfirm: async () => {
          console.log('BulkListingModal: ConfirmationModal confirmed. Attempting executeBulkListing(true)...');
          setConfirmationState({ isOpen: false, title: '', messages: [], onConfirm: () => {} });
          const finalResponse = await executeBulkListing(true); // bypassWarnings = true
          console.log('BulkListingModal: executeBulkListing(true) response:', finalResponse);
          // The useBulkListing hook's onComplete callback should handle closing the main modal
          // and updating isBulkListing state.
        },
      });
    } else {
      console.log('BulkListingModal: No warnings from executeBulkListing(false).');
      // If successful, useBulkListing's onComplete should close the modal.
      // If errors, useBulkListing should show a toast.
      // The hook should also set its internal isBulkListing state to false.
      if (initialResponse && initialResponse.success) {
        console.log('BulkListingModal: executeBulkListing(false) was successful directly.');
        // The hook's onComplete callback is responsible for closing the modal.
      } else if (initialResponse && initialResponse.errors && initialResponse.errors.length > 0) {
        console.log('BulkListingModal: executeBulkListing(false) failed with errors:', initialResponse.errors);
        // The hook should have shown an error toast.
      } else {
        console.log('BulkListingModal: executeBulkListing(false) response indicates no success, no warnings, and no errors, or an unexpected structure:', initialResponse);
      }
    }
  };

  const isReadyToList = useMemo(() => {
    const allPriced = Array.from(selectedHeroes).every(
      (heroId) => bulkPrices[heroId] && parseFloat(bulkPrices[heroId]) > 0
    );
    const recipientValid = !isPrivateSale || (recipient && web3.utils.isAddress(recipient));
    return allPriced && recipientValid;
  }, [selectedHeroes, bulkPrices, isPrivateSale, recipient]);

  // When switching pricing modes, clear all prices to prevent bugs
  const handlePricingModeChange = (mode) => {
    setPricingMode(mode);
    // Clear all prices when switching modes
    Array.from(selectedHeroes).forEach((heroId) => {
      setHeroPrice(heroId, '');
    });
    setGlobalPrice('');
    setTotalBulkPrice('');
  };

  if (!isOpen) return null;

  const closeConfirmationModal = () => {
    setConfirmationState({ isOpen: false, title: '', messages: [], onConfirm: () => {} });
  };

  return (
    <>
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        onClose={closeConfirmationModal}
        onConfirm={confirmationState.onConfirm}
        title={confirmationState.title}
        messages={confirmationState.messages}
      />
      <div className="fixed inset-0 z-40 overflow-auto bg-black bg-opacity-50 flex justify-center items-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with HONK Price Display */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">
              Bulk List Heroes ({selectedHeroes.size})
            </h2>
            <button
              onClick={onClose}
              disabled={isBulkListing}
              className="text-gray-400 hover:text-white text-2xl disabled:opacity-50"
            >
              ×
            </button>
          </div>

          {/* HONK Price Display at Top */}
          <div className="flex items-center justify-center bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <img src={honkLogo} alt="HONK" className="w-10 h-10" />
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500">
                  {totalValue.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="text-sm text-gray-300">Total HONK Value</div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {isBulkListing && (
          <div className="px-6 py-4 bg-gray-900 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">
                {bulkProgress.status || 'Processing...'}
              </span>
              <span className="text-sm text-gray-300">
                {bulkProgress.current}/{bulkProgress.total}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width:
                    bulkProgress.total > 0
                      ? `${(bulkProgress.current / bulkProgress.total) * 100}%`
                      : '0%',
                }}
              />
            </div>
          </div>
        )}

        {/* Scrollable Content Area */}
          {/* Added 'bulk-modal-scrollable-content' class for custom scrollbar styling */}
        <div className="flex-1 overflow-y-auto px-6 py-4 bulk-modal-scrollable-content">
          {/* Removed hero preview grid for cleaner UI */}

          {/* Pricing Mode Toggle */}
          <div className="mb-6">
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => handlePricingModeChange('individual')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  pricingMode === 'individual'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                Individual Pricing
              </button>
              <button
                onClick={() => handlePricingModeChange('bulk')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  pricingMode === 'bulk'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                Bulk Pricing
              </button>
            </div>

            {/* Bulk Pricing Controls */}
            {pricingMode === 'bulk' && (
              <div className="bg-gray-700 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-semibold text-white mb-3">Set Total Price for Bulk</h3>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={totalBulkPrice}
                        onChange={(e) => setTotalBulkPrice(e.target.value)}
                        placeholder="Enter total price for all heroes"
                        className="w-full px-4 py-2 pr-12 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        disabled={isBulkListing}
                      />
                      <img
                        src={honkLogo}
                        alt="HONK"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleTotalBulkPriceApply}
                    disabled={!totalBulkPrice || parseFloat(totalBulkPrice) <= 0 || isBulkListing}
                    className="px-4 py-2 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply Total
                  </button>
                </div>
                {totalBulkPrice && parseFloat(totalBulkPrice) > 0 && (
                  <div className="text-sm text-gray-300">
                    Price per hero:{' '}
                    {parseFloat(totalBulkPrice / selectedHeroes.size).toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 4,
                    })}{' '}
                    HONK
                  </div>
                )}

                {/* Summary Stats for Bulk Pricing */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mt-4 pt-4 border-t border-gray-600">
                  <div>
                    <div className="text-xl font-bold text-yellow-500">{selectedHeroes.size}</div>
                    <div className="text-xs text-gray-300">Heroes Selected</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-500">
                      {totalValue.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div className="text-xs text-gray-300">Total Value</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-blue-500">
                      {
                        Array.from(selectedHeroes).filter(
                          (heroId) => bulkPrices[heroId] && parseFloat(bulkPrices[heroId]) > 0
                        ).length
                      }
                    </div>
                    <div className="text-xs text-gray-300">Priced Heroes</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-purple-500">50</div>
                    <div className="text-xs text-gray-300">Max Heroes</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Private Sale Toggle */}
          <div className="mb-6">
            <label className="flex items-center space-x-2 select-none">
              <input
                id="bulkPrivateSaleToggle"
                type="checkbox"
                checked={isPrivateSale}
                onChange={() => setIsPrivateSale((prev) => !prev)}
                className="mr-2"
                disabled={isBulkListing}
              />
              <span>Private Sale</span>
            </label>
            {isPrivateSale && (
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Recipient 0x address"
                disabled={isBulkListing}
                className="mt-2 w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            )}
          </div>

          {/* Summary - Only show in Individual Pricing mode */}
          {pricingMode === 'individual' && (
            <div className="bg-gray-700 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-yellow-500">{selectedHeroes.size}</div>
                  <div className="text-sm text-gray-300">Heroes Selected</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-500">
                    {totalValue.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-sm text-gray-300">Total Value</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-500">
                    {
                      Array.from(selectedHeroes).filter(
                        (heroId) => bulkPrices[heroId] && parseFloat(bulkPrices[heroId]) > 0
                      ).length
                    }
                  </div>
                  <div className="text-sm text-gray-300">Priced Heroes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-500">50</div>
                  <div className="text-sm text-gray-300">Max Heroes</div>
                </div>
              </div>
            </div>
          )}

          {/* Individual Hero Pricing List */}
          <div className="space-y-3">
            {selectedHeroesArray.map((hero) => (
              <div key={hero.id} className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Hero Image */}
                    <div className="w-16 h-16 bg-gray-600 rounded-lg overflow-hidden flex-shrink-0">
                      {hero.image ? (
                        <img
                          src={hero.image}
                          alt={hero.name || `Hero #${hero.id}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="w-full h-full bg-gray-600 rounded-lg flex items-center justify-center text-xs font-medium text-white"
                        style={{ display: hero.image ? 'none' : 'flex' }}
                      >
                        #{hero.id}
                      </div>
                    </div>

                    <div>
                      <div className="font-medium text-white">
                        {hero.name || `Hero #${hero.id}`}
                      </div>
                      <div className="text-sm text-gray-400 capitalize">
                        {hero.rarity && <span>{hero.rarity}</span>}
                        {hero.level && <span> • Level {hero.level}</span>}
                        {hero.mainClass && hero.subClass && (
                          <span>
                            {' '}
                            • {hero.mainClass}/{hero.subClass}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">#{hero.id}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pr-4">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={bulkPrices[hero.id] || ''}
                        onChange={(e) => setHeroPrice(hero.id, e.target.value)}
                        placeholder="Price"
                        className={`w-32 px-3 py-2 pr-10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                          pricingMode === 'bulk'
                            ? 'bg-gray-600 border-gray-500 cursor-not-allowed'
                            : 'bg-gray-800 border-gray-600'
                        }`}
                        disabled={isBulkListing || pricingMode === 'bulk'}
                        readOnly={pricingMode === 'bulk'}
                      />
                      <img
                        src={honkLogo}
                        alt="HONK"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5"
                      />
                    </div>
                    {bulkPrices[hero.id] && parseFloat(bulkPrices[hero.id]) > 0 ? (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-gray-400 text-xs">-</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-800 border-t border-gray-700 px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-300">
              {isReadyToList
                ? `Ready to list ${selectedHeroes.size} heroes for ${totalValue.toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    }
                  )} HONK total`
                : `${Array.from(selectedHeroes).filter((heroId) => !bulkPrices[heroId] || parseFloat(bulkPrices[heroId]) <= 0).length} heroes still need prices`}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={isBulkListing}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteBulkListingAttempt} // Updated onClick handler
                disabled={!isReadyToList || isBulkListing}
                className="px-6 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isBulkListing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                    <span>Listing...</span>
                  </>
                ) : (
                  <span>List {selectedHeroes.size} Heroes</span>
                )}
              </button>
            </div>
          </div>
          {/* Marketplace fee notice */}
          <div className="text-xs text-gray-400 mt-2">
            Note: A <span className="text-yellow-400 font-semibold">1% marketplace fee</span> will
            be deducted from the sale proceeds.
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default BulkListingModal;
