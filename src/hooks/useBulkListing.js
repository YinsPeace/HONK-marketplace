import { useState, useCallback } from 'react';
import { HONKMarketplaceContract, web3, DFKHeroContract } from '../Web3Config';
import { toast } from 'react-toastify';

export const useBulkListing = (connectedAddress, fetchHeroes) => {
  const [selectedHeroes, setSelectedHeroes] = useState(new Set());
  const [bulkPrices, setBulkPrices] = useState({});
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isBulkListing, setIsBulkListing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [pendingBulkCancellations, setPendingBulkCancellations] = useState(new Set());
  
  // Private sale state
  const [isPrivateSale, setIsPrivateSale] = useState(false);
  const [recipient, setRecipient] = useState('');

  // Toggle bulk listing mode
  const toggleBulkMode = useCallback(() => {
    setIsBulkMode((prev) => !prev);
    if (isBulkMode) {
      // Clear selections when exiting bulk mode
      setSelectedHeroes(new Set());
      setBulkPrices({});
    }
  }, [isBulkMode]);

  // Toggle hero selection
  const toggleHeroSelection = useCallback((heroId) => {
    setSelectedHeroes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(heroId)) {
        newSet.delete(heroId);
        // Remove price when deselecting
        setBulkPrices((prevPrices) => {
          const newPrices = { ...prevPrices };
          delete newPrices[heroId];
          return newPrices;
        });
      } else {
        if (newSet.size >= 50) {
          toast.warning('Maximum 50 heroes can be selected for bulk listing');
          return prev;
        }
        newSet.add(heroId);
      }
      return newSet;
    });
  }, []);

  // Select all visible heroes (up to 50)
  const selectAllHeroes = useCallback(
    (heroIds) => {
      const availableHeroes = heroIds.filter((id) => !selectedHeroes.has(id));
      const toSelect = availableHeroes.slice(0, 50 - selectedHeroes.size);

      setSelectedHeroes((prev) => {
        const newSet = new Set(prev);
        toSelect.forEach((id) => newSet.add(id));
        return newSet;
      });

      if (availableHeroes.length > toSelect.length) {
        toast.info(
          `Selected ${toSelect.length} heroes. Maximum of 50 heroes can be bulk listed at once.`
        );
      }
    },
    [selectedHeroes]
  );

  // Clear all selections
  const clearAllSelections = useCallback(() => {
    setSelectedHeroes(new Set());
    setBulkPrices({});
  }, []);

  // Set price for a specific hero
  const setHeroPrice = useCallback((heroId, price) => {
    setBulkPrices((prev) => ({
      ...prev,
      [heroId]: price,
    }));
  }, []);

  // Set the same price for all selected heroes
  const setBulkPrice = useCallback(
    (price) => {
      setBulkPrices((prev) => {
        const newPrices = { ...prev };
        selectedHeroes.forEach((heroId) => {
          newPrices[heroId] = price;
        });
        return newPrices;
      });
    },
    [selectedHeroes]
  );

  // Validate bulk listing data
  const validateBulkListing = useCallback(() => {
    const errors = [];

    // Recipient validation for private sale
    if (isPrivateSale && (!recipient || !web3.utils.isAddress(recipient))) {
      errors.push('Enter a valid recipient 0x address for private sale');
    }

    if (selectedHeroes.size === 0) {
      errors.push('No heroes selected');
      return { isValid: false, errors };
    }

    if (selectedHeroes.size > 50) {
      errors.push('Cannot list more than 50 heroes at once');
    }

    // Check that all selected heroes have prices
    const missingPrices = Array.from(selectedHeroes).filter(
      (heroId) => !bulkPrices[heroId] || parseFloat(bulkPrices[heroId]) <= 0
    );

    if (missingPrices.length > 0) {
      errors.push(`${missingPrices.length} heroes are missing valid prices`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [selectedHeroes, bulkPrices, isPrivateSale, recipient]);

  // Validate hero ownership before transaction
  const validateHeroOwnership = useCallback(async () => {
    const heroIds = Array.from(selectedHeroes);

    const ownershipChecks = heroIds.map((heroId) =>
      DFKHeroContract.methods
        .ownerOf(heroId)
        .call()
        .catch((error) => {
          console.error(`Error checking ownership of hero ${heroId}:`, error);
          return null; // Return null on error to not block the whole process
        })
    );

    const owners = await Promise.all(ownershipChecks);

    const invalidHeroes = heroIds.filter((heroId, index) => {
      const owner = owners[index];
      // An owner is invalid if the call failed (owner is null) or the owner doesn't match
      return !owner || owner.toLowerCase() !== connectedAddress.toLowerCase();
    });

    return { isValid: invalidHeroes.length === 0, invalidHeroes };
  }, [selectedHeroes, connectedAddress]);

  // Execute bulk listing
  const executeBulkListing = useCallback(async (bypassWarnings = false) => {
    if (!connectedAddress) {
      toast.error('Wallet not connected');
      return { success: false };
    }

    const validation = validateBulkListing();
    if (!validation.isValid) {
      validation.errors.forEach((error) => toast.error(error));
      return { success: false, errors: validation.errors };
    }

    try {
      setIsBulkListing(true);
      setBulkProgress({
        current: 0,
        total: selectedHeroes.size,
        status: 'Validating hero ownership...',
      });

      // Validate hero ownership first
      const ownershipValidation = await validateHeroOwnership();
      if (!ownershipValidation.isValid) {
        const errorMsg = `You don't own these heroes: ${ownershipValidation.invalidHeroes.join(', ')}. They may have been transferred or listed elsewhere.`;
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Check for equipped items via direct contract call in parallel
      if (!bypassWarnings) {
        setBulkProgress({
          current: 0,
          total: selectedHeroes.size,
          status: 'Checking for equipped items...',
        });

        const heroIds = Array.from(selectedHeroes);
        const equipmentChecks = heroIds.map((heroId) =>
          DFKHeroContract.methods
            .getHeroEquipment(heroId)
            .call()
            .catch((error) => {
              console.warn(`Could not check equipment for hero ${heroId}:`, error);
              return null; // Return null on error
            })
        );

        const allEquipment = await Promise.all(equipmentChecks);

        const heroesWithEquipmentDetails = [];
        allEquipment.forEach((equipment, index) => {
          if (!equipment) return; // Skip if the check failed

          const heroId = heroIds[index];
          const itemNames = [];
          // Correctly check for non-zero equipment IDs using loose inequality
          if (equipment[1] != 0) itemNames.push('a pet');
          if (equipment[2] != 0 || equipment[3] != 0) itemNames.push('a weapon');
          if (equipment[6] != 0) itemNames.push('armor');
          if (equipment[7] != 0) itemNames.push('an accessory');

          if (itemNames.length > 0) {
            heroesWithEquipmentDetails.push({ heroId, items: itemNames });
          }
        });

        if (heroesWithEquipmentDetails.length > 0) {
          let warningMessage = '';
          if (heroesWithEquipmentDetails.length === 1) {
            const heroDetail = heroesWithEquipmentDetails[0];
            const exampleItem = heroDetail.items[0] || 'an item';
            warningMessage = `Heads up! One of your selected heroes (ID: ${heroDetail.heroId}) has one or more equipped items (e.g., ${exampleItem}). These items transfer with the hero. To keep them, unequip in DFK before selling. List anyway?`;
          } else {
            warningMessage = `Heads up! ${heroesWithEquipmentDetails.length} of your selected heroes have one or more equipped items (e.g., a pet or weapon). These items transfer with the heroes. To keep them, unequip in DFK before selling. List anyway?`;
          }

          return {
            success: false,
            errors: [],
            warnings: [warningMessage],
          };
        }
      }

      setBulkProgress({
        current: 1,
        total: selectedHeroes.size,
        status: 'Checking marketplace approval...',
      });

      const heroIds = Array.from(selectedHeroes);
      const prices = heroIds.map((heroId) => {
        const priceInWei = web3.utils.toWei(bulkPrices[heroId].toString(), 'ether');
        return priceInWei;
      });

      // Check if marketplace is approved for all heroes
      const isApproved = await DFKHeroContract.methods
        .isApprovedForAll(connectedAddress, HONKMarketplaceContract.options.address)
        .call();

      if (!isApproved) {
        toast.info('Approving marketplace to manage your heroes...');
        setBulkProgress({
          current: 0,
          total: selectedHeroes.size,
          status: 'Approving marketplace...',
        });

        const approveTx = await DFKHeroContract.methods
          .setApprovalForAll(HONKMarketplaceContract.options.address, true)
          .send({
            from: connectedAddress,
            gasLimit: 300000,
          });

        if (!approveTx.status) {
          throw new Error('Failed to approve marketplace');
        }

        toast.success('Marketplace approved!');
      }

      // Estimate gas for bulk listing with a more conservative approach
      let gasEstimate;
      try {
        const listingMethod = isPrivateSale
          ? HONKMarketplaceContract.methods.bulkListHeroesPrivate(heroIds, prices, recipient)
          : HONKMarketplaceContract.methods.bulkListHeroes(heroIds, prices);

        gasEstimate = await listingMethod.estimateGas({ from: connectedAddress });

        // Convert to number and add 30% buffer for safety
        gasEstimate = Math.floor(Number(gasEstimate) * 1.3);
      } catch (gasError) {
        console.warn('Gas estimation failed, using fallback:', gasError);
        gasEstimate = 150000 + heroIds.length * 100000; // More conservative fallback
      }

      setBulkProgress({
        current: 1,
        total: selectedHeroes.size,
        status: 'Submitting bulk listing transaction...',
      });

      // Pre-transaction validation to catch common issues
      for (let i = 0; i < heroIds.length; i++) {
        const heroId = heroIds[i];
        try {
          // Check if hero is already listed
          const isListed = await HONKMarketplaceContract.methods.checkIfHeroIsListed(heroId).call();
          if (isListed) {
            throw new Error(
              `Hero ${heroId} is already listed for sale. Please refresh and try again.`
            );
          }
          // Check ownership again right before sending (belt and suspenders)
          const currentOwner = await DFKHeroContract.methods.ownerOf(heroId).call();
          if (currentOwner.toLowerCase() !== connectedAddress.toLowerCase()) {
            throw new Error(
              `Ownership of hero ${heroId} changed. Please refresh and try again.`
            );
          }
        } catch (preTxError) {
          console.error('Pre-transaction validation failed:', preTxError);
          toast.error(preTxError.message || 'Pre-transaction validation failed.');
          setIsBulkListing(false);
          return { success: false, errors: [preTxError.message] };
        }
      }

      // Check for existing bulk listings to prevent duplicates if a previous attempt failed mid-way
      try {
        const nextBulkListingId = await HONKMarketplaceContract.methods.nextBulkListingId().call();
        const heroToBulkListing = new Map();

        // Check all existing bulk listings
        for (let bulkId = 1; bulkId < nextBulkListingId; bulkId++) {
          try {
            const bulkListingData = await HONKMarketplaceContract.methods
              .getBulkListing(bulkId)
              .call();
            const bulkHeroIds = bulkListingData.heroIds || bulkListingData[0] || [];

            bulkHeroIds.forEach((heroId) => {
              const heroIdStr = heroId.toString();
              if (heroIds.includes(heroIdStr)) {
                heroToBulkListing.set(heroIdStr, bulkId);
              }
            });
          } catch (e) {
            // Bulk listing might be empty, continue
          }
        }

        if (heroToBulkListing.size > 0) {
          const duplicateInfo = Array.from(heroToBulkListing.entries())
            .map(([heroId, bulkId]) => `Hero ${heroId} is in bulk listing #${bulkId}`)
            .join(', ');
          throw new Error(
            `Some heroes are already in bulk listings: ${duplicateInfo}. Please cancel those bulk listings first.`
          );
        }
      } catch (validationError) {
        if (validationError.message.includes('already in bulk listings')) {
          throw validationError;
        }
        console.warn('Could not validate bulk listings, proceeding with caution:', validationError);
      }

      // Execute bulk listing
      const tx = await (isPrivateSale
        ? HONKMarketplaceContract.methods.bulkListHeroesPrivate(heroIds, prices, recipient)
        : HONKMarketplaceContract.methods.bulkListHeroes(heroIds, prices)
      ).send({
        from: connectedAddress,
        gas: gasEstimate,
      });

      if (tx.status) {
        toast.success(`Successfully listed ${heroIds.length} heroes!`);

        // Clear selections and refresh data
        setSelectedHeroes(new Set());
        setBulkPrices({});

        // Refresh hero data
        if (fetchHeroes) {
          await fetchHeroes(connectedAddress);
        }

        // Notify all tabs to refresh
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('honkMarketplaceUpdate'));
          window.dispatchEvent(new Event('honkBulkListingDone'));
        }

        setBulkProgress({
          current: selectedHeroes.size,
          total: selectedHeroes.size,
          status: 'Complete!',
        });

        return { success: true, transactionHash: tx.transactionHash };
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Bulk listing error:', error);

      let errorMessage = error.message || 'Unknown error';

      // Handle specific error cases with better messages
      if (errorMessage.includes('revert')) {
        if (
          errorMessage.includes("You don't own this hero") ||
          errorMessage.includes("You don't own these heroes")
        ) {
          errorMessage =
            'One or more heroes are no longer owned by you. Please refresh and try again.';
        } else if (errorMessage.includes('Hero is already listed')) {
          errorMessage = 'One or more heroes are already listed. Please refresh and try again.';
        } else if (errorMessage.includes('Arrays length mismatch')) {
          errorMessage = 'Internal error with price data. Please try again.';
        } else if (errorMessage.includes('Cannot list more than 50 heroes')) {
          errorMessage = 'Cannot list more than 50 heroes at once. Please select fewer heroes.';
        } else if (errorMessage.includes('Price must be greater than zero')) {
          errorMessage = 'All hero prices must be greater than zero.';
        } else if (errorMessage.includes('Price exceeds maximum allowed')) {
          errorMessage = 'One or more hero prices exceed the maximum allowed price.';
        } else if (errorMessage.includes('No heroes to list')) {
          errorMessage = 'No heroes selected for listing.';
        } else if (errorMessage.includes('TransactionRevertedWithoutReasonError')) {
          errorMessage =
            'Transaction was rejected by the contract. This could be due to: heroes already listed, insufficient ownership, or invalid prices. Please check all heroes and try again.';
        } else {
          errorMessage =
            'Transaction was rejected by the contract. Please check that all heroes are valid and you own them.';
        }
      } else if (errorMessage.includes('gas')) {
        errorMessage =
          'Transaction failed due to gas issues. Try reducing the number of heroes or increasing gas limit.';
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas fees.';
      } else if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
        errorMessage = 'Transaction was cancelled by user.';
      }

      toast.error(`Bulk listing failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setIsBulkListing(false);
      setTimeout(() => {
        setBulkProgress({ current: 0, total: 0 });
      }, 3000);
    }
  }, [
    connectedAddress,
    selectedHeroes,
    bulkPrices,
    validateBulkListing,
    validateHeroOwnership,
    fetchHeroes,
    isPrivateSale,
    recipient,
  ]);

  // Calculate total estimated cost (for display)
  const getTotalEstimatedValue = useCallback(() => {
    return Array.from(selectedHeroes).reduce((total, heroId) => {
      const price = parseFloat(bulkPrices[heroId] || 0);
      return total + price;
    }, 0);
  }, [selectedHeroes, bulkPrices]);

  // Cancel bulk listing
  const cancelBulkListing = useCallback(
    async (bulkListingId, heroesInBulkListing = []) => {
      // Prevent duplicate requests for the same bulkListingId
      if (pendingBulkCancellations.has(bulkListingId)) {
        toast.info('Cancellation already pending for this bulk listing');
        return { success: false, pending: true };
      }
      setPendingBulkCancellations((prev) => new Set(prev).add(bulkListingId));

      if (!connectedAddress) {
        toast.error('Wallet not connected');
        return { success: false };
      }

      if (!bulkListingId || bulkListingId <= 0) {
        toast.error('Invalid bulk listing ID');
        return { success: false };
      }

      try {
        toast.info('Cancelling bulk listing...');

        // First, try to get all hero IDs for this bulk listing from the blockchain
        let heroIds = [];
        let isMockBulkListing = false;

        // Check if this is a mock bulk listing (IDs 1000-1999 are mock data)
        if (bulkListingId >= 1000 && bulkListingId <= 1999) {
          console.log(`Detected mock bulk listing ID: ${bulkListingId}`);
          isMockBulkListing = true;

          // For mock bulk listings, use the heroes passed from the UI
          if (heroesInBulkListing && heroesInBulkListing.length > 0) {
            heroIds = heroesInBulkListing.map((hero) => hero.id);
            console.log(`Using hero IDs from UI for mock bulk listing: ${heroIds}`);
            // Don't show confusing "individual" message here - we'll show clear success message later
          } else {
            // Fallback to selectedHeroes if available
            if (selectedHeroes && selectedHeroes.size > 0) {
              heroIds = Array.from(selectedHeroes);
              console.log(`Using fallback hero IDs from selection: ${heroIds}`);
              toast.warning(
                'Using selected heroes for cancellation. Please ensure you have the correct heroes selected.'
              );
            } else {
              toast.error(
                'Could not determine which heroes to cancel. This appears to be a display grouping rather than an actual bulk listing.'
              );
              return { success: false, error: 'Unable to determine heroes to cancel' };
            }
          }
        } else {
          // For real bulk listings, try to get data from the contract
          try {
            // Check if getBulkListing method exists in the contract
            if (HONKMarketplaceContract.methods.getBulkListing) {
              console.log(`Attempting to get bulk listing data for ID: ${bulkListingId}`);
              const bulkListingData = await HONKMarketplaceContract.methods
                .getBulkListing(bulkListingId)
                .call();
              heroIds = bulkListingData.heroIds || bulkListingData[0] || []; // Handle different return formats

              console.log(
                `Retrieved ${heroIds.length} heroes for bulk listing ${bulkListingId}:`,
                heroIds
              );
            } else {
              console.warn('getBulkListing method not available in contract ABI');
              throw new Error('getBulkListing method not available');
            }
          } catch (error) {
            console.error('Error retrieving bulk listing data:', error);

            // If getBulkListing fails, try to get hero IDs from the UI state as fallback
            console.log('Fallback: Attempting to use heroes from UI state or selection');

            if (heroesInBulkListing && heroesInBulkListing.length > 0) {
              heroIds = heroesInBulkListing.map((hero) => hero.id);
              console.log(`Using hero IDs from UI: ${heroIds}`);
              toast.warning('Using heroes from display for cancellation.');
            } else if (selectedHeroes && selectedHeroes.size > 0) {
              heroIds = Array.from(selectedHeroes);
              console.log(`Using fallback hero IDs from selection: ${heroIds}`);
              toast.warning(
                'Using selected heroes for cancellation. Please ensure you have the correct heroes selected.'
              );
            } else {
              toast.error(
                'Could not determine which heroes to cancel. Please try refreshing the page or contact support.'
              );
              return { success: false, error: 'Unable to determine heroes to cancel' };
            }
          }
        }

        if (!heroIds || heroIds.length === 0) {
          toast.error('No heroes found for this bulk listing');
          return { success: false, error: 'No heroes found' };
        }

        let dedicatedSucceeded = false;
        try {
          // If we can estimate gas, assume dedicated method is valid and will succeed
          const gasEstimate = await HONKMarketplaceContract.methods
            .cancelBulkListing(bulkListingId)
            .estimateGas({ from: connectedAddress });
          let gas = Math.floor(Number(gasEstimate) * 1.5);

          const tx = await HONKMarketplaceContract.methods.cancelBulkListing(bulkListingId).send({
            from: connectedAddress,
            gas,
          });
          // Success – handle UI and exit early
          if (tx && tx.status) {
            toast.success('Bulk listing cancelled successfully!');
            setSelectedHeroes(new Set());
            setBulkPrices({});
            if (fetchHeroes) await fetchHeroes(connectedAddress);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('honkMarketplaceUpdate'));
            }
            return { success: true, transactionHash: tx.transactionHash };
          }
        } catch (e) {
          console.warn(
            'cancelBulkListing gas estimate or tx failed, falling back to bulkCancelListings'
          );
        }

        // If dedicated path failed, fall back
        // Ensure IDs are strings for the contract call
        const heroIdStrings = heroIds.map((id) => id.toString());
        console.log(`Attempting to cancel individual listings for heroes: ${heroIdStrings}`);
        toast.info(`Cancelling bulk listing (${heroIds.length} heroes)...`);
        // Estimate gas
        let gas;
        try {
          const gasEstimate = await HONKMarketplaceContract.methods
            .bulkCancelListings(heroIdStrings)
            .estimateGas({ from: connectedAddress });
          gas = Math.floor(Number(gasEstimate) * 1.5);
        } catch (e) {
          gas = 1000000;
        }
        const tx = await HONKMarketplaceContract.methods.bulkCancelListings(heroIdStrings).send({
          from: connectedAddress,
          gas,
        });

        if (tx && tx.status) {
          if (isMockBulkListing) {
            toast.success(`Successfully cancelled bulk listing with ${heroIds.length} heroes!`);
          } else {
            toast.success('Bulk listing cancelled successfully!');
          }

          // Clear selections since they were cancelled (if any were selected)
          setSelectedHeroes(new Set());
          setBulkPrices({});

          // Refresh hero data
          if (fetchHeroes) {
            await fetchHeroes(connectedAddress);
          }

          // Notify all tabs to refresh
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('honkMarketplaceUpdate'));
          }

          return { success: true, transactionHash: tx.transactionHash };
        } else {
          throw new Error('Transaction failed - no transaction receipt received');
        }
      } catch (error) {
        console.error('Bulk listing cancellation error:', error);

        let errorMessage = error.message || 'Unknown error';

        // Handle specific error cases
        if (errorMessage.includes('revert')) {
          if (
            errorMessage.includes('Invalid bulk listing ID') ||
            errorMessage.includes('Bulk listing not found')
          ) {
            errorMessage = 'Bulk listing not found or already cancelled.';
          } else if (errorMessage.includes("You don't own this hero")) {
            errorMessage = 'You no longer own all heroes in this bulk listing.';
          } else if (
            errorMessage.includes('Hero does not exist') ||
            errorMessage.includes('Hero not found')
          ) {
            errorMessage = 'One or more heroes in this bulk listing are no longer available.';
          } else if (errorMessage.includes('Hero is not listed for sale')) {
            errorMessage = 'This bulk listing is no longer active.';
          } else {
            errorMessage = 'Bulk listing cancellation was rejected by the contract.';
          }
        } else if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
          errorMessage = 'Bulk listing cancellation was cancelled by user.';
        } else if (errorMessage.includes('gas')) {
          errorMessage = 'Bulk listing cancellation failed due to gas issues. Please try again.';
        } else if (errorMessage.includes('not available')) {
          errorMessage = 'Contract method not available. Using individual cancellation method.';
        }

        toast.error(`Failed to cancel bulk listing: ${errorMessage}`);
        return { success: false, error: errorMessage };
      } finally {
        // Remove from pending set after attempt completes
        setPendingBulkCancellations((prev) => {
          const newSet = new Set(prev);
          newSet.delete(bulkListingId);
          return newSet;
        });
      }
    },
    [
      connectedAddress,
      selectedHeroes,
      bulkPrices,
      validateBulkListing,
      validateHeroOwnership,
      fetchHeroes,
      pendingBulkCancellations,
    ]
  );

  return {
    // State
    selectedHeroes,
    bulkPrices,
    isBulkMode,
    isBulkListing,
    bulkProgress,
    pendingBulkCancellations,
    isPrivateSale,
    setIsPrivateSale,
    recipient,
    setRecipient,

    // Actions
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
  };
};
