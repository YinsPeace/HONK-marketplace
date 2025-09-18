import { useState, useCallback, useEffect } from 'react';
import { checkQuestStatus } from '../utils/filterUtils';
import { HONKMarketplaceContract, web3, DFKHeroContract } from '../Web3Config';
import { toast } from 'react-toastify';

export const useHeroListing = (connectedAddress, fetchHeroes, setHeroes) => {
  const [listingHeroId, setListingHeroId] = useState(null);
  const [listedHeroes, setListedHeroes] = useState([]);
  // Map heroId(string) -> { price: string(wei), isPrivate: boolean, recipient?: string, ts: number }
  const [pendingListings, setPendingListings] = useState(new Map());

  const fetchListedHeroes = useCallback(async () => {
    if (!connectedAddress) return [];

    try {
      const result = await HONKMarketplaceContract.methods
        .getListedHeroes()
        .call();
      const listedHeroes = result[0];

      const filtered = listedHeroes
        .filter(
          (hero) =>
            hero &&
            hero.id &&
            hero.id !== '0' &&
            hero.owner &&
            hero.owner.toLowerCase() === connectedAddress.toLowerCase() &&
            hero.isForSale
        )
        .map((hero) => ({
          heroId: hero.id.toString(),
          price: hero.price.toString(),
          owner: hero.owner,
          isForSale: true,
          marketplace: 'honk',
          bulkListingId: hero.bulkListingId ? Number(hero.bulkListingId) : 0,
        }));

      setListedHeroes(filtered);
      // Clear any matching pending entries that are now confirmed on-chain
      setPendingListings((prev) => {
        if (!prev || prev.size === 0) return prev;
        const next = new Map(prev);
        filtered.forEach((h) => next.delete(String(h.heroId)));
        return next;
      });
      return filtered;
    } catch (error) {
      console.error('Error fetching listed heroes:', error);
      toast.error('Failed to fetch listed heroes');
      return [];
    }
  }, [connectedAddress]);

  // Fetch listed heroes when component mounts or address changes
  useEffect(() => {
    fetchListedHeroes();
  }, [connectedAddress, fetchListedHeroes]);

  const isAddress = (addr) => /^0x[a-fA-F0-9]{40}$/.test(addr);

  const listHeroForSale = useCallback(
    async (heroId, price, bypassWarnings = false, heroData = null, isPrivate = false, recipient = null) => {
      console.log('Attempting to list hero:', heroId, 'with data:', heroData);

      // Check if hero is on a quest first
      const isQuesting = await checkQuestStatus(heroId);
      if (isQuesting) {
        return {
          success: false,
          errors: ['This hero is currently on a quest and cannot be listed.'],
          warnings: [],
        };
      }

      if (!connectedAddress || !heroId || !price) {
        return {
          success: false,
          errors: ['Invalid parameters'],
          warnings: [],
        };
      }

      try {
        // Convert price to wei (assuming 18 decimals)
        const priceInWei = web3.utils.toWei(price.toString(), 'ether');

        // Check if hero is on a different chain
        if (heroData && heroData.network) {
          // Map network codes to realm names
          const networkToRealm = {
            kla: 'Serendale',
            dfk: 'Crystalvale',
            met: 'Sundered Isles',
          };

          // If hero is not on DFK Chain (Crystalvale), show specific error
          if (heroData.network !== 'dfk') {
            const realmName = networkToRealm[heroData.network] || 'another realm';
            return {
              success: false,
              errors: [
                `This hero is on ${realmName}. Please move it to Crystalvale to list on HONK Marketplace.`,
              ],
              warnings: [],
            };
          }
        }

        // Check if hero exists and is owned by the user using DFKHeroContract
        try {
          const heroOwner = await DFKHeroContract.methods.ownerOf(heroId).call();
          if (heroOwner.toLowerCase() !== connectedAddress.toLowerCase()) {
            return {
              success: false,
              errors: ['You do not own this hero'],
              warnings: [],
            };
          }
        } catch (ownerError) {
          // If ownerOf fails, it might be because the hero is on another chain
          return {
            success: false,
            errors: ['Unable to verify hero ownership. The hero may be on another realm.'],
            warnings: [],
          };
        }

        // Check for equipped items via direct contract call
        if (!bypassWarnings) {
          try {
            const equipment = await DFKHeroContract.methods
              .getHeroEquipment(heroId)
              .call();
            const itemNames = [];
            // Indices from getHeroEquipment struct: 1:petId, 2:weapon1Id, 3:weapon2Id, 6:armorId, 7:accessoryId
            if (equipment[1] != 0) itemNames.push('a pet');
            if (equipment[2] != 0 || equipment[3] != 0) itemNames.push('a weapon'); // weapon1 or weapon2
            if (equipment[6] != 0) itemNames.push('armor');
            if (equipment[7] != 0) itemNames.push('an accessory');

            if (itemNames.length > 0) {
              const exampleItem = itemNames[0]; // e.g., "a pet" or "a weapon"
              return {
                success: false,
                errors: [],
                warnings: [
                  `Heads up! This hero has one or more equipped items (e.g., ${exampleItem}). These items transfer with the hero. To keep them, unequip in DFK before selling. List anyway?`,
                ],
              };
            }
          } catch (error) {
            console.warn(`Could not check equipment for hero ${heroId}:`, error);
            // Fail open, don't block the user if the check fails
          }
        }

        // Check if hero is already listed - using the correct getHero method
        const heroListing = await HONKMarketplaceContract.methods.getHero(heroId).call();
        if (heroListing && heroListing.isForSale) {
          return {
            success: false,
            errors: ['Hero is already listed'],
            warnings: [],
          };
        }

        // Check if marketplace is approved to handle the hero using DFKHeroContract
        const marketplaceAddressForApproval = HONKMarketplaceContract.options.address;
        console.log('[Listing Approval] Checking approval for marketplace:', marketplaceAddressForApproval, 'and owner:', connectedAddress);
        const isApproved = await DFKHeroContract.methods
          .isApprovedForAll(connectedAddress, marketplaceAddressForApproval)
          .call();
        console.log('[Listing Approval] isApprovedForAll returned:', isApproved);

        if (!isApproved) {
          try {
            console.log('[Listing Approval] Not approved. Attempting to setApprovalForAll for marketplace:', marketplaceAddressForApproval);
            // First approve the marketplace using DFKHeroContract
            const approveTx = await DFKHeroContract.methods
              .setApprovalForAll(marketplaceAddressForApproval, true)
              .send({
                from: connectedAddress,
                gasLimit: 300000, // Lower gas limit for approval
              });
            console.log('[Listing Approval] setApprovalForAll transaction result:', approveTx);

            if (!approveTx.status) {
              return {
                success: false,
                errors: ['Failed to approve marketplace'],
                warnings: [],
              };
            }
          } catch (approvalError) {
            console.error('[Listing Approval] Error during setApprovalForAll:', approvalError);
            return {
              success: false,
              errors: [
                'Failed to approve marketplace: ' + (approvalError.message || 'Unknown error'),
              ],
              warnings: [],
            };
          }
        }

        // Re-check approval status after attempting setApprovalForAll, just to be sure
        const isApprovedAfterAttempt = await DFKHeroContract.methods
          .isApprovedForAll(connectedAddress, marketplaceAddressForApproval)
          .call();
        console.log('[Listing Approval] Approval status AFTER setApprovalForAll attempt:', isApprovedAfterAttempt);

        if (!isApprovedAfterAttempt) {
          console.error('[Listing Approval] CRITICAL: Marketplace still not approved after setApprovalForAll attempt. Aborting listHero.');
          return {
            success: false,
            errors: ['Marketplace approval failed despite attempt. Please try approving manually or contact support.'],
            warnings: [],
          };
        }
        
        // Check if hero is on a quest
        try {
          const isOnQuest = await checkQuestStatus(heroId);
          console.log(`[Listing Quest Check] Hero ${heroId} is on quest: ${isOnQuest}`);
          if (isOnQuest) {
            return {
              success: false,
              errors: ['This hero is currently on a quest and cannot be listed.'],
              warnings: [],
            };
          }
        } catch (questCheckError) {
          console.error(`[Listing Quest Check] Error checking quest status for hero ${heroId}:`, questCheckError);
          // Decide if you want to block the transaction or just warn the user
          return {
            success: false,
            errors: ['Could not verify hero quest status. Please try again.'],
            warnings: [],
          };
        }

        // Check the DFK Hero contract address stored within HONKMarketplace
        try {
          const marketplaceDfkHeroContractAddress = await HONKMarketplaceContract.methods
            .dfkHeroContract()
            .call();
          console.log(`[Listing Pre-Check] HONKMarketplace's configured DFKHeroContract address: ${marketplaceDfkHeroContractAddress}`);
          // We will manually compare this to the frontend's DFK_HERO_CONTRACT_ADDRESS later
        } catch (dfkAddressCheckError) {
          console.error(`[Listing Pre-Check] Error reading HONKMarketplace.dfkHeroContract():`, dfkAddressCheckError);
          // Potentially critical, but let's log and proceed to see if other checks catch it
        }

        // Check contract's heroCount and recycledIndicesCount for potential issues
        try {
          const currentHeroCount = await HONKMarketplaceContract.methods.heroCount().call();
          const currentRecycledIndicesCount = await HONKMarketplaceContract.methods
            .recycledIndicesCount()
            .call();
          console.log(`[Listing Pre-Check] Contract heroCount: ${currentHeroCount}, recycledIndicesCount: ${currentRecycledIndicesCount}`);

          // MAX_HERO_COUNT is 1,000,000 as per contract
          if (BigInt(currentRecycledIndicesCount) === 0n && BigInt(currentHeroCount) >= 1000000n) {
            return {
              success: false,
              errors: [`The marketplace has reached its maximum hero capacity (${currentHeroCount} / 1,000,000).`],
              warnings: [],
            };
          }
        } catch (countCheckError) {
          console.error(`[Listing Pre-Check] Error reading heroCount/recycledIndicesCount:`, countCheckError);
          // Non-critical, proceed but log error
        }

        // Check if the marketplace contract is paused
        try {
          const isPaused = await HONKMarketplaceContract.methods.paused().call();
          console.log(`[Listing Pre-Check] Marketplace paused state: ${isPaused}`);
          if (isPaused) {
            return {
              success: false,
              errors: ['The HONKMarketplace contract is currently paused. Listings are temporarily disabled.'],
              warnings: [],
            };
          }
        } catch (pausedCheckError) {
          console.error(`[Listing Pre-Check] Error calling paused() on HONKMarketplace contract:`, pausedCheckError);
          return {
            success: false,
            errors: ['Could not verify if the HONKMarketplace contract is paused. Please try again.'],
            warnings: [],
          };
        }

        // Check if the contract already thinks the hero is listed
        try {
          const contractThinksListed = await HONKMarketplaceContract.methods
            .checkIfHeroIsListed(heroId)
            .call();
          console.log(`[Listing Pre-Check] Contract's isHeroListed for ${heroId}: ${contractThinksListed}`);
          if (contractThinksListed) {
            return {
              success: false,
              errors: [`The marketplace contract (HONKMarketplace) believes hero ${heroId} is already listed. You may need to cancel a previous listing from this marketplace.`],
              warnings: [],
            };
          }
        } catch (isListedCheckError) {
          console.error(`[Listing Pre-Check] Error calling checkIfHeroIsListed for hero ${heroId}:`, isListedCheckError);
          return {
            success: false,
            errors: ['Could not verify if hero is already listed with the HONKMarketplace contract. Please try again.'],
            warnings: [],
          };
        }

        // Verify on-chain ownership before attempting to list
        try {
          const onChainOwner = await DFKHeroContract.methods.ownerOf(heroId).call();
          console.log(`[Listing Ownership Check] On-chain owner of hero ${heroId}: ${onChainOwner}`);
          console.log(`[Listing Ownership Check] Connected address (expected owner): ${connectedAddress}`);
          if (onChainOwner.toLowerCase() !== connectedAddress.toLowerCase()) {
            console.error(`[Listing Ownership Check] Mismatch! Connected address ${connectedAddress} is NOT the on-chain owner ${onChainOwner} of hero ${heroId}.`);
            return {
              success: false,
              errors: ['Ownership mismatch: You do not appear to be the on-chain owner of this hero. Please refresh your hero list.'],
              warnings: [],
            };
          }
          console.log('[Listing Ownership Check] Ownership confirmed.');
        } catch (ownerCheckError) {
          console.error(`[Listing Ownership Check] Error checking ownerOf for hero ${heroId}:`, ownerCheckError);
          return {
            success: false,
            errors: ['Could not verify hero ownership. Please try again.'],
            warnings: [],
          };
        }

        // Log transaction parameters for debugging
        const convertedPrice = isPrivate ? priceInWei : web3.utils.toWei(price.toString(), 'ether');
        console.log('[Listing Transaction] Sending transaction with parameters:', { heroId, convertedPrice, connectedAddress, isPrivate, recipient });

        // Begin optimistic UI BEFORE sending tx so the button disables immediately
        setPendingListings((prev) => {
          const next = new Map(prev);
          next.set(String(heroId), {
            price: String(priceInWei),
            isPrivate: !!isPrivate,
            recipient: isPrivate ? recipient : undefined,
            ts: Date.now(),
          });
          return next;
        });

        // Update local hero state so the card switches to listed state and hides the "List for Sale" button
        if (setHeroes) {
          setHeroes((prevHeroes) =>
            prevHeroes.map((hero) =>
              hero.id === heroId
                ? {
                    ...hero,
                    isForSale: true,
                    price: priceInWei,
                    owner: connectedAddress,
                  }
                : hero
            )
          );
        }

        let tx;
        if (isPrivate) {
          tx = await HONKMarketplaceContract.methods
            .listHeroPrivate(heroId, priceInWei, recipient)
            .send({ from: connectedAddress, gasLimit: 550000 });
        } else {
          tx = await HONKMarketplaceContract.methods
            .listHero(heroId, web3.utils.toWei(price.toString(), 'ether'))
            .send({ from: connectedAddress, gasLimit: 500000 });
        }

        if (tx.status) {
          // Refresh the listed heroes (will clear the pending entry once confirmed)
          fetchListedHeroes();

          // Update the heroes state with the new listing
          if (setHeroes) {
            setHeroes((prevHeroes) => {
              return prevHeroes.map((hero) => {
                if (hero.id === heroId) {
                  return {
                    ...hero,
                    isForSale: true,
                    price: priceInWei,
                    owner: connectedAddress,
                  };
                }
                return hero;
              });
            });
          }

          return {
            success: true,
            errors: [],
            warnings: [],
          };
        } else {
          return {
            success: false,
            errors: ['Transaction failed'],
            warnings: [],
          };
        }
      } catch (error) {
        console.error('Error listing hero:', error);
        console.error('Detailed transaction error:', JSON.stringify(error, null, 2));
        // Revert optimistic state on error
        setPendingListings((prev) => {
          const next = new Map(prev);
          next.delete(String(heroId));
          return next;
        });
        if (setHeroes) {
          setHeroes((prevHeroes) =>
            prevHeroes.map((hero) =>
              hero.id === heroId
                ? {
                    ...hero,
                    isForSale: false,
                  }
                : hero
            )
          );
        }
        return {
          success: false,
          errors: [error.message || 'Unknown error occurred'],
          warnings: [],
        };
      }
    },
    [connectedAddress, fetchListedHeroes]
  );

  const listHeroForSaleGeneric = useCallback(
    async (heroId, price, bypassWarnings = false, heroData = null, isPrivate = false, recipient = null) => {
      return listHeroForSale(heroId, price, bypassWarnings, heroData, isPrivate, recipient);
    },
    [listHeroForSale]
  );

  const listHeroForSalePublic = useCallback(
    async (heroId, price, bypassWarnings = false, heroData = null) => {
      return listHeroForSaleGeneric(heroId, price, bypassWarnings, heroData, false);
    },
    [listHeroForSaleGeneric]
  );

  const listHeroPrivateForSale = useCallback(
    async (heroId, price, recipient, bypassWarnings = false, heroData = null) => {
      if (!recipient || !isAddress(recipient)) {
        return { success: false, errors: ['Invalid recipient address'], warnings: [] };
      }
      return listHeroForSaleGeneric(heroId, price, bypassWarnings, heroData, true, recipient);
    },
    [listHeroForSaleGeneric, isAddress]
  );

  return {
    listingHeroId,
    listHeroForSale: listHeroForSalePublic,
    listHeroPrivateForSale,
    fetchListedHeroes,
    listedHeroes,
    pendingListings,
  };
};
