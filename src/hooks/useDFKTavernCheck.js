import { useState, useEffect } from 'react';
import { DFKTavernInterface } from '../utils/DFKTavernInterface';
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

        // Get user auctions (hero IDs)
        const auctionIds = await tavern.getUserAuctions(connectedAddress);

        if (auctionIds && auctionIds.length > 0) {
          // Get detailed auction data
          const auctions = await tavern.getAuctions(auctionIds);

          if (auctions && auctions.length > 0) {
            // Process each auction using the same GraphQL query we use for other heroes
            const tavernHeroPromises = auctions
              .filter((auction) => auction && auction.open) // Only open auctions
              .map(async (auction) => {
                try {
                  const heroData = await getHeroData(auction.id);

                  if (!heroData) {
                    console.warn(`Failed to fetch hero data for ${auction.id} - no data returned`);
                    return null;
                  }

                  // Combine the hero data with tavern-specific information
                  return {
                    ...heroData,
                    isDFKTavernListing: true,
                    crystalPrice: auction.startingPrice, // Use starting price
                    marketplace: 'dfk',
                    seller: auction.seller,
                  };
                } catch (error) {
                  console.error(`Error processing tavern hero ${auction.id}:`, error);
                  return null;
                }
              });

            // Wait for all hero data to be fetched
            const processedHeroes = await Promise.all(tavernHeroPromises);
            // Filter out any null results from failed fetches
            const validHeroes = processedHeroes.filter((hero) => hero !== null);

            setTavernListedHeroes(validHeroes);
          } else {
            setTavernListedHeroes([]);
          }
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
  }, [connectedAddress, shouldCheck]);

  return {
    tavernListedHeroes,
    isChecking,
  };
};
