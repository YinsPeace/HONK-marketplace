import React, { useState, useEffect, useCallback, useRef } from 'react';
import HeroGrid from './HeroGrid';
import LoadingIndicator from './LoadingIndicator';
import {
  initializeContracts,
  checkNetwork,
  validateContracts,
  HONKMarketplaceContract,
  HONKTokenContract,
  DFKHeroContract,
  web3,
} from '../Web3Config';
import { getHeroData, processHeroData, formatPrice } from '../utils/heroUtils';
import { toast } from 'react-toastify';
import { applyFiltersAndSort } from '../utils/filterUtils';

const HEROES_PER_PAGE = 8;
const MAX_UINT256 =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935';

// eslint-disable-next-line no-unused-vars
const checkTokenApproval = async (connectedAddress, requiredAmount) => {
  try {
    const allowance = await HONKTokenContract.methods
      .allowance(connectedAddress, HONKMarketplaceContract.options.address)
      .call();
    console.log('HONK Token allowance for Marketplace:', allowance);

    if (BigInt(allowance) < BigInt(requiredAmount)) {
      console.log('Insufficient allowance, requesting approval...');
      const approvalTx = await HONKTokenContract.methods
        .approve(HONKMarketplaceContract.options.address, MAX_UINT256)
        .send({ from: connectedAddress });
      console.log('Approval transaction:', approvalTx);
    }
  } catch (error) {
    console.error('Error checking or setting token approval:', error);
    throw error; // Rethrow the error to be caught in the buyHero function
  }
};

// eslint-disable-next-line no-unused-vars
const checkFeePercentage = async () => {
  try {
    const feePercentage = await HONKMarketplaceContract.methods.getFeePercentage().call();
    console.log('Current FEE_PERCENTAGE:', feePercentage);
    const feePercentageAsDecimal = Number(feePercentage) / 10000;
    console.log('Fee Percentage as decimal:', feePercentageAsDecimal);
  } catch (error) {
    console.error('Error checking fee percentage:', error);
  }
};

const getListedHeroes = async (userAddress) => {
  try {
    console.log('Calling getListedHeroes...');
    const result = await HONKMarketplaceContract.methods.getListedHeroes().call();

    console.log('Raw result from getListedHeroes:', result);

    if (!result || !Array.isArray(result[0])) {
      console.log('No heroes returned or invalid data structure');
      return [];
    }

    const listedHeroes = result[0];
    const totalListed = Number(result[1] || 0);

    console.log('Total listed:', totalListed);
    console.log('Listed heroes from contract:', listedHeroes);

    const heroesForSale = listedHeroes.filter(
      (hero) =>
        hero &&
        hero.id &&
        hero.id !== '0' &&
        BigInt(hero.id) !== 0n &&
        hero.owner &&
        hero.owner.toLowerCase() !== userAddress.toLowerCase() &&
        hero.isForSale
    );

    console.log(`Heroes available for sale (excluding own): ${heroesForSale.length}`);
    console.log('Heroes for sale:', heroesForSale);

    return heroesForSale;
  } catch (error) {
    console.error('Error fetching listed heroes from contract:', error);
    return [];
  }
};

// eslint-disable-next-line no-unused-vars
const approveMarketplaceForNFTTransfers = async (connectedAddress) => {
  try {
    const tx = await DFKHeroContract.methods
      .setApprovalForAll(HONKMarketplaceContract.options.address, true)
      .send({ from: connectedAddress });
    console.log('Approval transaction:', tx);
    toast.success('Successfully approved marketplace for NFT transfers');
  } catch (error) {
    console.error('Error approving marketplace for NFT transfers:', error);
    toast.error(`Failed to approve marketplace: ${error.message}`);
  }
};

