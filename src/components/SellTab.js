import React, { useState, useEffect, useMemo } from 'react';
import HeroGrid from './HeroGrid';
import honkLogo from '../assets/images/honk/honkCoin.webp';
import { formatPrice } from '../utils/heroUtils';
import WarningModal from './WarningModal';
import LoadingIndicator from './LoadingIndicator';
import { useHeroManagement } from '../hooks/useHeroManagement';
import { useWallet } from '../hooks/useWallet';
import { useHeroListing } from '../hooks/useHeroListing';
import { useHeroOperations } from '../hooks/useHeroOperations.js';
import { useDFKTavernCheck } from '../hooks/useDFKTavernCheck';
import { toast } from 'react-toastify';
import { applyFiltersAndSort as applyFiltersAndSortUtil } from '../utils/filterUtils';

const SellTab = ({ filters, sortOrder, testHeroes }) => {
  const { isConnected, isCorrectNetwork, connectedAddress, connect, switchNetwork } = useWallet();
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(false);

  const { listingHeroId, listHeroForSale, listedHeroes, fetchListedHeroes } = useHeroListing(
    connectedAddress,
    heroes,
    setHeroes
  );

  const { 
    cancelListing, 
    updatePrice, 
    pendingCancellations, 
    pendingPriceUpdates 
  } = useHeroOperations(connectedAddress, fetchListedHeroes, setHeroes);

  // Keep track of tavern heroes separately
  const [tavernHeroesState, setTavernHeroesState] = useState([]);
  const [hasFetchedTavern, setHasFetchedTavern] = useState(false);

  // Get hero management state
  const {
    heroes: heroesFromManagement,
    loading: loadingFromManagement,
    isFullyLoaded,
    hasMore,
    isLoadingMore,
    lastHeroElementRef,
    error
  } = useHeroManagement(
    connectedAddress,
    false, // isBuyTab 
    filters,
    sortOrder,
    listedHeroes
  );

  // Get tavern heroes using raw heroes
  const { tavernListedHeroes, isChecking } = useDFKTavernCheck(
    connectedAddress,
    heroesFromManagement,
    loadingFromManagement,
    isFullyLoaded // Only start checking when heroes are fully loaded
  );

  // When tavern heroes are found, store them
  useEffect(() => {
    if (tavernListedHeroes?.length > 0) {
      const tavernHeroesWithMarketplace = tavernListedHeroes.map(h => ({
        ...h,
        marketplace: 'dfk',
        isDFKTavernListing: true
      }));
      setTavernHeroesState(tavernHeroesWithMarketplace);
    }
  }, [tavernListedHeroes]);

  // Combine and filter heroes
  const displayedHeroes = useMemo(() => {
    // Handle initial loading state
    if (!heroesFromManagement) {
      return [];
    }
    
    // Helper to get base hero ID by stripping any realm prefix
    const getBaseHeroId = (heroId) => {
      const id = String(heroId || '');
      // Get the last 6 digits which is the actual hero ID
      const baseId = id.slice(-6);
      return baseId;
    };

    // Get list of base hero IDs that are on DFKTavern
    const tavernHeroes = tavernHeroesState || [];
    const tavernHeroIds = new Set(tavernHeroes.map(h => getBaseHeroId(h.id)));

    // Filter out regular heroes that are on DFKTavern using base IDs
    const regularHeroes = heroesFromManagement || [];
    const filteredRegularHeroes = regularHeroes.filter(h => {
      const baseId = getBaseHeroId(h.id);
      const isInTavern = tavernHeroIds.has(baseId);
      return !isInTavern;
    });
    
    // Combine filtered regular heroes with tavern heroes
    const allHeroes = [...filteredRegularHeroes, ...(tavernHeroesState || [])].map(hero => {
      // Check if the hero is listed in HONKMarketplace
      const listedHero = listedHeroes.find(listed => listed.heroId === hero.id);
      if (listedHero) {
        return {
          ...hero,
          isForSale: true,
          price: listedHero.price,
          marketplace: 'honk'
        };
      }
      return hero;
    });
    
    // Filter heroes
    const filteredHeroes = allHeroes.filter(hero => {
      // Hide listed heroes filter
      if (filters.hideListedHeroes && hero.isForSale) {
        return false;
      }
      
      // Hide DFK Tavern heroes filter
      if (filters.hideDFKTavern && hero.isDFKTavernListing) {
        return false;
      }

      return true;
    });

    // Sort heroes
    const sortFunctions = {
      'price-asc': (a, b) => {
        // First sort by marketplace
        if (a.marketplace === 'honk' && b.marketplace !== 'honk') return -1;
        if (a.marketplace !== 'honk' && b.marketplace === 'honk') return 1;
        
        // Then by price
        const aPrice = Number(a.price || 0);
        const bPrice = Number(b.price || 0);
        return aPrice - bPrice;
      },
      'price-desc': (a, b) => {
        // First sort by marketplace
        if (a.marketplace === 'honk' && b.marketplace !== 'honk') return -1;
        if (a.marketplace !== 'honk' && b.marketplace === 'honk') return 1;
        
        // Then by price
        const aPrice = Number(a.price || 0);
        const bPrice = Number(b.price || 0);
        return bPrice - aPrice;
      },
      'level-asc': (a, b) => {
        // First sort by marketplace
        if (a.marketplace === 'honk' && b.marketplace !== 'honk') return -1;
        if (a.marketplace !== 'honk' && b.marketplace === 'honk') return 1;
        
        // Then by level
        const aLevel = Number(a.level || 0);
        const bLevel = Number(b.level || 0);
        return aLevel - bLevel;
      },
      'level-desc': (a, b) => {
        // First sort by marketplace
        if (a.marketplace === 'honk' && b.marketplace !== 'honk') return -1;
        if (a.marketplace !== 'honk' && b.marketplace === 'honk') return 1;
        
        // Then by level
        const aLevel = Number(a.level || 0);
        const bLevel = Number(b.level || 0);
        return bLevel - aLevel;
      },
      'rarity-asc': (a, b) => {
        // First sort by marketplace
        if (a.marketplace === 'honk' && b.marketplace !== 'honk') return -1;
        if (a.marketplace !== 'honk' && b.marketplace === 'honk') return 1;
        
        // Then by rarity
        const rarityMap = {
          'common': 0,
          'uncommon': 1,
          'rare': 2,
          'legendary': 3,
          'mythic': 4
        };
        const aRarity = rarityMap[(a.rarity || '').toLowerCase()] || 0;
        const bRarity = rarityMap[(b.rarity || '').toLowerCase()] || 0;
        return aRarity - bRarity;
      },
      'rarity-desc': (a, b) => {
        // First sort by marketplace
        if (a.marketplace === 'honk' && b.marketplace !== 'honk') return -1;
        if (a.marketplace !== 'honk' && b.marketplace === 'honk') return 1;
        
        // Then by rarity
        const rarityMap = {
          'common': 0,
          'uncommon': 1,
          'rare': 2,
          'legendary': 3,
          'mythic': 4
        };
        const aRarity = rarityMap[(a.rarity || '').toLowerCase()] || 0;
        const bRarity = rarityMap[(b.rarity || '').toLowerCase()] || 0;
        return bRarity - aRarity;
      }
    };

    const sortFn = sortFunctions[sortOrder] || sortFunctions['level-desc'];
    return [...filteredHeroes].sort(sortFn);

  }, [heroesFromManagement, tavernHeroesState, isFullyLoaded, filters, sortOrder]);

  // Update loading state when fetching changes
  useEffect(() => {
    setLoading(loadingFromManagement || isChecking);
  }, [loadingFromManagement, isChecking]);

  // Update heroes state with filtered heroes
  useEffect(() => {
    setHeroes(displayedHeroes);
  }, [displayedHeroes]);

  useEffect(() => {
    // If testHeroes are provided, use those instead of fetching
    if (testHeroes) {
      setHeroes(testHeroes);
    } else if (isConnected && isCorrectNetwork) {
      fetchListedHeroes();
    }
  }, [isConnected, isCorrectNetwork, connectedAddress, testHeroes]);

  useEffect(() => {
    if (listedHeroes && listedHeroes.length > 0) {
      setHeroes(prevHeroes => {
        return prevHeroes.map(hero => {
          const listedHero = listedHeroes.find(listed => listed.heroId === hero.id);
          if (listedHero) {
            return {
              ...hero,
              isForSale: true,
              price: listedHero.price,
              owner: listedHero.owner
            };
          }
          return hero;
        });
      });
    }
  }, [listedHeroes]);

  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [currentWarnings, setCurrentWarnings] = useState([]);
  const [heroToList, setHeroToList] = useState(null);
  const [priceToList, setPriceToList] = useState(null);

  useEffect(() => {
    if (error) {
      toast.error(`Error loading heroes: ${error}`);
    }
  }, [error]);

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
        fetchListedHeroes();
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
    if (!price) {
      toast.error('Please enter a price before listing');
      return;
    }

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
      fetchListedHeroes();
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
        <div className="relative">
          <HeroGrid
            heroes={heroes}
            isBuyPage={false}
            honkLogo={honkLogo}
            onList={handleListHeroForSale}
            onCancelListing={cancelListing}
            onUpdatePrice={updatePrice}
            formatPrice={formatPrice}
            lastHeroRef={lastHeroElementRef}
            isConnected={isConnected}
            listedHeroes={listedHeroes}
            pendingCancellations={pendingCancellations}
            pendingPriceUpdates={pendingPriceUpdates}
          />
          {isLoadingMore && <LoadingIndicator />}
          {!isLoadingMore && !hasMore && heroes.length > 0 && (
            <p className="mt-4 text-center">No more heroes to load.</p>
          )}
          {!loading && heroes.length === 0 && (
            <p className="mt-4 text-center">No heroes match your current filters.</p>
          )}
        </div>
      )}
      <WarningModal
        isOpen={warningModalOpen}
        onClose={handleWarningClose}
        onConfirm={handleWarningConfirm}
        warnings={currentWarnings}
      />
    </div>
  );
};

export default SellTab;
