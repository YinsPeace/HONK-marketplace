import { useState } from 'react';
import { HONKMarketplaceContract, web3 } from '../Web3Config';
import { toast } from 'react-toastify';

export const useHeroOperations = (connectedAddress, fetchHeroes) => {
  const [updatingHeroId, setUpdatingHeroId] = useState(null);
  const [cancellingHeroId, setCancellingHeroId] = useState(null);

  const updatePrice = async (heroId, price) => {
    setUpdatingHeroId(heroId);
    toast.info(`Updating price for Hero ${heroId}...`);
    try {
      const priceWei = web3.utils.toWei(price.toString(), 'ether');
      const gasEstimate = await HONKMarketplaceContract.methods
        .updatePrice(heroId, priceWei)
        .estimateGas({ from: connectedAddress });
      const receipt = await HONKMarketplaceContract.methods.updatePrice(heroId, priceWei).send({
        from: connectedAddress,
        gas: BigInt(Math.floor(Number(gasEstimate) * 1.5)),
      });

      if (receipt.status) {
        toast.success(`Price updated for Hero ${heroId} successfully!`);
        fetchHeroes(connectedAddress);
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Error updating price:', error);
      let errorMessage = 'Failed to update price. ';
      if (error.code === 4001) {
        errorMessage += 'Transaction was rejected in your wallet.';
      } else {
        errorMessage += 'Please try again later.';
      }
      toast.error(errorMessage);
    } finally {
      setUpdatingHeroId(null);
    }
  };

  const cancelListing = async (heroId) => {
    setCancellingHeroId(heroId);
    toast.info(`Cancelling listing for Hero ${heroId}...`);
    try {
      const gasEstimate = await HONKMarketplaceContract.methods
        .cancelListing(heroId)
        .estimateGas({ from: connectedAddress });
      const receipt = await HONKMarketplaceContract.methods.cancelListing(heroId).send({
        from: connectedAddress,
        gas: BigInt(Math.floor(Number(gasEstimate) * 1.5)),
      });

      if (receipt.status) {
        toast.success(`Listing for Hero ${heroId} cancelled successfully!`);
        fetchHeroes(connectedAddress);
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Error cancelling listing:', error);
      let errorMessage = 'Failed to cancel listing. ';
      if (error.code === 4001) {
        errorMessage += 'Transaction was rejected in your wallet.';
      } else {
        errorMessage += 'Please try again later.';
      }
      toast.error(errorMessage);
    } finally {
      setCancellingHeroId(null);
    }
  };

  return { updatingHeroId, cancellingHeroId, updatePrice, cancelListing };
};
