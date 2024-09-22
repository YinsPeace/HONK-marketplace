import { useState } from 'react';
import { HONKMarketplaceContract, DFKHeroContract, web3 } from '../Web3Config';
import { toast } from 'react-toastify';

export const useHeroListing = (userAddress, fetchHeroes) => {
  const [listingHeroId, setListingHeroId] = useState(null);

  const checkHeroStatus = async (heroId) => {
    const heroState = await DFKHeroContract.methods.getHeroState(heroId).call();
    const heroEquipment = await DFKHeroContract.methods.getHeroEquipmentV2(heroId).call();

    let warnings = [];
    let errors = [];

    if (heroState.currentQuest !== '0x0000000000000000000000000000000000000000') {
      errors.push('This hero is currently on a quest and cannot be listed.');
    }

    const equippedSlots = parseInt(heroEquipment.equippedSlots);
    if (equippedSlots > 0) {
      warnings.push(
        `This hero has ${equippedSlots} equipped item(s). These items will be sold with the hero if you proceed.`
      );
    }

    return { warnings, errors };
  };

  const listHeroForSale = async (heroId, price, forceList = false) => {
    try {
      setListingHeroId(heroId);
      const { warnings, errors } = await checkHeroStatus(heroId);

      if (errors.length > 0) {
        toast.error(errors.join(' '));
        return { success: false, warnings, errors };
      }

      if (warnings.length > 0 && !forceList) {
        return { success: false, warnings, errors };
      }

      // If there are no warnings, or forceList is true, proceed with listing
      await proceedWithListing(heroId, price);
      return { success: true, warnings: [], errors: [] };
    } catch (error) {
      console.error('Error listing hero:', error);
      toast.error(`Failed to list hero: ${error.message}`);
      return { success: false, warnings: [], errors: [error.message] };
    } finally {
      setListingHeroId(null);
    }
  };

  const proceedWithListing = async (heroId, price) => {
    try {
      toast.info(`Approving marketplace to transfer Hero ${heroId}...`);
      // Step 1: Approve the HONKMarketplace contract to transfer the hero
      const approveGasEstimate = await DFKHeroContract.methods
        .approve(HONKMarketplaceContract.options.address, heroId)
        .estimateGas({ from: userAddress });
      await DFKHeroContract.methods.approve(HONKMarketplaceContract.options.address, heroId).send({
        from: userAddress,
        gas: BigInt(Math.floor(Number(approveGasEstimate) * 1.5)),
      });

      toast.info(`Listing Hero ${heroId} for sale...`);
      // Step 2: List the hero on the HONKMarketplace
      const priceWei = web3.utils.toWei(price.toString(), 'ether');
      const listGasEstimate = await HONKMarketplaceContract.methods
        .listHero(heroId, priceWei)
        .estimateGas({ from: userAddress });
      const receipt = await HONKMarketplaceContract.methods.listHero(heroId, priceWei).send({
        from: userAddress,
        gas: BigInt(Math.floor(Number(listGasEstimate) * 1.5)),
      });

      if (receipt.status) {
        toast.success(`Hero ${heroId} listed for sale successfully!`);
        fetchHeroes(userAddress);
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Error in proceedWithListing:', error);
      throw error;
    }
  };

  return { listingHeroId, listHeroForSale };
};
