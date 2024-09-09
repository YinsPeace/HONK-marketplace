import React, { useState, useEffect, useCallback, useRef } from 'react';
import HeroGrid from './HeroGrid';
import LoadingIndicator from './LoadingIndicator';
import {
  HONKMarketplaceContract,
  web3,
  HONKTokenContract,
  DFKHeroContract,
  checkNetwork,
} from '../Web3Config';
import { getHeroData, processHeroData, formatPrice } from '../utils/heroUtils';
import { toast } from 'react-toastify';
import { applyFiltersAndSort } from '../utils/filterUtils';

const HEROES_PER_PAGE = 8;

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

const BuyTab = ({ connectedAddress, honkLogo, filters, sortOrder }) => {
  const [heroes, setHeroes] = useState([]);
  const [filteredHeroes, setFilteredHeroes] = useState([]);
  const [displayedHeroes, setDisplayedHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
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
    const checkStoredConnection = async () => {
      const walletConnected = localStorage.getItem('walletConnected');
      const storedAddress = localStorage.getItem('connectedAddress');
      if (walletConnected === 'true' && storedAddress) {
        const networkIsValid = await checkNetwork();
        if (networkIsValid) {
          fetchHeroes(storedAddress);
        } else {
          console.error('Connected to the wrong network');
          setError('Please connect to the DFK Testnet to view heroes.');
        }
      }
    };

    if (!connectedAddress) {
      checkStoredConnection();
    } else {
      fetchHeroes(connectedAddress);
    }
  }, [connectedAddress]);

  useEffect(() => {
    const applyFilters = () => {
      if (heroes.length > 0) {
        try {
          const filtered = applyFiltersAndSort(heroes, filters, sortOrder);
          console.log('Filtered heroes:', filtered);
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

      console.log(`Heroes available for sale: ${validHeroes.length}`);
      console.log('Processed heroes:', validHeroes);

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
    }
  };

  const checkHONKBalance = useCallback(async () => {
    try {
      const balance = await HONKTokenContract.methods.balanceOf(connectedAddress).call();
      console.log(`HONK Balance in Wei: ${balance}`);
      const balanceInEther = web3.utils.fromWei(balance, 'ether');
      console.log(`HONK Balance in Ether: ${balanceInEther} HONK`);
      return balance;
    } catch (error) {
      console.error('Error checking HONK balance:', error);
      return '0';
    }
  }, [connectedAddress]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!connectedAddress) return;
      const balance = await checkHONKBalance();
      console.log(`Current HONK balance: ${balance} wei`);
    };
    fetchBalance();
  }, [connectedAddress, checkHONKBalance]);

  const buyHero = async (heroId) => {
    if (!connectedAddress) {
      toast.error('Please connect your wallet to buy a hero.');
      return;
    }

    try {
      setLoading(true);
      const hero = heroes.find((h) => h.id === heroId);
      if (!hero) {
        throw new Error('Hero not found');
      }

      const balance = await HONKTokenContract.methods.balanceOf(connectedAddress).call();
      if (BigInt(balance) < BigInt(hero.price)) {
        throw new Error('Insufficient HONK balance');
      }

      const allowance = await HONKTokenContract.methods
        .allowance(connectedAddress, HONKMarketplaceContract.options.address)
        .call();
      if (BigInt(allowance) < BigInt(hero.price)) {
        const approveResult = await HONKTokenContract.methods
          .approve(HONKMarketplaceContract.options.address, hero.price)
          .send({ from: connectedAddress });
        if (!approveResult.status) {
          throw new Error('HONK approval failed');
        }
      }

      const gasEstimate = await HONKMarketplaceContract.methods
        .buyHero(heroId)
        .estimateGas({ from: connectedAddress });
      const result = await HONKMarketplaceContract.methods.buyHero(heroId).send({
        from: connectedAddress,
        gas: BigInt(Math.floor(Number(gasEstimate) * 1.5)),
      });

      if (result.status) {
        toast.success(`Successfully purchased hero ${heroId}!`);
        setHeroes((prevHeroes) => prevHeroes.filter((h) => h.id !== heroId));
        setFilteredHeroes((prevFiltered) => prevFiltered.filter((h) => h.id !== heroId));
        setDisplayedHeroes((prevDisplayed) => prevDisplayed.filter((h) => h.id !== heroId));
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Error buying hero:', error);
      let errorMessage = 'Failed to buy hero. ';
      if (error.message.includes('Insufficient HONK balance')) {
        errorMessage += "You don't have enough HONK tokens.";
      } else if (error.message.includes('HONK approval failed')) {
        errorMessage += 'Failed to approve HONK token spending.';
      } else if (error.message.includes('Hero not found')) {
        errorMessage += 'The selected hero is no longer available.';
      } else if (error.code === 4001) {
        errorMessage += 'Transaction was rejected in your wallet.';
      } else {
        errorMessage += 'Please try again later.';
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
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

  return <div>{renderHeroContent()}</div>;
};

export default BuyTab;
