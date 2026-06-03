import { DFKHeroContract } from '../Web3Config';

// Memoize filter results for performance
const memoizedResults = new Map();

// Memoize quest status checks
const questStatusCache = new Map();

// Helper function to check quest status
export const checkQuestStatus = async (heroId) => {
  if (questStatusCache.has(heroId)) {
    return questStatusCache.get(heroId);
  }

  try {
    const heroState = await DFKHeroContract.methods.getHeroState(heroId).call();
    const isQuesting = heroState.currentQuest !== '0x0000000000000000000000000000000000000000';
    questStatusCache.set(heroId, isQuesting);
    return isQuesting;
  } catch (error) {
    console.error(`Error checking quest status for hero ${heroId}:`, error);
    return false;
  }
};

const applyHeroFilters = async (hero, filters) => {
  // Hide questing heroes filter
  if (filters.hideQuesting) {
    const isQuesting = await checkQuestStatus(hero.id);
    if (isQuesting) {
      return null;
    }
  }

  // Hero ID filter
  if (filters.heroId && filters.heroId.trim() !== '') {
    const searchTerm = filters.heroId.trim();

    // For single digit searches, require at least 2 digits
    if (searchTerm.length === 1) {
      return null;
    }

    // Ensure consistent string handling
    const heroFullId = String(hero.id || '').padStart(13, '0');

    // Get the last 6 digits which is the actual hero ID
    const baseHeroId = heroFullId.slice(-6);

    // Check if the search term appears in either the full ID or base ID
    const isMatch = heroFullId.includes(searchTerm) || baseHeroId.includes(searchTerm);
    if (!isMatch) {
      return null;
    }
  }

  // Class filter
  if (filters.class?.length > 0) {
    const heroClassRaw = hero.mainClass || hero.class || '';
    const heroClass = normalizeClassName(heroClassRaw);

    const matchesClass = filters.class.some(
      (filterClass) => normalizeClassName(filterClass) === heroClass
    );

    if (!matchesClass) return null;
  }

  // Subclass filter
  if (filters.subclass?.length > 0) {
    const heroSubClassRaw = hero.subClass || hero.subclass || '';
    const heroSubClass = normalizeClassName(heroSubClassRaw);

    const matchesSubClass = filters.subclass.some(
      (filterClass) => normalizeClassName(filterClass) === heroSubClass
    );

    if (!matchesSubClass) {
      return null;
    }
  }

  // Profession filter (gathering)
  if (filters.profession?.length > 0) {
    // Use the profession directly from the hero object
    const mainProfession = (hero.professionStr || hero.profession || '').toLowerCase();

    const matchesProfession = filters.profession.some(
      (prof) => prof.toLowerCase() === mainProfession
    );

    if (!matchesProfession) return null;
  }

  // Crafting profession 1 filter
  if (filters.crafting1?.length > 0) {
    const craftProf1 = (hero.craftProf1 || hero.crafting1 || '').toLowerCase();

    const matchesCrafting1 = filters.crafting1.some((prof) => prof.toLowerCase() === craftProf1);

    if (!matchesCrafting1) return null;
  }

  // Crafting profession 2 filter
  if (filters.crafting2?.length > 0) {
    const craftProf2 = (hero.craftProf2 || hero.crafting2 || '').toLowerCase();

    const matchesCrafting2 = filters.crafting2.some((prof) => prof.toLowerCase() === craftProf2);

    if (!matchesCrafting2) return null;
  }

  // Level range filter
  if (filters.levelRange || (filters.levelMin !== undefined && filters.levelMax !== undefined)) {
    // Get level range either from array or separate min/max values
    const [minLevel, maxLevel] = filters.levelRange || [filters.levelMin, filters.levelMax];

    // Try different possible level properties and convert to number
    const heroLevel = Number(
      hero.level ||
        hero.stats?.level ||
        hero.info?.level ||
        hero.attributes?.find((a) => a.trait_type === 'level')?.value ||
        '1'
    );

    if (Number(minLevel) > 0 && heroLevel < Number(minLevel)) {
      return null;
    }

    if (maxLevel && Number(maxLevel) > 0 && heroLevel > Number(maxLevel)) {
      return null;
    }
  }

  // Rarity filter
  if (filters.rarityMin !== undefined || filters.rarityMax !== undefined) {
    const rarityMap = {
      common: 0,
      uncommon: 1,
      rare: 2,
      legendary: 3,
      mythic: 4,
    };

    const heroRarityValue = rarityMap[(hero.rarity || '').toLowerCase()] || 0;
    const minRarity = filters.rarityMin !== undefined ? filters.rarityMin : 0;
    const maxRarity = filters.rarityMax !== undefined ? filters.rarityMax : 4;

    // Check if this is not the default range (0-4)
    const isDefaultRange = minRarity === 0 && maxRarity === 4;

    if (!isDefaultRange && (heroRarityValue < minRarity || heroRarityValue > maxRarity)) {
      return null;
    }
  }

  // Generation range filter
  if (filters.generationMin !== undefined || filters.generationMax !== undefined) {
    const heroGen = Number(hero.generation || 0);
    const minGen = filters.generationMin !== undefined ? filters.generationMin : 0;
    const maxGen = filters.generationMax !== undefined ? filters.generationMax : 11;

    // Check if this is not the default range (0-11)
    const isDefaultRange = minGen === 0 && maxGen === 11;

    if (!isDefaultRange && (heroGen < minGen || heroGen > maxGen)) {
      return null;
    }
  }

  // Summons remaining filter
  if (filters.summonsRemainingMin !== undefined || filters.summonsRemainingMax !== undefined) {
    const heroMaxSummons = Number(hero.maxSummons || 0);
    const usedSummons = Number(hero.summons || 0);
    const summonsRemaining = heroMaxSummons - usedSummons;

    const minSummons = filters.summonsRemainingMin !== undefined ? filters.summonsRemainingMin : 0;
    const maxSummons = filters.summonsRemainingMax !== undefined ? filters.summonsRemainingMax : 10;

    // Check if this is not the default range (0-10)
    const isDefaultRange = minSummons === 0 && maxSummons === 10;

    if (!isDefaultRange && (summonsRemaining < minSummons || summonsRemaining > maxSummons)) {
      return null;
    }
  }

  return hero;
};

