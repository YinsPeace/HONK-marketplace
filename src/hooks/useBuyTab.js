import { useState, useEffect, useCallback, useRef } from 'react';
import { HONKMarketplaceContract, DFKHeroContract } from '../Web3Config';
import { getHeroData } from '../utils/heroUtils';
import { applyFiltersAndSort as applyFiltersAndSortUtil } from '../utils/filterUtils';

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
  const lastFetchRef = useRef(null);
  const eventSubscriptions = useRef({ heroListed: null, heroPurchased: null });
  const isSubscribed = useRef(false);

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

      const response = await HONKMarketplaceContract.methods.getListedHeroes().call();
      const heroIds = extractHeroIds(response);

      if (!heroIds.length) {
        setHeroes([]);
        return;
      }

      const heroesData = await Promise.all(
        heroIds.map(async (heroId) => {
          try {
            if (lastFetchRef.current !== fetchId) return null;
            
            // Get marketplace data first
            const marketplaceData = await HONKMarketplaceContract.methods.getHero(heroId).call();
            
            // Check if hero is for sale and not owned by current user
            if (!marketplaceData || !marketplaceData.isForSale || 
                marketplaceData.owner.toLowerCase() === address.toLowerCase()) {
              return null;
            }

            // Only fetch hero data if the hero is available
            let heroData;
            try {
              heroData = await getHeroData(heroId);
              
              // Check if hero is on the correct chain (DFK Chain/Crystalvale)
              if (heroData.network && heroData.network !== 'dfk') {
                // Hero has moved to another chain, should be filtered out
                return null;
              }
              
              // Check if hero is still owned by the original owner in the marketplace listing
              try {
                // Get the current owner from the contract
                const currentOwner = await DFKHeroContract.methods.ownerOf(heroId).call();
                
                // If the current owner is different from the listing owner, filter it out
                if (currentOwner.toLowerCase() !== marketplaceData.owner.toLowerCase()) {
                  return null;
                }
              } catch (ownerError) {
                // If we can't verify ownership, better to filter it out
                return null;
              }
            } catch (error) {
              heroData = createDefaultHeroData(heroId, marketplaceData);
            }

            // Map stat names to match the expected format
            const statMapping = {
              'mining': 'Mining',
              'gardening': 'Gardening',
              'foraging': 'Foraging',
              'fishing': 'Fishing',
              'blacksmithing': 'Blacksmithing',
              'goldsmithing': 'Goldsmithing',
              'armorsmithing': 'Armorsmithing',
              'woodworking': 'Woodworking',
              'leatherworking': 'Leatherworking',
              'jewelcrafting': 'Jewelcrafting',
              'enchanting': 'Enchanting',
              'alchemy': 'Alchemy'
            };

            // Parse statGenes to get crafting professions
            const statGenes = heroData?.statGenes || '';
            const statsUnknown1 = heroData?.statsUnknown1 || 0;
            const statsUnknown2 = heroData?.statsUnknown2 || 0;

            // Helper function to get profession name from stat
            const getProfessionFromStat = (statValue) => {
              const professionMap = {
                0: '',
                1: 'blacksmithing',
                2: 'goldsmithing',
                3: 'armorsmithing',
                4: 'woodworking',
                5: 'leatherworking',
                6: 'jewelcrafting',
                7: 'enchanting',
                8: 'alchemy'
              };
              const profession = professionMap[statValue] || '';
              return statMapping[profession] || '';
            };

            // Get crafting professions from statsUnknown values
            const craftProf1 = getProfessionFromStat(statsUnknown1);
            const craftProf2 = getProfessionFromStat(statsUnknown2);
            const craftSkill1 = statsUnknown1 > 0 ? 0 : 0; // We'll need to calculate actual skill levels
            const craftSkill2 = statsUnknown2 > 0 ? 0 : 0;

            const processedHero = {
              ...heroData,
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
              craftSkill1,
              craftSkill2,
              rarity: heroData?.rarity || 'common'
            };

            return processedHero;
          } catch (error) {
            return null;
          }
        })
      );

      if (lastFetchRef.current !== fetchId) {
        return;
      }

      const validHeroes = heroesData.filter(hero => hero !== null);
      
      setHeroes(validHeroes);
      await applyFiltersAndSort(validHeroes);
    } catch (error) {
      if (lastFetchRef.current === fetchId) {
        setError('Failed to fetch heroes: ' + error.message);
        setHeroes([]);
      }
    } finally {
      if (lastFetchRef.current === fetchId) {
        setIsFetching(false);
        setLoading(false);
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

    const cleanupSubscriptions = () => {
      if (!isSubscribed.current) {
        return;
      }
      
      try {
        if (eventSubscriptions.current.heroListed) {
          eventSubscriptions.current.heroListed.unsubscribe();
          eventSubscriptions.current.heroListed = null;
        }
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
    setHeroes
  };
};
