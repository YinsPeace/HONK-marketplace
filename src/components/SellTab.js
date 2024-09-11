import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DFKHeroContract, HONKMarketplaceContract, web3, checkNetwork } from '../Web3Config';
import HeroGrid from './HeroGrid';
import honkLogo from '../assets/images/honk/honkCoin.webp';
import { getHeroData, processHeroData, formatPrice } from '../utils/heroUtils';
import { toast } from 'react-toastify';
import WarningModal from './WarningModal';
import LoadingIndicator from './LoadingIndicator';
import { applyFiltersAndSort } from '../utils/filterUtils';

const HEROES_PER_PAGE = 8;

const fetchHeroIds = async (address) => {
  try {
    const heroIds = await DFKHeroContract.methods.getUserHeroes(address).call();
    return heroIds;
  } catch (error) {
    console.error('Error fetching hero IDs:', error);
    throw new Error('Failed to fetch your heroes. Please try again later.');
  }
};

const SellTab = ({ userAddress, filters, sortOrder }) => {
  const [allHeroes, setAllHeroes] = useState([]);
  const [filteredHeroes, setFilteredHeroes] = useState([]);
  const [displayedHeroes, setDisplayedHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [currentWarnings, setCurrentWarnings] = useState([]);
  const [heroToList, setHeroToList] = useState(null);
  const [priceToList, setPriceToList] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [listingHeroId, setListingHeroId] = useState(null);
  const [cancellingHeroId, setCancellingHeroId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWalletConnected, setIsWalletConnected] = useState(false);

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
    const checkContractsAndFetchHeroes = async () => {
      if (!DFKHeroContract || !HONKMarketplaceContract) {
        console.error('Contracts not initialized');
        setError('Contracts not initialized. Please try refreshing the page.');
        return;
      }

      if (!HONKMarketplaceContract.methods.getHero) {
        console.error('getHero method not found in HONKMarketplaceContract');
        setError('Contract method not found. Please check the contract ABI.');
        return;
      }

      if (!userAddress) {
        checkStoredConnection();
      } else {
        fetchHeroes(userAddress);
      }
    };

    checkContractsAndFetchHeroes();
  }, [userAddress]);

  const checkStoredConnection = async () => {
    const walletConnected = localStorage.getItem('walletConnected');
    const storedAddress = localStorage.getItem('connectedAddress');
    if (walletConnected === 'true' && storedAddress) {
      const networkIsValid = await checkNetwork();
      if (networkIsValid) {
        fetchHeroes(storedAddress);
      } else {
        setError('Please connect to the DFK Testnet to view your heroes.');
      }
    }
  };

  useEffect(() => {
    const applyFilters = () => {
      console.log('Applying filters. Current state:', { allHeroes, filters, sortOrder });
      if (allHeroes.length > 0) {
        try {
          const filtered = applyFiltersAndSort(allHeroes, filters, sortOrder);
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
    };

    applyFilters();
  }, [allHeroes, filters, sortOrder]);

  useEffect(() => {
    console.log('Filters changed in SellTab:', filters);
  }, [filters]);

  const fetchHeroes = async (address) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching hero IDs for address:', address);
      const heroIds = await fetchHeroIds(address);
      console.log('Fetched hero IDs:', heroIds);

      if (heroIds.length === 0) {
        console.log('No heroes found for this address');
        setAllHeroes([]);
        setFilteredHeroes([]);
        setDisplayedHeroes([]);
        setHasMore(false);
        return;
      }

      console.log('Fetching marketplace heroes individually');
      const marketplaceHeroes = await Promise.all(
        heroIds.map(async (heroId) => {
          try {
            const hero = await HONKMarketplaceContract.methods.getHero(heroId).call();
            console.log(`Fetched hero ${heroId}:`, hero);
            return hero;
          } catch (error) {
            console.error(`Error fetching hero ${heroId}:`, error);
            return null;
          }
        })
      );
      const validMarketplaceHeroes = marketplaceHeroes.filter((hero) => hero !== null);
      console.log('Fetched valid marketplace heroes:', validMarketplaceHeroes);

      console.log('Processing hero data');
      const heroesData = await Promise.all(
        validMarketplaceHeroes.map(async (hero) => {
          console.log('Processing hero:', hero.id);
          const heroData = await getHeroData(hero.id);
          const processedHero = processHeroData(heroData);
          const heroState = await DFKHeroContract.methods.getHeroState(hero.id).call();
          const isOnQuest = heroState.currentQuest !== '0x0000000000000000000000000000000000000000';

          return {
            ...processedHero,
            id: hero.id,
            isForSale: hero.isForSale,
            price: hero.price,
            isOnQuest,
          };
        })
      );
      console.log('Processed hero data:', heroesData);

      setAllHeroes(heroesData);
      console.log('All heroes set in state:', heroesData);
    } catch (error) {
      console.error('Error fetching heroes:', error);
      console.error('Error details:', error.message);
      if (error.response) {
        console.error('Error response:', error.response);
      }
      setError(error.message || 'Failed to fetch heroes. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkHeroStatus = async (heroId) => {
    const heroState = await DFKHeroContract.methods.getHeroState(heroId).call();

    const heroInfo = await DFKHeroContract.methods.getHeroInfo(heroId).call();

    const heroEquipment = await DFKHeroContract.methods.getHeroEquipmentV2(heroId).call();

    let warnings = [];
    let errors = [];

    if (heroState.currentQuest !== '0x0000000000000000000000000000000000000000') {
      errors.push('This hero is currently on a quest and cannot be listed.');
      console.error('Hero is on a quest:', heroState.currentQuest);
    }

    const equippedSlots = parseInt(heroEquipment.equippedSlots);
    if (equippedSlots > 0) {
      warnings.push(
        `This hero has ${equippedSlots} equipped item(s). These items will be sold with the hero if you proceed.`
      );
    }

    return { warnings, errors };
  };

  const listHeroForSale = async (heroId, price) => {
    if (!isWalletConnected) {
      toast.error('Please connect your wallet to list a hero.');
      return;
    }

    try {
      setListingHeroId(heroId);

      // Check hero status before listing
      const { warnings, errors } = await checkHeroStatus(heroId);

      if (errors.length > 0) {
        toast.error(errors.join(' '));
        return;
      }

      if (warnings.length > 0) {
        setCurrentWarnings(warnings);
        setHeroToList(heroId);
        setPriceToList(price);
        setWarningModalOpen(true);
        return;
      }

      // If no warnings, proceed with listing
      await proceedWithListing(heroId, price);
    } catch (error) {
      console.error('Error listing hero:', error);
      let errorMessage = 'Failed to list hero. ';
      if (error.code === 4001) {
        errorMessage += 'Transaction was rejected in your wallet.';
      } else if (error.message.includes('hero is on a quest')) {
        errorMessage += 'Hero is currently on a quest and cannot be listed.';
      } else {
        errorMessage += 'Please try again later.';
      }
      toast.error(errorMessage);
    } finally {
      setListingHeroId(null);
    }
  };

  const proceedWithListing = async (heroId, price) => {
    try {
      // Step 1: Approve the HONKMarketplace contract to transfer the hero
      const approveGasEstimate = await DFKHeroContract.methods
        .approve(HONKMarketplaceContract.options.address, heroId)
        .estimateGas({ from: userAddress });
      await DFKHeroContract.methods.approve(HONKMarketplaceContract.options.address, heroId).send({
        from: userAddress,
        gas: BigInt(Math.floor(Number(approveGasEstimate) * 1.5)),
      });

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
        setAllHeroes((prevHeroes) => {
          const updatedHeroes = prevHeroes.map((hero) =>
            hero.id === heroId ? { ...hero, isForSale: true, price: priceWei } : hero
          );
          return updatedHeroes;
        });
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Error in proceedWithListing:', error);
      throw error; // Rethrow the error to be caught in the listHeroForSale function
    }
  };

  const handleWarningClose = () => {
    setWarningModalOpen(false);
    setCurrentWarnings([]);
    setHeroToList(null);
    setPriceToList(null);
  };

  const handleWarningConfirm = () => {
    if (heroToList && priceToList) {
      proceedWithListing(heroToList, priceToList);
    }
    setWarningModalOpen(false);
    setCurrentWarnings([]);
    setHeroToList(null);
    setPriceToList(null);
  };

  const updatePrice = async (heroId, price) => {
    if (!userAddress) {
      toast.error('Please connect your wallet to update the price.');
      return;
    }

    try {
      setListingHeroId(heroId);
      const priceWei = web3.utils.toWei(price.toString(), 'ether');
      const gasEstimate = await HONKMarketplaceContract.methods
        .updatePrice(heroId, priceWei)
        .estimateGas({ from: userAddress });
      const receipt = await HONKMarketplaceContract.methods.updatePrice(heroId, priceWei).send({
        from: userAddress,
        gas: BigInt(Math.floor(Number(gasEstimate) * 1.5)),
      });

      if (receipt.status) {
        toast.success(`Price updated for Hero ${heroId} successfully!`);
        setAllHeroes((prevHeroes) => {
          const updatedHeroes = prevHeroes.map((hero) =>
            hero.id === heroId ? { ...hero, price: priceWei } : hero
          );
          return updatedHeroes;
        });
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
      setListingHeroId(null);
    }
  };

  const cancelListing = async (heroId) => {
    if (!userAddress) {
      toast.error('Please connect your wallet to cancel a listing.');
      return;
    }

    try {
      setCancellingHeroId(heroId);
      const gasEstimate = await HONKMarketplaceContract.methods
        .cancelListing(heroId)
        .estimateGas({ from: userAddress });
      const receipt = await HONKMarketplaceContract.methods.cancelListing(heroId).send({
        from: userAddress,
        gas: BigInt(Math.floor(Number(gasEstimate) * 1.5)),
      });

      if (receipt.status) {
        toast.success(`Listing for Hero ${heroId} cancelled successfully!`);
        setAllHeroes((prevHeroes) => {
          const updatedHeroes = prevHeroes.map((hero) =>
            hero.id === heroId ? { ...hero, isForSale: false, price: '0' } : hero
          );
          return updatedHeroes;
        });
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

  const handleFiltersChange = (filterKey, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterKey]: value,
    }));
  };

  console.log('Heroes being passed to HeroGrid:', displayedHeroes);

  useEffect(() => {
    checkWalletConnection();
  }, [userAddress]);

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        setIsWalletConnected(accounts.length > 0);
      } catch (error) {
        console.error('Failed to check wallet connection:', error);
        setIsWalletConnected(false);
      }
    } else {
      setIsWalletConnected(false);
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        checkWalletConnection();
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        toast.error('Failed to connect wallet. Please try again.');
      }
    } else {
      toast.error('MetaMask is not installed. Please install it to use this feature.');
    }
  };

  return (
    <div>
      {!isWalletConnected && (
        <div className="mt-4 text-center">
          <p>Please connect your wallet to view and list your heroes.</p>
          <button
            onClick={connectWallet}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Connect Wallet
          </button>
        </div>
      )}
      {isWalletConnected && (
        <>
          {isLoading ? (
            <LoadingIndicator />
          ) : error ? (
            <div className="mt-4 text-center text-red-500">Error: {error}</div>
          ) : displayedHeroes.length === 0 ? (
            <div className="mt-4 text-center">
              <p>No heroes to display</p>
              <p>No heroes match your current filters.</p>
            </div>
          ) : (
            <>
              <HeroGrid
                heroes={displayedHeroes}
                isBuyPage={false}
                honkLogo={honkLogo}
                onList={listHeroForSale}
                onCancelListing={cancelListing}
                onUpdatePrice={updatePrice}
                formatPrice={formatPrice}
                lastHeroRef={lastHeroElementRef}
                listingHeroId={listingHeroId}
                cancellingHeroId={cancellingHeroId}
              />
              {isLoadingMore && <LoadingIndicator />}
              {!isLoadingMore && !hasMore && displayedHeroes.length > 0 && (
                <p className="mt-4 text-center">No more heroes to load.</p>
              )}
            </>
          )}
          <WarningModal
            isOpen={warningModalOpen}
            onClose={handleWarningClose}
            onConfirm={handleWarningConfirm}
            warnings={currentWarnings}
          />
        </>
      )}
    </div>
  );
};

export default SellTab;
