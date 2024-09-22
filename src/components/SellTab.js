import React, { useState } from 'react';
import HeroGrid from './HeroGrid';
import honkLogo from '../assets/images/honk/honkCoin.webp';
import { formatPrice } from '../utils/heroUtils';
import WarningModal from './WarningModal';
import LoadingIndicator from './LoadingIndicator';
import { useHeroManagement } from '../hooks/useHeroManagement';
import { useWallet } from '../hooks/useWallet';
import { useHeroListing } from '../hooks/useHeroListing';
import { useHeroOperations } from '../hooks/useHeroOperations.js';
import { toast } from 'react-toastify';

const SellTab = ({ filters, sortOrder }) => {
  const { isConnected, isCorrectNetwork, connectedAddress, connect, switchNetwork } = useWallet();
  const {
    displayedHeroes,
    loading,
    error,
    hasMore,
    isLoadingMore,
    lastHeroElementRef,
    fetchHeroes,
  } = useHeroManagement(connectedAddress, false, filters, sortOrder);
  const { listingHeroId, listHeroForSale } = useHeroListing(connectedAddress, fetchHeroes);
  const { cancellingHeroId, updatePrice, cancelListing } = useHeroOperations(
    connectedAddress,
    fetchHeroes
  );

  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [currentWarnings, setCurrentWarnings] = useState([]);
  const [heroToList, setHeroToList] = useState(null);
  const [priceToList, setPriceToList] = useState(null);

  const handleWarningClose = () => {
    setWarningModalOpen(false);
    setCurrentWarnings([]);
    setHeroToList(null);
    setPriceToList(null);
  };

  const handleWarningConfirm = async () => {
    if (heroToList && priceToList) {
      const result = await listHeroForSale(heroToList, priceToList, true);
      if (result.success) {
        toast.success(`Hero ${heroToList} listed successfully after warning confirmation.`);
        fetchHeroes(connectedAddress);
      } else {
        toast.error(`Failed to list hero after warning confirmation: ${result.errors.join(', ')}`);
      }
    }
    setWarningModalOpen(false);
    setCurrentWarnings([]);
    setHeroToList(null);
    setPriceToList(null);
  };

  const handleListHeroForSale = async (heroId, price) => {
    const result = await listHeroForSale(heroId, price);
    if (!result.success) {
      if (result.warnings.length > 0) {
        setCurrentWarnings(result.warnings);
        setHeroToList(heroId);
        setPriceToList(price);
        setWarningModalOpen(true);
      } else if (result.errors.length > 0) {
        toast.error(`Failed to list hero: ${result.errors.join(', ')}`);
      }
    } else {
      toast.success(`Hero ${heroId} listed successfully.`);
      fetchHeroes(connectedAddress);
    }
  };

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      toast.error(`Failed to connect wallet: ${error.message}`);
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchNetwork();
    } catch (error) {
      toast.error(`Failed to switch network: ${error.message}`);
    }
  };

  return (
    <div>
      {!isConnected && (
        <div className="mt-4 text-center">
          <p>Please connect your wallet to view and list your heroes.</p>
          <button
            onClick={handleConnect}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Connect Wallet
          </button>
        </div>
      )}
      {isConnected && !isCorrectNetwork && (
        <div className="mt-4 text-center">
          <p>Please switch to the correct network.</p>
          <button
            onClick={handleSwitchNetwork}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Switch Network
          </button>
        </div>
      )}
      {isConnected && isCorrectNetwork && (
        <>
          {loading ? (
            <LoadingIndicator />
          ) : error ? (
            <div className="mt-4 text-center text-red-500">
              {toast.error(`Error loading heroes: ${error}`)}
            </div>
          ) : displayedHeroes.length === 0 ? (
            <div className="mt-4 text-center">
              <p>No heroes to display</p>
              <p>No heroes match your current filters.</p>
            </div>
          ) : (
            <>
              <HeroGrid
                heroes={displayedHeroes}
                isBuyPage={false}
                honkLogo={honkLogo}
                onList={handleListHeroForSale}
                onCancelListing={cancelListing}
                onUpdatePrice={updatePrice}
                formatPrice={formatPrice}
                lastHeroRef={lastHeroElementRef}
                listingHeroId={listingHeroId}
                cancellingHeroId={cancellingHeroId}
              />
              {isLoadingMore && <LoadingIndicator />}
              {!isLoadingMore && !hasMore && displayedHeroes.length > 0 && (
                <p className="mt-4 text-center">No more heroes to load.</p>
              )}
            </>
          )}
          <WarningModal
            isOpen={warningModalOpen}
            onClose={handleWarningClose}
            onConfirm={handleWarningConfirm}
            warnings={currentWarnings}
          />
        </>
      )}
    </div>
  );
};

export default SellTab;
