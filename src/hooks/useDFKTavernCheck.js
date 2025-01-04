import { useState, useEffect } from 'react';
import DFKTavernInterface from '../contracts/DFKTavernInterface';
import { getHeroData } from '../utils/heroUtils';

export const useDFKTavernCheck = (connectedAddress, heroes, isLoading, shouldCheck = false) => {
  const [tavernListedHeroes, setTavernListedHeroes] = useState([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkTavernListings = async () => {
      // Only proceed if we have an address and not already checking and shouldCheck is true
      if (!connectedAddress || !shouldCheck || isChecking) {
        return;
      }

      setIsChecking(true);

      try {
        // Initialize DFK Tavern interface
        const tavern = new DFKTavernInterface();
        const listings = await tavern.getUserListings(connectedAddress);
        
        if (listings && listings.length > 0) {
          // Process each listing using the same GraphQL query we use for other heroes
          const tavernHeroPromises = listings.map(async listing => {
            try {
              
              const heroData = await getHeroData(listing.heroId);
              
              if (!heroData) {
                console.warn(`Failed to fetch hero data for ${listing.heroId} - no data returned`);
                return null;
              }

              // Combine the hero data with tavern-specific information
              return {
                ...heroData,
                isDFKTavernListing: true,
                crystalPrice: listing.price,
                marketplace: 'dfk',
                seller: listing.seller,
              };
            } catch (error) {
              console.error(`Error processing tavern hero ${listing.heroId}:`, error);
              return null;
            }
          });

          // Wait for all hero data to be fetched
          const processedHeroes = await Promise.all(tavernHeroPromises);
          // Filter out any null results from failed fetches
          const validHeroes = processedHeroes.filter(hero => hero !== null);
          
          setTavernListedHeroes(validHeroes);
        } else {
          setTavernListedHeroes([]);
        }
      } catch (error) {
        console.warn('Error checking tavern listings:', error);
        setTavernListedHeroes([]);
      } finally {
        setIsChecking(false);
      }
    };

    checkTavernListings();
  }, [connectedAddress, shouldCheck, isChecking]);

  return {
    tavernListedHeroes,
    isChecking
  };
};
