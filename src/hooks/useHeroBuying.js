import { useState, useCallback } from 'react';
import { HONKMarketplaceContract, HONKTokenContract, web3 } from '../Web3Config';
import { toast } from 'react-toastify';

const MAX_UINT256 =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935';

export const useHeroBuying = (connectedAddress, fetchHeroes, onBalanceChange) => {
  const [buyingHeroId, setBuyingHeroId] = useState(null);

  const checkHONKBalance = useCallback(async () => {
    const balance = await HONKTokenContract.methods.balanceOf(connectedAddress).call();
    return web3.utils.fromWei(balance, 'ether');
  }, [connectedAddress]);

  const buyHero = async (heroId) => {
    try {
      setBuyingHeroId(heroId);
      toast.info(`Preparing to buy hero ${heroId}...`, { autoClose: 2000 });

      // Get hero details
      const hero = await HONKMarketplaceContract.methods.getHero(heroId).call();

      if (!hero.isForSale) {
        toast.error('This hero is no longer for sale.');
        return;
      }

      if (hero.owner.toLowerCase() === connectedAddress.toLowerCase()) {
        toast.error('You cannot buy your own hero.');
        return;
      }

      const price = BigInt(hero.price);

      // Check buyer's HONK balance
      const honkBalance = await checkHONKBalance();
      if (BigInt(web3.utils.toWei(honkBalance, 'ether')) < price) {
        toast.error(
          `Insufficient HONK balance. You need ${web3.utils.fromWei(price.toString(), 'ether')} HONK.`
        );
        return;
      }

      // Check current allowance
      let currentAllowance = BigInt(
        await HONKTokenContract.methods
          .allowance(connectedAddress, HONKMarketplaceContract.options.address)
          .call()
      );

      // If allowance is insufficient, request approval for MAX_UINT256
      if (currentAllowance < price) {
        const approvalTx = await HONKTokenContract.methods
          .approve(HONKMarketplaceContract.options.address, MAX_UINT256)
          .send({ from: connectedAddress });

        console.log('Approval transaction:', approvalTx);

        // Wait for the allowance to be updated
        const maxRetries = 5;
        let retryCount = 0;
        while (retryCount < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
          currentAllowance = BigInt(
            await HONKTokenContract.methods
              .allowance(connectedAddress, HONKMarketplaceContract.options.address)
              .call()
          );
          if (currentAllowance >= price) break;
          retryCount++;
        }

        if (currentAllowance < price) {
          throw new Error('Insufficient HONK allowance after approval.');
        }
      }

      toast.info('Estimating gas for the transaction...', { autoClose: 2000 });

      // Estimate gas for the transaction
      let estimatedGas;
      try {
        estimatedGas = await HONKMarketplaceContract.methods.buyHero(heroId).estimateGas({
          from: connectedAddress,
        });
      } catch (gasEstimateError) {
        console.error('Gas estimation failed:', gasEstimateError);
        estimatedGas = BigInt(500000);
      }

      // Add a 50% buffer to the estimated gas
      const gasLimit = BigInt(Math.floor(Number(estimatedGas) * 1.5));

      toast.info('Executing purchase transaction...', { autoClose: false, toastId: 'buyingHero' });

      // Recheck hero status before purchase
      const heroStatus = await HONKMarketplaceContract.methods.getHero(heroId).call();
      if (!heroStatus.isForSale) {
        toast.error('This hero is no longer available for purchase.');
        return;
      }

      // Add a small delay before sending the transaction
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const tx = await HONKMarketplaceContract.methods.buyHero(heroId).send({
        from: connectedAddress,
        gas: gasLimit.toString(),
      });

      if (tx.status) {
        toast.success(`Successfully purchased hero ${heroId}!`);
        fetchHeroes(connectedAddress);
        onBalanceChange();
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Error buying hero:', error);
      toast.error(`Failed to buy hero: ${error.message}`);
    } finally {
      setBuyingHeroId(null);
      toast.dismiss('buyingHero');
    }
  };

  return { buyingHeroId, buyHero, checkHONKBalance };
};
