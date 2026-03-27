import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useHeroManagement } from '../hooks/useHeroManagement';
import { useHeroListing } from '../hooks/useHeroListing';
import { useDFKTavernCheck } from '../hooks/useDFKTavernCheck';
import { useBulkListing } from '../hooks/useBulkListing';
import { web3 } from '../Web3Config';
import LoadingIndicator from './LoadingIndicator';
import VirtualizedHeroGrid from './VirtualizedHeroGrid';
import BulkSelectionControls from './BulkSelectionControls';
import BulkListingModal from './BulkListingModal';
import ConfirmationModal from './ConfirmationModal'; // Import the new modal
import BulkListingDetailModal from './BulkListingDetailModal';
import { enhanceHeroWithGeneData } from '../utils/heroGeneParser';
import { toast } from 'react-toastify';
import { HONKMarketplaceContract } from '../Web3Config';
import honkLogo from '../assets/images/honk/honkCoin.webp';
import { formatPrice } from '../utils/heroUtils';
import { Modal, HeroDetails } from './Modal';
import { useHeroOperations } from '../hooks/useHeroOperations.js';
import { applyFiltersAndSort as applyFiltersAndSortUtil } from '../utils/filterUtils';

// Zero address constant for private listing detection
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const SellTab = ({ userAddress, filters, sortOrder, testHeroes }) => {
  // Ref used to track whether the dev-only timer has started

  // Only useWallet for isConnected, isCorrectNetwork, connect, switchNetwork if needed for UI
  const { isConnected, isCorrectNetwork, connect, switchNetwork } = useWallet();
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 });



  // Modal state for hero listing
  const [selectedHero, setSelectedHero] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [price, setPrice] = useState('');
  const [confirmationState, setConfirmationState] = useState({
    isOpen: false,
    title: '',
    messages: [],
    onConfirm: () => {},
  });

  // Generic confirmation/warning modal state
  const [isWarningModalOpen, setWarningModalOpen] = useState(false);
  const [warningContent, setWarningContent] = useState({ title: '', messages: [] });
  const [onConfirmWarning, setOnConfirmWarning] = useState(null);

  // Add sell tab bulk mode state
  const [isSellBulkMode, setIsSellBulkMode] = useState(false);

  // Toggle sell bulk mode
  const toggleSellBulkMode = () => {
    setIsSellBulkMode((prev) => !prev);
  };

  // All hero-related hooks use userAddress
  const {
    listingHeroId,
    listHeroForSale,
    listHeroPrivateForSale,
    listedHeroes,
    fetchListedHeroes,
    pendingListings,
  } = useHeroListing(
    userAddress, 
    heroes, 
    setHeroes
  );

  const {
    cancelListing,
    updatePrice,
    checkAndCancelIfMoved,
    pendingCancellations,
    pendingPriceUpdates,
  } = useHeroOperations(userAddress, fetchListedHeroes, setHeroes);

  // Bulk listing functionality
  const {
    selectedHeroes,
    bulkPrices,
    isBulkMode,
    isBulkListing,
    bulkProgress,
    toggleBulkMode,
    toggleHeroSelection,
    selectAllHeroes,
    clearAllSelections,
    setHeroPrice,
    setBulkPrice,
    executeBulkListing,
    validateBulkListing,
    getTotalEstimatedValue,
    cancelBulkListing,
    // Private sale
    isPrivateSale,
    setIsPrivateSale,
    recipient,
    setRecipient,
  } = useBulkListing(userAddress, fetchListedHeroes);

  // Bulk listing modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // This is called when the user clicks "Proceed" on the warning modal
  const handleConfirmAction = async () => {
    if (onConfirmWarning) {
      await onConfirmWarning();
    }
    setWarningModalOpen(false);
    setOnConfirmWarning(null); // Reset confirmation action
  };

  // Bulk listing detail modal state for viewing details
  const [selectedBulkListing, setSelectedBulkListing] = useState(null);
  const [isBulkDetailModalOpen, setIsBulkDetailModalOpen] = useState(false);

  // Optimistic UI: pending bulk listings to surface in Bulk View immediately
  const [pendingBulkListingsUI, setPendingBulkListingsUI] = useState([]);

  // If there are pending listings (single or bulk), poll the contract every 5s until they confirm
  useEffect(() => {
    const hasPendingSingles = pendingListings && pendingListings.size > 0;
    const hasPendingBulks = pendingBulkListingsUI && pendingBulkListingsUI.length > 0;
    if (!hasPendingSingles && !hasPendingBulks) return;
    const id = setInterval(() => {
      fetchListedHeroes?.();
    }, 5000);
    return () => clearInterval(id);
  }, [pendingListings, pendingBulkListingsUI, fetchListedHeroes]);

  // Keep track of tavern heroes separately
  const [tavernHeroesState, setTavernHeroesState] = useState([]);
  const [hasFetchedTavern, setHasFetchedTavern] = useState(false);

  // Get hero management state
  const {
    heroes: heroesFromManagement,
    loading: loadingFromManagement,
    error,
    lastHeroElementRef,
    lastRefreshed,
    refreshHeroes,
    isFullyLoaded,
  } = useHeroManagement(
    userAddress,
    false, // isBuyTab
    filters,
    sortOrder,
    listedHeroes
  );

  // Handle refresh button click
  const handleRefresh = useCallback(async () => {
    try {
      // Clear enriched state immediately to avoid showing stale private flags
      setHeroesEnriched([]);
      // Refresh both: base hero data and on-chain listed heroes overlay
      await Promise.all([
        fetchListedHeroes?.(),
        (async () => {
          refreshHeroes();
        })(),
      ]);
    } catch (e) {
      // No-op: best-effort refresh
    }
  }, [refreshHeroes, fetchListedHeroes]);

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
      const tavernHeroesWithMarketplace = tavernListedHeroes.map((h) => ({
        ...h,
        marketplace: 'dfk',
        isDFKTavernListing: true,
      }));
      setTavernHeroesState(tavernHeroesWithMarketplace);
    }
  }, [tavernListedHeroes]);

  // Handle hero listing - opens modal
  const handleList = (heroId) => {
    const hero = displayedHeroes.find((h) => h.id === heroId);
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

  const handleModalList = async (heroId, enteredPrice, isPrivate = false, recipient = '') => {
    const heroToList = selectedHero || displayedHeroes.find((h) => h.id === heroId);
    const listingPrice = enteredPrice || price;
    if (!heroToList || !listingPrice) {
      toast.error('Please enter a valid price');
      return;
    }

    // Close the listing modal first, as the confirmation modal will take over.
    handleCloseModal();

    let result;
    if (isPrivate) {
      result = await listHeroPrivateForSale(heroToList.id, listingPrice, recipient, false, heroToList);
    } else {
      result = await listHeroForSale(heroToList.id, listingPrice, false, heroToList);
    }

    if (result.warnings && result.warnings.length > 0) {
      setConfirmationState({
        isOpen: true,
        title: 'Equipment Warning',
        messages: result.warnings,
        onConfirm: async () => {
          setConfirmationState({ isOpen: false, title: '', messages: [], onConfirm: () => {} });
          const finalResult = isPrivate
            ? await listHeroPrivateForSale(heroToList.id, listingPrice, recipient, true, heroToList)
            : await listHeroForSale(heroToList.id, listingPrice, true, heroToList);
          if (finalResult.success) {
            toast.success(`Hero ${heroToList.id} listed successfully!`);
          } else {
            toast.error(finalResult.errors[0] || 'Failed to list hero');
          }
        },
      });
    } else if (result.success) {
      toast.success(`Hero ${selectedHero.id} listed successfully!`);
    } else {
      toast.error(result.errors && result.errors[0] ? result.errors[0] : 'Failed to list hero');
    }
  };

  // Handler for initiating the bulk listing process
  const handleBulkList = async () => {
    // Snapshot current selections and prices BEFORE executing (they may be cleared after success)
    const selectedHeroIdsSnapshot = Array.from(selectedHeroes);
    const bulkPricesSnapshot = { ...bulkPrices };
    const isPrivateSaleSnapshot = isPrivateSale;
    const recipientSnapshot = recipient;

    const result = await executeBulkListing(false); // bypassWarnings = false

    if (result.success) {
      toast.success('Bulk listing created successfully!');
      setIsBulkModalOpen(false);

      // Create an optimistic bulk listing object for immediate display in Bulk View
      try {
        const heroIds = selectedHeroIdsSnapshot;
        if (heroIds.length > 0) {
          // Build hero objects from current management list
          const selectedHeroObjects = heroIds
            .map((id) => (heroesFromManagement || []).find((h) => String(h.id) === String(id)))
            .filter(Boolean)
            .map((h) => ({ ...h }));

          // Compute total HONK price from UI prices (numbers)
          const totalPrice = heroIds.reduce((sum, id) => {
            const p = parseFloat(bulkPricesSnapshot[id] || 0);
            return sum + (isNaN(p) ? 0 : p);
          }, 0);

          // Assign a temporary mock bulkListingId in the reserved mock range (1000-1999)
          const existingIds = new Set(pendingBulkListingsUI.map((b) => b.bulkListingId));
          let mockId = 1000 + Math.floor(Math.random() * 900);
          while (existingIds.has(mockId)) mockId = 1000 + Math.floor(Math.random() * 900);

          // Mark involved heroes as pending listed in local state (for spinner + disabled actions)
          setHeroes((prev) =>
            prev.map((hero) => {
              if (heroIds.some((hid) => String(hid) === String(hero.id))) {
                const honk =
                  bulkPricesSnapshot[hero.id] || bulkPricesSnapshot[String(hero.id)] || 0;
                let priceWei = '0';
                try {
                  priceWei = web3.utils.toWei(String(honk), 'ether');
                } catch {}
                return {
                  ...hero,
                  isForSale: true,
                  isPendingListing: true,
                  price: priceWei,
                  owner: userAddress,
                };
              }
              return hero;
            })
          );

          // Push a pending bulk listing card for Bulk View
          const pendingBulk = {
            id: `bulk-${mockId}`,
            bulkListingId: mockId,
            isBulkListing: true,
            isPending: true,
            heroes: selectedHeroObjects,
            totalPrice,
            owner: userAddress,
            isForSale: true,
            heroCount: selectedHeroObjects.length,
            marketplace: 'honk',
            allowedBuyer: isPrivateSaleSnapshot ? recipientSnapshot : undefined,
            isPrivate: !!isPrivateSaleSnapshot,
          };
          setPendingBulkListingsUI((prev) => [...prev, pendingBulk]);
          // Clear selections only after we've created the optimistic overlays
          clearAllSelections();
        }
      } catch (e) {
        // Non-fatal; optimistic overlay best-effort
      }
    } else if (result.warnings && result.warnings.length > 0) {
      setWarningContent({ title: 'Equipment Warning', messages: result.warnings });
      // Set the confirmation action to re-run the listing with bypass
      setOnConfirmWarning(() => async () => {
        const confirmResult = await executeBulkListing(true); // bypassWarnings = true
        if (confirmResult.success) {
          toast.success('Bulk listing created successfully!');
          setIsBulkModalOpen(false);
          clearAllSelections();
        } else {
          toast.error(`Failed to list heroes: ${confirmResult.errors.join(', ')}`);
        }
      });
      setWarningModalOpen(true);
    } else if (result.errors && result.errors.length > 0) {
      toast.error(`Error: ${result.errors.join(', ')}`);
    }
  };

  // Local state to hold heroes enriched with private-listing info
  const [heroesEnriched, setHeroesEnriched] = useState([]);

  // Enrich heroes with allowedBuyer/isPrivate – only for heroes that are actually listed
  useEffect(() => {
    if (!heroesFromManagement || heroesFromManagement.length === 0) {
      setHeroesEnriched([]);
      return;
    }

    // Build a quick lookup of listed hero IDs (owned by the connected user)
    const listedIds = new Set((listedHeroes || []).map((lh) => String(lh.heroId)));

    const enrich = async () => {
      const enriched = await Promise.all(
        heroesFromManagement.map(async (hero) => {
          // Skip expensive call when hero is not listed
          if (!listedIds.has(String(hero.id))) {
            return hero;
          }
          try {
            const allowedBuyer = await HONKMarketplaceContract.methods
              .heroAllowedBuyer(hero.id)
              .call();
            return {
              ...hero,
              allowedBuyer,
              isPrivate: allowedBuyer && allowedBuyer !== ZERO_ADDRESS,
            };
          } catch (err) {
            // Keep base hero if call fails
            return hero;
          }
        })
      );
      setHeroesEnriched(enriched);
    };
    enrich();
  }, [heroesFromManagement, listedHeroes]);

  // Group heroes by bulk listing ID for consistent display - memoized to prevent re-renders
  const groupHeroesByBulkListing = useCallback((heroList) => {
    if (!heroList || !Array.isArray(heroList)) return [];

    // Separate individual and bulk listings
    const individualListings = [];
    const bulkGroups = new Map();

    heroList.forEach((hero) => {
      if (!hero) return;

      // Check if hero has a bulkListingId (>0 means it's part of a bulk listing)
      const bulkListingId = hero.bulkListingId || 0;

      if (bulkListingId > 0) {
        // Group bulk listings
        if (!bulkGroups.has(bulkListingId)) {
          bulkGroups.set(bulkListingId, {
            id: `bulk-${bulkListingId}`,
            bulkListingId: bulkListingId,
            isBulkListing: true,
            heroes: [],
            totalPrice: 0,
            owner: hero.owner,
            isForSale: true,
            heroCount: 0,
            marketplace: hero.marketplace || 'honk',
            // Use properties from first hero for filtering
            class: hero.class,
            subClass: hero.subClass,
            rarity: hero.rarity,
            generation: hero.generation,
            level: hero.level,
          });
        }

        const bulkGroup = bulkGroups.get(bulkListingId);
        bulkGroup.heroes.push(hero);

        // Fix price calculation - ensure we're parsing the price correctly
        // Hero prices might be in Wei format, so we need to convert them first
        let heroPrice = 0;
        try {
          if (hero.price && hero.price !== '0') {
            // Try to convert from Wei first, if it fails, use the price as is
            const priceInEther = web3.utils.fromWei(hero.price.toString(), 'ether');
            heroPrice = parseFloat(priceInEther);
          }
        } catch (error) {
          // If conversion fails, try parsing the price directly
          heroPrice = parseFloat(hero.price || 0);
        }

        if (!isNaN(heroPrice) && heroPrice > 0) {
          bulkGroup.totalPrice += heroPrice;
        }

        // Update hero count
        bulkGroup.heroCount = bulkGroup.heroes.length;

        // Update group properties to reflect the collection (use highest values for filtering)
        bulkGroup.level = Math.max(bulkGroup.level || 0, hero.level || 0);
        if (hero.rarity && hero.rarity.toLowerCase() !== 'common') {
          bulkGroup.rarity = hero.rarity; // Prioritize non-common rarities
        }
      } else {
        // Individual listing
        individualListings.push(hero);
      }
    });

    // Convert bulk groups to array and combine with individual listings
    const bulkListingsArray = Array.from(bulkGroups.values()).map((group) => {
      const firstHero = group.heroes[0];
      group.allowedBuyer = firstHero ? firstHero.allowedBuyer : undefined;
      group.isPrivate = group.allowedBuyer && group.allowedBuyer !== ZERO_ADDRESS;
      return group;
    });
    return [...individualListings, ...bulkListingsArray];
  }, []);

  // State to hold filtered and processed heroes
  const [displayedHeroes, setDisplayedHeroes] = useState([]);

  // Effect to calculate displayed heroes with filters and sorting
  useEffect(() => {
    const calculateDisplayedHeroes = async () => {
      const sourceHeroes = heroesEnriched && heroesEnriched.length ? heroesEnriched : heroesFromManagement;
      // Handle initial loading state
      if (!sourceHeroes) {
        setDisplayedHeroes([]);
        return;
      }


      // Helper to get base hero ID by stripping any realm prefix
      const getBaseHeroId = (heroId) => {
        const id = String(heroId || '');
        const baseId = id.slice(-6); // Get the last 6 digits
        return baseId;
      };

      const tavernHeroes = tavernHeroesState || [];
      const tavernHeroIds = new Set(tavernHeroes.map((h) => getBaseHeroId(h.id)));

      const regularHeroes = sourceHeroes || [];
      const filteredRegularHeroes = regularHeroes.filter((h) => {
        const baseId = getBaseHeroId(h.id);
        return !tavernHeroIds.has(baseId);
      });

      const listedHeroesMap = new Map();
      if (listedHeroes && Array.isArray(listedHeroes)) {
        listedHeroes.forEach((listed) => {
          listedHeroesMap.set(String(listed.heroId), listed); // Ensure heroId is string for map keys
        });
      }
      const pendingMap = pendingListings || new Map();

      const allHeroes = [...filteredRegularHeroes, ...tavernHeroes].map((hero) => {
        const heroIdStr = String(hero.id);
        const listedHero = listedHeroesMap.get(heroIdStr); // confirmed on-chain listing overlay
        const pending = pendingMap.get?.(heroIdStr); // optimistic pending overlay

        if (pending) {
          // Pending listing takes precedence (optimistic UI)
          return {
            ...hero,
            isForSale: true,
            isPendingListing: true,
            price: pending.price, // wei
            marketplace: 'honk',
            bulkListingId: hero.bulkListingId || 0,
            allowedBuyer: pending.recipient || hero.allowedBuyer,
            isPrivate: pending.isPrivate || hero.isPrivate,
            owner: userAddress || hero.owner,
          };
        }

        if (listedHero) {
          return {
            ...hero,
            isForSale: true,
            price: listedHero.price,
            marketplace: 'honk',
            bulkListingId: listedHero.bulkListingId || 0,
            // keep private listing props if they exist
            allowedBuyer: hero.allowedBuyer || listedHero.allowedBuyer,
            isPrivate:
              hero.isPrivate !== undefined
                ? hero.isPrivate
                : (listedHero.allowedBuyer && listedHero.allowedBuyer !== ZERO_ADDRESS),
          };
        }
        return hero;
      });

      try {
        // Apply advanced filtering using the utility function
        const filteredHeroes = await applyFiltersAndSortUtil(
          allHeroes,
          filters,
          sortOrder,
          true, // isSellTab
          listedHeroes,
          tavernHeroes
        );

        // Group heroes by bulk listing AFTER filtering
        const groupedHeroes = groupHeroesByBulkListing(filteredHeroes);
        const groupedPlusPending = [...groupedHeroes, ...pendingBulkListingsUI];

        // Apply SellTab-specific UI filters
        const filteredHeroesFromUI = groupedPlusPending.filter((hero) => {
          if (filters.hideListedHeroes && hero.isForSale) return false;
          if (filters.hideDFKTavern && hero.isDFKTavernListing) return false;
          return true;
        });

        let modeFilteredHeroes = filteredHeroesFromUI;
        // Filter for viewing existing bulk listings vs. individual heroes/listings
        if (isSellBulkMode) { // User clicked "Bulk View" to see existing bulk listings
          modeFilteredHeroes = filteredHeroesFromUI.filter((hero) => hero.isBulkListing === true);
        } else { // User is viewing individual listings or their unlisted heroes
          modeFilteredHeroes = filteredHeroesFromUI.filter((hero) => hero.isBulkListing !== true);
        }

        // If in "Bulk Select" mode (for CREATING a new bulk listing), only show unlisted, individual heroes
        if (isBulkMode) { // isBulkMode is from useBulkListing hook, active when user clicks "Bulk Select"
          modeFilteredHeroes = modeFilteredHeroes.filter(hero =>
              !hero.isForSale &&
              (!hero.isBulkListing || hero.isBulkListing === false || hero.bulkListingId === 0)
          );
        }

        setDisplayedHeroes(modeFilteredHeroes);
      } catch (error) {
        console.error('Error filtering heroes:', error);
        // Fallback to unfiltered heroes if filtering fails
        setDisplayedHeroes(allHeroes);
      }
    };

    calculateDisplayedHeroes();

  }, [
    heroesEnriched,
    heroesFromManagement,
    listedHeroes,
    pendingBulkListingsUI,
    tavernHeroesState,
    pendingListings,
    userAddress,
    groupHeroesByBulkListing, // This is a useCallback, safe
    JSON.stringify(filters), // Convert to string to ensure proper comparison
    sortOrder,
    isSellBulkMode, // Boolean state for viewing existing bulk listings
    isBulkMode,     // Boolean state from useBulkListing for CREATING new bulk listings
  ]);

  // Reconcile: remove pending bulk overlay once all its heroes appear in listedHeroes
  useEffect(() => {
    if (!pendingBulkListingsUI || pendingBulkListingsUI.length === 0) return;
    if (!listedHeroes || listedHeroes.length === 0) return;

    const listedMap = new Map();
    listedHeroes.forEach((lh) => listedMap.set(String(lh.heroId), lh));

    setPendingBulkListingsUI((prev) => {
      const remaining = [];
      prev.forEach((bulk) => {
        const allPresent = bulk.heroes.every((h) => listedMap.has(String(h.id)));
        if (allPresent) {
          // Clear pending flags on those heroes in local state
          const ids = new Set(bulk.heroes.map((h) => String(h.id)));
          setHeroes((prevHeroes) =>
            prevHeroes.map((h) => (ids.has(String(h.id)) ? { ...h, isPendingListing: false } : h))
          );
          // Do not keep this bulk in pending list
        } else {
          remaining.push(bulk);
        }
      });
      return remaining;
    });
  }, [listedHeroes, pendingBulkListingsUI]);

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


  useEffect(() => {
    // If testHeroes are provided, use those instead of fetching
    if (testHeroes) {
      setHeroes(testHeroes);
    } else if (isConnected && isCorrectNetwork) {
      fetchListedHeroes();
    }
  }, [isConnected, isCorrectNetwork, userAddress, testHeroes]);

  useEffect(() => {
    if (listedHeroes && listedHeroes.length > 0) {
      setHeroes((prevHeroes) => {
        return prevHeroes.map((hero) => {
          const listedHero = listedHeroes.find((listed) => listed.heroId === hero.id);
          if (listedHero) {
            return {
              ...hero,
              isForSale: true,
              price: listedHero.price,
              owner: listedHero.owner,
            };
          }
          return hero;
        });
      });
    }
  }, [listedHeroes]);



  // Bulk listing handlers
  const handleOpenBulkModal = () => {
    setIsBulkModalOpen(true);
  };

  const handleCloseBulkModal = () => {
    setIsBulkModalOpen(false);
  };

  const handleBulkListingComplete = async () => {
    handleCloseBulkModal();
    // Refresh listed heroes after bulk listing
    await fetchListedHeroes();
  };

  // Close modal & refresh when bulk listing done event fired globally
  useEffect(() => {
    const handler = () => {
      handleCloseBulkModal();
      fetchListedHeroes();
    };
    window.addEventListener('honkBulkListingDone', handler);
    return () => window.removeEventListener('honkBulkListingDone', handler);
  }, []);

  // Bulk listing operation handlers
  const handleBuyBulkListing = async (bulkListingId) => {
    // In SellTab, this is used for "View Details" functionality
    const bulkListing = displayedHeroes.find(
      (hero) => hero.isBulkListing && hero.bulkListingId === bulkListingId
    );

    if (bulkListing) {
      setSelectedBulkListing(bulkListing);
      setIsBulkDetailModalOpen(true);
    } else {
      toast.error('Bulk listing not found');
    }
  };

  const handleCloseBulkDetailModal = () => {
    setIsBulkDetailModalOpen(false);
    setSelectedBulkListing(null);
  };

  const handleCancelBulkListing = async (bulkListingId, heroesFromCard = null) => {
    try {
      let heroesInBulkListing = heroesFromCard;

      // If heroes weren't passed directly, try to find them in the displayed heroes
      if (!heroesInBulkListing) {
        const bulkListing = displayedHeroes.find(
          (hero) => hero.isBulkListing && hero.bulkListingId === bulkListingId
        );
        heroesInBulkListing = bulkListing ? bulkListing.heroes : [];
      }

      console.log(
        `Cancelling bulk listing ${bulkListingId} with ${heroesInBulkListing.length} heroes:`,
        heroesInBulkListing.map((h) => h.id)
      );

      // Call the bulk cancellation function with the hero data
      const result = await cancelBulkListing(bulkListingId, heroesInBulkListing);
      if (result?.success) {
        // Don't show additional success toast since the hook already shows one
        await fetchListedHeroes(); // Refresh the listed heroes
      } else {
        toast.error('Failed to cancel bulk listing');
      }
    } catch (error) {
      console.error('Error cancelling bulk listing:', error);
      toast.error('Failed to cancel bulk listing');
    }
  };

  // Modified hero listing handler to support bulk mode
  const handleHeroClick = (heroId) => {
    if (isBulkMode) {
      // In bulk mode, toggle selection instead of opening modal
      toggleHeroSelection(heroId);
    } else {
      // Normal mode - open individual listing modal
      handleList(heroId);
    }
  };

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
      const hero = displayedHeroes.find((h) => h.id === heroToList);
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

  const [stuckBulkIds, setStuckBulkIds] = useState([]);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // Detect stuck bulk listings
  useEffect(() => {
    async function detectStuckBulkListings() {
      // Get all unique bulkListingIds from seller's listed heroes
      const heroBulkIds = new Set(
        (heroesFromManagement || [])
          .filter((h) => h.bulkListingId && h.bulkListingId > 0)
          .map((h) => h.bulkListingId)
      );
      if (heroBulkIds.size === 0) {
        setStuckBulkIds([]);
        return;
      }
      // Get all valid bulk listing IDs from contract
      let contractBulkIds = new Set();
      try {
        const nextBulkListingId = await HONKMarketplaceContract.methods.nextBulkListingId().call();
        for (let bulkId = 1; bulkId < nextBulkListingId; bulkId++) {
          try {
            const bulkListingData = await HONKMarketplaceContract.methods
              .getBulkListing(bulkId)
              .call();
            const heroIds = bulkListingData.heroIds || bulkListingData[0] || [];
            if (heroIds.length > 0) {
              contractBulkIds.add(Number(bulkId));
            }
          } catch {}
        }
      } catch {}
      // Any heroBulkId not in contractBulkIds is stuck
      const stuck = Array.from(heroBulkIds).filter((id) => !contractBulkIds.has(Number(id)));
      setStuckBulkIds(stuck);
    }
    detectStuckBulkListings();
  }, [heroesFromManagement]);

  // Cleanup handler
  const handleCleanupStuckBulkListings = async () => {
    setIsCleaningUp(true);
    try {
      for (const stuckId of stuckBulkIds) {
        try {
          await HONKMarketplaceContract.methods
            .cleanupStaleBulkListing(stuckId)
            .send({ from: userAddress });
          toast.success(`Cleaned up stuck bulk listing #${stuckId}`);
        } catch (err) {
          toast.error(`Failed to clean up bulk listing #${stuckId}: ${err.message}`);
        }
      }
      // Refresh after cleanup
      if (fetchListedHeroes) await fetchListedHeroes();
    } finally {
      setIsCleaningUp(false);
    }
  };

  return (
    <div>
      {/* Stuck bulk listing warning and cleanup */}
      {stuckBulkIds.length > 0 && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-4 flex items-center justify-between">
          <span>
            Some of your heroes are stuck in missing bulk listings and are not visible to buyers.
            <br />
            Bulk Listing IDs: {stuckBulkIds.join(', ')}
          </span>
          <button
            className="ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            onClick={handleCleanupStuckBulkListings}
            disabled={isCleaningUp}
          >
            {isCleaningUp ? 'Cleaning up...' : 'Cleanup Stuck Bulk Listings'}
          </button>
        </div>
      )}

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

      {/* Removed the top pending banner to keep the layout clean and subtle */}

      <div className="flex flex-col md:flex-row h-full relative">
        {/* Main Content Area - This div wraps BulkSelectionControls, VirtualizedHeroGrid, etc. */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* The existing BulkSelectionControls and VirtualizedHeroGrid will become children of this div */}

      {/* Bulk Selection Controls */}
      <BulkSelectionControls
        isBulkMode={isBulkMode}
        toggleBulkMode={toggleBulkMode}
        selectedHeroes={selectedHeroes}
        selectAllHeroes={selectAllHeroes}
        clearAllSelections={clearAllSelections}
        onOpenBulkModal={handleOpenBulkModal}
        visibleHeroes={displayedHeroes}
        totalHeroes={displayedHeroes.length}
        isSellBulkMode={isSellBulkMode}
        toggleSellBulkMode={toggleSellBulkMode}
        onRefresh={handleRefresh}
        loading={loading}
      />

      <VirtualizedHeroGrid
        heroes={displayedHeroes}
        isBuyPage={false}
        honkLogo={honkLogo}
        onList={handleHeroClick}
        onCancelListing={cancelListing}
        onUpdatePrice={updatePrice}
        formatPrice={formatPrice}
        isConnected={isConnected}
        listedHeroes={listedHeroes}
        pendingCancellations={pendingCancellations}
        pendingPriceUpdates={pendingPriceUpdates}
        lastHeroRef={lastHeroElementRef}
        // Bulk listing props
        isBulkMode={isBulkMode}
        selectedHeroes={selectedHeroes}
        onToggleSelection={toggleHeroSelection}
        onBuyBulkListing={handleBuyBulkListing}
        onCancelBulkListing={handleCancelBulkListing}
      />
        </div> {/* End of Main Content Area (flex-1) */}
      </div> {/* End of Outer Layout Div (flex flex-col md:flex-row) */}

      {/* Hero Listing Modal (for single hero) */}
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

      {/* Bulk Listing Creation Modal */}
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        onClose={() => setConfirmationState({ ...confirmationState, isOpen: false })}
        onConfirm={confirmationState.onConfirm}
        title={confirmationState.title}
        messages={confirmationState.messages}
      />

      {isBulkModalOpen && (
        <BulkListingModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          selectedHeroes={selectedHeroes}
          heroes={displayedHeroes.filter((h) => selectedHeroes.has(h.id))}
          executeBulkListing={executeBulkListing} // Corrected prop
          bulkPrices={bulkPrices}
          setHeroPrice={setHeroPrice}
          setBulkPrice={setBulkPrice}
          // validateBulkListing={validateBulkListing} // Removed unused prop
          getTotalEstimatedValue={getTotalEstimatedValue}
          isBulkListing={isBulkListing}
          bulkProgress={bulkProgress} // Removed duplicate prop
          isPrivateSale={isPrivateSale}
          setIsPrivateSale={setIsPrivateSale}
          recipient={recipient}
          setRecipient={setRecipient}
        />
      )}

      {/* Generic Confirmation Modal */}
      {isWarningModalOpen && (
        <ConfirmationModal
          isOpen={isWarningModalOpen}
          onClose={() => setWarningModalOpen(false)}
          onConfirm={handleConfirmAction}
          title={warningContent.title}
          messages={warningContent.messages}
        />
      )}

      {/* Bulk Listing Detail Modal for Sellers */}
      {isBulkDetailModalOpen && selectedBulkListing && (
        <BulkListingDetailModal
          isOpen={isBulkDetailModalOpen}
          onClose={() => setIsBulkDetailModalOpen(false)}
          bulkListing={selectedBulkListing}
          onCancelBulkListing={cancelBulkListing}
          isConnected={isConnected}
          pendingTransactions={pendingCancellations}
          honkLogo={honkLogo}
          isSeller={true}
        />
      )}
    </div>
  );
};

export default SellTab;
