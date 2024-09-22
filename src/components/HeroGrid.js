import React, { useState } from 'react';
import HeroCard from './HeroCard';
import { Modal, HeroDetails } from './Modal';

const HeroGrid = ({
  heroes,
  isBuyPage,
  honkLogo,
  onList,
  onCancelListing,
  onUpdatePrice,
  onBuy,
  formatPrice,
  lastHeroRef,
  listingHeroId,
  cancellingHeroId,
  isConnected,
}) => {
  const [selectedHero, setSelectedHero] = useState(null);
  const [price, setPrice] = useState('');

  if (!heroes || heroes.length === 0) {
    return <div className="text-center mt-4">No heroes to display</div>;
  }

  const handleList = (heroId) => {
    const hero = heroes.find((h) => h.id === heroId);
    setSelectedHero(hero);
  };

  const closeModal = () => {
    setSelectedHero(null);
    setPrice('');
  };

  const listHeroForSale = async () => {
    if (selectedHero && price) {
      try {
        await onList(selectedHero.id, price);
        closeModal();
      } catch (error) {
        console.error('Error listing hero:', error);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap justify-center -mx-4">
        {heroes.map((hero, index) => (
          <div
            key={hero.id}
            ref={index === heroes.length - 1 ? lastHeroRef : null}
            className="p-4"
            style={{ width: '320px' }} // Adjusted to account for padding
          >
            <HeroCard
              hero={hero}
              isBuyPage={isBuyPage}
              honkLogo={honkLogo}
              onBuy={onBuy}
              onCancelListing={onCancelListing}
              onUpdatePrice={onUpdatePrice}
              onList={handleList}
              formatPrice={formatPrice}
              isListing={listingHeroId === hero.id}
              isCancelling={cancellingHeroId === hero.id}
              isConnected={isConnected}
            />
          </div>
        ))}
      </div>
      {selectedHero && (
        <Modal onClose={closeModal}>
          <HeroDetails
            hero={selectedHero}
            honkLogo={honkLogo}
            price={price}
            setPrice={setPrice}
            onList={listHeroForSale}
            isBuyPage={isBuyPage}
            onClose={closeModal}
            onBuy={onBuy}
          />
        </Modal>
      )}
    </div>
  );
};

export default HeroGrid;
