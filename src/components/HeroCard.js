import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { calculateRequiredXp, calculateRemainingStamina } from '../utils/stamExpCalc';
import { statBoosts } from '../utils/heroStatskills';
import { DFKHeroContract, web3 } from '../Web3Config';
import { getFirstName, getLastName } from '../utils/heroUtils';
import '../components/styles/HeroCard.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

import crystalIcon from '../assets/images/hero/icons/crystal.png';
import jewelIcon from '../assets/images/hero/icons/jewel.png';
import jadeIcon from '../assets/images/hero/icons/jade.png';

const craftingProfessionMapping = {
  '1': 'Alchemy',
  '2': 'Blacksmithing',
  '3': 'Carpentry',
  '4': 'Cooking',
  '5': 'Jewelcrafting',
  '6': 'Leatherworking',
  '7': 'Tailoring',
  '8': 'Weaving',
};

const HeroCard = React.memo(
  ({
    hero,
    isBuyPage,
    honkLogo,
    onList,
    onCancelListing,
    onUpdatePrice,
    onBuyHero,
    inModal = false,
    isListing = false,
    isCancelling = false,
    isConnected,
    purchasedHeroes,
    listedHeroes,
    pendingTransactions,
    pendingCancellations,
    pendingPriceUpdates,
  }) => {
    const [isOnQuest, setIsOnQuest] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [price, setPrice] = useState('');
    const [isBuying, setIsBuying] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

    useEffect(() => {
      const checkQuestStatus = async () => {
        const heroState = await DFKHeroContract.methods.getHeroState(hero.id).call();
        setIsOnQuest(heroState.currentQuest !== '0x0000000000000000000000000000000000000000');
      };
      checkQuestStatus();
    }, [hero.id]);

    const handleBuy = useCallback(async () => {
      if (isBuying || !isConnected || pendingTransactions?.has(hero.id)) return;

      setIsBuying(true);
      try {
        await onBuyHero(hero.id);
      } catch (error) {
        console.error('Error in handleBuy:', error);
        setIsBuying(false);
        toast.error(`Failed to buy hero: ${error.message}`);
      }
    }, [isBuying, isConnected, hero.id, onBuyHero, pendingTransactions]);

    const handleList = useCallback(async () => {
      if (isListing) return;
      try {
        onList(hero.id);
      } catch (error) {
        console.error('Error opening listing modal:', error);
        toast.error('Failed to open listing modal');
      }
    }, [hero.id, onList, isListing]);

    const handleCancelListing = useCallback(async () => {
      if (isCancelling) return;
      try {
        const result = await onCancelListing(hero.id);
        if (!result?.success) {
          toast.error('Failed to cancel listing');
        }
      } catch (error) {
        console.error('Error cancelling listing:', error);
        toast.error('Failed to cancel listing');
      }
    }, [hero.id, onCancelListing, isCancelling]);

    const handleUpdatePrice = async () => {
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        toast.error('Please enter a valid price greater than 0 HONK');
        return;
      }
      if (parseFloat(price) > 1000000) {
        toast.error('Price cannot exceed 1,000,000 HONK');
        return;
      }

      try {
        const result = await onUpdatePrice(hero.id, price);
        if (result?.success) {
          setIsEditing(false);
          setPrice('');
        } else {
          toast.error('Failed to update price');
        }
      } catch (error) {
        console.error('Failed to update price:', error);
        toast.error('Failed to update price');
      }
    };

    const handlePriceChange = useCallback((e) => {
      const value = e.target.value;
      // Only allow numbers with up to 18 decimal places
      if (value === '' || /^\d*\.?\d{0,18}$/.test(value)) {
        setPrice(value);
      }
    }, []);

    const formatPrice = (price) => {
      return price ? web3.utils.fromWei(price.toString(), 'ether') : '0';
    };

    const formatPriceForDisplay = (price) => {
      if (!price) return '0';
      try {
        // First try to convert from Wei if it's in Wei format
        const formattedPrice = web3.utils.fromWei(price.toString(), 'ether');
        return parseFloat(formattedPrice).toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        });
      } catch (error) {
        // If fromWei fails, the price is probably already in the correct format
        return parseFloat(price).toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        });
      }
    };

    const formatHeroId = (id, originRealm) => {
      // Only format IDs for Crystal and Jade realms
      if (originRealm === 'CRY' || originRealm === 'SER2') {
        // For Crystal realm, ensure prefix starts with 1
        // For Jade realm, ensure prefix starts with 2
        const prefix = originRealm === 'CRY' ? '1' : '2';
        
        // Find the first non-zero digit after the prefix
        const match = id.match(new RegExp(`^${prefix}0*([1-9][0-9]*)$`));
        if (match) {
          return match[1]; // Return everything after the prefix and leading zeros
        }
      }
      
      // For other realms or if no match, return id as is
      return id;
    };

    const getRealmIcon = (originRealm) => {
      switch(originRealm) {
        case 'CRY':
          return crystalIcon;
        case 'SER':
          return jewelIcon;
        case 'SER2':
          return jadeIcon;
        default:
          return null;
      }
    };

    const realmIcon = getRealmIcon(hero.originRealm);

    const handleCardClick = useCallback(() => {
      if (!inModal) {
        setIsFlipped(!isFlipped);
      }
    }, [inModal, isFlipped]);

    const handleCopyId = (e) => {
      e.stopPropagation(); // Prevent card flip
      navigator.clipboard.writeText(hero.fullId || hero.id);
      toast.success(`Hero ID ${hero.fullId || hero.id} copied to clipboard!`);
    };

    const openTavern = (e) => {
      e.stopPropagation(); // Prevent card flip
      window.open('https://game.defikingdoms.com/tavern', '_blank');
    };

    const renderPriceOrStatus = () => {
      if (purchasedHeroes?.has(hero.id.toString())) {
        return (
          <div className="flex items-center justify-center gap-2 text-white">
            <img src={honkLogo} alt="HONK" className="w-8 h-8" />
            <span className="text-xl">Bought</span>
          </div>
        );
      }
      return (
        <div className="flex items-center justify-center gap-2 text-white">
          <img src={honkLogo} alt="HONK" className="w-8 h-8" />
          <span className="text-xl">{formatPriceForDisplay(hero.price)}</span>
        </div>
      );
    };

    const renderButtons = () => {
      if (!isConnected) return null;

      // If the hero is listed on DFK Tavern, show a gray button
      if (hero.isDFKTavernListing) {
        return (
          <div className="price-container flex flex-col items-center justify-center gap-2">
            <div className="crystal-price" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              {formatPriceForDisplay(hero.crystalPrice)} 
              <img 
                src={crystalIcon} 
                alt="CRYSTAL" 
                style={{ 
                  width: '16px', 
                  height: '16px',
                  position: 'relative',
                  top: '1px'
                }} 
              />
              CRYSTAL
            </div>
            <button
              className="list-button dfk-tavern"
              onClick={openTavern}
              style={{ cursor: 'pointer' }}
            >
              Listed on DFK Tavern
            </button>
          </div>
        );
      }

      // If the hero is being cancelled, show a loading state
      if (hero.isCancelling || pendingCancellations?.has(hero.id)) {
        return <div className="text-gray-400">Cancelling listing...</div>;
      }

      // If the hero is being purchased, show a loading state
      if (pendingTransactions?.has(hero.id)) {
        return <div className="text-gray-400">Processing purchase...</div>;
      }

      // If the hero was just purchased by this user
      if (purchasedHeroes?.has(hero.id)) {
        return <div className="text-green-500">Purchase complete!</div>;
      }

      if (hero.isForSale) {
        // We only need to know if there's a pending update
        const isPriceUpdatePending = pendingPriceUpdates?.has(hero.id);
        const displayPrice = hero.price;  // Always use current price

        return (
          <>
            <div className="price-container flex flex-col items-center justify-center gap-2">
              <div className="flex items-center justify-center gap-2 text-white">
                <img src={honkLogo} alt="HONK" className="w-8 h-8" />
                <span className="text-xl">{formatPriceForDisplay(displayPrice)}</span>
              </div>
            </div>
            {isBuyPage ? (
              <button
                onClick={() => onBuyHero(hero.id)}
                className="button"
                disabled={!isConnected || isBuying}
              >
                {isBuying ? 'Processing...' : 'Buy'}
              </button>
            ) : isEditing ? (
              <div className="hero-card-price-edit-container">
                <input
                  type="number"
                  value={price}
                  onChange={handlePriceChange}
                  placeholder="New price in HONK"
                  className="hero-card-price-input"
                  min="0"
                  step="0.000000000000000001"
                  title="Enter price in HONK (up to 18 decimal places)"
                  disabled={isUpdatingPrice}
                />
                <button
                  className={`modal-button update-price-button ${
                    !price || isNaN(parseFloat(price)) || isUpdatingPrice
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                  onClick={handleUpdatePrice}
                  disabled={!price || isNaN(parseFloat(price)) || isUpdatingPrice}
                >
                  {isUpdatingPrice ? 'Updating...' : 'Update'}
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="button"
                    disabled={isUpdatingPrice || isCancelling}
                  >
                    Edit Price
                  </button>
                  <button
                    onClick={() => window.open(`https://dfk-adventures.herokuapp.com/heroes/${hero.id}`, '_blank')}
                    className="button"
                    title="View hero details on ADFK"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}
                  >
                    <img 
                      src="https://dfk-adventures.herokuapp.com/static/profile.png" 
                      alt="ADFK"
                      style={{
                        width: '16px',
                        height: '16px',
                        marginRight: '4px'
                      }}
                    />
                    ADFK
                  </button>
                </div>
                <button
                  onClick={handleCancelListing}
                  className="button"
                  disabled={isUpdatingPrice || isCancelling}
                >
                  Cancel Listing
                </button>
              </>
            )}
          </>
        );
      }

      return (
        <>
          <button onClick={handleList} className="button mb-2" disabled={isListing}>
            List for Sale
          </button>
          <button
            onClick={() => window.open(`https://dfk-adventures.herokuapp.com/heroes/${hero.id}`, '_blank')}
            className="button"
            title="View hero details on ADFK"
            style={{
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            <img 
              src="https://dfk-adventures.herokuapp.com/static/profile.png" 
              alt="ADFK"
              style={{
                width: '16px',
                height: '16px',
                marginRight: '4px'
              }}
            />
            ADFK
          </button>
        </>
      );
    };

    if (!hero) {
      return <div>No hero data available</div>;
    }

    const getAttribute = (traitType) => {
      switch (traitType) {
        case 'Rarity': return hero.rarity;
        case 'Element': return hero.element;
        case 'Gender': return hero.gender;
        case 'Background': return hero.background;
        case 'HP': return hero.hp?.toString();
        case 'MP': return hero.mp?.toString();
        case 'Stamina': return hero.stamina?.toString();
        case 'StaminaFullAt': return hero.staminaFullAt?.toString();
        case 'XP': return hero.xp?.toString();
        case 'Level': return hero.level?.toString();
        case 'Strength': return hero.strength?.toString();
        case 'Dexterity': return hero.dexterity?.toString();
        case 'Agility': return hero.agility?.toString();
        case 'Vitality': return hero.vitality?.toString();
        case 'Intelligence': return hero.intelligence?.toString();
        case 'Wisdom': return hero.wisdom?.toString();
        case 'Luck': return hero.luck?.toString();
        case 'Stat Boost 1': return hero.statBoost1;
        case 'Stat Boost 2': return hero.statBoost2;
        case 'Summons Remaining': return hero.summons?.toString();
        case 'Max Summons': return hero.maxSummons?.toString();
        default: return null;
      }
    };

    const getNumericAttribute = (traitType) => {
      const value = getAttribute(traitType);
      return value ? Number(value) : 0;
    };

    const heroStats = {
      hp: hero.hp?.toString() || '0',
      mp: hero.mp?.toString() || '0',
      summonsRemaining: hero.maxSummons ? (parseInt(hero.maxSummons) - parseInt(hero.summons)).toString() : '0',
      maxSummons: hero.maxSummons?.toString() || '0',
      stamina: hero.stamina || 0,
      staminaFullAt: hero.staminaFullAt || 0,
      xp: hero.xp || 0,
      strength: hero.strength?.toString() || '0',
      dexterity: hero.dexterity?.toString() || '0',
      agility: hero.agility?.toString() || '0',
      vitality: hero.vitality?.toString() || '0',
      intelligence: hero.intelligence?.toString() || '0',
      wisdom: hero.wisdom?.toString() || '0',
      luck: hero.luck?.toString() || '0',
      statBoost1: hero.statBoost1,
      statBoost2: hero.statBoost2,
    };

    const ensureAttribute = (attr, defaultValue = 'N/A') => (attr !== 'N/A' ? attr : defaultValue);

    const level = parseInt(hero.level, 10);
    const requiredXpForNextLevel = calculateRequiredXp(level);

    const heroForStaminaCalculation = {
      staminaFullAt: parseInt(hero.staminaFullAt || '0', 10) * 1000,
      stats: {
        stamina: parseInt(hero.stamina || '0', 10),
      },
    };

    const currentStamina = calculateRemainingStamina(heroForStaminaCalculation);

    const heroXp = parseInt(hero.xp || '0', 10);
    const heroStamina = parseInt(hero.stamina || '0', 10);

    const xpPercentage = `${(heroXp / requiredXpForNextLevel) * 100}%`;
    const staminaPercentage = `${(currentStamina / heroStamina) * 100}%`;

    heroStats.summons = `${hero.maxSummons ? (parseInt(hero.maxSummons) - parseInt(hero.summons)) : 0}/${hero.maxSummons || 0}`;

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
      strength: ensureAttribute(hero.strength, 'N/A'),
      dexterity: ensureAttribute(hero.dexterity, 'N/A'),
      agility: ensureAttribute(hero.agility, 'N/A'),
      vitality: ensureAttribute(hero.vitality, 'N/A'),
      endurance: ensureAttribute(hero.endurance, 'N/A'),
      intelligence: ensureAttribute(hero.intelligence, 'N/A'),
      wisdom: ensureAttribute(hero.wisdom, 'N/A'),
      luck: ensureAttribute(hero.luck, 'N/A'),
    };

    const capitalizeFirstLetter = (string) => {
      if (!string) return '';
      return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const styles = {
      container: {
        position: 'relative',
        width: '100%',
        maxWidth: '350px',
        padding: '1rem',
        backgroundColor: '#1a1b26',
        borderRadius: '8px',
        color: '#fff',
        marginBottom: '1rem'
      },
      skillList: {
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '0.5rem',
        alignItems: 'center'
      },
      craftingList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem'
      },
      skillRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%'
      },
      sectionTitle: {
        marginTop: '.75rem'
      },
      mainProfession: {
        color: '#4ade80', // Bright green color
        fontWeight: 'bold'
      }
    };

    const formatProfessionLevel = (level) => {
      return Math.floor(parseFloat(level || 0) / 10).toString();
    };

    const detailedStats = (
      <div style={{ padding: '0 10px', marginTop: '-10px' }}>
        <div className={`col`}>
          <h3 style={styles.sectionTitle}>Stats</h3>
          <div className={`statList`}>
            {stats.map((stat) => (
              <div key={stat.value}>
                <div className={`statName`}>
                  {stat.abbr === hero.statBoost1 && stat.abbr === hero.statBoost2 ? (
                    <>
                      <span className={`statBoostDouble`}>{stat.abbr}</span>
                      <span className={`tooltip`}>
                        {stat.label}
                        <span className={`statBoost`}> +2</span>
                        <br />
                        <span className={`statBoost2`}>+2 P%, +4 S%</span>
                      </span>
                    </>
                  ) : stat.abbr === hero.statBoost1 ? (
                    <>
                      <span className={`statBoost`}>{stat.abbr}</span>
                      <span className={`tooltip`}>
                        {stat.label}
                        <span className={`statBoost`}> +2</span>
                      </span>
                    </>
                  ) : stat.abbr === hero.statBoost2 ? (
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
          <h3 style={styles.sectionTitle}>Gathering Professions</h3>
          <div className={`skillList`}>
            {['mining', 'gardening', 'fishing', 'foraging'].map(prof => {
              const isMainProfession = hero.professionStr?.toLowerCase() === prof;
              return (
                <React.Fragment key={prof}>
                  <div className={`${isMainProfession ? 'chosen mainProfession' : ''} skillName`}>
                    {capitalizeFirstLetter(prof)}
                    {isMainProfession && <span className={`tooltip`}>Main</span>}
                  </div>
                  <div className={`skillValue`}>
                    {formatProfessionLevel(hero[prof])}
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          <h3 style={styles.sectionTitle}>Crafting Professions</h3>
          <div className="skillList" style={styles.craftingList}>
            {hero.craftProf1 && hero.craftProf1 !== 'none' && (
              <div style={styles.skillRow}>
                <div className={`skillName ${
                  // Only add craftProf2 (blue color) if it's the only profession
                  (!hero.craftProf2 || hero.craftProf2 === 'none' || hero.craftProf2 === hero.craftProf1) 
                    ? 'craftProf2' 
                    : 'craftProfTitle'
                }`}>
                  {capitalizeFirstLetter(hero.craftProf1)}
                </div>
                <div className={`skillLevel`}>0</div>
              </div>
            )}
            {hero.craftProf2 && hero.craftProf2 !== 'none' && hero.craftProf2 !== hero.craftProf1 && (
              <div style={styles.skillRow}>
                <div className={`skillName craftProfTitle`}>
                  {capitalizeFirstLetter(hero.craftProf2)}
                </div>
                <div className={`skillLevel`}>0</div>
              </div>
            )}
            {(!hero.craftProf1 || hero.craftProf1 === 'none') && 
             (!hero.craftProf2 || hero.craftProf2 === 'none') && (
              <div className={`noCrafting`}>No crafting professions</div>
            )}
          </div>
        </div>
      </div>
    );

    const isPriceUpdatePending = useMemo(() => 
      pendingPriceUpdates?.has(hero.id), 
      [pendingPriceUpdates, hero.id]
    );

    const isCancellationPending = useMemo(() => 
      pendingCancellations?.has(hero.id),
      [pendingCancellations, hero.id]
    );

    const isTransactionPending = useMemo(() => 
      pendingTransactions?.has(hero.id),
      [pendingTransactions, hero.id]
    );

    return (
      <div className={`${hero.mainClass} w-full`}>
        <div className={`CardContainer heroCard card ${hero.element} ${hero.rarity?.toLowerCase()} ${isFlipped ? 'flipped' : ''}`} onClick={handleCardClick}>
          {isOnQuest && (
            <div className="quest-indicator" title="Hero is currently on a quest">
              <span>!</span>
            </div>
          )}
          <div className="heroCardFront">
            <div 
              className="heroID" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', cursor: 'pointer' }}
              onClick={handleCopyId}
              title="Click to copy full Hero ID"
            >
              {realmIcon && (
                <img 
                  src={realmIcon} 
                  alt={hero.originRealm} 
                  className="realm-icon" 
                  style={{ 
                    width: '16px', 
                    height: '16px', 
                    marginRight: '2px',
                    display: 'inline-block'
                  }} 
                />
              )}
              #{formatHeroId(hero.id, hero.originRealm)}
            </div>
            <div className="heroCardFrame">
              <div className={`specials row`}>
                <div className={`icon element-icon`}>
                  {hero.element === 'fire' && <img src={fireIcon} alt="Fire" />}
                  {hero.element === 'water' && <img src={waterIcon} alt="Water" />}
                  {hero.element === 'earth' && <img src={earthIcon} alt="Earth" />}
                  {hero.element === 'wind' && <img src={windIcon} alt="Wind" />}
                  {hero.element === 'lightning' && <img src={lightningIcon} alt="Lightning" />}
                  {hero.element === 'ice' && <img src={iceIcon} alt="Ice" />}
                  {hero.element === 'light' && <img src={lightIcon} alt="Light" />}
                  {hero.element === 'dark' && <img src={darkIcon} alt="Dark" />}
                  <span className={`tooltip`}>{hero.element}</span>
                </div>
                <div className={`icon`}>
                  {hero.background === 'arctic' && <img src={arcticIcon} alt="" />}
                  {hero.background === 'city' && <img src={cityIcon} alt="" />}
                  {hero.background === 'desert' && <img src={desertIcon} alt="" />}
                  {hero.background === 'forest' && <img src={forestIcon} alt="" />}
                  {hero.background === 'island' && <img src={islandIcon} alt="" />}
                  {hero.background === 'mountains' && <img src={mountainIcon} alt="" />}
                  {hero.background === 'plains' && <img src={plainsIcon} alt="" />}
                  {hero.background === 'swamp' && <img src={swampIcon} alt="" />}
                  <span className={'tooltip'}>{hero.background}</span>
                </div>
                <div className={'icon'}>
                  <img src={hero.gender === 'female' ? femaleIcon : maleIcon} alt="" />
                  <span className={'tooltip'}>{hero.gender}</span>
                </div>
              </div>
            </div>
            <div className={'heroName'}>
              <span>{`${hero.firstName} ${hero.lastName}`}</span>
            </div>
            <div className={`heroPreview ${hero.rarity}`}>
              <div className={'heroGlow'} />
              <div className={`${hero.background} backgroundGeneral heroContainer`}>
                <img src={hero.image} alt={hero.name} className={'heroImage'} onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/placeholder-hero.svg';
                }} />
              </div>
            </div>

            <div className={'heroInfo'}>
              <div className={'class'}>
                {hero.mainClass}
                <span className={'subClass'}>{hero.subClass}</span>
              </div>
              <div className={'cardRarity'}>
                <div className={'icon'}>
                  {hero.rarity === 'common' && <img src={commonIcon} alt="" />}
                  {hero.rarity === 'uncommon' && <img src={uncommonIcon} alt="" />}
                  {hero.rarity === 'rare' && <img src={rareIcon} alt="" />}
                  {hero.rarity === 'legendary' && <img src={legendaryIcon} alt="" />}
                  {hero.rarity === 'mythic' && <img src={mythicIcon} alt="" />}
                  <span className={'tooltip'}>{hero.rarity}</span>
                </div>
              </div>
              <div className={'level'}>
                Level {hero.level}
                <span className={'subClass'}>Gen {hero.generation}</span>
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
                        width: `${hero.maxSummons > 0 ? (hero.maxSummons - hero.summons) / hero.maxSummons * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                  <div className={'summonsAmount amount'}>
                    {hero.generation === 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '8px' }}>{'0/'}</span>
                        <span style={{ fontSize: '16px' }}>&infin;</span>
                      </div>
                    ) : (
                      `${hero.maxSummons ? (parseInt(hero.maxSummons) - parseInt(hero.summons)) : 0}/${hero.maxSummons || 0}`
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
                      {currentStamina}/{hero.stamina}
                    </div>
                  </div>
                </div>
                <div className={`statXp row`}>
                  XP
                  <div className={`bar`}>
                    <div className={`xpBar`} style={{ width: xpPercentage }} />
                  </div>
                  <div className={`xpAmount amount`}>
                    {hero.xp}/{requiredXpForNextLevel}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={`heroCardBack`}>
            <div className={`heroCardFrame`}>
              <div className={`specials row`}>
                <div className={`icon`}>
                  {hero.element === 'fire' && <img src={fireIcon} alt="" />}
                  {hero.element === 'water' && <img src={waterIcon} alt="" />}
                  {hero.element === 'earth' && <img src={earthIcon} alt="" />}
                  {hero.element === 'wind' && <img src={windIcon} alt="" />}
                  {hero.element === 'lightning' && <img src={lightningIcon} alt="" />}
                  {hero.element === 'ice' && <img src={iceIcon} alt="" />}
                  {hero.element === 'light' && <img src={lightIcon} alt="" />}
                  {hero.element === 'dark' && <img src={darkIcon} alt="" />}
                  <span className={`tooltip`}>{hero.element}</span>
                </div>
                <div className={`icon`}>
                  {hero.background === 'arctic' && <img src={arcticIcon} alt="" />}
                  {hero.background === 'city' && <img src={cityIcon} alt="" />}
                  {hero.background === 'desert' && <img src={desertIcon} alt="" />}
                  {hero.background === 'forest' && <img src={forestIcon} alt="" />}
                  {hero.background === 'island' && <img src={islandIcon} alt="" />}
                  {hero.background === 'mountains' && <img src={mountainIcon} alt="" />}
                  {hero.background === 'plains' && <img src={plainsIcon} alt="" />}
                  {hero.background === 'swamp' && <img src={swampIcon} alt="" />}
                  <span className={`tooltip`}>{hero.background}</span>
                </div>
                <div className={`icon`}>
                  <img src={hero.gender === 'female' ? femaleIcon : maleIcon} alt="" />
                  <span className={`tooltip`}>{hero.gender}</span>
                </div>
              </div>
              {hero.ownerName && (
                <div className="owner-info" style={{ 
                  position: 'absolute', 
                  bottom: '10px', 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  color: '#fff',
                  fontSize: '0.9em',
                  textAlign: 'center',
                  width: '100%'
                }}>
                  Owner: {hero.ownerName}
                </div>
              )}
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
              <div className="flex flex-col items-center gap-2">
                <div className="flex flex-col items-center justify-between p-2 bg-gray-800 rounded-lg w-full">
                  {renderPriceOrStatus()}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={handleBuy}
                    className={`button ${
                      !isConnected ||
                      isBuying ||
                      pendingTransactions?.has(hero.id) ||
                      purchasedHeroes?.has(hero.id)
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                    disabled={
                      !isConnected ||
                      isBuying ||
                      pendingTransactions?.has(hero.id) ||
                      purchasedHeroes?.has(hero.id)
                    }
                    title={
                      !isConnected
                        ? 'Connect wallet to buy heroes'
                        : purchasedHeroes?.has(hero.id)
                          ? 'Already purchased'
                          : pendingTransactions?.has(hero.id) || isBuying
                            ? 'Transaction in progress'
                            : 'Buy this hero'
                    }
                  >
                    {pendingTransactions?.has(hero.id) || isBuying
                      ? 'Buying...'
                      : purchasedHeroes?.has(hero.id)
                        ? 'Bought'
                        : 'Buy'}
                  </button>
                  <button
                    onClick={() => window.open(`https://dfk-adventures.herokuapp.com/heroes/${hero.id}`, '_blank')}
                    className="button"
                    title="View hero details on ADFK"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}
                  >
                    <img 
                      src="https://dfk-adventures.herokuapp.com/static/profile.png" 
                      alt="ADFK"
                      style={{
                        width: '16px',
                        height: '16px',
                        marginRight: '4px'
                      }}
                    />
                    ADFK
                  </button>
                </div>
              </div>
            ) : (
              <>
                {renderButtons()}
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

<style>
  {`
    .dfk-tavern-indicator {
      position: absolute;
      top: 30px;
      right: 10px;
      background-color: rgba(0, 0, 0, 0.8);
      padding: 8px;
      border-radius: 8px;
      text-align: right;
      z-index: 10;
    }
    .dfk-tavern-label {
      color: #fff;
      font-size: 12px;
      margin-bottom: 4px;
    }
    .crystal-price {
      color: #00ffff;
      font-size: 14px;
    }
  `}
</style>
