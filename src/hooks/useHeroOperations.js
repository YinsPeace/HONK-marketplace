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

      // First check if the hero exists in the marketplace
      let heroData;
      try {
        heroData = await HONKMarketplaceContract.methods.getHero(heroId).call();
        if (!heroData.isForSale) {
          throw new Error('Hero is not listed for sale');
        }
        if (heroData.owner.toLowerCase() !== connectedAddress.toLowerCase()) {
          throw new Error('You are not the owner of this hero listing');
        }
      } catch (checkError) {
        console.error('Error checking hero before update:', checkError);
        throw new Error(`Cannot update price: ${checkError.message}`);
      }

      // Check price update cooldown before attempting transaction
      try {
        const lastUpdateTime = await HONKMarketplaceContract.methods.lastPriceUpdateTime(heroId).call();
        const cooldownPeriod = 15 * 60; // 15 minutes in seconds
        const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
        const nextAllowedUpdate = parseInt(lastUpdateTime) + cooldownPeriod;
        
        if (currentTime < nextAllowedUpdate) {
          const remainingTime = nextAllowedUpdate - currentTime;
          const minutes = Math.floor(remainingTime / 60);
          const seconds = remainingTime % 60;
          
          let timeMessage;
          if (minutes > 0) {
            timeMessage = `${minutes} minute${minutes > 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}`;
          } else {
            timeMessage = `${seconds} second${seconds !== 1 ? 's' : ''}`;
          }
          
          throw new Error(`Price update cooldown active. You can update the price in ${timeMessage}. Please wait and try again.`);
        }
      } catch (cooldownError) {
        // If it's our custom cooldown error, re-throw it
        if (cooldownError.message.includes('Price update cooldown active')) {
          throw cooldownError;
        }
        // Otherwise, log but continue (might be an older contract without this mapping)
        console.warn('Could not check price update cooldown:', cooldownError);
      }

      // Estimate gas first to catch potential issues
      let gasEstimate;
      try {
        gasEstimate = await HONKMarketplaceContract.methods.updatePrice(
          heroId,
          priceInWei
        ).estimateGas({
          from: connectedAddress
        });
        console.log(`Gas estimate for updatePrice: ${gasEstimate}`);
      } catch (gasError) {
        console.error('Gas estimation failed:', gasError);
        
        // Check for specific contract errors
        const errorMessage = gasError.message || '';
        if (errorMessage.includes('Price update too soon')) {
          throw new Error('Price update cooldown active. You can only update a hero\'s price once every 15 minutes. Please wait and try again.');
        }
        
        throw new Error(`Transaction would fail: ${gasError.message}`);
      }

      // Use estimated gas with buffer, minimum 400,000
      const gasLimit = Math.max(Math.floor(Number(gasEstimate) * 1.5), 400000);

      // Use the correct method name from the contract: updatePrice
      const tx = await HONKMarketplaceContract.methods.updatePrice(
        heroId,
        priceInWei
      ).send({
        from: connectedAddress,
        gasLimit: gasLimit
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
      
      // Provide more specific error messages based on common issues
      let errorMessage = error.message || 'Unknown error';
      if (errorMessage.includes('revert')) {
        errorMessage = 'Transaction was reverted by the contract. Please check if the hero is still listed and you own it.';
      } else if (errorMessage.includes('gas')) {
        errorMessage = 'Transaction failed due to gas issues. Please try again.';
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas fees.';
      }
      
      toast.error(`Failed to update price: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage
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

  // Helper function to check price update cooldown status
  const checkPriceUpdateCooldown = useCallback(async (heroId) => {
    if (!heroId) {
      return { canUpdate: false, error: 'Invalid hero ID' };
    }

    try {
      const lastUpdateTime = await HONKMarketplaceContract.methods.lastPriceUpdateTime(heroId).call();
      const cooldownPeriod = 15 * 60; // 15 minutes in seconds
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      const nextAllowedUpdate = parseInt(lastUpdateTime) + cooldownPeriod;
      
      if (currentTime < nextAllowedUpdate) {
        const remainingTime = nextAllowedUpdate - currentTime;
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        
        let timeMessage;
        if (minutes > 0) {
          timeMessage = `${minutes} minute${minutes > 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}`;
        } else {
          timeMessage = `${seconds} second${seconds !== 1 ? 's' : ''}`;
        }
        
        return {
          canUpdate: false,
          remainingTime: remainingTime,
          timeMessage: timeMessage,
          nextAllowedUpdate: nextAllowedUpdate
        };
      }
      
      return { canUpdate: true };
    } catch (error) {
      console.warn('Could not check price update cooldown:', error);
      // If we can't check, assume it's okay to try (for backward compatibility)
      return { canUpdate: true };
    }
  }, []);

  return {
    updatePrice,
    cancelListing,
    checkAndCancelIfMoved,
    pendingCancellations,
    pendingPriceUpdates,
    checkPriceUpdateCooldown
  };
};
