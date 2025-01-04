import React, { useState } from 'react';
import { Modal, HeroDetails } from './Modal';
import { toast } from 'react-toastify';
import VirtualizedHeroGrid from './VirtualizedHeroGrid';

const HeroGrid = ({
  heroes,
  isBuyPage,
  honkLogo,
  onList,
  onCancelListing,
  onUpdatePrice,
  onBuyHero,
  formatPrice,
  lastHeroRef,
  isConnected,
  purchasedHeroes,
  listedHeroes,
  pendingTransactions,
  pendingCancellations,
  pendingPriceUpdates,
}) => {
  const [selectedHero, setSelectedHero] = useState(null);
  const [price, setPrice] = useState('');

  if (!heroes || heroes.length === 0) {
    return <div className="text-center mt-4">No heroes to display</div>;
  }

  const handleList = (heroId) => {
    const hero = heroes.find((h) => h.id === heroId);
    if (hero) {
      setSelectedHero(hero);
    } else {
      console.error('Hero not found:', heroId);
    }
  };

  const closeModal = () => {
    setSelectedHero(null);
    setPrice('');
  };

  const listHeroForSale = async () => {
    if (!selectedHero) {
      toast.error('No hero selected');
      return;
    }

    if (!price) {
      toast.error('Please enter a price');
      return;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      toast.error('Please enter a valid price greater than 0 HONK');
      return;
    }

    if (numericPrice > 1000000) {
      toast.error('Price cannot exceed 1,000,000 HONK');
      return;
    }

    try {
      await onList(selectedHero.id, price);
      closeModal();
    } catch (error) {
      console.error('Error listing hero:', error);
      toast.error('Failed to list hero: ' + error.message);
    }
  };

  return (
    <>
      <VirtualizedHeroGrid
        heroes={heroes}
        isBuyPage={isBuyPage}
        honkLogo={honkLogo}
        onList={handleList}
        onCancelListing={onCancelListing}
        onUpdatePrice={onUpdatePrice}
        onBuyHero={onBuyHero}
        formatPrice={formatPrice}
        lastHeroRef={lastHeroRef}
        isConnected={isConnected}
        purchasedHeroes={purchasedHeroes}
        listedHeroes={listedHeroes}
        pendingTransactions={pendingTransactions}
        pendingCancellations={pendingCancellations}
        pendingPriceUpdates={pendingPriceUpdates}
      />
      {selectedHero && (
        <Modal onClose={closeModal}>
          <HeroDetails
            hero={selectedHero}
            honkLogo={honkLogo}
            price={price}
            setPrice={setPrice}
            onList={listHeroForSale}
            isBuyPage={false}
            onClose={closeModal}
          />
        </Modal>
      )}
    </>
  );
};

export default HeroGrid;
