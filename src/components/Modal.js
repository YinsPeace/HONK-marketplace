import React, { useState } from 'react';
import './styles/Modal.css';
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

  const [isQuesting, setIsQuesting] = useState(false);

  const handleQuestStatusChange = (status) => {
    setIsQuesting(status);
  };

  // Get stat value directly from hero object
  const getStatValue = (statName) => {
    if (!hero || !hero.stats) return 'N/A';
    
    // Map stat names to their property names in the hero object
    const statMap = {
      'Strength': 'strength',
      'Dexterity': 'dexterity',
      'Agility': 'agility',
      'Vitality': 'vitality',
      'Endurance': 'endurance',
      'Intelligence': 'intelligence',
      'Wisdom': 'wisdom',
      'Luck': 'luck'
    };
    
    const statKey = statMap[statName];
    return statKey && hero.stats ? hero.stats[statKey] || 'N/A' : 'N/A';
  };
  
  // Get profession value directly from hero object
  const getProfessionValue = (profName) => {
    if (!hero) return 'N/A';
    
    // Map profession names to their property names in the hero object
    const profMap = {
      'Mining': 'mining',
      'Gardening': 'gardening',
      'Fishing': 'fishing',
      'Foraging': 'foraging'
    };
    
    const profKey = profMap[profName];
    return profKey && hero[profKey] !== undefined ? Math.floor(hero[profKey] / 10) : 'N/A';
  };
  
  // This function was removed as we now directly use hero.craftProf1/2 properties

  const calculateSellerFee = (amount) => {
    const parsedAmount = parseFloat(amount) || 0;
    return parsedAmount * SELLER_FEE_PERCENTAGE;
  };

  const calculateSellerProceeds = (amount) => {
    const parsedAmount = parseFloat(amount) || 0;
    return parsedAmount - calculateSellerFee(parsedAmount);
  };

  const handleAction = () => {
    if (isQuesting) {
      return; // Don't do anything if hero is questing
    }

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
        <HeroCard hero={hero} honkLogo={honkLogo} inModal onQuestStatusChange={handleQuestStatusChange}/>
      </div>
      <div className="hero-details">
        <h2>{hero.firstName} {hero.lastName}</h2>
        <div className="stats">
          <div className="stats-section">
          <h2>Stats</h2>
          <div className="stat-grid">
            <div className="stat-col">
              <ul>
                <li>
                  <span className="stat-label">Strength:</span>
                  <span className="stat-value">{getStatValue('Strength')}</span>
                </li>
                <li>
                  <span className="stat-label">Agility:</span>
                  <span className="stat-value">{getStatValue('Agility')}</span>
                </li>
                <li>
                  <span className="stat-label">Endurance:</span>
                  <span className="stat-value">{getStatValue('Endurance')}</span>
                </li>
                <li>
                  <span className="stat-label">Wisdom:</span>
                  <span className="stat-value">{getStatValue('Wisdom')}</span>
                </li>
              </ul>
            </div>
            <div className="stat-col">
              <ul>
                <li>
                  <span className="stat-label">Dexterity:</span>
                  <span className="stat-value">{getStatValue('Dexterity')}</span>
                </li>
                <li>
                  <span className="stat-label">Vitality:</span>
                  <span className="stat-value">{getStatValue('Vitality')}</span>
                </li>
                <li>
                  <span className="stat-label">Intelligence:</span>
                  <span className="stat-value">{getStatValue('Intelligence')}</span>
                </li>
                <li>
                  <span className="stat-label">Luck:</span>
                  <span className="stat-value">{getStatValue('Luck')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>  
        <h3 className="section-title">Professions</h3>
          <hr />
          <div className="profession-grid">
            <div className="profession-col">
              <ul>
                <li>
                  <span className="profession-label">Mining:</span>
                  <span className="profession-value">{getProfessionValue('Mining')}</span>
                </li>
                <li>
                  <span className="profession-label">Fishing:</span>
                  <span className="profession-value">{getProfessionValue('Fishing')}</span>
                </li>
              </ul>
            </div>
            <div className="profession-col">
              <ul>
                <li>
                  <span className="profession-label">Gardening:</span>
                  <span className="profession-value">{getProfessionValue('Gardening')}</span>
                </li>
                <li>
                  <span className="profession-label">Foraging:</span>
                  <span className="profession-value">{getProfessionValue('Foraging')}</span>
                </li>
              </ul>
            </div>
          </div>
          <h3 className="section-title">Crafting Professions</h3>
          <hr />
          <div className="profession-grid">
            {(hero.craftProf1 && hero.craftProf1 !== 'none') || (hero.craftProf2 && hero.craftProf2 !== 'none') ? (
              <>
                {hero.craftProf1 && hero.craftProf1 !== 'none' && (
                  <div className="profession-col single-col">
                    <ul>
                      <li>
                        <span className="profession-label">{hero.craftProf1}:</span>
                        <span className="profession-value">0</span>
                      </li>
                    </ul>
                  </div>
                )}
                {hero.craftProf2 && hero.craftProf2 !== 'none' && hero.craftProf2 !== hero.craftProf1 && (
                  <div className="profession-col single-col">
                    <ul>
                      <li>
                        <span className="profession-label">{hero.craftProf2}:</span>
                        <span className="profession-value">0</span>
                      </li>
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p>No crafting professions</p>
            )}
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
                disabled={isQuesting}
                className={isQuesting ? 'input-disabled' : ''}
                title={isQuesting ? 'Hero is currently on a quest and cannot be listed' : ''}
              />
              <div className="fee-details">
                <p>Marketplace Fee (1%): {calculateSellerFee(price).toFixed(2)} HONK</p>
                <p>You will receive: {calculateSellerProceeds(price).toFixed(2)} HONK</p>
              </div>
              <div className="modal-buttons">
                <button
                  className={`modal-button ${isQuesting ? 'button-disabled' : ''}`}
                  onClick={isQuesting ? undefined : handleAction}
                  disabled={isQuesting}
                  style={isQuesting? { pointerEvents: 'none' } : {}}
                  title={isQuesting ? 'Hero is currently on a quest and cannot be listed' : ''}                
                >
                  {isQuesting ? 'Questing' : 'List for Sale'}
                </button>
                <button className="modal-button" onClick={onClose}>
                  Cancel
                </button>
              </div>
              {isQuesting && (
                <div className="quest-warning">
                  <p>This hero is currently on a quest and cannot be listed</p>
                </div>
              )}
            </>
          )}
        </div>
        {(!isBuyPage && !isQuesting) && (
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
