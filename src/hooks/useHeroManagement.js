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
import { enhanceHeroWithGeneData } from '../utils/heroGeneParser';

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
  const [loading, setLoading] = useState(true);
  const observer = useRef();
  const displayStableRef = useRef(false);
  const processedHeroesCountRef = useRef(0);
  // Normalize address to lowercase for all uses
  const normalizedAddress = connectedAddress ? connectedAddress.toLowerCase() : undefined;
  const mode = isBuyTab ? 'buy' : 'sell';
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

  // For benchmarking
const setFetchStartTime = () => {
  if (typeof window !== 'undefined') {
    window.__honkSellFetchStart = performance.now();
  }
};

const getFetchTime = () => {
  if (typeof window !== 'undefined' && window.__honkSellFetchStart) {
    return performance.now() - window.__honkSellFetchStart;
  }
  return 0;
};

const fetchHeroes = useCallback(async () => {
    if (!normalizedAddress || isFetching) return;
    
    setIsFetching(true);
    setLoading(true);
    setError(null);
    displayStableRef.current = false;
    processedHeroesCountRef.current = 0;

    try {
      // Start benchmark
      setFetchStartTime();
// NOTE: isFetching removed from dependency array below.
      // console.log(`[HONK] Starting to fetch heroes for: ${normalizedAddress}`);
      
      // Try to get from cache first
      const cacheKey = `${mode}-${normalizedAddress}`;
      const cachedData = heroCache.get(cacheKey);
      
      if (Array.isArray(cachedData) && cachedData.length > 0) {
        // console.log(`[HONK] Found ${cachedData.length} heroes in cache for SellTab`);
        setHeroes(cachedData);
        setIsFetching(false);
        return;
      }

      // Use the progress callback to handle incremental loading
      await getHeroesByOwner(normalizedAddress, (progress) => {
        const { heroes: newHeroes, totalProcessed, isFirstBatch, elapsedMs, isDone } = progress;
        
        // Update our tracking
        processedHeroesCountRef.current = totalProcessed;
        
        if (Array.isArray(newHeroes) && newHeroes.length > 0) {
          // If this is the first batch, we want to show it immediately
          if (isFirstBatch) {
            // console.log(`[HONK] First batch of ${newHeroes.length} heroes loaded in ${elapsedMs}ms`);
            setHeroes(newHeroes);
            setLoading(false); // Turn off initial loading indicator
            // For SellTab, cache after first batch
            if (mode === 'sell') {
              heroCache.set(cacheKey, newHeroes);
            }
          } else {
            // For subsequent batches, append to existing heroes
            setHeroes(prevHeroes => {
              const updatedHeroes = [...prevHeroes, ...newHeroes];
              // console.log(`[HONK] Loaded ${newHeroes.length} more heroes. Total: ${updatedHeroes.length}`);
              return updatedHeroes;
            });
          }
        }
        
        // If we're done loading all heroes, update cache and finalize
        if (isDone) {
          setHeroes(currentHeroes => {
            // console.log(`[HONK] All ${currentHeroes.length} heroes loaded in ${getFetchTime()}ms`);
            // Store in cache
            heroCache.set(cacheKey, currentHeroes);
            setLoading(false); // Ensure loading is turned off
            return currentHeroes;
          });
        }
      });
    } catch (err) {
      console.error('Failed to fetch heroes:', err);
      setError('Failed to fetch heroes');
    } finally {
      setIsFetching(false);
    }
  }, [connectedAddress, mode]);

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
          setError('Please connect to the DFK Mainnet.');
          return;
        }
        if (!validateContracts()) {
          setError('One or more contracts failed to initialize.');
          return;
        }
        if (normalizedAddress) {
          await fetchHeroes();
        }
      } catch (err) {
        setError('Failed to initialize app or fetch heroes.');
      }
    };

    initAndFetch();

  }, [connectedAddress, mode]);

  // Enhance heroes with gene data when in SellTab
  const enhancedHeroes = useMemo(() => {
    if (!isBuyTab && heroes.length > 0) {
      // Helper to map statsUnknown values to crafting professions
      const getProfessionFromStat = (statValue) => {
        const professionMap = {
          0: 'Blacksmithing',
          2: 'Goldsmithing',
          4: 'Armorsmithing',
          6: 'Woodworking',
          8: 'Leatherworking',
          10: 'Tailoring',
          12: 'Enchanting',
          14: 'Alchemy'
        };
        return professionMap[statValue] || 'none';
      };

      return heroes.map(hero => {
        // Ensure hero is enhanced with gene data exactly once
        const enriched = hero.hasOwnProperty('visualTraits') ? hero : enhanceHeroWithGeneData(hero);

        // Derive crafting professions if they are missing or set to "none"
        const needsCraftProf1 = !enriched.craftProf1 || enriched.craftProf1 === 'none';
        const needsCraftProf2 = !enriched.craftProf2 || enriched.craftProf2 === 'none';

        if (!needsCraftProf1 && !needsCraftProf2) {
          return enriched;
        }

        const craftProf1 = needsCraftProf1 ? getProfessionFromStat(parseInt(enriched.statsUnknown1 || 0)) : enriched.craftProf1;
        const craftProf2 = needsCraftProf2 ? getProfessionFromStat(parseInt(enriched.statsUnknown2 || 0)) : enriched.craftProf2;

        return {
          ...enriched,
          craftProf1,
          craftProf2
        };
      });
    }
    return heroes;
  }, [heroes, isBuyTab]);

  // Apply filters when heroes or filters change
  useEffect(() => {
    const updateFiltered = async () => {
      try {
        // Apply filters to enhanced heroes
        const filtered = await applyFiltersAndSort(
          enhancedHeroes,
          filters,
          sortOrder,
          !isBuyTab,
          Array.from(listedHeroes || [])
        );

        setFilteredHeroes(filtered);
        setDisplayedHeroes(filtered.slice(0, HEROES_PER_PAGE));
        setHasMore(filtered.length > HEROES_PER_PAGE);
        setCurrentPage(0);
      } catch (err) {
        console.error('Error applying filters:', err);
        setError('Error filtering heroes');
      }
    };

    if (enhancedHeroes.length > 0) {
      updateFiltered();
    }
  }, [enhancedHeroes, filters, sortOrder, isBuyTab, listedHeroes]);



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