const BuyTab = ({
  connectedAddress,
  honkLogo,
  filters,
  sortOrder,
  onBalanceChange,
  isMetaMaskLoggedIn,
}) => {
  const [heroes, setHeroes] = useState([]);
  const [filteredHeroes, setFilteredHeroes] = useState([]);
  const [displayedHeroes, setDisplayedHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const observer = useRef();

  const loadMoreHeroes = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const startIndex = displayedHeroes.length;
    const endIndex = startIndex + HEROES_PER_PAGE;
    const newHeroes = filteredHeroes.slice(startIndex, endIndex);
    setTimeout(() => {
      setDisplayedHeroes((prev) => [...prev, ...newHeroes]);
      setHasMore(endIndex < filteredHeroes.length);
      setIsLoadingMore(false);
    }, 500);
  }, [isLoadingMore, hasMore, displayedHeroes.length, filteredHeroes]);

  const lastHeroElementRef = useCallback(
    (node) => {
      if (loading || isLoadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            loadMoreHeroes();
          }
        },
        { threshold: 1.0, rootMargin: '0px 0px 200px 0px' }
      );
      if (node) observer.current.observe(node);
    },
    [loading, isLoadingMore, hasMore, loadMoreHeroes]
  );

  useEffect(() => {
    const initAndFetch = async () => {
      try {
        await initializeContracts();
        const isNetworkCorrect = await checkNetwork();
        if (!isNetworkCorrect) {
          setError('Please connect to the DFK Testnet.');
          return;
        }
        if (!validateContracts()) {
          setError('One or more contracts failed to initialize.');
          return;
        }
        if (connectedAddress) {
          await fetchHeroes(connectedAddress);
        }
      } catch (err) {
        console.error('Error initializing app or fetching heroes:', err);
        setError('Failed to initialize app or fetch heroes.');
      }
    };

    initAndFetch();
  }, [connectedAddress]);

  useEffect(() => {
    const applyFilters = () => {
      if (heroes.length > 0) {
        try {
          const filtered = applyFiltersAndSort(heroes, filters, sortOrder);
          setFilteredHeroes(filtered);
          setDisplayedHeroes(filtered.slice(0, HEROES_PER_PAGE));
          setHasMore(filtered.length > HEROES_PER_PAGE);
        } catch (err) {
          console.error('Error applying filters:', err);
          setError('Error filtering heroes: ' + err.message);
        }
      } else {
        setFilteredHeroes([]);
        setDisplayedHeroes([]);
        setHasMore(false);
      }
      setLoading(false);
      setIsInitialLoad(false);
    };

    applyFilters();
  }, [heroes, filters, sortOrder]);

  useEffect(() => {
    const setupEventListeners = async () => {
      HONKMarketplaceContract.events.HeroListed({}, (error, event) => {
        if (error) {
          console.error('Error on HeroListed event:', error);
          return;
        }
        console.log('Hero Listed Event:', event.returnValues);
      });

      HONKMarketplaceContract.events.HeroPurchased({}, (error, event) => {
        if (error) {
          console.error('Error on HeroPurchased event:', error);
          return;
        }
        console.log('Hero Purchased Event:', event.returnValues);
      });
    };

    setupEventListeners();
  }, []);

  const fetchHeroes = async (address) => {
    try {
      console.log('Fetching heroes for address:', address);
      setIsLoading(true);
      setError(null);
      const listedHeroes = await getListedHeroes(address);
      console.log('Listed heroes fetched:', listedHeroes);

      if (listedHeroes.length === 0) {
        console.log('No listed heroes found');
        setHeroes([]);
        setFilteredHeroes([]);
        setDisplayedHeroes([]);
        setHasMore(false);
        setLoading(false);
        setIsInitialLoad(false);
        return;
      }

      console.log('Processing hero data...');
      const newHeroes = await Promise.all(
        listedHeroes.map(async (hero) => {
          try {
            const heroData = await getHeroData(hero.id);
            const processedHero = processHeroData(heroData);
            const heroState = await DFKHeroContract.methods.getHeroState(hero.id).call();
            const isOnQuest =
              heroState.currentQuest !== '0x0000000000000000000000000000000000000000';

            return {
              ...processedHero,
              id: hero.id,
              price: hero.price,
              isForSale: true,
              owner: hero.owner,
              level:
                parseInt(
                  processedHero.attributes.find((attr) => attr.trait_type === 'Level')?.value
                ) || 0,
              isOnQuest: isOnQuest,
            };
          } catch (error) {
            console.error(`Error processing hero ${hero.id}:`, error);
            return null;
          }
        })
      );

      const validHeroes = newHeroes.filter((hero) => hero !== null);
      console.log('Valid heroes processed:', validHeroes.length);

      setHeroes(validHeroes);
      setIsInitialLoad(false);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching heroes:', error);
      setError('Failed to fetch heroes: ' + error.message);
      setIsInitialLoad(false);
      setLoading(false);
    } finally {
      setIsLoading(false);
      console.log('Fetch heroes completed');
    }
  };

  const checkHONKBalance = useCallback(async () => {
    try {
      const balance = await HONKTokenContract.methods.balanceOf(connectedAddress).call();
      // eslint-disable-next-line no-unused-vars
      const balanceInEther = web3.utils.fromWei(balance, 'ether');
      return balance;
    } catch (error) {
      console.error('Error checking HONK balance:', error);
      return '0';
    }
  }, [connectedAddress]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!connectedAddress) return;
      // eslint-disable-next-line no-unused-vars
      const balance = await checkHONKBalance();
    };
    fetchBalance();
  }, [connectedAddress, checkHONKBalance]);

  // eslint-disable-next-line no-unused-vars
  const approveHONKTokens = async (amount) => {
    try {
      console.log('Approving HONK tokens...');
      console.log('Amount to approve:', amount.toString());
      console.log('Marketplace address:', HONKMarketplaceContract.options.address);

      const tx = await HONKTokenContract.methods
        .approve(HONKMarketplaceContract.options.address, amount.toString())
        .send({ from: connectedAddress });

      console.log('Approval transaction:', tx);

      // Check allowance immediately after approval
      const newAllowance = await HONKTokenContract.methods
        .allowance(connectedAddress, HONKMarketplaceContract.options.address)
        .call();
      console.log('New allowance after approval:', newAllowance);

      return true;
    } catch (error) {
      console.error('Error approving HONK tokens:', error);
      throw error;
    }
  };

  const buyHero = async (heroId) => {
    if (!connectedAddress) {
      toast.error('Please connect your wallet to buy a hero.');
      return;
    }

    try {
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
      const buyerBalance = BigInt(
        await HONKTokenContract.methods.balanceOf(connectedAddress).call()
      );
      if (buyerBalance < price) {
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
      console.log('Current HONK allowance:', currentAllowance.toString());

      // If allowance is 0 or insufficient, request approval for MAX_UINT256
      if (currentAllowance < price) {
        console.log('Insufficient allowance, requesting approval for maximum allowance...');

        // Request approval for the maximum allowance (to avoid repeated approvals)
        const approvalTx = await HONKTokenContract.methods
          .approve(HONKMarketplaceContract.options.address, MAX_UINT256)
          .send({ from: connectedAddress });

        console.log('Approval transaction:', approvalTx);

        // Retry checking allowance after approval, with a delay
        const maxRetries = 5;
        let retryCount = 0;
        const retryDelay = 2000; // 2 seconds delay

        while (retryCount < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay)); // Wait 2 seconds
          currentAllowance = BigInt(
            await HONKTokenContract.methods
              .allowance(connectedAddress, HONKMarketplaceContract.options.address)
              .call()
          );
          console.log('New HONK allowance after approval:', currentAllowance.toString());

          if (currentAllowance >= price) {
            break; // Exit the loop if allowance is sufficient
          }

          retryCount++;
          if (retryCount === maxRetries) {
            throw new Error(
              `BH5: Insufficient HONK allowance after approval. Required: ${price.toString()}, Allowed: ${currentAllowance.toString()}`
            );
          }
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
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2-second delay

      const tx = await HONKMarketplaceContract.methods.buyHero(heroId).send({
        from: connectedAddress,
        gas: gasLimit.toString(),
      });

      if (tx.status) {
        toast.success(`Successfully purchased hero ${heroId}!`);
        setHeroes((prevHeroes) => prevHeroes.filter((h) => h.id !== heroId));
        setFilteredHeroes((prevFiltered) => prevFiltered.filter((h) => h.id !== heroId));
        setDisplayedHeroes((prevDisplayed) => prevDisplayed.filter((h) => h.id !== heroId));

        // Update the balance after successful purchase
        onBalanceChange();
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Error buying hero:', error);
      if (error.message.includes('Hero is not listed for sale')) {
        toast.error('This hero is no longer available for purchase.');
      } else if (error.message.includes('Insufficient HONK balance')) {
        toast.error('You do not have enough HONK tokens to complete this purchase.');
      } else if (error.message.includes('Insufficient HONK allowance')) {
        toast.error('Please approve the marketplace to spend your HONK tokens and try again.');
      } else {
        toast.error(`Failed to buy hero: ${error.message}`);
      }
    } finally {
      toast.dismiss('buyingHero');
    }
  };

  const renderHeroContent = () => {
    if (isLoading) {
      return <LoadingIndicator />;
    }

    if (error) {
      return <p className="mt-4 text-center text-red-500">Error: {error}</p>;
    }

    return (
      <>
        <HeroGrid
          heroes={displayedHeroes}
          isBuyPage={true}
          honkLogo={honkLogo}
          formatPrice={formatPrice}
          onBuy={buyHero}
          lastHeroRef={lastHeroElementRef}
          isMetaMaskLoggedIn={isMetaMaskLoggedIn}
        />
        {isLoadingMore && <LoadingIndicator />}
        {!isLoadingMore && !hasMore && displayedHeroes.length > 0 && (
          <p className="mt-4 text-center">No more heroes to load.</p>
        )}
        {!isLoadingMore && displayedHeroes.length === 0 && (
          <p className="mt-4 text-center">No heroes match your current filters.</p>
        )}
      </>
    );
  };

  useEffect(() => {
    console.log('HONKMarketplaceContract address:', HONKMarketplaceContract.options.address);
    console.log('HONKTokenContract address:', HONKTokenContract.options.address);
  }, []);

  return <div>{renderHeroContent()}</div>;
};

export default BuyTab;
