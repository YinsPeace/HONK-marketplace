import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  initializeContracts,
  checkNetwork,
  validateContracts,
} from '../Web3Config';
import { getHeroesByOwner } from '../utils/heroUtils';
import { applyFiltersAndSort } from '../utils/filterUtils';
import { DFKHeroContract, HONKMarketplaceContract } from '../Web3Config';
import { heroCache } from '../utils/cacheUtils';

const HEROES_PER_PAGE = 20;

export const useHeroManagement = (
  connectedAddress, 
  isBuyTab = true, 
  filters, 
  sortOrder, 
  listedHeroes
) => {
  const [heroes, setHeroes] = useState([]);
  const [filteredHeroes, setFilteredHeroes] = useState([]);
  const [displayedHeroes, setDisplayedHeroes] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observer = useRef();
  const mode = isBuyTab ? 'buy' : 'owned';
  const cachedHeroes = useRef({});

  // Function to update hero cache
  const updateHeroCache = useCallback((type, heroes) => {
    cachedHeroes.current[type] = heroes;
  }, []);

  // Function to get cached heroes
  const getCachedHeroes = useCallback((type) => {
    return cachedHeroes.current[type] || [];
  }, []);

  const processHero = useCallback(async (hero) => {
    if (isBuyTab) {
      try {
        const marketplaceData = await HONKMarketplaceContract.methods.getHero(hero.id).call();
        return { 
          ...hero, 
          price: marketplaceData.price,
          isForSale: marketplaceData.isForSale 
        };
      } catch (err) {
        return hero;
      }
    }
    return hero;
  }, [isBuyTab]);

  // Function to add heroes in batches
  const addHeroesBatch = useCallback((heroes) => {
    setHeroes(prevHeroes => {
      const newHeroes = [...prevHeroes];
      heroes.forEach(hero => {
        if (!newHeroes.some(h => h.id === hero.id)) {
          newHeroes.push(hero);
        }
      });
      return newHeroes;
    });
  }, []);

  const fetchHeroes = useCallback(async () => {
    if (!connectedAddress || isFetching) return;
    
    setIsFetching(true);
    setError(null);

    try {
      // Try to get from cache first
      const cacheKey = `${mode}-${connectedAddress}`;
      const cachedData = heroCache.get(cacheKey);
      
      if (cachedData) {
        setHeroes(cachedData);
        setIsFetching(false);
        return;
      }

      const fetchedHeroes = await getHeroesByOwner(connectedAddress);
      setHeroes(fetchedHeroes);
      // Store in cache
      heroCache.set(cacheKey, fetchedHeroes);
    } catch (err) {
      setError('Failed to fetch heroes');
    } finally {
      setIsFetching(false);
    }
  }, [connectedAddress, isFetching, mode]);

  const loadMoreHeroes = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    const startIndex = nextPage * HEROES_PER_PAGE;
    const endIndex = startIndex + HEROES_PER_PAGE;
    
    setDisplayedHeroes(prev => {
      // Get the next batch of heroes and append them to the existing ones
      const nextBatch = filteredHeroes.slice(startIndex, endIndex);
      const combined = [...prev, ...nextBatch];
      // Re-sort the entire combined array
      return combined.sort((a, b) => {
        if (sortOrder === 'generation-asc') {
          return (Number(a.generation || 0) - Number(b.generation || 0));
        }
        if (sortOrder === 'generation-desc') {
          return (Number(b.generation || 0) - Number(a.generation || 0));
        }
        return 0;
      });
    });
    
    setHasMore(endIndex < filteredHeroes.length);
    setCurrentPage(nextPage);
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore, currentPage, filteredHeroes, sortOrder]);

  const lastHeroElementRef = useCallback(node => {
    if (isFetching || !node) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
        loadMoreHeroes();
      }
    });
    
    observer.current.observe(node);
  }, [isFetching, hasMore, isLoadingMore, loadMoreHeroes]);

  // Initial setup and hero fetching
  useEffect(() => {
    const initAndFetch = async () => {
      try {
        await initializeContracts();
        const isNetworkCorrect = await checkNetwork();
        if (!isNetworkCorrect) {
          setError('Please connect to the DFK Testnet.');
          return;
        }
        if (!validateContracts()) {
          setError('One or more contracts failed to initialize.');
          return;
        }
        if (connectedAddress) {
          await fetchHeroes();
        }
      } catch (err) {
        setError('Failed to initialize app or fetch heroes.');
      }
    };

    initAndFetch();
  }, [connectedAddress, fetchHeroes]);

  // Apply filters when heroes or filters change
  useEffect(() => {
    const applyFilters = async () => {
      if (heroes.length > 0) {
        // Apply filters to all heroes
        const filtered = await applyFiltersAndSort(heroes, filters, sortOrder, !isBuyTab, listedHeroes);
        setFilteredHeroes(filtered);
        
        // Reset pagination when filters change
        setDisplayedHeroes(filtered.slice(0, HEROES_PER_PAGE));
        setHasMore(filtered.length > HEROES_PER_PAGE);
        setCurrentPage(0);
      }
    };

    if (!isFetching) {
      applyFilters();
    }
  }, [heroes, filters, sortOrder, listedHeroes, isBuyTab, isFetching]);

  // Clear cache on blockchain events
  useEffect(() => {
    if (listedHeroes?.length > 0) {
      heroCache.clear();
    }
  }, [listedHeroes]);

  // Add isFullyLoaded calculation
  const isFullyLoaded = useMemo(() => {
    return !isFetching && heroes.length > 0 && displayedHeroes.length === filteredHeroes.length;
  }, [isFetching, heroes.length, displayedHeroes.length, filteredHeroes.length]);

  return {
    heroes: displayedHeroes,
    loading: isFetching,
    isLoadingMore,
    isFullyLoaded,
    hasMore,
    error,
    lastHeroElementRef,
    fetchHeroes,
  };
};