export const applyFiltersAndSort = async (
  heroes,
  filters,
  sortOrder,
  isSellTab = false,
  listedHeroes = [],
  tavernHeroes = []
) => {
  if (!heroes || !Array.isArray(heroes)) return [];

  // Ensure filters is an object
  filters = filters || {};

  // Ensure arrays are arrays
  listedHeroes = Array.isArray(listedHeroes) ? listedHeroes : [];
  tavernHeroes = Array.isArray(tavernHeroes) ? tavernHeroes : [];

  // Disable caching for SellTab to prevent stale filter results
  let useCache = !isSellTab;

  if (useCache) {
    // Create a cache key based on the inputs (include all relevant data)
    const cacheKey = JSON.stringify({
      heroes: heroes.map((h) => h.id),
      filters,
      sortOrder,
      isSellTab,
      listedHeroes: listedHeroes.map((h) => h.heroId),
      tavernHeroes: tavernHeroes.map((h) => h.id),
    });

    if (memoizedResults.has(cacheKey)) {
      return memoizedResults.get(cacheKey);
    }
  }

  // Create Sets for quick lookup
  const listedHeroIds = new Set(listedHeroes.map((h) => h?.heroId).filter(Boolean));
  const tavernHeroIds = new Set(tavernHeroes.map((h) => h?.id).filter(Boolean));

  // Split heroes into listed, unlisted, and tavern
  const [listedHeroesArr, unlistedHeroesArr, tavernHeroesArr] = heroes.reduce(
    ([listed, unlisted, tavern], hero) => {
      if (!hero) return [listed, unlisted, tavern];

      // First check if it's a DFK hero
      if (hero.marketplace === 'dfk' || hero.isDFKTavernListing) {
        tavern.push(hero);
      }
      // Then check if it's listed on HONK
      else if (listedHeroIds.has(hero.id) && hero.isForSale) {
        const listingData = listedHeroes.find((h) => h.heroId === hero.id);
        if (listingData) {
          listed.push({
            ...hero,
            isForSale: true,
            price: listingData.price,
            owner: listingData.owner,
            marketplace: 'honk',
          });
        } else {
          unlisted.push(hero);
        }
      } else {
        unlisted.push(hero);
      }
      return [listed, unlisted, tavern];
    },
    [[], [], []]
  );

  // Apply filters to each array separately
  let filteredListedHeroes = await Promise.all(
    listedHeroesArr.map(async (hero) => {
      return applyHeroFilters(hero, filters);
    })
  );

  let filteredUnlistedHeroes = await Promise.all(
    unlistedHeroesArr.map(async (hero) => {
      return applyHeroFilters(hero, filters);
    })
  );

  let filteredTavernHeroes = await Promise.all(
    tavernHeroesArr.map(async (hero) => {
      return applyHeroFilters(hero, filters);
    })
  );

  // Filter out nulls (heroes that didn't pass filters)
  filteredListedHeroes = filteredListedHeroes.filter((hero) => hero !== null);
  filteredUnlistedHeroes = filteredUnlistedHeroes.filter((hero) => hero !== null);
  filteredTavernHeroes = filteredTavernHeroes.filter((hero) => hero !== null);

  // Apply sorting within each group
  const sortFunctions = {
    'price-asc': (a, b) => {
      const aPrice = BigInt(a.price || '0');
      const bPrice = BigInt(b.price || '0');
      return aPrice < bPrice ? -1 : aPrice > bPrice ? 1 : 0;
    },
    'price-desc': (a, b) => {
      const aPrice = BigInt(a.price || '0');
      const bPrice = BigInt(b.price || '0');
      return bPrice < aPrice ? -1 : bPrice > aPrice ? 1 : 0;
    },
    'level-asc': (a, b) => Number(a.level || 0) - Number(b.level || 0),
    'level-desc': (a, b) => Number(b.level || 0) - Number(a.level || 0),
    'id-asc': (a, b) => Number(a.id || 0) - Number(b.id || 0),
    'id-desc': (a, b) => Number(b.id || 0) - Number(a.id || 0),
    'generation-asc': (a, b) => Number(a.generation || 0) - Number(b.generation || 0),
    'generation-desc': (a, b) => Number(b.generation || 0) - Number(a.generation || 0),
    'rarity-asc': (a, b) => {
      const rarityMap = {
        common: 0,
        uncommon: 1,
        rare: 2,
        legendary: 3,
        mythic: 4,
      };
      const aRarity = rarityMap[(a.rarity || '').toLowerCase()] || 0;
      const bRarity = rarityMap[(b.rarity || '').toLowerCase()] || 0;
      return aRarity - bRarity;
    },
    'rarity-desc': (a, b) => {
      const rarityMap = {
        common: 0,
        uncommon: 1,
        rare: 2,
        legendary: 3,
        mythic: 4,
      };
      const aRarity = rarityMap[(a.rarity || '').toLowerCase()] || 0;
      const bRarity = rarityMap[(b.rarity || '').toLowerCase()] || 0;
      return bRarity - aRarity;
    },
  };

  const sortFn = sortFunctions[sortOrder] || sortFunctions['price-asc'];

  filteredListedHeroes.sort(sortFn);
  filteredUnlistedHeroes.sort(sortFn);
  filteredTavernHeroes.sort(sortFn);

  // Combine all heroes in the correct order
  const filteredHeroes = [
    ...filteredListedHeroes,
    ...filteredUnlistedHeroes,
    ...filteredTavernHeroes,
  ];

  // Cache and return the results (only if caching is enabled)
  if (useCache) {
    const cacheKey = JSON.stringify({
      heroes: heroes.map((h) => h.id),
      filters,
      sortOrder,
      isSellTab,
      listedHeroes: listedHeroes.map((h) => h.heroId),
      tavernHeroes: tavernHeroes.map((h) => h.id),
    });
    memoizedResults.set(cacheKey, filteredHeroes);
  }
  return filteredHeroes;
};

const normalizeClassName = (className) => {
  const classMap = {
    warrior: 'warrior',
    knight: 'knight',
    thief: 'thief',
    archer: 'archer',
    priest: 'priest',
    wizard: 'wizard',
    monk: 'monk',
    pirate: 'pirate',
    berserker: 'berserker',
    seer: 'seer',
    legionnaire: 'legionnaire',
    scholar: 'scholar',
    paladin: 'paladin',
    darkKnight: 'darkknight',
    summoner: 'summoner',
    ninja: 'ninja',
    shapeshifter: 'shapeshifter',
    dragoon: 'dragoon',
  };
  return classMap[className.toLowerCase()] || className.toLowerCase();
};

const rarityValues = {
  common: 0,
  uncommon: 1,
  rare: 2,
  legendary: 3,
  mythic: 4,
};
