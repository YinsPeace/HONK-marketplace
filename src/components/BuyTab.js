import React from 'react';
import HeroGrid from './HeroGrid';
import LoadingIndicator from './LoadingIndicator';
import { formatPrice } from '../utils/heroUtils';
import { toast } from 'react-toastify';
import { useHeroManagement } from '../hooks/useHeroManagement';
import { useWallet } from '../hooks/useWallet';
import { useHeroBuying } from '../hooks/useHeroBuying';

const BuyTab = ({ honkLogo, filters, sortOrder }) => {
  const { isConnected, isCorrectNetwork, connectedAddress, connect, switchNetwork, updateBalance } =
    useWallet();

  const {
    displayedHeroes,
    loading,
    error,
    hasMore,
    isLoadingMore,
    lastHeroElementRef,
    fetchHeroes,
  } = useHeroManagement(connectedAddress, true, filters, sortOrder);

  const { buyingHeroId, buyHero, checkHONKBalance } = useHeroBuying(
    connectedAddress,
    fetchHeroes,
    updateBalance
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

      await buyHero(heroId);
    } catch (error) {
      toast.error(`Failed to buy hero: ${error.message}`);
    }
  };

  return (
    <div>
      {!isConnected && (
        <div className="mt-4 text-center">
          <p>Please connect your wallet to view and buy heroes.</p>
          <button
            onClick={connect}
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
            onClick={switchNetwork}
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
          ) : (
            <>
              <HeroGrid
                heroes={displayedHeroes}
                isBuyPage={true}
                honkLogo={honkLogo}
                formatPrice={formatPrice}
                onBuy={handleBuyHero}
                lastHeroRef={lastHeroElementRef}
                isConnected={isConnected}
                buyingHeroId={buyingHeroId}
              />
              {isLoadingMore && <LoadingIndicator />}
              {!isLoadingMore && !hasMore && displayedHeroes.length > 0 && (
                <p className="mt-4 text-center">No more heroes to load.</p>
              )}
              {!isLoadingMore && displayedHeroes.length === 0 && (
                <p className="mt-4 text-center">No heroes match your current filters.</p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default BuyTab;
