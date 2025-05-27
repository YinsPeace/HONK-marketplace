import React, { useEffect, useState } from 'react';
import HeroGrid from './HeroGrid';
import LoadingIndicator from './LoadingIndicator';
import { toast } from 'react-toastify';
import { useWallet } from '../hooks/useWallet';
import { useHeroBuying } from '../hooks/useHeroBuying';
import { useBuyTab } from '../hooks/useBuyTab';
import honkLogo from '../assets/images/honk/honkCoin.webp';

const BuyTab = ({ filters, sortOrder }) => {
  const { isConnected, isCorrectNetwork, connectedAddress, connect, switchNetwork, updateBalance } =
    useWallet();

  const {
    displayedHeroes,
    loading,
    error,
    hasMore,
    isLoadingMore,
    loadMoreHeroes,
    fetchHeroes,
    setHeroes,
    loadStats
  } = useBuyTab(connectedAddress, filters, sortOrder);

  const [pendingTransactions, setPendingTransactions] = React.useState(new Set());

  const { buyingHeroId, buyHero, checkHONKBalance } = useHeroBuying(
    connectedAddress,
    fetchHeroes,
    updateBalance,
    setPendingTransactions,
    setHeroes
  );

  const handleBuyHero = async (heroId) => {
    if (!isConnected) {
      toast.error('Please connect your wallet to buy a hero.');
      try {
        await connect();
      } catch (error) {
        toast.error('Failed to connect wallet. Please try again.');
      }
      return;
    }

    if (!isCorrectNetwork) {
      toast.error('Please switch to the correct network.');
      try {
        await switchNetwork();
      } catch (error) {
        toast.error('Failed to switch network. Please try again.');
      }
      return;
    }

    try {
      const honkBalance = await checkHONKBalance();
      if (parseFloat(honkBalance) <= 0) {
        toast.error('Insufficient HONK balance. Please add funds to your wallet.');
        return;
      }

      const success = await buyHero(heroId);
      if (success) {
        toast.success('Hero purchase successful!');
      }
    } catch (error) {
      toast.error(`Failed to buy hero: ${error.message}`);
    }
  };

  useEffect(() => {
    if (!isConnected || !isCorrectNetwork || !connectedAddress) {
      return;
    }
  }, [isConnected, isCorrectNetwork, connectedAddress]);

  return (
    <div className="container mx-auto px-4">
      {!isConnected && (
        <div className="mt-8 text-center">
          <p className="text-lg mb-4">Please connect your wallet to access the marketplace.</p>
          <button
            onClick={connect}
            className="mt-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold text-lg"
          >
            Connect Wallet
          </button>
        </div>
      )}
      {isConnected && !isCorrectNetwork && (
        <div className="mt-8 text-center">
          <p className="text-lg mb-4">Please switch to the DFK Chain network to continue.</p>
          <button
            onClick={switchNetwork}
            className="mt-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold text-lg"
          >
            Switch to DFK Chain
          </button>
        </div>
      )}
      {isConnected && isCorrectNetwork && (
        <>
          {error ? (
            <div className="mt-8 text-center text-red-500">
              Error: {error}
            </div>
          ) : (
            <div className="mt-8">
              {/* Show loading indicator at top while initially loading */}
              {loading && displayedHeroes.length === 0 && (
                <div className="flex justify-center items-center mb-8">
                  <LoadingIndicator />
                  <span className="ml-3">Loading heroes...</span>
                </div>
              )}
              {/* Always render HeroGrid, even during loading */}
              <HeroGrid
                heroes={displayedHeroes}
                isBuyPage={true}
                honkLogo={honkLogo}
                onBuyHero={handleBuyHero}
                lastHeroRef={hasMore ? loadMoreHeroes : undefined}
                isConnected={isConnected}
                loading={isLoadingMore}
                purchasedHeroes={new Set()}
                listedHeroes={new Set()}
                pendingTransactions={pendingTransactions}
                pendingCancellations={new Set()}
                pendingPriceUpdates={new Set()}
              />
              {/* Show loading indicator at bottom during pagination */}
              {/* Only show loading indicator if we're still actively loading */}
              {(loading || isLoadingMore) && displayedHeroes.length > 0 && !loadStats?.isDone && (
                <div className="flex justify-center items-center mt-8">
                  <LoadingIndicator />
                  <span className="ml-3">Loading more heroes...</span>
                </div>
              )}
              {/* Loading stats */}
              {loadStats?.isDone && (
                <div className="text-center mt-8 text-gray-500">
                  Found {loadStats.totalHeroes} heroes on blockchain, displaying {loadStats.validHeroes} valid listings
                  ({loadStats.filteredOut} filtered out) • Loaded in {(loadStats.loadTimeMs / 1000).toFixed(1)} seconds
                </div>
              )}
              {!isLoadingMore && !hasMore && displayedHeroes.length > 0 && (
                <div className="text-center mt-8 text-gray-500">
                  No more heroes to load
                </div>
              )}
              {!isLoadingMore && displayedHeroes.length === 0 && (
                <p className="mt-8 text-center">No heroes match your current filters.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BuyTab;
