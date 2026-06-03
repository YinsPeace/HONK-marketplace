import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useBuyTab } from '../hooks/useBuyTab';
import { useHeroBuying } from '../hooks/useHeroBuying';
import { toast } from 'react-toastify';
import LoadingIndicator from './LoadingIndicator';
import HeroGrid from './HeroGrid';

import BulkListingDetailModal from './BulkListingDetailModal';
import BulkSelectionControls from './BulkSelectionControls';
import honkLogo from '../assets/images/honk/honkCoin.webp';
import { HONKMarketplaceContract, HONKTokenContract, web3 } from '../Web3Config';
import { marketplaceCache } from '../utils/cacheUtils';

const BuyTab = ({ filters, sortOrder }) => {
  const { isConnected, isCorrectNetwork, connectedAddress, connect, switchNetwork, updateBalance } =
    useWallet();

  const { heroes, bulkListings, loading, error, hasMore, loadMoreHeroes, fetchHeroes } = useBuyTab(
    connectedAddress,
    filters,
    sortOrder
  );

  const { buyHero, purchasedHeroes } = useHeroBuying(
    connectedAddress,
    fetchHeroes, // onPurchaseSuccess callback
    updateBalance,
    () => {} // setPendingTransactions (not used here, but required by hook)
  );

  const [pendingTransactions, setPendingTransactions] = useState(new Set());


  const [selectedBulkListing, setSelectedBulkListing] = useState(null);
  const [isBulkDetailModalOpen, setIsBulkDetailModalOpen] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);

  const toggleBulkMode = () => {
    setIsBulkMode((prev) => !prev);
  };

  const handleBuyHero = async (heroId) => {
    if (!isConnected || !isCorrectNetwork) {
      toast.error('Please connect your wallet and switch to the correct network.');
      return;
    }
    setPendingTransactions((prev) => new Set([...prev, heroId]));
    try {
      await buyHero(heroId);
    } catch (err) {
      toast.error(`Failed to buy hero: ${err.message}`);
    } finally {
      setPendingTransactions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(heroId);
        return newSet;
      });
    }
  };

  const handleCardClick = (hero) => {
    // For individual heroes, clicking the card can open a detail view in the future.
    // For now, the buy button is on the card itself.
  };

  const handleBulkCardClick = (bulkListing) => {
    setSelectedBulkListing(bulkListing);
    setIsBulkDetailModalOpen(true);
  };

  const handleBuyBulkListing = async (bulkListingId) => {
    if (!isConnected || !isCorrectNetwork) {
      toast.error('Please connect your wallet and switch to the correct network.');
      return;
    }

    const bulkListing = bulkListings.find((b) => b.bulkListingId.toString() === bulkListingId.toString());
    if (!bulkListing) {
      toast.error('Bulk listing not found.');
      return;
    }

    const heroIdsInBulk = bulkListing.heroes.map((h) => h.id);
    setPendingTransactions((prev) => new Set([...prev, ...heroIdsInBulk]));
    toast.info(`Purchasing ${heroIdsInBulk.length} heroes in bulk...`);

    try {
      const priceInWei = web3.utils.toWei(bulkListing.totalPrice.toString(), 'ether');
      const allowance = await HONKTokenContract.methods
        .allowance(connectedAddress, HONKMarketplaceContract.options.address)
        .call();

      if (BigInt(allowance) < BigInt(priceInWei)) {
        toast.info('Requesting approval for HONK spending...');
        await HONKTokenContract.methods
          .approve(
            HONKMarketplaceContract.options.address,
            '115792089237316195423570985008687907853269984665640564039457584007913129639935' // Max uint256
          )
          .send({ from: connectedAddress });
        toast.success('Approval successful! Proceeding with purchase.');
      }

      const tx = await HONKMarketplaceContract.methods
        .purchaseBulkListing(bulkListingId)
        .send({ from: connectedAddress });

      if (tx.status) {
        toast.success(`Successfully purchased ${heroIdsInBulk.length} heroes!`);
        fetchHeroes();
        updateBalance();
        setIsBulkDetailModalOpen(false);

        // Clear marketplace cache to ensure bulk listing disappears from seller's view
        marketplaceCache.clearListedHeroes();
      } else {
        throw new Error('Bulk purchase transaction failed.');
      }
    } catch (err) {
      toast.error(`Bulk purchase failed: ${err.message}`);
    } finally {
      setPendingTransactions((prev) => {
        const newSet = new Set(prev);
        heroIdsInBulk.forEach((id) => newSet.delete(id));
        return newSet;
      });
    }
  };

  const renderContent = () => {
    if (!isConnected) {
      return (
        <div className="flex justify-center items-center h-full">
          <button onClick={connect} className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-bold hover:bg-yellow-400">
            Connect Wallet to View Marketplace
          </button>
        </div>
      );
    }

    if (!isCorrectNetwork) {
      return (
        <div className="flex justify-center items-center h-full">
          <button onClick={switchNetwork} className="bg-red-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-400">
            Switch to DFK Chain
          </button>
        </div>
      );
    }

    if (loading && heroes.length === 0 && bulkListings.length === 0) {
      return <LoadingIndicator message="Loading heroes from the marketplace..." />;
    }

    if (error) {
      return <p className="text-red-500 text-center">Error: {error}</p>;
    }

    if (isBulkMode && bulkListings.length === 0) {
      return <p className="text-center mt-8">No bulk listings available.</p>;
    }

    if (!isBulkMode && heroes.length === 0) {
      return <p className="text-center mt-8">No individual heroes for sale.</p>;
    }

    return (
      <>
        {isBulkMode ? (
          <HeroGrid
            heroes={bulkListings}
            honkLogo={honkLogo}
            onBulkListingClick={handleBulkCardClick}
            isBuyPage={true}
            isBulkMode={true}
            showPrivateBadge={true}
            isConnected={isConnected}
            pendingTransactions={pendingTransactions}
            purchasedHeroes={purchasedHeroes}
          />
        ) : (
          <HeroGrid
            heroes={heroes}
            honkLogo={honkLogo}
            onCardClick={handleCardClick}
            onBuyHero={handleBuyHero}
            showPrivateBadge={true}
            isConnected={isConnected}
            isBuyPage={true}
            pendingTransactions={pendingTransactions}
            purchasedHeroes={purchasedHeroes}
          />
        )}
        {hasMore && !isBulkMode && (
          <div className="flex justify-center mt-4">
            <button
              onClick={loadMoreHeroes}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-300 disabled:bg-gray-500"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex-grow flex flex-col p-4 bg-gray-900 text-white relative">
      {isBulkDetailModalOpen && selectedBulkListing && (
        <BulkListingDetailModal
          isOpen={isBulkDetailModalOpen}
          onClose={() => setIsBulkDetailModalOpen(false)}
          bulkListing={selectedBulkListing}
          onBuyBulkListing={handleBuyBulkListing}
          onCancelBulkListing={null}
          isConnected={isConnected}
          pendingTransactions={pendingTransactions}
          isSeller={false}
        />
      )}

      <div className="mb-4">
        <BulkSelectionControls
          isBulkMode={false} // Not in selection mode
          toggleBulkMode={() => {}} // No-op
          isSellBulkMode={isBulkMode} // Controls the view toggle
          toggleSellBulkMode={toggleBulkMode} // Toggles the view
          selectedHeroes={new Set()} // Not used
          selectAllHeroes={() => {}} // No-op
          clearAllSelections={() => {}} // No-op
          onOpenBulkModal={() => {}} // No-op
          visibleHeroes={[]} // Not used
          totalHeroes={0} // Not used
          hideBulkSelect={true} // Hides selection-related controls
          onRefresh={fetchHeroes}
          loading={loading}
        />
      </div>

      {renderContent()}
    </div>
  );
};

export default BuyTab;
