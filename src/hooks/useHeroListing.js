import { useState, useCallback, useEffect } from 'react';
import { HONKMarketplaceContract, web3, DFKHeroContract } from '../Web3Config';
import { toast } from 'react-toastify';

export const useHeroListing = (connectedAddress, fetchHeroes, setHeroes) => {
  const [listingHeroId, setListingHeroId] = useState(null);
  const [listedHeroes, setListedHeroes] = useState([]);

  const fetchListedHeroes = useCallback(async () => {
    if (!connectedAddress) return [];
    
    try {
      const result = await HONKMarketplaceContract.methods.getListedHeroes().call();
      const listedHeroes = result[0];
      
      const filtered = listedHeroes
        .filter(hero => 
          hero && 
          hero.id && 
          hero.id !== '0' && 
          hero.owner && 
          hero.owner.toLowerCase() === connectedAddress.toLowerCase() &&
          hero.isForSale
        )
        .map(hero => ({
          heroId: hero.id.toString(),
          price: hero.price.toString(),
          owner: hero.owner,
          isForSale: true,
          marketplace: 'honk'
        }));

      setListedHeroes(filtered);
      return filtered;
    } catch (error) {
      console.error('Error fetching listed heroes:', error);
      toast.error('Failed to fetch listed heroes');
      return [];
    }
  }, [connectedAddress]);

  // Fetch listed heroes when component mounts or address changes
  useEffect(() => {
    fetchListedHeroes();
  }, [connectedAddress, fetchListedHeroes]);

  const listHeroForSale = useCallback(async (heroId, price, bypassWarnings = false, heroData = null) => {
    if (!connectedAddress || !heroId || !price) {
      return {
        success: false,
        errors: ['Invalid parameters'],
        warnings: []
      };
    }

    try {
      // Convert price to wei (assuming 18 decimals)
      const priceInWei = web3.utils.toWei(price.toString(), 'ether');
      
      // Check if hero is on a different chain
      if (heroData && heroData.network) {
        // Map network codes to realm names
        const networkToRealm = {
          'kla': 'Serendale',
          'dfk': 'Crystalvale',
          'met': 'Sundered Isles'
        };
        
        // If hero is not on DFK Chain (Crystalvale), show specific error
        if (heroData.network !== 'dfk') {
          const realmName = networkToRealm[heroData.network] || 'another realm';
          return {
            success: false,
            errors: [`This hero is on ${realmName}. Please move it to Crystalvale to list on HONK Marketplace.`],
            warnings: []
          };
        }
      }
      
      // Check if hero exists and is owned by the user using DFKHeroContract
      try {
        const heroOwner = await DFKHeroContract.methods.ownerOf(heroId).call();
        if (heroOwner.toLowerCase() !== connectedAddress.toLowerCase()) {
          return {
            success: false,
            errors: ['You do not own this hero'],
            warnings: []
          };
        }
      } catch (ownerError) {
        // If ownerOf fails, it might be because the hero is on another chain
        return {
          success: false,
          errors: ['Unable to verify hero ownership. The hero may be on another realm.'],
          warnings: []
        };
      }

      // Check if hero is already listed - using the correct getHero method
      const heroListing = await HONKMarketplaceContract.methods.getHero(heroId).call();
      if (heroListing && heroListing.isForSale) {
        return {
          success: false,
          errors: ['Hero is already listed'],
          warnings: []
        };
      }

      // Check if marketplace is approved to handle the hero using DFKHeroContract
      const isApproved = await DFKHeroContract.methods.isApprovedForAll(
        connectedAddress,
        HONKMarketplaceContract.options.address
      ).call();

      if (!isApproved) {
        try {
          // First approve the marketplace using DFKHeroContract
          const approveTx = await DFKHeroContract.methods.setApprovalForAll(
            HONKMarketplaceContract.options.address,
            true
          ).send({ 
            from: connectedAddress,
            gasLimit: 300000 // Lower gas limit for approval
          });
          
          if (!approveTx.status) {
            return {
              success: false,
              errors: ['Failed to approve marketplace'],
              warnings: []
            };
          }
        } catch (approvalError) {
          console.error('Approval error:', approvalError);
          return {
            success: false,
            errors: ['Failed to approve marketplace: ' + (approvalError.message || 'Unknown error')],
            warnings: []
          };
        }
      }

      // List the hero using HONKMarketplaceContract
      const tx = await HONKMarketplaceContract.methods.listHero(
        heroId,
        priceInWei
      ).send({
        from: connectedAddress,
        gasLimit: 500000
      });

      if (tx.status) {
        // Refresh the listed heroes
        const updatedHeroes = await fetchListedHeroes();
        
        // Update the heroes state with the new listing
        if (setHeroes) {
          setHeroes(prevHeroes => {
            return prevHeroes.map(hero => {
              if (hero.id === heroId) {
                return {
                  ...hero,
                  isForSale: true,
                  price: priceInWei,
                  owner: connectedAddress
                };
              }
              return hero;
            });
          });
        }
        
        return {
          success: true,
          errors: [],
          warnings: []
        };
      } else {
        return {
          success: false,
          errors: ['Transaction failed'],
          warnings: []
        };
      }

    } catch (error) {
      console.error('Error listing hero:', error);
      return {
        success: false,
        errors: [error.message || 'Unknown error occurred'],
        warnings: []
      };
    }
  }, [connectedAddress, fetchListedHeroes]);

  return {
    listingHeroId,
    listHeroForSale,
    fetchListedHeroes,
    listedHeroes
  };
};
