import { useState, useEffect, useCallback, useRef } from 'react';
import { HONKMarketplaceContract, DFKHeroContract } from '../Web3Config';
import { getHeroData } from '../utils/heroUtils';
import { applyFiltersAndSort as applyFiltersAndSortUtil } from '../utils/filterUtils';
import { enhanceHeroWithGeneData } from '../utils/heroGeneParser';
import { marketplaceCache } from '../utils/cacheUtils';

const extractHeroIds = (rawResponse) => {
  if (!rawResponse || !rawResponse[0] || !Array.isArray(rawResponse[0])) {
    return [];
  }

  return rawResponse[0]
    .filter(hero => {
      // Filter out invalid heroes (id === 0 or null/undefined)
      if (!hero || !hero.id || hero.id === 0n) return false;
      return true;
    })
    .map(hero => hero.id);
};

export const useBuyTab = (connectedAddress, filters, sortOrder) => {
  const [heroes, setHeroes] = useState([]);
  const [filteredHeroes, setFilteredHeroes] = useState([]);
  const [displayedHeroes, setDisplayedHeroes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [loadStats, setLoadStats] = useState({ totalHeroes: 0, loadTimeMs: 0, isDone: false });
  const lastFetchRef = useRef(null);
  const eventSubscriptions = useRef({ heroListed: null, heroPurchased: null });
  const isSubscribed = useRef(false);
  const displayStableRef = useRef(false);

  const HEROES_PER_PAGE = 8;

  const createDefaultHeroData = (heroId, marketplaceData) => ({
    id: heroId.toString(),
    name: `Hero #${heroId}`,
    class: 'Unknown',
    subClass: 'Unknown',
    level: 1,
    generation: 1,
    price: marketplaceData.price.toString(),
    owner: marketplaceData.owner,
    isForSale: true
  });

  const applyFiltersAndSort = useCallback(
    async (heroList) => {
      if (!Array.isArray(heroList)) {
        setError('Invalid hero data received');
        return;
      }

      try {
        // Use the same filtering system as SellTab
        const filtered = await applyFiltersAndSortUtil(heroList, filters, sortOrder, false);
        
        setFilteredHeroes(filtered);
        setDisplayedHeroes(filtered.slice(0, HEROES_PER_PAGE));
        setHasMore(filtered.length > HEROES_PER_PAGE);
      } catch (error) {
        setError('Error filtering heroes');
      }
    },
    [filters, sortOrder]
  );

  const fetchHeroes = useCallback(async (address) => {
    const fetchId = Date.now();
    lastFetchRef.current = fetchId;
    
    if (!address || isFetching) return;

    try {
      setIsFetching(true);
      setLoading(true);
      setError(null);
      
      // Debug counters to track hero processing
      const filterDebug = {
        total: 0,
        marketplaceInvalid: 0,
        wrongNetwork: 0,
        ownershipMismatch: 0,
        ownerIsUser: 0,
        processingErrors: 0,
        validHeroes: 0
      };
      
      // Local array to track valid heroes (React state updates are async)
      const validHeroesArray = [];

      // Benchmark: mark fetch start
      if (typeof window !== 'undefined') {
        window.__honkFetchStart = performance.now();
      }
      setLoadStats({ totalHeroes: 0, loadTimeMs: 0, isDone: false });
      
      // Check cache first
      // console.log('[HONK] Checking marketplace cache...');
      const cachedHeroes = marketplaceCache.getListedHeroes();
      if (cachedHeroes && cachedHeroes.length > 0) {
        // console.log(`[HONK] Found ${cachedHeroes.length} heroes in cache!`);
        // Ensure we have a fresh copy of the array
        const cachedHeroesCopy = [...cachedHeroes];
        
        // Update state with cached heroes
        setHeroes(cachedHeroesCopy);
        setLoading(false);
        setIsFetching(false);
        
        // Apply filters to cached heroes
        await applyFiltersAndSort(cachedHeroesCopy);
        
        // Log and update UI
        if (typeof window !== 'undefined' && window.__honkFetchStart) {
          const loadTime = performance.now() - window.__honkFetchStart;
          // console.log(`[HONK] Loaded from cache in ${loadTime.toFixed(0)} ms`);
          
          setLoadStats({
            totalHeroes: cachedHeroesCopy.length,
            validHeroes: cachedHeroesCopy.length,
            filteredOut: 0,
            loadTimeMs: Math.round(loadTime),
            isDone: true,
            fromCache: true
          });
        }
        return;
      }
      
      // If no cache, fetch from blockchain
      const response = await HONKMarketplaceContract.methods.getListedHeroes().call();
      const heroIds = extractHeroIds(response);
      
      // Log initial count of heroes from contract
      // console.log(`[HONK] Initial heroes from contract: ${heroIds.length}`);
      // console.log(`[HONK] Connected address: ${address}`);
      filterDebug.total = heroIds.length;

      if (!heroIds.length) {
        setHeroes([]);
        return;
      }

      // Reset current heroes to show loading placeholders
      setHeroes([]);

      // Process heroes incrementally to show them as soon as they are ready
      const heroPromises = heroIds.map(async (heroId) => {
        try {
          if (lastFetchRef.current !== fetchId) return;

          // Retrieve marketplace info first
          const marketplaceData = await HONKMarketplaceContract.methods.getHero(heroId).call();

          // Check if hero is for sale and not owned by current user
          if (!marketplaceData || !marketplaceData.isForSale) {
            filterDebug.marketplaceInvalid++;
            // console.log(`[HONK] Hero ${heroId} filtered: not for sale or invalid marketplace data`);
            return;
          }
          
          if (marketplaceData.owner.toLowerCase() === address.toLowerCase()) {
            filterDebug.ownerIsUser++;
            // console.log(`[HONK] Hero ${heroId} filtered: owned by current user`);
            return;
          }

          // Fetch hero core data (with fallback)
          let heroData;
          try {
            heroData = await getHeroData(heroId);

            if (heroData.network && heroData.network !== 'dfk') {
              filterDebug.wrongNetwork++;
              // console.log(`[HONK] Hero ${heroId} filtered: wrong network (${heroData.network})`);
              return;
            }

            try {
              const currentOwner = await DFKHeroContract.methods.ownerOf(heroId).call();
              if (currentOwner.toLowerCase() !== marketplaceData.owner.toLowerCase()) {
                filterDebug.ownershipMismatch++;
                // console.log(`[HONK] Hero ${heroId} filtered: ownership mismatch`);
                // console.log(`   Listed owner: ${marketplaceData.owner.toLowerCase()}`);
                // console.log(`   Actual owner: ${currentOwner.toLowerCase()}`);
                return;
              }
            } catch (error) {
              filterDebug.processingErrors++;
              // console.log(`[HONK] Error processing hero ${heroId}:`, error.message);
              return;
            }
          } catch {
            heroData = createDefaultHeroData(heroId, marketplaceData);
          }

          // === Build processed hero (same logic as before) ===
          const statMapping = {
            'mining': 'Mining',
            'gardening': 'Gardening',
            'foraging': 'Foraging',
            'fishing': 'Fishing',
            0: 'Blacksmithing',
            2: 'Goldsmithing',
            4: 'Armorsmithing',
            6: 'Woodworking',
            8: 'Leatherworking',
            10: 'Tailoring',
            12: 'Enchanting',
            14: 'Alchemy'
          };

          const statsUnknown1 = heroData?.statsUnknown1 || 0;
          const statsUnknown2 = heroData?.statsUnknown2 || 0;

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
            return professionMap[statValue] || '';
          };

          const craftProf1 = getProfessionFromStat(statsUnknown1);
          const craftProf2 = getProfessionFromStat(statsUnknown2);

          const enrichedHero = enhanceHeroWithGeneData(heroData);

          const processedHero = {
            ...enrichedHero,
            id: heroId.toString(),
            price: marketplaceData.price.toString(),
            owner: marketplaceData.owner,
            isForSale: true,
            mainClass: heroData?.mainClass || 'Unknown',
            subClass: heroData?.subClass || 'Unknown',
            stats: {
              strength: parseInt(heroData?.strength) || 0,
              dexterity: parseInt(heroData?.dexterity) || 0,
              agility: parseInt(heroData?.agility) || 0,
              vitality: parseInt(heroData?.vitality) || 0,
              endurance: parseInt(heroData?.endurance) || 0,
              intelligence: parseInt(heroData?.intelligence) || 0,
              wisdom: parseInt(heroData?.wisdom) || 0,
              luck: parseInt(heroData?.luck) || 0
            },
            mining: parseInt(heroData?.mining) || 0,
            gardening: parseInt(heroData?.gardening) || 0,
            foraging: parseInt(heroData?.foraging) || 0,
            fishing: parseInt(heroData?.fishing) || 0,
            level: parseInt(heroData?.level) || 0,
            stamina: parseInt(heroData?.stamina) || 0,
            xp: parseInt(heroData?.xp) || 0,
            craftProf1,
            craftProf2,
            craftSkill1: statsUnknown1 > 0 ? 0 : 0,
            craftSkill2: statsUnknown2 > 0 ? 0 : 0,
            rarity: heroData?.rarity || 'common'
          };

          // === Push hero incrementally ===
          if (lastFetchRef.current === fetchId) {
            filterDebug.validHeroes++;
            // console.log(`[HONK] Hero ${heroId} passed all checks and is valid`);
            
            // Add to our local tracking array
            validHeroesArray.push(processedHero);
            
            setHeroes(prev => {
              const updated = [...prev, processedHero];
              
              // If we've got at least HEROES_PER_PAGE heroes or this is the first hero,
              // update the filtered list
              if (updated.length >= HEROES_PER_PAGE || updated.length === 1) {
                // Turn off loading when we have our first hero
                if (loading) {
                  setLoading(false);
                }
                
                // Only update displayed heroes if they're not yet stable
                if (!displayStableRef.current) {
                  setFilteredHeroes(updated);
                  setDisplayedHeroes(updated.slice(0, HEROES_PER_PAGE));
                  
                  // Once we have a full page, mark display as stable
                  if (updated.length >= HEROES_PER_PAGE) {
                    displayStableRef.current = true;
                  }
                }
              }
              
              return updated;
            });
          }
        } catch {
          // swallow individual errors to keep loading others
        }
      });

      await Promise.allSettled(heroPromises);
      
      // Log detailed filtering statistics
      // console.log(`[HONK] ===== Hero Filtering Summary =====`);
      // console.log(`[HONK] Total heroes from contract: ${filterDebug.total}`);
      // console.log(`[HONK] Heroes filtered out due to:`);
      // console.log(`[HONK]   - Not for sale/invalid data: ${filterDebug.marketplaceInvalid}`);
      // console.log(`[HONK]   - Owned by current user: ${filterDebug.ownerIsUser}`);
      // console.log(`[HONK]   - Wrong network: ${filterDebug.wrongNetwork}`);
      // console.log(`[HONK]   - Ownership mismatch: ${filterDebug.ownershipMismatch}`);
      // console.log(`[HONK]   - Processing errors: ${filterDebug.processingErrors}`);
      // console.log(`[HONK] Valid heroes after filtering: ${filterDebug.validHeroes}`);
      // console.log(`[HONK] ================================`);

      // Finalize
      if (lastFetchRef.current === fetchId) {
        setIsFetching(false);
        
        // Reset display stability for next time
        displayStableRef.current = false;
        
        // Final filter pass to ensure we have properly sorted heroes
        // Use our local array which has the correct heroes count
        if (validHeroesArray.length > 0) {
          // One final state update with all heroes to ensure consistency
          setHeroes(validHeroesArray);
          await applyFiltersAndSort(validHeroesArray);
        }
        
        // Calculate and display total load time with filtering details
        if (typeof window !== 'undefined' && window.__honkFetchStart) {
          const loadTime = performance.now() - window.__honkFetchStart;
          
          // Log heroes count from our tracked array, not from async state
          // console.log(`[HONK] Heroes in validHeroesArray: ${validHeroesArray.length}`);
          // console.log(`[HONK] Filtered heroes: ${filteredHeroes.length}`);
          // console.log(`[HONK] Displayed heroes: ${displayedHeroes.length}`);
          
          // Use our local count instead of relying on React state
          const validCount = validHeroesArray.length;
          const filteredOut = heroIds.length - validCount;
          
          // console.log(`[HONK] All ${heroIds.length} heroes processed in ${loadTime.toFixed(0)} ms`);
          // console.log(`[HONK] ${validCount} valid heroes kept, ${filteredOut} heroes filtered out`);
          
          // Store in cache for future use
          if (validHeroesArray.length > 0) {
            // console.log(`[HONK] Storing ${validHeroesArray.length} heroes in cache`);
            marketplaceCache.setListedHeroes([...validHeroesArray]); // Create a deep copy to avoid reference issues
          } else {
            // console.log(`[HONK] Not caching heroes: empty or invalid (${validHeroesArray.length})`);
          }
          
          setLoadStats({
            totalHeroes: heroIds.length,
            validHeroes: validCount,
            filteredOut: filteredOut,
            loadTimeMs: Math.round(loadTime),
            isDone: true,
            fromCache: false
          });
        }
      }
    } catch (error) {
      if (lastFetchRef.current === fetchId) {
        setError('Failed to fetch heroes: ' + error.message);
        setHeroes([]);
      }
    } finally {
      if (lastFetchRef.current === fetchId) {
        setIsFetching(false);
      }
    }
  }, []);

  useEffect(() => {
    const applyFilters = async () => {
      if (heroes.length > 0) {
        await applyFiltersAndSort(heroes);
      }
    };
    applyFilters();
  }, [heroes, filters, sortOrder, applyFiltersAndSort]);

  useEffect(() => {
    if (connectedAddress) {
      fetchHeroes(connectedAddress);
    }
    return () => {
      lastFetchRef.current = null;
    };
  }, [connectedAddress, fetchHeroes]);

  const setupSubscriptions = useCallback(() => {
    if (!HONKMarketplaceContract || isSubscribed.current) {
      return;
    }

    try {
      const heroListedEvent = HONKMarketplaceContract.events.HeroListed();
      const heroPurchasedEvent = HONKMarketplaceContract.events.HeroPurchased();

      eventSubscriptions.current = {
        heroListed: heroListedEvent,
        heroPurchased: heroPurchasedEvent
      };

      heroListedEvent.on('data', () => {
        fetchHeroes(connectedAddress);
      });

      heroPurchasedEvent.on('data', () => {
        fetchHeroes(connectedAddress);
      });

      isSubscribed.current = true;
    } catch (error) {
      setError('Failed to setup event subscriptions');
    }
  }, [connectedAddress, fetchHeroes]);

  const cleanupSubscriptions = useCallback(() => {
    if (!eventSubscriptions.current) return;

    Object.values(eventSubscriptions.current).forEach(subscription => {
      if (subscription) {
        subscription.unsubscribe();
      }
    });

    eventSubscriptions.current = { heroListed: null, heroPurchased: null };
    isSubscribed.current = false;
  }, []);
  
  useEffect(() => {
    if (!connectedAddress || !HONKMarketplaceContract?.methods || isSubscribed.current) {
      return;
    }

    // Setup event handling for market events with cache clearing
    try {
      const heroListedEvent = HONKMarketplaceContract.events.HeroListed();
      const heroPurchasedEvent = HONKMarketplaceContract.events.HeroPurchased();
      
      eventSubscriptions.current = {
        heroListed: heroListedEvent,
        heroPurchased: heroPurchasedEvent
      };
      
      // On market events, clear cache and refetch
      const onMarketEvent = () => {
        // console.log('[HONK] Market event detected, clearing cache');
        marketplaceCache.clearListedHeroes();
        fetchHeroes(connectedAddress);
      };
      
      heroListedEvent.on('data', onMarketEvent);
      heroPurchasedEvent.on('data', onMarketEvent);
      
      isSubscribed.current = true;
    } catch (error) {
      setError('Failed to setup event subscriptions');
    }
    
    // Cleanup function
    return () => {
      if (!isSubscribed.current) return;
      
      try {
        if (eventSubscriptions.current.heroPurchased) {
          eventSubscriptions.current.heroPurchased.unsubscribe();
          eventSubscriptions.current.heroPurchased = null;
        }
        isSubscribed.current = false;
      } catch (error) {
        // Error handling without console.error
      }
    };

    const setupSubscriptions = async () => {
      if (isSubscribed.current) {
        return;
      }

      try {
        // Create event subscriptions only if contract is ready
        if (HONKMarketplaceContract?.events) {
          const heroListedEvent = HONKMarketplaceContract.events.HeroListed({}, {
            fromBlock: 'latest'
          });

          if (heroListedEvent) {
            heroListedEvent.on('data', async (event) => {
              if (!isFetching) {
                await fetchHeroes(connectedAddress);
              }
            });

            heroListedEvent.on('error', (error) => {
              // Error handling without console.error
            });

            eventSubscriptions.current.heroListed = heroListedEvent;
          }

          const heroPurchasedEvent = HONKMarketplaceContract.events.HeroPurchased({}, {
            fromBlock: 'latest'
          });

          if (heroPurchasedEvent) {
            heroPurchasedEvent.on('data', async (event) => {
              if (!isFetching) {
                await fetchHeroes(connectedAddress);
              }
            });

            heroPurchasedEvent.on('error', (error) => {
              // Error handling without console.error
            });

            eventSubscriptions.current.heroPurchased = heroPurchasedEvent;
          }

          isSubscribed.current = true;
        }
      } catch (error) {
        cleanupSubscriptions();
      }
    };

    setupSubscriptions();

    return () => {
      cleanupSubscriptions();
    };
  }, [connectedAddress, fetchHeroes, HONKMarketplaceContract, isFetching]);

  // Effect: Log when first hero becomes visible
  useEffect(() => {
    if (heroes.length === 1 && typeof window !== 'undefined' && window.__honkFetchStart) {
      const delta = performance.now() - window.__honkFetchStart;
      // eslint-disable-next-line no-console
      // console.log(`[HONK] First hero visible after ${delta.toFixed(0)} ms`);
    }
  }, [heroes]);

  // Effect: Log when displayed heroes first non-empty
  useEffect(() => {
    if (displayedHeroes.length === 1 && typeof window !== 'undefined' && window.__honkFetchStart) {
      const delta = performance.now() - window.__honkFetchStart;
      // eslint-disable-next-line no-console
      // console.log(`[HONK] First hero displayed (after filters) in ${delta.toFixed(0)} ms`);
    }
  }, [displayedHeroes]);

  const loadMoreHeroes = useCallback(() => {
    if (isLoadingMore || !hasMore || !Array.isArray(filteredHeroes)) {
      setIsLoadingMore(false);
      return;
    }

    setIsLoadingMore(true);
    
    const startIndex = displayedHeroes.length;
    const endIndex = startIndex + HEROES_PER_PAGE;
    const newHeroes = filteredHeroes.slice(startIndex, endIndex);

    if (newHeroes.length === 0) {
      setHasMore(false);
      setIsLoadingMore(false);
      return;
    }

    setDisplayedHeroes(prev => [...prev, ...newHeroes]);
    setHasMore(endIndex < filteredHeroes.length);
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore, displayedHeroes.length, filteredHeroes]);



  return {
    heroes,
    displayedHeroes,
    loading,
    error,
    hasMore,
    isLoadingMore,
    loadMoreHeroes,
    fetchHeroes,
    setHeroes,
    loadStats
  };
};
