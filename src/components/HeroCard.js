import React, { useState, useEffect, useCallback, useMemo } from 'react';
import HeroPortrait from '../heroRender/HeroPortrait';
import HeroCardTabs from './HeroCardTabs';
import { calculateRequiredXp, calculateRemainingStamina } from '../utils/stamExpCalc';
import { DFKHeroContract, web3 } from '../Web3Config';
import {
  activeAbilityMapping,
  passiveAbilityMapping,
} from '../utils/heroUtils';
import { abilityWithShortCode } from '../utils/heroGeneParser';
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

import crystalIcon from '../assets/images/hero/icons/crystal.png';
import jewelIcon from '../assets/images/hero/icons/jewel.png';
import jadeIcon from '../assets/images/hero/icons/jade.png';

// Zero address constant used for private listing checks
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const craftingProfessionMapping = {
  0: 'Blacksmithing',
  2: 'Goldsmithing',
  4: 'Armorsmithing',
  6: 'Woodworking',
  8: 'Leatherworking',
  10: 'Tailoring',
  12: 'Enchanting',
  14: 'Alchemy',
};

// Helper function to format and escape ability names
const formatAbility = (abilityName, fallback, unknown = 'Unknown') => {
  const formattedAbility = abilityWithShortCode(abilityName || fallback || unknown);
  // No need to escape here as we're returning a string, not JSX
  return formattedAbility;
};

