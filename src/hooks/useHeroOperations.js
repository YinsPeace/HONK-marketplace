import { useState, useCallback } from 'react';
import { HONKMarketplaceContract, web3 } from '../Web3Config';
import { toast } from 'react-toastify';

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

  return {
    updatePrice,
    cancelListing,
    pendingCancellations,
    pendingPriceUpdates
  };
};
