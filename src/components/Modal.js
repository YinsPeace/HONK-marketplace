import React from 'react';
import './Modal.css';
import HeroCard from './HeroCard';

const Modal = ({ onClose, children }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          X
        </button>
        {children}
      </div>
    </div>
  );
};

const HeroDetails = ({ hero, honkLogo, price, setPrice, onList, isBuyPage, onClose, onBuy }) => {
  const SELLER_FEE_PERCENTAGE = 0.01;

  const getAttributeValue = (traitType) => {
    const attribute = hero.attributes.find((attr) => attr.trait_type === traitType);
    return attribute ? attribute.value : 'N/A';
  };

  const calculateSellerFee = (amount) => {
    const parsedAmount = parseFloat(amount) || 0;
    return parsedAmount * SELLER_FEE_PERCENTAGE;
  };

  const calculateSellerProceeds = (amount) => {
    const parsedAmount = parseFloat(amount) || 0;
    return parsedAmount - calculateSellerFee(parsedAmount);
  };

  const handleAction = () => {
    if (isBuyPage) {
      onBuy(hero.id, hero.price);
    } else {
      onList(hero.id, price);
    }
    onClose();
  };

  return (
    <div className="modal-body">
      <div className="modal-hero-image">
        <HeroCard hero={hero} honkLogo={honkLogo} inModal />
      </div>
      <div className="hero-details">
        <h2>{hero.name}</h2>
        <div className="stats">
          <h3 className="section-title">Stats</h3>
          <hr />
          <div className="stat-grid">
            <div className="stat-col">
              <ul>
                <li>
                  <span className="stat-label">Strength:</span>
                  <span className="stat-value">{getAttributeValue('Strength')}</span>
                </li>
                <li>
                  <span className="stat-label">Agility:</span>
                  <span className="stat-value">{getAttributeValue('Agility')}</span>
                </li>
                <li>
                  <span className="stat-label">Endurance:</span>
                  <span className="stat-value">{getAttributeValue('Endurance')}</span>
                </li>
                <li>
                  <span className="stat-label">Wisdom:</span>
                  <span className="stat-value">{getAttributeValue('Wisdom')}</span>
                </li>
              </ul>
            </div>
            <div className="stat-col">
              <ul>
                <li>
                  <span className="stat-label">Dexterity:</span>
                  <span className="stat-value">{getAttributeValue('Dexterity')}</span>
                </li>
                <li>
                  <span className="stat-label">Vitality:</span>
                  <span className="stat-value">{getAttributeValue('Vitality')}</span>
                </li>
                <li>
                  <span className="stat-label">Intelligence:</span>
                  <span className="stat-value">{getAttributeValue('Intelligence')}</span>
                </li>
                <li>
                  <span className="stat-label">Luck:</span>
                  <span className="stat-value">{getAttributeValue('Luck')}</span>
                </li>
              </ul>
            </div>
          </div>
          <h3 className="section-title">Professions</h3>
          <hr />
          <div className="profession-grid">
            <div className="profession-col">
              <ul>
                <li>
                  <span className="profession-label">Mining:</span>
                  <span className="profession-value">{getAttributeValue('Mining')}</span>
                </li>
                <li>
                  <span className="profession-label">Fishing:</span>
                  <span className="profession-value">{getAttributeValue('Fishing')}</span>
                </li>
              </ul>
            </div>
            <div className="profession-col">
              <ul>
                <li>
                  <span className="profession-label">Gardening:</span>
                  <span className="profession-value">{getAttributeValue('Gardening')}</span>
                </li>
                <li>
                  <span className="profession-label">Foraging:</span>
                  <span className="profession-value">{getAttributeValue('Foraging')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          {isBuyPage ? (
            <>
              <div className="price-container">
                <img
                  src={honkLogo}
                  alt="HONK Coin"
                  style={{ width: '20px', height: '20px' }}
                  className="mr-2"
                />
                <span className="price-text">{hero.price} HONK</span>
              </div>
              <div className="modal-buttons">
                <button className="modal-button" onClick={handleAction}>
                  Buy Now
                </button>
                <button className="modal-button" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Price in HONK"
              />
              <div className="fee-details">
                <p>Marketplace Fee (1%): {calculateSellerFee(price).toFixed(2)} HONK</p>
                <p>You will receive: {calculateSellerProceeds(price).toFixed(2)} HONK</p>
              </div>
              <div className="modal-buttons">
                <button className="modal-button" onClick={handleAction}>
                  List for Sale
                </button>
                <button className="modal-button" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
        {!isBuyPage && (
          <div className="disclaimer">
            <p>
              Disclaimer: By proceeding with this listing, you acknowledge that a 1% fee will be
              deducted from your sale price when the hero is sold.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export { Modal, HeroDetails };