// Helper function to format price with 0-2 decimal places
const formatPriceHelper = (price) => {
  if (!price) return '0';
  try {
    // Convert from Wei if it's in Wei format
    let formattedPrice;
    if (typeof price === 'string' && price.length > 10) {
      formattedPrice = web3.utils.fromWei(price.toString(), 'ether');
    } else {
      formattedPrice = price.toString();
    }
    return parseFloat(formattedPrice).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  } catch (error) {
    console.error('Error formatting price:', error);
    return parseFloat(price || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
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
    onQuestStatusChange,
    // Bulk listing props
    isBulkMode = false,
    selectedHeroes = new Set(),
    onToggleSelection,
    onBuyBulkListing,
    onCancelBulkListing,
    // New prop to disable buying functionality
    disableBuying = false,
    formatPrice: externalFormatPrice,
  }) => {


    const [isOnQuest, setIsOnQuest] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [price, setPrice] = useState('');
    const [isBuying, setIsBuying] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const [activeTab, setActiveTab] = useState('stats');

    // Skip blockchain calls when rendering placeholder heroes for performance testing
    useEffect(() => {
      if (hero.isPlaceholder) return;

      const checkQuestStatus = async () => {
        const heroState = await DFKHeroContract.methods.getHeroState(hero.id).call();
        const questStatus = heroState.currentQuest !== '0x0000000000000000000000000000000000000000';
        setIsOnQuest(questStatus);

        if (onQuestStatusChange) {
          onQuestStatusChange(questStatus);
        }
      };

      checkQuestStatus();
    }, [hero.id, onQuestStatusChange, hero.isPlaceholder]);

    const handleBuy = useCallback(async () => {
      if (isBuying || !isConnected || pendingTransactions?.has(hero.id)) return;

      setIsBuying(true);
      try {
        await onBuyHero(hero.id);
      } catch (error) {
        // Errors from onBuyHero (like actual transaction failures) will be caught here.
        // Toast messages for these are often handled within onBuyHero itself or useHeroBuying.
        console.error('Error during onBuyHero call in HeroCard:', error);
        // Optionally, show a generic error toast if not already handled by onBuyHero
        // toast.error(`An error occurred: ${error.message}`);
      } finally {
        setIsBuying(false);
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

    const formatPriceForDisplay = (price) => {
      if (!price) return '0';
      try {
        // First try to convert from Wei if it's in Wei format
        const formattedPrice = web3.utils.fromWei(price.toString(), 'ether');
        return parseFloat(formattedPrice).toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        });
      } catch (error) {
        // If fromWei fails, the price is probably already in the correct format
        return parseFloat(price).toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
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
      switch (originRealm) {
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
            <div
              className="crystal-price"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              {formatPriceForDisplay(hero.crystalPrice)}
              <img loading="lazy"
                src={crystalIcon}
                alt="CRYSTAL"
                style={{
                  width: '16px',
                  height: '16px',
                  position: 'relative',
                  top: '1px',
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

      // Subtle UX: keep buttons visible and show inline spinners instead of replacing the whole UI

      if (hero.isForSale) {
        // We only need to know if there's a pending update
        const isPriceUpdatePending = pendingPriceUpdates?.has(hero.id);
        const displayPrice = hero.price; // Always use current price

        return (
          <>
            <div className="price-container flex flex-col items-center justify-center gap-2">
              <div className="flex items-center justify-center gap-2 text-white">
                {hero.isPendingListing && (
                  <div
                    className="animate-spin rounded-full h-3 w-3 border-2 border-yellow-300 border-t-transparent"
                    title="Listing is finalizing"
                  ></div>
                )}
                <img src={honkLogo} alt="HONK" className="w-8 h-8" />
                <span className="text-xl">{formatPriceForDisplay(displayPrice)}</span>
              </div>
            </div>
            {isBuyPage ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex flex-col items-center justify-between p-2 bg-gray-800 rounded-lg w-full">
                  {renderPriceOrStatus()}
                </div>
                <div className="flex items-center justify-center gap-2">
                  {!disableBuying && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card flip
                        handleBuy();
                      }}
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
                      {pendingTransactions?.has(hero.id) || isBuying ? (
                        <span className="inline-flex items-center">
                          <span className="animate-spin rounded-full h-3 w-3 border-2 border-white/80 border-t-transparent mr-2"></span>
                          Buying...
                        </span>
                      ) : purchasedHeroes?.has(hero.id) ? (
                        'Bought'
                      ) : (
                        'Buy'
                      )}
                    </button>
                  )}
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="button"
                    title="DFK Adventures is offline"
                    disabled
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      opacity: 0.45,
                      filter: 'grayscale(1)',
                      cursor: 'not-allowed',
                    }}
                  >
                    ADFK
                  </button>
                </div>
              </div>
            ) : isEditing && !hero.isPendingListing ? (
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
                />
                <button
                  className={`modal-button update-price-button ${
                    !price || isNaN(parseFloat(price)) || isPriceUpdatePending
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                  onClick={handleUpdatePrice}
                  disabled={!price || isNaN(parseFloat(price)) || isPriceUpdatePending}
                >
                  {isPriceUpdatePending ? (
                    <span className="inline-flex items-center">
                      <span className="animate-spin rounded-full h-3 w-3 border-2 border-white/80 border-t-transparent mr-2"></span>
                      Updating...
                    </span>
                  ) : (
                    'Update'
                  )}
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card flip
                      if (!hero.isPendingListing) {
                        setIsEditing(true);
                      }
                    }}
                    className={`button ${
                      hero.isPendingListing || isPriceUpdatePending ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={hero.isPendingListing || isPriceUpdatePending}
                    title={
                      hero.isPendingListing
                        ? 'Please wait while the listing is being finalized'
                        : isPriceUpdatePending
                        ? 'Updating price...'
                        : 'Edit price'
                    }
                  >
                    {isPriceUpdatePending ? (
                      <span className="inline-flex items-center">
                        <span className="animate-spin rounded-full h-3 w-3 border-2 border-white/80 border-t-transparent mr-2"></span>
                        Updating...
                      </span>
                    ) : (
                      'Edit Price'
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card flip
                      if (!hero.isPendingListing) {
                        handleCancelListing();
                      }
                    }}
                    className={`button ${
                      hero.isPendingListing || hero.isCancelling || pendingCancellations?.has(hero.id)
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                    disabled={
                      hero.isPendingListing || hero.isCancelling || pendingCancellations?.has(hero.id)
                    }
                    title={
                      hero.isPendingListing
                        ? 'Please wait while the listing is being finalized'
                        : hero.isCancelling || pendingCancellations?.has(hero.id)
                        ? 'Cancelling listing...'
                        : 'Cancel listing'
                    }
                  >
                    {hero.isCancelling || pendingCancellations?.has(hero.id) ? (
                      <span className="inline-flex items-center">
                        <span className="animate-spin rounded-full h-3 w-3 border-2 border-white/80 border-t-transparent mr-2"></span>
                        Cancelling...
                      </span>
                    ) : (
                      'Cancel Listing'
                    )}
                  </button>
                </div>
              </>
            )}
          </>
        );
      }

      // Handle bulk mode vs normal mode for unlisted heroes
      const isSelected = selectedHeroes?.has(hero.id);

      if (isBulkMode) {
        return (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent card flip
                onToggleSelection?.(hero.id);
              }}
              className={`button mb-2 ${isSelected ? 'bg-gray-600 hover:bg-gray-700' : ''}`}
              style={{
                backgroundColor: isSelected ? '#4b5563' : undefined,
                color: isSelected ? '#9ca3af' : undefined,
              }}
              disabled={isListing}
            >
              {isSelected ? 'Remove from bulk' : 'Add to bulk'}
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="button"
              title="DFK Adventures is offline"
              disabled
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                opacity: 0.45,
                filter: 'grayscale(1)',
                cursor: 'not-allowed',
              }}
            >
              ADFK
            </button>
          </>
        );
      }

      return (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent card flip
              handleList();
            }}
            className="button mb-2"
            disabled={isListing}
          >
            List for Sale
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="button"
            title="DFK Adventures is offline"
            disabled
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              opacity: 0.45,
              filter: 'grayscale(1)',
              cursor: 'not-allowed',
            }}
          >
            ADFK
          </button>
        </>
      );
    };

    // Bulk listing handlers
    const handleBuyBulkListing = (bulkListingId) => {
      if (onBuyBulkListing) {
        onBuyBulkListing(bulkListingId);
      }
    };

    const handleCancelBulkListing = (bulkListingId) => {
      if (onCancelBulkListing) {
        // If this is a bulk listing card, pass the heroes data
        if (hero.isBulkListing && hero.heroes) {
          onCancelBulkListing(bulkListingId, hero.heroes);
        } else {
          onCancelBulkListing(bulkListingId);
        }
      }
    };

    const renderBulkButtons = () => {
      if (!isBuyPage) {
        // Seller's view - show both view details and cancel bulk listing buttons
        return (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleBuyBulkListing(hero.bulkListingId)}
              className="button bg-blue-600 hover:bg-blue-700"
            >
              View Details
            </button>
            <button
              onClick={() => handleCancelBulkListing(hero.bulkListingId)}
              className="button bg-red-600 hover:bg-red-700"
              disabled={pendingCancellations?.has(hero.bulkListingId)}
            >
              {pendingCancellations?.has(hero.bulkListingId)
                ? 'Cancelling...'
                : 'Cancel Bulk Listing'}
            </button>
          </div>
        );
      } else {
        // Buyer's view - show buy bulk listing button
        return (
          <button
            onClick={() => handleBuyBulkListing(hero.bulkListingId)}
            className="button bg-green-600 hover:bg-green-700"
            disabled={!isConnected || pendingTransactions?.has(hero.bulkListingId)}
          >
            {pendingTransactions?.has(hero.bulkListingId)
              ? 'Purchasing...'
              : isBuyPage
                ? 'Buy All Heroes'
                : 'View Details'}
          </button>
        );
      }
    };

    if (!hero) {
      return <div>No hero data available</div>;
    }

    // Normalize rarity for icon rendering
    const normalizedRarity = (hero.rarity || '').toLowerCase().trim();

    const getAttribute = (traitType) => {
      switch (traitType) {
        case 'Rarity':
          return hero.rarity;
        case 'Element':
          return hero.element;
        case 'Gender':
          return hero.gender;
        case 'Background':
          return hero.background;
        case 'HP':
          return hero.hp?.toString();
        case 'MP':
          return hero.mp?.toString();
        case 'Stamina':
          return hero.stamina?.toString();
        case 'StaminaFullAt':
          return hero.staminaFullAt?.toString();
        case 'XP':
          return hero.xp?.toString();
        case 'Level':
          return hero.level?.toString();
        case 'Strength':
          return hero.strength?.toString();
        case 'Dexterity':
          return hero.dexterity?.toString();
        case 'Agility':
          return hero.agility?.toString();
        case 'Vitality':
          return hero.vitality?.toString();
        case 'Intelligence':
          return hero.intelligence?.toString();
        case 'Wisdom':
          return hero.wisdom?.toString();
        case 'Luck':
          return hero.luck?.toString();
        case 'Stat Boost 1':
          return hero.statBoost1;
        case 'Stat Boost 2':
          return hero.statBoost2;
        case 'Summons Remaining':
          return hero.summons?.toString();
        case 'Max Summons':
          return hero.maxSummons?.toString();
        default:
          return null;
      }
    };

    const getNumericAttribute = (traitType) => {
      const value = getAttribute(traitType);
      return value ? Number(value) : 0;
    };

    const heroStats = {
      hp: hero.hp?.toString() || '0',
      mp: hero.mp?.toString() || '0',
      summonsRemaining: hero.maxSummons
        ? (parseInt(hero.maxSummons) - parseInt(hero.summons)).toString()
        : '0',
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

    heroStats.summons = `${hero.maxSummons ? parseInt(hero.maxSummons) - parseInt(hero.summons) : 0}/${hero.maxSummons || 0}`;

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
        marginBottom: '1rem',
      },
      skillList: {
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '0.5rem',
        alignItems: 'center',
      },
      craftingList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
      },
      skillRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
      },
      sectionTitle: {
        marginTop: '.75rem',
      },
      mainProfession: {
        color: '#4ade80', // Bright green color
        fontWeight: 'bold',
      },
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
            {['mining', 'gardening', 'fishing', 'foraging'].map((prof) => {
              const isMainProfession = hero.professionStr?.toLowerCase() === prof;
              return (
                <React.Fragment key={prof}>
                  <div className={`${isMainProfession ? 'chosen mainProfession' : ''} skillName`}>
                    {capitalizeFirstLetter(prof)}
                    {isMainProfession && <span className={`tooltip`}>Main</span>}
                  </div>
                  <div className={`skillValue`}>{formatProfessionLevel(hero[prof])}</div>
                </React.Fragment>
              );
            })}
          </div>

          <h3 style={styles.sectionTitle}>Crafting Professions</h3>
          <div className="skillList" style={styles.craftingList}>
            {hero.craftProf1 && hero.craftProf1 !== 'none' && (
              <div style={styles.skillRow}>
                <div
                  className={`skillName ${
                    // Only add craftProf2 (blue color) if it's the only profession
                    !hero.craftProf2 ||
                    hero.craftProf2 === 'none' ||
                    hero.craftProf2 === hero.craftProf1
                      ? 'craftProf2'
                      : 'craftProfTitle'
                  }`}
                >
                  {capitalizeFirstLetter(hero.craftProf1)}
                </div>
                <div className={`skillLevel`}>0</div>
              </div>
            )}
            {hero.craftProf2 &&
              hero.craftProf2 !== 'none' &&
              hero.craftProf2 !== hero.craftProf1 && (
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

    const isPriceUpdatePending = useMemo(
      () => pendingPriceUpdates?.has(hero.id),
      [pendingPriceUpdates, hero.id]
    );

    const isCancellationPending = useMemo(
      () => pendingCancellations?.has(hero.id),
      [pendingCancellations, hero.id]
    );

    const isTransactionPending = useMemo(
      () => pendingTransactions?.has(hero.id),
      [pendingTransactions, hero.id]
    );

    // Check if hero is selected in bulk mode for visual feedback
    const isSelected = isBulkMode && selectedHeroes?.has(hero.id);

    // Render bulk listing card
    if (hero.isBulkListing) {
      // Debug log for bulk listing data
      console.log('[HeroCard] Rendering bulk listing:', {
        id: hero.bulkListingId,
        heroCount: hero.heroCount,
        heroesLength: hero.heroes?.length,
        totalPrice: hero.totalPrice,
        heroes: hero.heroes,
      });

      return (
        <div
          className={`hero-card ${isBulkMode && selectedHeroes.has(hero.id) ? 'bulk-selected' : ''}`}
        >
          <div className="hero-image-container">
            {/* Show up to 4 hero images in a 2x2 grid */}
            <div className="bulk-hero-images grid grid-cols-2 gap-1 p-2">
              {hero.heroes?.slice(0, 4).map((bulkHero, index) => (
                <div
                  key={bulkHero.id}
                  className="relative w-16 h-16 rounded border overflow-hidden"
                >
                  <HeroPortrait hero={bulkHero} />
                </div>
              ))}
              {hero.heroes?.length > 4 && (
                <div className="w-16 h-16 rounded border bg-gray-800 flex items-center justify-center text-white text-xs">
                  +{hero.heroes.length - 4}
                </div>
              )}
            </div>

            {/* Bulk listing badge */}
            <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold">
              BULK ({hero.heroes?.length || hero.heroCount || 0})
            </div>
          </div>

          <div className="hero-info">
            <h3 className="hero-name text-lg font-bold mb-2">Bulk Listing #{hero.bulkListingId}</h3>

            <div className="hero-details text-sm mb-3">
              <div className="flex justify-between">
                <span>Heroes:</span>
                <span className="font-bold">{hero.heroes?.length || hero.heroCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Classes:</span>
                <span className="text-xs">
                  {[...new Set(hero.heroes?.map((h) => h.mainClass) || [])].slice(0, 3).join(', ')}
                  {[...new Set(hero.heroes?.map((h) => h.mainClass) || [])].length > 3 ? '...' : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Levels:</span>
                <span className="text-xs">
                  {Math.min(...(hero.heroes?.map((h) => h.level || 1) || [1]))} -{' '}
                  {Math.max(...(hero.heroes?.map((h) => h.level || 1) || [1]))}
                </span>
              </div>
            </div>

            <div className="price-section mb-3">
              <div className="flex items-center justify-between">
                <img src={honkLogo} alt="HONK" className="w-6 h-6" />
                <span className="price text-xl font-bold">
                  {typeof externalFormatPrice === 'function'
                    ? externalFormatPrice(hero.totalPrice)
                    : formatPriceHelper(hero.totalPrice)}
                </span>
              </div>
              <div className="text-xs text-gray-400 text-center">
                ~
                {formatPriceHelper(
                  (hero.totalPrice || 0) / (hero.heroes?.length || hero.heroCount || 1)
                )}{' '}
                per hero
              </div>
            </div>

            {renderBulkButtons()}
          </div>
        </div>
      );
    }

    return (
      <div className={`${hero.mainClass} w-full`}>
        <div
          className={`CardContainer heroCard card ${hero.element} ${hero.rarity?.toLowerCase()} ${isFlipped ? 'flipped' : ''} ${isSelected ? 'bulk-selected' : ''}`}
          onClick={handleCardClick}
          style={{
            ...(isSelected
              ? {
                  border: '3px solid #3b82f6',
                  boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                }
              : {}),
          }}
        >
          {isOnQuest && (
            <div className="quest-indicator" title="Hero is currently on a quest">
              <span>!</span>
            </div>
          )}
          {/* Private listing indicator */}
          {(hero.isPrivate || (hero.allowedBuyer && hero.allowedBuyer !== ZERO_ADDRESS)) && (
            <div
              className="private-indicator absolute top-2 right-2 bg-gray-200 text-purple-700 rounded-full p-1 shadow-lg"
              title={
                isBuyPage
                  ? `Private listing by: ${hero.owner || 'Unknown'}`
                  : hero.allowedBuyer
                    ? `Private listing for: ${hero.allowedBuyer}`
                    : 'Private listing'
              }
            >
              <span>🔒</span>
            </div>
          )}
          <div className="heroCardFront">
            <div
              className="heroID"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                cursor: 'pointer',
              }}
              onClick={handleCopyId}
              title="Click to copy full Hero ID"
            >
              {realmIcon && (
                <img loading="lazy"
                  src={realmIcon}
                  alt={hero.originRealm}
                  className="realm-icon"
                  style={{
                    width: '16px',
                    height: '16px',
                    marginRight: '2px',
                    display: 'inline-block',
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
                <div className={'heroImage'}>
                  <HeroPortrait hero={hero} />
                </div>
              </div>
            </div>

            <div className={'heroInfo'}>
              <div className={'class'}>
                {hero.mainClass}
                <span className={'subClass'}>{hero.subClass}</span>
              </div>
              <div className={'cardRarity'}>
                <div className={'icon'}>
                  {normalizedRarity === 'common' && <img src={commonIcon} alt="" />}
                  {normalizedRarity === 'uncommon' && <img src={uncommonIcon} alt="" />}
                  {normalizedRarity === 'rare' && <img src={rareIcon} alt="" />}
                  {normalizedRarity === 'legendary' && <img src={legendaryIcon} alt="" />}
                  {normalizedRarity === 'mythic' && <img src={mythicIcon} alt="" />}
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
                        width: `${hero.maxSummons > 0 ? ((hero.maxSummons - hero.summons) / hero.maxSummons) * 100 : 0}%`,
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
                      `${hero.maxSummons ? parseInt(hero.maxSummons) - parseInt(hero.summons) : 0}/${hero.maxSummons || 0}`
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

              {/* Tab content area */}
              <div className={`heroStats`}>
                <div className={`heroFrame`}>
                  {activeTab === 'stats' && detailedStats}
                  {activeTab === 'growth' && (
                    <div style={{ padding: '0 10px' }}>
                      <h3 style={styles.sectionTitle}>Growth Stats</h3>
                      <div className="statList-vertical growth-stats">
                        <div
                          className="growth-section-title"
                          style={{
                            textAlign: 'center',
                            fontWeight: 500,
                            fontSize: '17px',
                            color: '#fbe375',
                            margin: '6px 0 2px 0',
                            letterSpacing: '0.02em',
                          }}
                        >
                          Primary Growth
                        </div>
                        <div
                          className="row"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '2px 8px',
                          }}
                        >
                          <div className="col">
                            <div className="statName">STR</div>
                            <div className="statValue">
                              {hero.growthStats?.primary?.STR || '0'}%
                            </div>
                          </div>
                          <div className="col">
                            <div className="statName">INT</div>
                            <div className="statValue">
                              {hero.growthStats?.primary?.INT || '0'}%
                            </div>
                          </div>
                          <div className="col">
                            <div className="statName">WIS</div>
                            <div className="statValue">
                              {hero.growthStats?.primary?.WIS || '0'}%
                            </div>
                          </div>
                          <div className="col">
                            <div className="statName">LCK</div>
                            <div className="statValue">
                              {hero.growthStats?.primary?.LCK || '0'}%
                            </div>
                          </div>
                        </div>
                        <div
                          className="row"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '2px 8px',
                          }}
                        >
                          <div className="col">
                            <div className="statName">AGI</div>
                            <div className="statValue">
                              {hero.growthStats?.primary?.AGI || '0'}%
                            </div>
                          </div>
                          <div className="col">
                            <div className="statName">VIT</div>
                            <div className="statValue">
                              {hero.growthStats?.primary?.VIT || '0'}%
                            </div>
                          </div>
                          <div className="col">
                            <div className="statName">END</div>
                            <div className="statValue">
                              {hero.growthStats?.primary?.END || '0'}%
                            </div>
                          </div>
                          <div className="col">
                            <div className="statName">DEX</div>
                            <div className="statValue">
                              {hero.growthStats?.primary?.DEX || '0'}%
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div
                            className="growth-section-title"
                            style={{ gridColumn: '1 / -1', textAlign: 'center', fontWeight: 500 }}
                          >
                            Secondary Growth
                          </div>
                        </div>
                        <div
                          className="row"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '2px 8px',
                          }}
                        >
                          <div className="col">
                            <div className="statName">STR</div>
                            <div className="statValue">
                              {hero.growthStats?.secondary?.STR || '0'}%
                            </div>
                          </div>
                          <div className="col">
                            <div className="statName">INT</div>
                            <div className="statValue">
                              {hero.growthStats?.secondary?.INT || '0'}%
                            </div>
                          </div>
                          <div className="col">
                            <div className="statName">WIS</div>
                            <div className="statValue">
                              {hero.growthStats?.secondary?.WIS || '0'}%
                            </div>
                          </div>
                          <div className="col">
                            <div className="statName">LCK</div>
                            <div className="statValue">
                              {hero.growthStats?.secondary?.LCK || '0'}%
                            </div>
                          </div>
                        </div>
                        <div
                          className="row"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '2px 8px',
                          }}
                        >
                          <div className="col">
                            <div className="statName">AGI</div>
                            <div className="statValue">
                              {hero.growthStats?.secondary?.AGI || '0'}%
                            </div>
                          </div>
                          <div className="col">
                            <div className="statName">VIT</div>
                            <div className="statValue">
                              {hero.growthStats?.secondary?.VIT || '0'}%
                            </div>
                          </div>
                          <div className="col">
                            <div className="statName">END</div>
                            <div className="statValue">
                              {hero.growthStats?.secondary?.END || '0'}%
                            </div>
                          </div>
                          <div className="col">
                            <div className="statName">DEX</div>
                            <div className="statValue">
                              {hero.growthStats?.secondary?.DEX || '0'}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'abilities' && (
                    <div style={{ padding: '0 10px' }}>
                      <h3 style={styles.sectionTitle}>Ability Genes</h3>
                      <div className="statList-vertical ability-genes">
                        <div className="row">
                          <div className="statName">Active 1</div>
                          <div className="statValue">
                            {formatAbility(
                              hero.abilityGenes?.active1?.name,
                              activeAbilityMapping[Number(hero.originalStatGenes?.active1)]
                            )}
                          </div>
                        </div>
                        <div className="row">
                          <div className="statName">Active 2</div>
                          <div className="statValue">
                            {formatAbility(
                              hero.abilityGenes?.active2?.name,
                              activeAbilityMapping[Number(hero.originalStatGenes?.active2)]
                            )}
                          </div>
                        </div>
                        <div className="row">
                          <div className="statName">Passive 1</div>
                          <div className="statValue">
                            {formatAbility(
                              hero.abilityGenes?.passive1?.name,
                              passiveAbilityMapping[Number(hero.originalStatGenes?.passive1)]
                            )}
                          </div>
                        </div>
                        <div className="row">
                          <div className="statName">Passive 2</div>
                          <div className="statValue">
                            {formatAbility(
                              hero.abilityGenes?.passive2?.name,
                              passiveAbilityMapping[Number(hero.originalStatGenes?.passive2)]
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'recessive1' && (
                    <div style={{ padding: '0 10px' }}>
                      <h3 style={styles.sectionTitle}>Recessive Genes (R1)</h3>
                      <div className="statList-vertical recessive-genes">
                        <div className="row paired-stats">
                          <div className="stat-pair">
                            <div className="statName">Class</div>
                            <div className="statValue" style={{ color: '#e6c15a' }}>
                              {hero.formattedRecessiveGenes?.stat?.r1?.mainClass || 'Unknown'}
                            </div>
                          </div>
                          <div className="stat-pair">
                            <div className="statName">Subclass</div>
                            <div className="statValue" style={{ color: '#d14f69' }}>
                              {hero.formattedRecessiveGenes?.stat?.r1?.subClass || 'Unknown'}
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="statName">Profession</div>
                          <div className="statValue" style={{ color: '#8bc34a' }}>
                            {hero.formattedRecessiveGenes?.stat?.r1?.profession || 'Unknown'}
                          </div>
                        </div>
                        <div className="row paired-stats">
                          <div className="stat-pair">
                            <div className="statName">Stat Boost 1</div>
                            <div className="statValue" style={{ color: '#ff9800' }}>
                              {hero.formattedRecessiveGenes?.stat?.r1?.statBoost1 || 'Unknown'}
                            </div>
                          </div>
                          <div className="stat-pair">
                            <div className="statName">Stat Boost 2</div>
                            <div className="statValue" style={{ color: '#4caf50' }}>
                              {hero.formattedRecessiveGenes?.stat?.r1?.statBoost2 || 'Unknown'}
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="statName">Active 1</div>
                          <div className="statValue" style={{ color: '#2196f3' }}>
                            {hero.formattedRecessiveGenes?.stat?.r1?.active1 || 'Unknown'}
                          </div>
                        </div>
                        <div className="row">
                          <div className="statName">Active 2</div>
                          <div className="statValue" style={{ color: '#2196f3' }}>
                            {hero.formattedRecessiveGenes?.stat?.r1?.active2 || 'Unknown'}
                          </div>
                        </div>
                        <div className="row">
                          <div className="statName">Passive 1</div>
                          <div className="statValue" style={{ color: '#9c27b0' }}>
                            {hero.formattedRecessiveGenes?.stat?.r1?.passive1 || 'Unknown'}
                          </div>
                        </div>
                        <div className="row">
                          <div className="statName">Passive 2</div>
                          <div className="statValue" style={{ color: '#9c27b0' }}>
                            {hero.formattedRecessiveGenes?.stat?.r1?.passive2 || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'recessive2' && (
                    <div style={{ padding: '0 10px' }}>
                      <h3 style={styles.sectionTitle}>Recessive Genes (R2)</h3>
                      <div className="statList-vertical recessive-genes">
                        <div className="row paired-stats">
                          <div className="stat-pair">
                            <div className="statName">Class</div>
                            <div className="statValue" style={{ color: '#e6c15a' }}>
                              {hero.formattedRecessiveGenes?.stat?.r2?.mainClass || 'Unknown'}
                            </div>
                          </div>
                          <div className="stat-pair">
                            <div className="statName">Subclass</div>
                            <div className="statValue" style={{ color: '#d14f69' }}>
                              {hero.formattedRecessiveGenes?.stat?.r2?.subClass || 'Unknown'}
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="statName">Profession</div>
                          <div className="statValue" style={{ color: '#8bc34a' }}>
                            {hero.formattedRecessiveGenes?.stat?.r2?.profession || 'Unknown'}
                          </div>
                        </div>
                        <div className="row paired-stats">
                          <div className="stat-pair">
                            <div className="statName">Stat Boost 1</div>
                            <div className="statValue" style={{ color: '#ff9800' }}>
                              {hero.formattedRecessiveGenes?.stat?.r2?.statBoost1 || 'Unknown'}
                            </div>
                          </div>
                          <div className="stat-pair">
                            <div className="statName">Stat Boost 2</div>
                            <div className="statValue" style={{ color: '#4caf50' }}>
                              {hero.formattedRecessiveGenes?.stat?.r2?.statBoost2 || 'Unknown'}
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="statName">Active 1</div>
                          <div className="statValue" style={{ color: '#2196f3' }}>
                            {hero.formattedRecessiveGenes?.stat?.r2?.active1 || 'Unknown'}
                          </div>
                        </div>
                        <div className="row">
                          <div className="statName">Active 2</div>
                          <div className="statValue" style={{ color: '#2196f3' }}>
                            {hero.formattedRecessiveGenes?.stat?.r2?.active2 || 'Unknown'}
                          </div>
                        </div>
                        <div className="row">
                          <div className="statName">Passive 1</div>
                          <div className="statValue" style={{ color: '#9c27b0' }}>
                            {hero.formattedRecessiveGenes?.stat?.r2?.passive1 || 'Unknown'}
                          </div>
                        </div>
                        <div className="row">
                          <div className="statName">Passive 2</div>
                          <div className="statValue" style={{ color: '#9c27b0' }}>
                            {hero.formattedRecessiveGenes?.stat?.r2?.passive2 || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tab navigation */}
              <HeroCardTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
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
                  {!disableBuying && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card flip
                        handleBuy();
                      }}
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
                  )}
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="button"
                    title="DFK Adventures is offline"
                    disabled
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      opacity: 0.45,
                      filter: 'grayscale(1)',
                      cursor: 'not-allowed',
                    }}
                  >
                    ADFK
                  </button>
                </div>
              </div>
            ) : (
              <>{renderButtons()}</>
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
</style>;
