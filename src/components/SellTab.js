import React, { useState, useEffect, useMemo } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useHeroManagement } from '../hooks/useHeroManagement';
import { useHeroListing } from '../hooks/useHeroListing';
import { useDFKTavernCheck } from '../hooks/useDFKTavernCheck';
import LoadingIndicator from './LoadingIndicator';
import VirtualizedHeroGrid from './VirtualizedHeroGrid';
import { enhanceHeroWithGeneData } from '../utils/heroGeneParser';
import { toast } from 'react-toastify';
import honkLogo from '../assets/images/honk/honkCoin.webp';
import { formatPrice } from '../utils/heroUtils';
import WarningModal from './WarningModal';
import { Modal, HeroDetails } from './Modal';
import { useHeroOperations } from '../hooks/useHeroOperations.js';
import { applyFiltersAndSort as applyFiltersAndSortUtil } from '../utils/filterUtils';

const SellTab = ({ userAddress, filters, sortOrder, testHeroes }) => {
  // Only useWallet for isConnected, isCorrectNetwork, connect, switchNetwork if needed for UI
  const { isConnected, isCorrectNetwork, connect, switchNetwork } = useWallet();
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 });

  // Modal state for hero listing
  const [selectedHero, setSelectedHero] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [price, setPrice] = useState('');

  // All hero-related hooks use userAddress
  const { listingHeroId, listHeroForSale, listedHeroes, fetchListedHeroes } = useHeroListing(
    userAddress,
    heroes,
    setHeroes
  );

  const { 
    cancelListing, 
    updatePrice, 
    checkAndCancelIfMoved,
    pendingCancellations, 
    pendingPriceUpdates 
  } = useHeroOperations(userAddress, fetchListedHeroes, setHeroes);

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
    userAddress,
    false, // isBuyTab 
    filters,
    sortOrder,
    listedHeroes
  );

  // Get tavern heroes using raw heroes
  const { tavernListedHeroes, isChecking } = useDFKTavernCheck(
    userAddress,
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

  // Handle hero listing - opens modal
  const handleList = (heroId) => {
    const hero = heroes.find(h => h.id === heroId);
    if (hero) {
      setSelectedHero(hero);
      setPrice('');
      setIsModalOpen(true);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedHero(null);
    setPrice('');
  };

  // Handle actual listing with price from modal
  const handleModalList = async (heroId, priceValue) => {
    if (!priceValue || parseFloat(priceValue) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      const hero = heroes.find(h => h.id === heroId);
      const result = await listHeroForSale(heroId, priceValue, false, hero);
      
      if (result.success) {
        toast.success(`Hero ${heroId} listed successfully!`);
        fetchListedHeroes();
        handleCloseModal();
      } else {
        if (result.warnings && result.warnings.length > 0) {
          setCurrentWarnings(result.warnings);
          setHeroToList(heroId);
          setPriceToList(priceValue);
          setWarningModalOpen(true);
        } else {
          toast.error(`Failed to list hero: ${result.errors.join(', ')}`);
        }
      }
    } catch (error) {
      console.error('Error listing hero:', error);
      toast.error(`Failed to list hero: ${error.message}`);
    }
  };

  // Combine and filter heroes - optimized for large collections
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

    // Get list of base hero IDs that are on DFKTavern - memoize this expensive operation
    const tavernHeroes = tavernHeroesState || [];
    const tavernHeroIds = new Set(tavernHeroes.map(h => getBaseHeroId(h.id)));

    // Filter out regular heroes that are on DFKTavern using base IDs
    const regularHeroes = heroesFromManagement || [];
    const filteredRegularHeroes = regularHeroes.filter(h => {
      const baseId = getBaseHeroId(h.id);
      const isInTavern = tavernHeroIds.has(baseId);
      return !isInTavern;
    });
    
    // Create a map of listed heroes for O(1) lookup instead of O(n) find operations
    const listedHeroesMap = new Map();
    if (listedHeroes && Array.isArray(listedHeroes)) {
      listedHeroes.forEach(listed => {
        listedHeroesMap.set(listed.heroId, listed);
      });
    }
    
    // Combine filtered regular heroes with tavern heroes
    const allHeroes = [...filteredRegularHeroes, ...tavernHeroes].map(hero => {
      // Check if the hero is listed in HONKMarketplace using map lookup
      const listedHero = listedHeroesMap.get(hero.id);
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

    // Sort heroes - optimized sort functions
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

  }, [heroesFromManagement, tavernHeroesState, listedHeroes, filters, sortOrder]);

  // Update loading state when fetching changes
  useEffect(() => {
    const isLoading = loadingFromManagement || isChecking;
    setLoading(isLoading);
    
    // Update progress tracking
    if (loadingFromManagement) {
      setLoadingProgress({ loaded: heroesFromManagement?.length || 0, total: 0 });
    } else if (!isLoading) {
      setLoadingProgress({ loaded: 0, total: 0 });
    }
    
    // Set global loading flag for HeroGrid to detect
    window.isLoadingHeroes = isLoading;
    
    // Cleanup
    return () => {
      window.isLoadingHeroes = false;
    };
  }, [loadingFromManagement, isChecking, heroesFromManagement]);

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
  }, [isConnected, isCorrectNetwork, userAddress, testHeroes]);

  // Check for heroes that have moved to another chain and cancel their listings
  // Only run this when the listed heroes change, not periodically
  useEffect(() => {
    const checkHeroesOnOtherChains = async () => {
      if (!userAddress || !listedHeroes || listedHeroes.length === 0) return;
      
      // Check each listed hero to see if it has moved to another chain
      for (const listedHero of listedHeroes) {
        await checkAndCancelIfMoved(listedHero.heroId);
      }
    };
    
    // Run the check when the component mounts and when listed heroes change
    checkHeroesOnOtherChains();
  }, [userAddress, listedHeroes, checkAndCancelIfMoved]);

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
      // Find the hero in our local state
      const hero = heroes.find(h => h.id === heroToList);
      const result = await listHeroForSale(heroToList, priceToList, true, hero);
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

  return (
    <div>
      {loading && (
        <div className="mt-4 text-center">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-4 border-yellow-500 border-t-transparent mr-3"></div>
            <span className="text-lg">
              Loading heroes... ({loadingProgress.loaded} loaded so far)
            </span>
        </div>
        </div>
      )}
      
      <VirtualizedHeroGrid
            heroes={heroes}
            isBuyPage={false}
            honkLogo={honkLogo}
        onList={handleList}
            onCancelListing={cancelListing}
            onUpdatePrice={updatePrice}
            formatPrice={formatPrice}
            isConnected={isConnected}
            listedHeroes={listedHeroes}
            pendingCancellations={pendingCancellations}
            pendingPriceUpdates={pendingPriceUpdates}
          />
      
      {/* Hero Listing Modal */}
      {isModalOpen && selectedHero && (
        <Modal onClose={handleCloseModal}>
          <HeroDetails
            hero={selectedHero}
            honkLogo={honkLogo}
            price={price}
            setPrice={setPrice}
            onList={handleModalList}
            isBuyPage={false}
            onClose={handleCloseModal}
          />
        </Modal>
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