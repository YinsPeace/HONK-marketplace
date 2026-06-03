import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { initializeContracts, checkNetwork, validateContracts } from '../Web3Config';
import { getHeroesByOwner } from '../utils/heroUtils';
import { applyFiltersAndSort } from '../utils/filterUtils';
import { HONKMarketplaceContract } from '../Web3Config';
import { heroCache } from '../utils/cacheUtils';
import { enhanceHeroWithGeneData } from '../utils/heroGeneParser';

const HEROES_PER_PAGE = 40;

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
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [cacheVersion, setCacheVersion] = useState(0); // Add cache version for invalidation
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

  const processHero = useCallback(
    async (hero) => {
      if (isBuyTab) {
        try {
          const marketplaceData = await HONKMarketplaceContract.methods.getHero(hero.id).call();
          return {
            ...hero,
            price: marketplaceData.price,
            isForSale: marketplaceData.isForSale,
          };
        } catch (err) {
          return hero;
        }
      }
      return hero;
    },
    [isBuyTab]
  );

  // Function to add heroes in batches
  const addHeroesBatch = useCallback((heroes) => {
    setHeroes((prevHeroes) => {
      const newHeroes = [...prevHeroes];
      heroes.forEach((hero) => {
        if (!newHeroes.some((h) => h.id === hero.id)) {
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

  const fetchHeroes = useCallback(
    async (forceRefresh = false) => {
      if (!normalizedAddress || isFetching) return;

      setIsFetching(true);
      setLoading(true);
      setError(null);
      displayStableRef.current = false;
      processedHeroesCountRef.current = 0;

      try {
        // Start benchmark
        setFetchStartTime();

        // Generate cache key with version
        const cacheKey = `${mode}-${normalizedAddress}-v${cacheVersion}`;

        // Only check cache if not forcing refresh
        if (!forceRefresh) {
          const cachedData = heroCache.get(cacheKey);

          if (Array.isArray(cachedData) && cachedData.length > 0) {
            setHeroes(cachedData);
            setIsFetching(false);
            setLoading(false);
            setLastRefreshed(new Date());
            return;
          }
        } else {
          // Clear any existing cache for this key if forcing refresh
          heroCache.clearCacheForMode(mode, normalizedAddress);
        }

        // Use the progress callback to handle incremental loading
        await getHeroesByOwner(normalizedAddress, (progress) => {
          const { heroes: newHeroes, totalProcessed, isFirstBatch, elapsedMs, isDone } = progress;

          // Update our tracking
          processedHeroesCountRef.current = totalProcessed;

          if (Array.isArray(newHeroes) && newHeroes.length > 0) {
            if (isFirstBatch) {
              setHeroes(newHeroes);
              setLoading(false);
              // Cache first batch for SellTab
              if (mode === 'sell') {
                heroCache.set(cacheKey, newHeroes);
              }
            } else {
              setHeroes((prevHeroes) => {
                const updatedHeroes = [...prevHeroes, ...newHeroes];
                return updatedHeroes;
              });
            }
          }

          // If we're done loading all heroes, update cache and finalize
          if (isDone) {
            setHeroes((currentHeroes) => {
              // Store in cache with versioned key
              heroCache.set(cacheKey, currentHeroes);
              setLoading(false);
              setLastRefreshed(new Date());
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
    },
    [connectedAddress, mode]
  );

  const loadMoreHeroes = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    const startIndex = nextPage * HEROES_PER_PAGE;
    const endIndex = startIndex + HEROES_PER_PAGE;

    setDisplayedHeroes((prev) => {
      // Get the next batch of heroes and append them to the existing ones
      const nextBatch = filteredHeroes.slice(startIndex, endIndex);
      const combined = [...prev, ...nextBatch];
      // Re-sort the entire combined array
      return combined.sort((a, b) => {
        if (sortOrder === 'generation-asc') {
          return Number(a.generation || 0) - Number(b.generation || 0);
        }
        if (sortOrder === 'generation-desc') {
          return Number(b.generation || 0) - Number(a.generation || 0);
        }
        return 0;
      });
    });

    setHasMore(endIndex < filteredHeroes.length);
    setCurrentPage(nextPage);
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore, currentPage, filteredHeroes, sortOrder]);

  const lastHeroElementRef = useCallback(
    (node) => {
      if (isFetching || !node) return;

      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreHeroes();
        }
      });

      observer.current.observe(node);
    },
    [isFetching, hasMore, isLoadingMore, loadMoreHeroes]
  );

  // Initial setup and hero fetching
  useEffect(() => {
    const initAndFetch = async () => {
      try {
        await initializeContracts();
        const isNetworkCorrect = await checkNetwork();
        if (!isNetworkCorrect) {
          setError('Please connect to the DFK Chain (mainnet or testnet).');
          return;
        }
        if (!validateContracts()) {
          setError('One or more contracts failed to initialize.');
          return;
        }
        if (normalizedAddress) {
          // Always force refresh on initial load to prevent stale cache issues
          await fetchHeroes(true);
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
          14: 'Alchemy',
        };
        return professionMap[statValue] || 'none';
      };

      return heroes.map((hero) => {
        // Ensure hero is enhanced with gene data exactly once
        const enriched = hero.hasOwnProperty('visualTraits') ? hero : enhanceHeroWithGeneData(hero);

        // Derive crafting professions if they are missing or set to "none"
        const needsCraftProf1 = !enriched.craftProf1 || enriched.craftProf1 === 'none';
        const needsCraftProf2 = !enriched.craftProf2 || enriched.craftProf2 === 'none';

        if (!needsCraftProf1 && !needsCraftProf2) {
          return enriched;
        }

        const craftProf1 = needsCraftProf1
          ? getProfessionFromStat(parseInt(enriched.statsUnknown1 || 0))
          : enriched.craftProf1;
        const craftProf2 = needsCraftProf2
          ? getProfessionFromStat(parseInt(enriched.statsUnknown2 || 0))
          : enriched.craftProf2;

        return {
          ...enriched,
          craftProf1,
          craftProf2,
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

  // Add function to force refresh heroes
    const refreshHeroes = useCallback(() => {
    // Clear heroes to show immediate feedback and prevent stale data
    setHeroes([]);
    // Increment cache version to trigger the fetch effect
    setCacheVersion((prev) => prev + 1);
  }, []);

  // Fetch heroes when dependencies change
  useEffect(() => {
    // Only fetch if not already fetching and we have an address
    if (!normalizedAddress || isFetching) return;

    const fetchData = async () => {
      setIsFetching(true);
      setLoading(true);
      setError(null);
      displayStableRef.current = false;
      processedHeroesCountRef.current = 0;

      try {
        // Start benchmark
        setFetchStartTime();

        // Generate cache key with version
        const cacheKey = `${mode}-${normalizedAddress}-v${cacheVersion}`;

        // Only check cache if not forcing refresh
        const forceRefresh = cacheVersion > 0; // If we've incremented the version, force refresh

        if (!forceRefresh) {
          const cachedData = heroCache.get(cacheKey);

          if (Array.isArray(cachedData) && cachedData.length > 0) {
            setHeroes(cachedData);
            setIsFetching(false);
            setLoading(false);
            setLastRefreshed(new Date());
            return;
          }
        } else {
          // Clear any existing cache for this key if forcing refresh
          heroCache.clearCacheForMode(mode, normalizedAddress);
        }

        // Use the progress callback to handle incremental loading
        await getHeroesByOwner(normalizedAddress, (progress) => {
          const { heroes: newHeroes, isFirstBatch, isDone } = progress;

          if (Array.isArray(newHeroes) && newHeroes.length > 0) {
            if (isFirstBatch) {
              setHeroes(newHeroes);
              setLoading(false);
              // Cache first batch for SellTab
              if (mode === 'sell') {
                heroCache.set(cacheKey, newHeroes);
              }
            } else {
              setHeroes((prevHeroes) => [...prevHeroes, ...newHeroes]);
            }
          }

          // If we're done loading all heroes, update cache and finalize
          if (isDone) {
            setHeroes((currentHeroes) => {
              // Store in cache with versioned key
              heroCache.set(cacheKey, currentHeroes);
              setLoading(false);
              setLastRefreshed(new Date());
              return currentHeroes;
            });
          }
        });
      } catch (err) {
        console.error('Error fetching heroes:', err);
        setError('Failed to load heroes');
        setLoading(false);
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
    // Add heroCache and getHeroesByOwner to dependencies to satisfy the linter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedAddress, mode, cacheVersion, heroCache, getHeroesByOwner]);

  return {
    heroes: displayedHeroes,
    loading: isFetching,
    isLoadingMore,
    isFullyLoaded,
    hasMore,
    error,
    lastHeroElementRef,
    fetchHeroes,
    refreshHeroes,
    updateHeroCache,
    getCachedHeroes,
    setDisplayedHeroes,
    setCurrentPage,
    setHasMore,
    setError,
    setLoading,
    setIsLoadingMore,
    setIsFetching,
    setHeroes,
    setFilteredHeroes,
    lastRefreshed,
  };
};
