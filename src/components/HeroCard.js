import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { calculateRequiredXp, calculateRemainingStamina } from '../utils/stamExpCalc';
import { statBoosts } from '../utils/heroStatskills';
import { DFKHeroContract, web3 } from '../Web3Config';
import '../components/styles/HeroCard.css';

import femaleIcon from '../assets/images/hero/icons/icon-female.png';
import maleIcon from '../assets/images/hero/icons/icon-male.png';

import fireIcon from '../assets/images/hero/icons/element-fire.png';
import waterIcon from '../assets/images/hero/icons/element-water.png';
import earthIcon from '../assets/images/hero/icons/element-earth.png';
import windIcon from '../assets/images/hero/icons/element-wind.png';
import lightningIcon from '../assets/images/hero/icons/element-lightning.png';
import iceIcon from '../assets/images/hero/icons/element-ice.png';
import lightIcon from '../assets/images/hero/icons/element-light.png';
import darkIcon from '../assets/images/hero/icons/element-dark.png';

import arcticIcon from '../assets/images/hero/icons/icon-arctic.png';
import cityIcon from '../assets/images/hero/icons/icon-city.png';
import desertIcon from '../assets/images/hero/icons/icon-desert.png';
import forestIcon from '../assets/images/hero/icons/icon-forest.png';
import islandIcon from '../assets/images/hero/icons/icon-island.png';
import mountainIcon from '../assets/images/hero/icons/icon-mountains.png';
import plainsIcon from '../assets/images/hero/icons/icon-plains.png';
import swampIcon from '../assets/images/hero/icons/icon-swamp.png';

import commonIcon from '../assets/images/hero/icons/rarity-common.png';
import uncommonIcon from '../assets/images/hero/icons/rarity-uncommon.png';
import rareIcon from '../assets/images/hero/icons/rarity-rare.png';
import legendaryIcon from '../assets/images/hero/icons/rarity-legendary.png';
import mythicIcon from '../assets/images/hero/icons/rarity-mythic.png';

import healthIcon from '../assets/images/hero/icons/icon-health.png';
import manaIcon from '../assets/images/hero/icons/icon-mana.png';

