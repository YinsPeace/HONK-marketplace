import { useState, useEffect, useCallback, useRef } from 'react';
import { HONKMarketplaceContract, web3 } from '../Web3Config';
import { getHeroData } from '../utils/heroUtils';
import { applyFiltersAndSort as applyFiltersAndSortUtil } from '../utils/filterUtils';
import { enhanceHeroWithGeneData } from '../utils/heroGeneParser';
import { marketplaceCache } from '../utils/cacheUtils';

// Zero address constant for private listing checks
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const HEROES_PER_PAGE = 50;

export const useBuyTab = (connectedAddress, filters, sortOrder) => {
  // Core data stores
  const [allHeroes, setAllHeroes] = useState([]); // All heroes fetched from contract
  const [filteredHeroes, setFilteredHeroes] = useState([]); // Filtered and sorted heroes
  const [displayedHeroes, setDisplayedHeroes] = useState([]); // Paginated heroes for display
  const [bulkListings, setBulkListings] = useState([]); // State for grouped bulk listings

  // State management
  const [loading, setLoading] = useState(true); // Initial load state
  const [isLoadingMore, setIsLoadingMore] = useState(false); // Loading more heroes during pagination
  const [hasMore, setHasMore] = useState(false); // Whether more heroes can be loaded from pagination
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1); // Current page for display pagination
  const [hasMoreToDisplay, setHasMoreToDisplay] = useState(true); // If more items can be shown from filteredHeroes
  const [refetchCount, setRefetchCount] = useState(0);

  // Ref for preventing race conditions
  const fetchIdRef = useRef(0);

  // Load cached marketplace heroes for instant display while fresh data loads in background
  useEffect(() => {
    const cachedHeroes = marketplaceCache.getListedHeroes();
    if (cachedHeroes && cachedHeroes.length > 0) {
      setAllHeroes(cachedHeroes);
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => setRefetchCount((c) => c + 1), []);

  const createDefaultHeroData = (heroId, marketplaceData) => ({
    id: heroId.toString(),
    name: `Hero #${heroId}`,
    class: 'Unknown',
    subClass: 'Unknown',
    level: 1,
    generation: 1,
    price: marketplaceData.price.toString(),
    owner: marketplaceData.owner,
    isForSale: true,
  });

  const groupHeroesByBulkListing = useCallback((heroList) => {
    if (!heroList || !Array.isArray(heroList)) return [];
    const individualListings = [];
    const bulkGroups = new Map();

    heroList.forEach((hero) => {
      if (!hero) return;
      const bulkListingId = BigInt(hero.bulkListingId);
      const isBulkListing = bulkListingId > 0n;
      if (isBulkListing) {
        if (!bulkGroups.has(bulkListingId)) {
          bulkGroups.set(bulkListingId, {
            id: `bulk-${bulkListingId}`,
            bulkListingId: bulkListingId,
            isBulkListing: bulkListingId > 0n,
            heroes: [],
            totalPrice: 0,
            owner: hero.owner,
            isForSale: true,
            mainClass: hero.mainClass,
            subClass: hero.subClass,
            rarity: hero.rarity,
            generation: hero.generation,
            level: hero.level,
          });
        }
        const bulkGroup = bulkGroups.get(bulkListingId);
        bulkGroup.heroes.push(hero);

        // Convert hero price from Wei to HONK (ether units) for human-readable totals
        let heroPrice = 0;
        try {
          if (hero.price && hero.price !== '0') {
            heroPrice = parseFloat(web3.utils.fromWei(hero.price.toString(), 'ether'));
          }
        } catch (e) {
          heroPrice = parseFloat(hero.price || 0);
        }
        if (!isNaN(heroPrice)) {
          bulkGroup.totalPrice += heroPrice;
        }
      } else {
        individualListings.push(hero);
      }
    });

    const bulkListingsArray = Array.from(bulkGroups.values()).map((group) => {
      group.heroCount = group.heroes.length;
      // derive bulk allowed buyer and privacy
      const firstHero = group.heroes[0];
      group.allowedBuyer = firstHero ? firstHero.allowedBuyer : undefined;
      group.isPrivate = group.allowedBuyer && group.allowedBuyer !== ZERO_ADDRESS;

      // Convert BigInt to string for display and return a new object
      return {
        ...group,
        bulkListingId: group.bulkListingId.toString(),
      };
    });

    return [...individualListings, ...bulkListingsArray];
  }, []);

  const processAndEnhanceHeroes = useCallback(
    async (heroesFromContract, currentFetchId) => {
      // Process in parallel to speed up; drop heavy ownerOf check for performance (assume marketplace data is correct)
      const results = await Promise.all(
        heroesFromContract.map(async (hero) => {
          if (fetchIdRef.current !== currentFetchId) return null; // Abort if a new fetch has started
          if (!hero || !hero.id || hero.id === 0n || !hero.isForSale) return null;
          if (hero.owner.toLowerCase() === connectedAddress?.toLowerCase()) return null;

          try {
            const heroData = await getHeroData(hero.id);
            if (!heroData || (heroData.network && heroData.network !== 'dfk')) return null;

            const allowedBuyer = await HONKMarketplaceContract.methods.heroAllowedBuyer(hero.id).call();
            
            const isPrivate = allowedBuyer !== ZERO_ADDRESS;
            if (isPrivate && allowedBuyer.toLowerCase() !== connectedAddress?.toLowerCase()) {
              return null;
            }

            const enhancedHero = await enhanceHeroWithGeneData(heroData);
            const bulkListingId = BigInt(hero.bulkListingId);

            return {
              ...enhancedHero,
              allowedBuyer,
              isPrivate,
              id: hero.id.toString(),
              price: hero.price.toString(),
              owner: hero.owner,
              isForSale: true,
              bulkListingId: bulkListingId.toString(),
              isBulkListing: bulkListingId > 0n,
            };
          } catch (e) {
            console.error(`Error processing hero ${hero.id}:`, e);
            return null;
          }
        })
      );

      return results.filter(Boolean);
    },
    [connectedAddress]
  );

  const fetchAllHeroesPaginated = useCallback(
    async (currentFetchId) => {
      let allFetchedHeroes = [];
      let hasMoreToFetch = true;
      let offset = 0;

      while (hasMoreToFetch) {
        if (fetchIdRef.current !== currentFetchId) return; // Abort

        try {
          const heroesPage = await HONKMarketplaceContract.methods
            .getListedHeroesPaginated(offset, HEROES_PER_PAGE)
            .call();

          if (heroesPage && heroesPage.length > 0) {
            const validHeroes = heroesPage.filter(h => h && h.id && h.id !== 0n);
            const processedPage = await processAndEnhanceHeroes(validHeroes, currentFetchId);
            allFetchedHeroes.push(...processedPage);
            setAllHeroes([...allFetchedHeroes]); // Update state incrementally for better UX

            if (validHeroes.length < HEROES_PER_PAGE) {
              hasMoreToFetch = false;
            } else {
              offset += HEROES_PER_PAGE;
            }
          } else {
            hasMoreToFetch = false;
          }
        } catch (err) {
          const errorMessage = err.message || (err.data && err.data.message) || '';
          if (errorMessage.includes('Offset out of bounds')) {
            hasMoreToFetch = false; // Normal end of pagination
          } else {
            console.error('Error fetching a page of heroes:', err);
            setError('Failed to fetch heroes from the marketplace.');
            hasMoreToFetch = false; // Stop fetching on other critical errors
          }
        }
      }
    },
    [processAndEnhanceHeroes]
  );

  // Main effect to trigger fetching when address changes
  useEffect(() => {
    if (connectedAddress) {
      fetchIdRef.current += 1;
      const currentFetchId = fetchIdRef.current;

      setLoading(true);
      setError(null);
      setAllHeroes([]);
      setFilteredHeroes([]);
      setDisplayedHeroes([]);
      setPage(1);
      setHasMoreToDisplay(true);

      fetchAllHeroesPaginated(currentFetchId).finally(() => {
        if (fetchIdRef.current === currentFetchId) {
          setLoading(false);
        }
      });
    }
  }, [connectedAddress, fetchAllHeroesPaginated, refetchCount]);

  useEffect(() => {
    const applyFiltersAndGrouping = async () => {
      if (allHeroes.length > 0) {
        const groupedResult = groupHeroesByBulkListing(allHeroes);

        const individualHeroes = groupedResult.filter(item => !item.isBulkListing);
        const bulkGroups = groupedResult.filter(item => item.isBulkListing);

        const filtered = await applyFiltersAndSortUtil(individualHeroes, filters, sortOrder);
        setFilteredHeroes(filtered);
        setBulkListings(bulkGroups);

        setHasMoreToDisplay(true);
        setPage(1);
        setDisplayedHeroes(filtered.slice(0, HEROES_PER_PAGE));
      } else {
        setFilteredHeroes([]);
        setDisplayedHeroes([]);
        setBulkListings([]);
      }
    };
    applyFiltersAndGrouping();
  }, [allHeroes, filters, sortOrder, groupHeroesByBulkListing, applyFiltersAndSortUtil]);

  const loadMore = useCallback(() => {
    if (hasMoreToDisplay && !isLoadingMore) {
        setIsLoadingMore(true);
        setPage((prevPage) => prevPage + 1);
    }
  }, [hasMoreToDisplay, isLoadingMore]);

  useEffect(() => {
    // The filter/sort effect is responsible for setting the initial page (page 1).
    // This effect should only handle appending subsequent pages.
    if (page > 1) {
        const startIndex = (page - 1) * HEROES_PER_PAGE;
        const endIndex = page * HEROES_PER_PAGE;
        const newHeroes = filteredHeroes.slice(startIndex, endIndex);

        if (newHeroes.length > 0) {
            setDisplayedHeroes((prev) => [...prev, ...newHeroes]);
        }
    }

    // Always update the 'hasMore' flags after a page change.
    const moreAvailable = page * HEROES_PER_PAGE < filteredHeroes.length;
    setHasMore(moreAvailable);
    setHasMoreToDisplay(moreAvailable);
    setIsLoadingMore(false); // Done loading for this page
  }, [page, filteredHeroes]);

  return {
    heroes: displayedHeroes,
    displayedHeroes,
    bulkListings,
    loading,
    error,
    hasMore,
    isLoadingMore,
    loadMoreHeroes: loadMore,
    fetchHeroes: refetch,
    setHeroes: setAllHeroes,
    loadStats: () => {},
  };
};
