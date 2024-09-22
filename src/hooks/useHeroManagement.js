import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initializeContracts,
  checkNetwork,
  validateContracts,
  HONKMarketplaceContract,
  DFKHeroContract,
} from '../Web3Config';
import { getHeroData, processHeroData } from '../utils/heroUtils';
import { applyFiltersAndSort as applyFiltersAndSortUtil } from '../utils/filterUtils';

export const useHeroManagement = (connectedAddress, isBuyTab = true, filters, sortOrder) => {
  const [heroes, setHeroes] = useState([]);
  const [filteredHeroes, setFilteredHeroes] = useState([]);
  const [displayedHeroes, setDisplayedHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const observer = useRef();
  const HEROES_PER_PAGE = 8;

  const fetchHeroes = useCallback(
    async (address) => {
      try {
        setLoading(true);
        setError(null);

        let heroIds;
        if (isBuyTab) {
          const result = await HONKMarketplaceContract.methods.getListedHeroes().call();
          heroIds = result[0]
            .filter(
              (hero) =>
                hero &&
                hero.id &&
                hero.id !== '0' &&
                BigInt(hero.id) !== 0n &&
                hero.owner &&
                hero.owner.toLowerCase() !== address.toLowerCase() &&
                hero.isForSale
            )
            .map((hero) => hero.id);
        } else {
          heroIds = await DFKHeroContract.methods.getUserHeroes(address).call();
        }

        const heroesData = await Promise.all(
          heroIds.map(async (heroId) => {
            const heroData = await getHeroData(heroId);
            const processedHero = processHeroData(heroData);
            const heroState = await DFKHeroContract.methods.getHeroState(heroId).call();
            const isOnQuest =
              heroState.currentQuest !== '0x0000000000000000000000000000000000000000';
            const marketplaceData = await HONKMarketplaceContract.methods.getHero(heroId).call();

            return {
              ...processedHero,
              id: heroId,
              isForSale: marketplaceData.isForSale,
              price: marketplaceData.price,
              owner: marketplaceData.owner,
              isOnQuest,
            };
          })
        );

        setHeroes(heroesData);
      } catch (error) {
        console.error('Error fetching heroes:', error);
        setError('Failed to fetch heroes: ' + error.message);
      } finally {
        setLoading(false);
      }
    },
    [isBuyTab]
  );

  const applyFiltersAndSort = useCallback(
    (heroes, filters, sortOrder) => {
      console.log('applyFiltersAndSort called in useHeroManagement');
      return applyFiltersAndSortUtil(heroes, filters, sortOrder, !isBuyTab);
    },
    [isBuyTab]
  );

  useEffect(() => {
    if (heroes.length > 0) {
      console.log('Applying filters and sort in useHeroManagement');
      const newFilteredHeroes = applyFiltersAndSort(heroes, filters, sortOrder);
      console.log('New filtered heroes:', newFilteredHeroes);
      setFilteredHeroes(newFilteredHeroes);
      setDisplayedHeroes(newFilteredHeroes.slice(0, HEROES_PER_PAGE));
      setHasMore(newFilteredHeroes.length > HEROES_PER_PAGE);
    }
  }, [heroes, filters, sortOrder, applyFiltersAndSort]);

  const loadMoreHeroes = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const startIndex = displayedHeroes.length;
    const endIndex = startIndex + HEROES_PER_PAGE;
    const newHeroes = filteredHeroes.slice(startIndex, endIndex);

    // Check for duplicates
    const uniqueNewHeroes = newHeroes.filter(
      (hero) => !displayedHeroes.some((displayedHero) => displayedHero.id === hero.id)
    );

    setTimeout(() => {
      setDisplayedHeroes((prev) => [...prev, ...uniqueNewHeroes]);
      setHasMore(endIndex < filteredHeroes.length);
      setIsLoadingMore(false);
    }, 500);
  }, [isLoadingMore, hasMore, displayedHeroes, filteredHeroes]);

  const lastHeroElementRef = useCallback(
    (node) => {
      if (loading || isLoadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          console.log('Last hero intersecting, loading more heroes');
          loadMoreHeroes();
        }
      });
      if (node) {
        console.log('Observing last hero element');
        observer.current.observe(node);
      }
    },
    [loading, isLoadingMore, hasMore, loadMoreHeroes]
  );

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
          await fetchHeroes(connectedAddress);
        }
      } catch (err) {
        console.error('Error initializing app or fetching heroes:', err);
        setError('Failed to initialize app or fetch heroes.');
      }
    };

    initAndFetch();
  }, [connectedAddress, fetchHeroes]);

  useEffect(() => {
    const setupEventListeners = () => {
      const heroListedSubscription = HONKMarketplaceContract.events.HeroListed(
        {},
        (error, event) => {
          if (error) {
            console.error('Error on HeroListed event:', error);
            return;
          }
          console.log('Hero Listed Event:', event.returnValues);
          fetchHeroes(connectedAddress);
        }
      );

      const heroPurchasedSubscription = HONKMarketplaceContract.events.HeroPurchased(
        {},
        (error, event) => {
          if (error) {
            console.error('Error on HeroPurchased event:', error);
            return;
          }
          console.log('Hero Purchased Event:', event.returnValues);
          fetchHeroes(connectedAddress);
        }
      );

      return () => {
        heroListedSubscription.unsubscribe();
        heroPurchasedSubscription.unsubscribe();
      };
    };

    return setupEventListeners();
  }, [connectedAddress, fetchHeroes]);

  return {
    heroes,
    filteredHeroes,
    displayedHeroes,
    loading,
    error,
    hasMore,
    isLoadingMore,
    lastHeroElementRef,
    fetchHeroes,
    applyFiltersAndSort,
    setFilteredHeroes,
    setDisplayedHeroes,
    setHasMore,
  };
};