const HeroCard = React.memo(
  ({
    hero,
    isBuyPage,
    honkLogo,
    onList,
    onCancelListing,
    onUpdatePrice,
    onBuy,
    inModal = false,
    isListing = false,
    isCancelling = false,
    isConnected,
  }) => {
    const [isOnQuest, setIsOnQuest] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [price, setPrice] = useState('');
    const [isBuying, setIsBuying] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
      const checkQuestStatus = async () => {
        const heroState = await DFKHeroContract.methods.getHeroState(hero.id).call();
        setIsOnQuest(heroState.currentQuest !== '0x0000000000000000000000000000000000000000');
      };
      checkQuestStatus();
    }, [hero.id]);

    const handleBuy = useCallback(async () => {
      if (isBuying || !isConnected) return;
      setIsBuying(true);
      try {
        await onBuy(hero.id);
      } catch (error) {
        console.error('Error buying hero:', error);
        // Consider adding a user-friendly error message here
      } finally {
        setIsBuying(false);
      }
    }, [hero.id, onBuy, isBuying, isConnected]);

    const handleList = useCallback(async () => {
      if (isListing) return;
      try {
        await onList(hero.id);
      } catch (error) {
        console.error('Error listing hero:', error);
        // Consider adding a user-friendly error message here
      }
    }, [hero.id, onList, isListing]);

    const handleCancelListing = useCallback(async () => {
      if (isCancelling) return;
      try {
        await onCancelListing(hero.id);
      } catch (error) {
        console.error('Error cancelling listing:', error);
        // Consider adding a user-friendly error message here
      }
    }, [hero.id, onCancelListing, isCancelling]);

    const handleUpdatePrice = useCallback(() => {
      if (!price || isNaN(parseFloat(price))) {
        // Consider adding a user-friendly error message here
        return;
      }
      onUpdatePrice(hero.id, price);
      setIsEditing(false);
    }, [hero.id, price, onUpdatePrice]);

    const handlePriceChange = useCallback((e) => {
      const value = e.target.value;
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setPrice(value);
      }
    }, []);

    const formatPriceForDisplay = useMemo(
      () => (priceInput) => {
        if (!priceInput) return 'N/A';
        const priceInEther = web3.utils.fromWei(priceInput.toString(), 'ether');
        return `${priceInEther} HONK`;
      },
      []
    );

    const handleCardClick = useCallback(() => {
      if (!inModal) {
        setIsFlipped(!isFlipped);
      }
    }, [inModal, isFlipped]);

    if (!hero) {
      return <div>No hero data available</div>;
    }

    const heroAttributes = hero.attributes;

    const getAttribute = (traitType) => {
      if (!heroAttributes) return undefined;
      const attribute = heroAttributes.find((attr) => attr.trait_type === traitType)?.value;
      return attribute !== undefined ? String(attribute).toLowerCase() : undefined;
    };

    const rarity = getAttribute('Rarity');
    const element = getAttribute('Element');
    const gender = getAttribute('Gender');
    const background = getAttribute('Background');
    const mainClass = getAttribute('Class');
    const heroSubClass = getAttribute('Sub Class');
    const heroLevel = getAttribute('Level');
    const generation = getAttribute('Generation');
    const profession = getAttribute('Profession') || 'unknown';
    const craftProf1 = getAttribute('Crafting 1') || 'none';
    const craftProf2 = getAttribute('Crafting 2') || 'none';

    const heroClasses = `heroPreview ${rarity}`;
    const cardClasses = `CardContainer heroCard card ${element} ${rarity} ${isFlipped ? 'flipped' : ''}`;

    const heroName = hero.name || 'Unknown Hero';
    const heroImage = hero.image || '';

    const getNumericAttribute = (traitType) => {
      const attribute = heroAttributes.find((attr) => attr.trait_type === traitType)?.value;
      return attribute ? Number(attribute) : 0;
    };

    const reverseStatBoosts = Object.entries(statBoosts).reduce((acc, [key, value]) => {
      acc[value.toLowerCase()] = key;
      return acc;
    }, {});

    const heroStatBoost1 = statBoosts[reverseStatBoosts[getAttribute('Stat Boost 1')]] || '';
    const heroStatBoost2 = statBoosts[reverseStatBoosts[getAttribute('Stat Boost 2')]] || '';

    const heroStats = {
      hp: getAttribute('HP') || '0',
      mp: getAttribute('MP') || '0',
      summonsRemaining: getAttribute('Summons Remaining') || '0',
      maxSummons: getAttribute('Max Summons') || '0',
      stamina: getNumericAttribute('Stamina') || 0,
      staminaFullAt: getNumericAttribute('StaminaFullAt') || 0,
      xp: getNumericAttribute('XP') || 0,
      strength: getAttribute('Strength') || '0',
      dexterity: getAttribute('Dexterity') || '0',
      agility: getAttribute('Agility') || '0',
      vitality: getAttribute('Vitality') || '0',
      intelligence: getAttribute('Intelligence') || '0',
      endurance: getAttribute('Endurance') || '0',
      wisdom: getAttribute('Wisdom') || '0',
      luck: getAttribute('Luck') || '0',
      mining: getAttribute('Mining') || '0',
      gardening: getAttribute('Gardening') || '0',
      fishing: getAttribute('Fishing') || '0',
      foraging: getAttribute('Foraging') || '0',
      statBoost1: getAttribute('Stat Boost 1') || '',
      statBoost2: getAttribute('Stat Boost 2') || '',
    };

    const ensureAttribute = (attr, defaultValue = 'N/A') => (attr !== 'N/A' ? attr : defaultValue);

    const level = parseInt(heroLevel, 10);
    const requiredXpForNextLevel = calculateRequiredXp(level);

    const heroForStaminaCalculation = {
      staminaFullAt: heroStats.staminaFullAt * 1000,
      stats: {
        stamina: heroStats.stamina,
      },
    };

    const currentStamina = calculateRemainingStamina(heroForStaminaCalculation);

    const xpPercentage = `${(heroStats.xp / requiredXpForNextLevel) * 100}%`;
    const staminaPercentage = `${(currentStamina / heroStats.stamina) * 100}%`;

    heroStats.summons = `${heroStats.summonsRemaining}/${heroStats.maxSummons}`;

    const stats = [
      { value: 'strength', label: 'Strength', abbr: 'STR' },
      { value: 'dexterity', label: 'Dexterity', abbr: 'DEX' },
      { value: 'agility', label: 'Agility', abbr: 'AGI' },
      { value: 'vitality', label: 'Vitality', abbr: 'VIT' },
      { value: 'endurance', label: 'Endurance', abbr: 'END' },
      { value: 'intelligence', label: 'Intelligence', abbr: 'INT' },
      { value: 'wisdom', label: 'Wisdom', abbr: 'WIS' },
      { value: 'luck', label: 'Luck', abbr: 'LCK' },
    ];

    hero.stats = {
      strength: ensureAttribute(heroStats.strength, 'N/A'),
      dexterity: ensureAttribute(heroStats.dexterity, 'N/A'),
      agility: ensureAttribute(heroStats.agility, 'N/A'),
      vitality: ensureAttribute(heroStats.vitality, 'N/A'),
      endurance: ensureAttribute(heroStats.endurance, 'N/A'),
      intelligence: ensureAttribute(heroStats.intelligence, 'N/A'),
      wisdom: ensureAttribute(heroStats.wisdom, 'N/A'),
      luck: ensureAttribute(heroStats.luck, 'N/A'),
    };

    const capitalizeFirstLetter = (string) => {
      if (!string) return '';
      return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const detailedStats = (
      <div style={{ padding: '0 10px', marginTop: '-10px' }}>
        <div className={`col`}>
          <h3 style={{ marginTop: '.5rem' }}>Stats</h3>
          <div className={`statList`}>
            {stats.map((stat) => (
              <div key={stat.value}>
                <div className={`statName`}>
                  {stat.abbr === heroStatBoost1 && stat.abbr === heroStatBoost2 ? (
                    <>
                      <span className={`statBoostDouble`}>{stat.abbr}</span>
                      <span className={`tooltip`}>
                        {stat.label}
                        <span className={`statBoost`}> +2</span>
                        <br />
                        <span className={`statBoost2`}>+2 P%, +4 S%</span>
                      </span>
                    </>
                  ) : stat.abbr === heroStatBoost1 ? (
                    <>
                      <span className={`statBoost`}>{stat.abbr}</span>
                      <span className={`tooltip`}>
                        {stat.label}
                        <span className={`statBoost`}> +2</span>
                      </span>
                    </>
                  ) : stat.abbr === heroStatBoost2 ? (
                    <>
                      <span className={`statBoost2`}>{stat.abbr}</span>
                      <span className={`tooltip`}>
                        {stat.label}
                        <br />
                        <span className={`statBoost2`}>+2 P%, +4 S%</span>
                      </span>
                    </>
                  ) : (
                    <>
                      {stat.abbr}
                      <span className={`tooltip`}>{stat.label}</span>
                    </>
                  )}
                </div>
                <div className={`statPoint`}>{hero.stats[stat.value]}</div>
              </div>
            ))}
          </div>
        </div>
        <div className={`col`}>
          <h3 style={{ marginTop: '.75rem' }}>Gathering Professions</h3>
          <div className={`skillList`}>
            <div className={`${profession === 'mining' ? 'chosen' : ''} skillName`}>
              Mining<span className={`tooltip`}>{profession === 'mining' ? 'Main' : ''}</span>
            </div>
            <div className={`skillLevel`}>{heroStats.mining}</div>

            <div className={`${profession === 'gardening' ? 'chosen' : ''} skillName`}>
              Gardening<span className={`tooltip`}>{profession === 'gardening' ? 'Main' : ''}</span>
            </div>
            <div className={`skillLevel`}>{heroStats.gardening}</div>

            <div className={`${profession === 'fishing' ? 'chosen' : ''} skillName`}>
              Fishing<span className={`tooltip`}>{profession === 'fishing' ? 'Main' : ''}</span>
            </div>
            <div className={`skillLevel`}>{heroStats.fishing}</div>

            <div className={`${profession === 'foraging' ? 'chosen' : ''} skillName`}>
              Foraging<span className={`tooltip`}>{profession === 'foraging' ? 'Main' : ''}</span>
            </div>
            <div className={`skillLevel`}>{heroStats.foraging}</div>
          </div>
        </div>
        <div className={`col`}>
          <h3 style={{ marginTop: '.75rem' }}>Crafting Professions</h3>
          <div className={`skillList`}>
            {craftProf1 && craftProf1 !== 'none' && (
              <>
                <div
                  className={`craftProfTitle skillName ${craftProf1 === craftProf2 ? 'craftProf2' : ''}`}
                  style={{ gridColumn: 'span 3' }}
                >
                  {capitalizeFirstLetter(craftProf1)}
                </div>
                <div className={`skillLevel`}>0.0</div>
              </>
            )}
            {craftProf2 && craftProf2 !== 'none' && craftProf1 !== craftProf2 && (
              <>
                <div className={`craftProfTitle skillName`} style={{ gridColumn: 'span 3' }}>
                  {capitalizeFirstLetter(craftProf2)}
                </div>
                <div className={`skillLevel`}>0.0</div>
              </>
            )}
            {(!craftProf1 || craftProf1 === 'none') && (!craftProf2 || craftProf2 === 'none') && (
              <div style={{ gridColumn: 'span 4' }}>No crafting professions</div>
            )}
          </div>
        </div>
      </div>
    );

    return (
      <div className={`${mainClass} w-full`}>
        <div className={cardClasses} onClick={handleCardClick}>
          {isOnQuest && (
            <div className="absolute top-2 right-2 z-10">
              <div className="relative group">
                <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold quest-warning">!</span>
                </div>
                <div className="absolute invisible group-hover:visible bg-gray-800 text-white p-2 rounded mt-1 right-0 whitespace-nowrap">
                  This hero is currently on a quest
                </div>
              </div>
            </div>
          )}
          <div className="heroCardFront">
            <div className="heroID">#{hero.shortId}</div>
            <div className="heroHealth">
              <img src={healthIcon} alt="" />
              {heroStats.hp}
              <span className="tooltip">Health</span>
            </div>
            <div className="heroMana">
              <img src={manaIcon} alt="" />
              {heroStats.mp}
              <span className="tooltip">Mana</span>
            </div>
            <div className="heroCardFrame">
              <div className={`specials row`}>
                <div className={`icon element-icon`}>
                  {element === 'fire' && <img src={fireIcon} alt="Fire" />}
                  {element === 'water' && <img src={waterIcon} alt="Water" />}
                  {element === 'earth' && <img src={earthIcon} alt="Earth" />}
                  {element === 'wind' && <img src={windIcon} alt="Wind" />}
                  {element === 'lightning' && <img src={lightningIcon} alt="Lightning" />}
                  {element === 'ice' && <img src={iceIcon} alt="Ice" />}
                  {element === 'light' && <img src={lightIcon} alt="Light" />}
                  {element === 'dark' && <img src={darkIcon} alt="Dark" />}
                  <span className={`tooltip`}>{element}</span>
                </div>
                <div className={`icon`}>
                  {background === 'arctic' && <img src={arcticIcon} alt="" />}
                  {background === 'city' && <img src={cityIcon} alt="" />}
                  {background === 'desert' && <img src={desertIcon} alt="" />}
                  {background === 'forest' && <img src={forestIcon} alt="" />}
                  {background === 'island' && <img src={islandIcon} alt="" />}
                  {background === 'mountains' && <img src={mountainIcon} alt="" />}
                  {background === 'plains' && <img src={plainsIcon} alt="" />}
                  {background === 'swamp' && <img src={swampIcon} alt="" />}
                  <span className={'tooltip'}>{background}</span>
                </div>
                <div className={'icon'}>
                  <img src={gender === 'female' ? femaleIcon : maleIcon} alt="" />
                  <span className={'tooltip'}>{gender}</span>
                </div>
              </div>
            </div>
            <div className={'heroName'}>
              <span>{heroName}</span>
            </div>
            <div className={heroClasses}>
              <div className={'heroGlow'} />
              <div className={`${background} backgroundGeneral heroContainer`}>
                <img src={heroImage} alt={heroName} className={'heroImage'} />
              </div>
            </div>

            <div className={'heroInfo'}>
              <div className={'class'}>
                {mainClass}
                <span className={'subClass'}>{heroSubClass}</span>
              </div>
              <div className={'cardRarity'}>
                <div className={'icon'}>
                  {rarity === 'common' && <img src={commonIcon} alt="" />}
                  {rarity === 'uncommon' && <img src={uncommonIcon} alt="" />}
                  {rarity === 'rare' && <img src={rareIcon} alt="" />}
                  {rarity === 'legendary' && <img src={legendaryIcon} alt="" />}
                  {rarity === 'mythic' && <img src={mythicIcon} alt="" />}
                  <span className={'tooltip'}>{rarity}</span>
                </div>
              </div>
              <div className={'level'}>
                Level {heroLevel}
                <span className={'subClass'}>Gen {generation}</span>
              </div>
            </div>
            <div className={'heroStats'}>
              <div className={'heroFrame'}>
                <div className={`statSummons row`}>
                  Summons
                  <div className={'bar'}>
                    <div
                      className={'summonsBar'}
                      style={{
                        width: `${heroStats.maxSummons > 0 ? (heroStats.summonsRemaining / heroStats.maxSummons) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                  <div className={'summonsAmount amount'}>
                    {generation === 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '8px' }}>{'0/'}</span>
                        <span style={{ fontSize: '16px' }}>&infin;</span>
                      </div>
                    ) : (
                      heroStats.summons
                    )}
                  </div>
                </div>
                <div className={`statStaminaWrapper`}>
                  <div className={`statStamina row`}>
                    Stamina
                    <div className={`bar`}>
                      <div className={`staminaBar`} style={{ width: staminaPercentage }} />
                    </div>
                    <div className={`staminaAmount amount`}>
                      {currentStamina}/{heroStats.stamina}
                    </div>
                  </div>
                </div>
                <div className={`statXp row`}>
                  XP
                  <div className={`bar`}>
                    <div className={`xpBar`} style={{ width: xpPercentage }} />
                  </div>
                  <div className={`xpAmount amount`}>
                    {heroStats.xp}/{requiredXpForNextLevel}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={`heroCardBack`}>
            <div className={`heroCardFrame`}>
              <div className={`specials row`}>
                <div className={`icon`}>
                  {element === 'fire' && <img src={fireIcon} alt="" />}
                  {element === 'water' && <img src={waterIcon} alt="" />}
                  {element === 'earth' && <img src={earthIcon} alt="" />}
                  {element === 'wind' && <img src={windIcon} alt="" />}
                  {element === 'lightning' && <img src={lightningIcon} alt="" />}
                  {element === 'ice' && <img src={iceIcon} alt="" />}
                  {element === 'light' && <img src={lightIcon} alt="" />}
                  {element === 'dark' && <img src={darkIcon} alt="" />}
                  <span className={`tooltip`}>{element}</span>
                </div>
                <div className={`icon`}>
                  {background === 'arctic' && <img src={arcticIcon} alt="" />}
                  {background === 'city' && <img src={cityIcon} alt="" />}
                  {background === 'desert' && <img src={desertIcon} alt="" />}
                  {background === 'forest' && <img src={forestIcon} alt="" />}
                  {background === 'island' && <img src={islandIcon} alt="" />}
                  {background === 'mountains' && <img src={mountainIcon} alt="" />}
                  {background === 'plains' && <img src={plainsIcon} alt="" />}
                  {background === 'swamp' && <img src={swampIcon} alt="" />}
                  <span className={`tooltip`}>{background}</span>
                </div>
                <div className={`icon`}>
                  <img src={gender === 'female' ? femaleIcon : maleIcon} alt="" />
                  <span className={`tooltip`}>{gender}</span>
                </div>
              </div>
              <div className={`heroStats`}>
                <div className={`heroFrame`}>{detailedStats}</div>
              </div>
            </div>
            Placeholder for statSliders
          </div>
        </div>
        {!inModal && (
          <div className="button-container">
            {isBuyPage ? (
              <>
                <div className="price-container flex items-center">
                  <img
                    src={honkLogo}
                    alt="HONK Coin"
                    style={{ width: '20px', height: '20px' }}
                    className="mr-2"
                  />
                  <span className="price-text">{formatPriceForDisplay(hero.price)}</span>
                </div>
                <button
                  className={`button ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={handleBuy}
                  disabled={isBuying || !isConnected}
                  title={!isConnected ? 'Connect wallet to buy heroes' : ''}
                >
                  {isBuying ? 'Buying...' : 'Buy'}
                </button>
              </>
            ) : hero.isForSale ? (
              <>
                <div className="price-container flex items-center">
                  <img
                    src={honkLogo}
                    alt="HONK Coin"
                    style={{ width: '20px', height: '20px' }}
                    className="mr-2"
                  />
                  <span className="price-text">{formatPriceForDisplay(hero.price)}</span>
                </div>
                {isEditing ? (
                  <div className="hero-card-price-edit-container">
                    <input
                      type="number"
                      value={price}
                      onChange={handlePriceChange}
                      placeholder="New price"
                      className="hero-card-price-input"
                    />
                    <button
                      className="modal-button update-price-button"
                      onClick={handleUpdatePrice}
                      disabled={!price || isNaN(parseFloat(price))}
                    >
                      Update
                    </button>
                  </div>
                ) : (
                  <button
                    className="modal-button edit-price-button"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Price
                  </button>
                )}
                <button className="button" onClick={handleCancelListing} disabled={isCancelling}>
                  {isCancelling ? 'Cancelling...' : 'Cancel Listing'}
                </button>
              </>
            ) : (
              <>
                <button className="button" onClick={handleList} disabled={isListing}>
                  {isListing ? 'Listing...' : 'List for Sale'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }
);

HeroCard.displayName = 'HeroCard';

export default React.memo(HeroCard);
