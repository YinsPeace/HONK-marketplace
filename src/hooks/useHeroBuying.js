import { useState, useCallback } from 'react';
import { HONKMarketplaceContract, HONKTokenContract, DFKHeroContract, web3 } from '../Web3Config';
import { toast } from 'react-toastify';

const MAX_UINT256 =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935';

export const useHeroBuying = (
  connectedAddress,
  fetchHeroes,
  onBalanceChange,
  setPendingTransactions,
  setHeroes
) => {
  const [buyingHeroId, setBuyingHeroId] = useState(null);
  const [purchasedHeroes, setPurchasedHeroes] = useState(new Set());
  const [error, setError] = useState(null);

  const checkHONKBalance = useCallback(async () => {
    const balance = await HONKTokenContract.methods.balanceOf(connectedAddress).call();
    return web3.utils.fromWei(balance, 'ether');
  }, [connectedAddress]);

  const checkHeroState = async (heroId) => {
    try {
      const heroState = await DFKHeroContract.methods.getHeroState(heroId).call();
      const isOnQuest = heroState.currentQuest !== '0x0000000000000000000000000000000000000000';
      return { isOnQuest };
    } catch (error) {
      setError('Failed to check hero state: ' + error.message);
      throw new Error('Failed to check hero state');
    }
  };

  const checkAndHandleApproval = async (price) => {
    // Check current allowance
    let currentAllowance = BigInt(
      await HONKTokenContract.methods
        .allowance(connectedAddress, HONKMarketplaceContract.options.address)
        .call()
    );

    // If allowance is insufficient, request approval for MAX_UINT256
    if (currentAllowance < price) {
      try {
        toast.info('Requesting approval for HONK spending...', { autoClose: false });

        // Estimate gas for approval
        let gasLimit;
        try {
          const gasEstimate = await HONKTokenContract.methods
            .approve(HONKMarketplaceContract.options.address, MAX_UINT256)
            .estimateGas({ from: connectedAddress });
          gasLimit = Math.floor(Number(gasEstimate) * 1.5);
        } catch (error) {
          setError('Gas estimation failed for HONK approval: ' + error.message);
          gasLimit = 100000;
        }

        const approvalTx = await HONKTokenContract.methods
          .approve(HONKMarketplaceContract.options.address, MAX_UINT256)
          .send({ from: connectedAddress, gas: gasLimit });

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

        // Add a small delay after approval confirmation
        await new Promise((resolve) => setTimeout(resolve, 2000));

        toast.success('HONK spending approved! Please confirm the purchase transaction.', {
          autoClose: 3000,
        });
        return true;
      } catch (error) {
        setError('Approval failed: ' + error.message);
        toast.error('Failed to approve HONK spending: ' + error.message);
        return null;
      }
    }
    return true;
  };

  const buyHero = async (heroId) => {
    try {
      setBuyingHeroId(heroId);
      setPendingTransactions((prev) => new Set([...prev, heroId]));

      // Get hero details
      const hero = await HONKMarketplaceContract.methods.getHero(heroId).call();

      if (!hero.isForSale) {
        toast.error('This hero is no longer for sale.');
        return false;
      }

      if (hero.owner.toLowerCase() === connectedAddress.toLowerCase()) {
        toast.error('You cannot buy your own hero.');
        return false;
      }

      const price = BigInt(hero.price);

      // Check buyer's HONK balance
      const honkBalance = await checkHONKBalance();
      if (BigInt(web3.utils.toWei(honkBalance, 'ether')) < price) {
        toast.error(
          `Insufficient HONK balance. You need ${web3.utils.fromWei(price.toString(), 'ether')} HONK.`
        );
        return false;
      }

      const needsApproval = await checkAndHandleApproval(price);
      if (needsApproval === null) {
        setBuyingHeroId(null);
        return;
      }

      // Estimate gas for the transaction
      let estimatedGas;
      try {
        estimatedGas = await HONKMarketplaceContract.methods.buyHero(heroId).estimateGas({
          from: connectedAddress,
        });
      } catch (gasEstimateError) {
        setError('Error estimating gas: ' + gasEstimateError.message);
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

        // Mark the hero as purchased
        setPurchasedHeroes((prev) => new Set([...prev, heroId]));

        // Update the local state immediately
        setHeroes((prevHeroes) =>
          prevHeroes.map((h) =>
            h.id === heroId ? { ...h, isForSale: false, owner: connectedAddress } : h
          )
        );
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      setError('Failed to buy hero: ' + error.message);
      toast.error(`Failed to buy hero: ${error.message}`);
    } finally {
      setBuyingHeroId(null);
      toast.dismiss('buyingHero');
    }
  };

  return { buyingHeroId, buyHero, checkHONKBalance, purchasedHeroes, error };
};
