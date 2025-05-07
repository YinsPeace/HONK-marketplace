import { useState, useCallback } from 'react';
import { HONKMarketplaceContract, web3, DFKHeroContract } from '../Web3Config';
import { toast } from 'react-toastify';
import { getHeroData } from '../utils/heroUtils';

export const useHeroOperations = (connectedAddress, fetchHeroes, setHeroes) => {
  const [pendingCancellations, setPendingCancellations] = useState(new Set());
  const [pendingPriceUpdates, setPendingPriceUpdates] = useState(new Set());

  const updatePrice = useCallback(async (heroId, newPrice) => {
    if (!connectedAddress || !heroId || !newPrice) {
      return {
        success: false,
        error: 'Invalid parameters'
      };
    }

    try {
      setPendingPriceUpdates(prev => new Set([...prev, heroId]));

      // Convert price to wei
      const priceInWei = web3.utils.toWei(newPrice.toString(), 'ether');

      // Use the correct method name from the contract: updatePrice
      const tx = await HONKMarketplaceContract.methods.updatePrice(
        heroId,
        priceInWei
      ).send({
        from: connectedAddress,
        gasLimit: 300000
      });

      if (tx.status) {
        // Refresh the heroes list
        await fetchHeroes(connectedAddress);
        toast.success(`Successfully updated price for hero ${heroId}`);
        return {
          success: true
        };
      } else {
        toast.error('Transaction failed');
        return {
          success: false,
          error: 'Transaction failed'
        };
      }
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error(`Failed to update price: ${error.message || 'Unknown error'}`);
      return {
        success: false,
        error: error.message || 'Unknown error'
      };
    } finally {
      setPendingPriceUpdates(prev => {
        const next = new Set(prev);
        next.delete(heroId);
        return next;
      });
    }
  }, [connectedAddress, fetchHeroes]);

  const cancelListing = useCallback(async (heroId) => {
    if (!connectedAddress || !heroId) {
      return {
        success: false,
        error: 'Invalid parameters'
      };
    }

    try {
      setPendingCancellations(prev => new Set([...prev, heroId]));

      const tx = await HONKMarketplaceContract.methods.cancelListing(heroId).send({
        from: connectedAddress,
        gasLimit: 300000
      });

      if (tx.status) {
        await fetchHeroes(connectedAddress);
        toast.success(`Successfully cancelled listing for hero ${heroId}`);
        return {
          success: true
        };
      } else {
        toast.error('Transaction failed');
        return {
          success: false,
          error: 'Transaction failed'
        };
      }
    } catch (error) {
      console.error('Error cancelling listing:', error);
      toast.error(`Failed to cancel listing: ${error.message || 'Unknown error'}`);
      return {
        success: false,
        error: error.message || 'Unknown error'
      };
    } finally {
      setPendingCancellations(prev => {
        const next = new Set(prev);
        next.delete(heroId);
        return next;
      });
    }
  }, [connectedAddress, fetchHeroes]);

  // Function to check if a hero has moved to another chain or changed ownership and cancel the listing if needed
  const checkAndCancelIfMoved = useCallback(async (heroId) => {
    if (!connectedAddress || !heroId) {
      return {
        success: false,
        error: 'Invalid parameters'
      };
    }

    try {
      // Get hero data to check the network
      const heroData = await getHeroData(heroId);
      
      // If hero is not on DFK Chain (Crystalvale), cancel the listing
      if (heroData.network && heroData.network !== 'dfk') {
        // Map network codes to realm names for the message
        const networkToRealm = {
          'kla': 'Serendale',
          'dfk': 'Crystalvale',
          'met': 'Sundered Isles'
        };
        
        const realmName = networkToRealm[heroData.network] || 'another realm';
        
        // Automatically cancel the listing
        const result = await cancelListing(heroId);
        
        if (result.success) {
          toast.info(`Hero #${heroId} was automatically unlisted because it moved to ${realmName}`);
        }
        
        return result;
      }
      
      // Check if hero is still owned by the original owner
      try {
        // Get the current owner from the contract
        const currentOwner = await DFKHeroContract.methods.ownerOf(heroId).call();
        // Get the owner from the marketplace listing
        const marketplaceData = await HONKMarketplaceContract.methods.getHero(heroId).call();
        
        // If the current owner is different from the listing owner, cancel the listing
        if (currentOwner.toLowerCase() !== marketplaceData.owner.toLowerCase()) {
          
          // Automatically cancel the listing
          const result = await cancelListing(heroId);
          
          if (result.success) {
            toast.info(`Hero #${heroId} was automatically unlisted because ownership changed`);
          }
          
          return result;
        }
      } catch (ownerError) {
        // If we can't check ownership, we should still continue
      }
      
      return { success: true, moved: false };
    } catch (error) {
      console.error('Error checking hero network:', error);
      return {
        success: false,
        error: error.message || 'Unknown error'
      };
    }
  }, [connectedAddress, cancelListing]);

  return {
    updatePrice,
    cancelListing,
    checkAndCancelIfMoved,
    pendingCancellations,
    pendingPriceUpdates
  };
};
