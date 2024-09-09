const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const choices = {
  gender: { 1: 'male', 3: 'female' },
  background: {
    0: 'desert',
    2: 'forest',
    4: 'plains',
    6: 'island',
    8: 'swamp',
    10: 'mountains',
    12: 'city',
    14: 'arctic',
  },
  class: {
    0: 'warrior',
    1: 'knight',
    2: 'thief',
    3: 'archer',
    4: 'priest',
    5: 'wizard',
    6: 'monk',
    7: 'pirate',
    16: 'paladin',
    17: 'darkKnight',
    18: 'summoner',
    19: 'ninja',
    24: 'dragoon',
    25: 'sage',
    28: 'dreadKnight',
  },
  skinColor: {
    0: 'c58135',
    2: 'f1ca9e',
    4: '985e1c',
    6: '57340c',
    8: 'e6a861',
    10: '7b4a11',
    12: 'e5ac91',
    14: 'aa5c38',
  },
  hairColor: {
    0: 'ab9159',
    1: 'af3853',
    2: '578761',
    3: '068483',
    4: '48321e',
    5: '66489e',
    6: 'ca93a7',
    7: '62a7e6',
    16: 'd7bc65',
    17: '9b68ab',
    18: '8d6b3a',
    19: '566377',
    24: '880016',
    25: '353132',
    28: '8f9bb3',
  },
  eyeColor: {
    0: '203997',
    2: '896693',
    4: 'bb3f55',
    6: '0d7634',
    8: '8d7136',
    10: '613d8a',
    12: '2494a2',
    14: 'a41e12',
  },
  appendageColor: {
    0: 'c5bfa7',
    1: 'a88b47',
    2: '58381e',
    3: '566f7d',
    4: '2a386d',
    5: '3f2e40',
    6: '830e18',
    7: '6f3a3c',
    16: '6b173c',
    17: 'a0304d',
    18: '78547c',
    19: '352a51',
    24: 'c29d35',
    25: '211f1f',
    28: 'd7d7d7',
  },
  backAppendageColor: {
    0: 'c5bfa7',
    1: 'a88b47',
    2: '58381e',
    3: '566f7d',
    4: '2a386d',
    5: '3f2e40',
    6: '830e18',
    7: '6f3a3c',
    16: '6b173c',
    17: 'a0304d',
    18: '78547c',
    19: '352a51',
    24: 'c29d35',
    25: '211f1f',
    28: 'd7d7d7',
  },
  hairStyle: {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    16: 16,
    17: 17,
    18: 18,
    19: 19,
    24: 24,
    25: 25,
    28: 28,
  },
  backAppendage: {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    16: 16,
    17: 17,
    18: 18,
    19: 19,
    24: 24,
    25: 25,
    28: 28,
  },
  headAppendage: {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    16: 16,
    17: 17,
    18: 18,
    19: 19,
    24: 24,
    25: 25,
    28: 28,
  },
  subClass: {
    0: 'warrior',
    1: 'knight',
    2: 'thief',
    3: 'archer',
    4: 'priest',
    5: 'wizard',
    6: 'monk',
    7: 'pirate',
    16: 'paladin',
    17: 'darkKnight',
    18: 'summoner',
    19: 'ninja',
    24: 'dragoon',
    25: 'sage',
    28: 'dreadKnight',
  },
  profession: {
    0: 'mining',
    2: 'gardening',
    4: 'fishing',
    6: 'foraging',
  },
  craftingProfession: {
    0: 'blacksmithing',
    2: 'goldsmithing',
    4: 'armorsmithing',
    6: 'woodworking',
    8: 'leatherworking',
    10: 'tailoring',
    12: 'enchanting',
    14: 'alchemy',
  },
  passive1: {
    0: 'Basic1',
    1: 'Basic2',
    2: 'Basic3',
    3: 'Basic4',
    4: 'Basic5',
    5: 'Basic6',
    6: 'Basic7',
    7: 'Basic8',
    16: 'Advanced1',
    17: 'Advanced2',
    18: 'Advanced3',
    19: 'Advanced4',
    24: 'Elite1',
    25: 'Elite2',
    28: 'Transcendent1',
  },
  passive2: {
    0: 'Basic1',
    1: 'Basic2',
    2: 'Basic3',
    3: 'Basic4',
    4: 'Basic5',
    5: 'Basic6',
    6: 'Basic7',
    7: 'Basic8',
    16: 'Advanced1',
    17: 'Advanced2',
    18: 'Advanced3',
    19: 'Advanced4',
    24: 'Elite1',
    25: 'Elite2',
    28: 'Transcendent1',
  },
  active1: {
    0: 'Basic1',
    1: 'Basic2',
    2: 'Basic3',
    3: 'Basic4',
    4: 'Basic5',
    5: 'Basic6',
    6: 'Basic7',
    7: 'Basic8',
    16: 'Advanced1',
    17: 'Advanced2',
    18: 'Advanced3',
    19: 'Advanced4',
    24: 'Elite1',
    25: 'Elite2',
    28: 'Transcendent1',
  },
  active2: {
    0: 'Basic1',
    1: 'Basic2',
    2: 'Basic3',
    3: 'Basic4',
    4: 'Basic5',
    5: 'Basic6',
    6: 'Basic7',
    7: 'Basic8',
    16: 'Advanced1',
    17: 'Advanced2',
    18: 'Advanced3',
    19: 'Advanced4',
    24: 'Elite1',
    25: 'Elite2',
    28: 'Transcendent1',
  },
  statBoost1: {
    0: 'STR',
    2: 'AGI',
    4: 'INT',
    6: 'WIS',
    8: 'LCK',
    10: 'VIT',
    12: 'END',
    14: 'DEX',
  },
  statBoost2: {
    0: 'STR',
    2: 'AGI',
    4: 'INT',
    6: 'WIS',
    8: 'LCK',
    10: 'VIT',
    12: 'END',
    14: 'DEX',
  },
  element: {
    0: 'fire',
    2: 'water',
    4: 'earth',
    6: 'wind',
    8: 'lightning',
    10: 'ice',
    12: 'light',
    14: 'dark',
  },
  visualUnknown1: {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    16: 16,
    17: 17,
    18: 18,
    19: 19,
    24: 24,
    25: 25,
    28: 28,
  },
  visualUnknown2: {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    16: 16,
    17: 17,
    18: 18,
    19: 19,
    24: 24,
    25: 25,
    28: 28,
  },
  statsUnknown1: {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    16: 16,
    17: 17,
    18: 18,
    19: 19,
    24: 24,
    25: 25,
    28: 28,
  },
  statsUnknown2: {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    16: 16,
    17: 17,
    18: 18,
    19: 19,
    24: 24,
    25: 25,
    28: 28,
  },
};

// Map for visual genes
export const visualGenesMap = {
  0: 'gender',
  1: 'headAppendage',
  2: 'backAppendage',
  3: 'background',
  4: 'hairStyle',
  5: 'hairColor',
  6: 'visualUnknown1',
  7: 'eyeColor',
  8: 'skinColor',
  9: 'appendageColor',
  10: 'backAppendageColor',
  11: 'visualUnknown2',
};

// Map for stats genes
export const statsGenesMap = {
  0: 'class',
  1: 'subClass',
  2: 'profession',
  3: 'passive1',
  4: 'passive2',
  5: 'active1',
  6: 'active2',
  7: 'statBoost1',
  8: 'statBoost2',
  9: 'statsUnknown1',
  10: 'element',
  11: 'statsUnknown2',
};

// Map for crafting professions
export const craftingProfessionsMap = {
  0: 'crafting1',
  1: 'crafting2',
};

// Convert kai value to decimal
function kai2dec(kai) {
  const ALPHABET = '123456789abcdefghijkmnopqrstuvwx';
  return ALPHABET.indexOf(kai);
}

// Convert genes to kai
function genesToKai(genes) {
  const ALPHABET = '123456789abcdefghijkmnopqrstuvwx';
  const BASE = BigInt(ALPHABET.length);

  let buf = '';
  while (genes >= BASE) {
    const mod = genes % BASE;
    buf = ALPHABET[Number(mod)] + buf;
    genes = (genes - mod) / BASE;
  }

  // Add the last 4 (finally).
  buf = ALPHABET[Number(genes)] + buf;

  // Pad with leading 0s.
  buf = buf.padStart(48, '1');

  return buf.replace(/(.{4})/g, '$1 ');
}

// Convert genes based on map
export function convertGenes(_genes, genesMap) {
  // First, convert the genes to kai.
  const rawKai = genesToKai(BigInt(_genes.toString())).split(' ').join('');

  const genes = {};

  // Remove spaces, and get every 4th character.
  for (const k in rawKai.split('')) {
    if (rawKai.hasOwnProperty(k)) {
      const trait = genesMap[Math.floor(Number(k) / 4)];

      const kai = rawKai[k];
      const valueNum = kai2dec(kai);

      genes[trait] = choices[trait][valueNum];
    }
  }

  return genes;
}

// Calculate required XP
export const calculateRequiredXp = (level) => {
  let xpNeeded;
  const nextLevel = level + 1;
  switch (true) {
    case level < 6:
      xpNeeded = nextLevel * 1000;
      break;
    case level < 9:
      xpNeeded = 4000 + (nextLevel - 5) * 2000;
      break;
    case level < 16:
      xpNeeded = 12000 + (nextLevel - 9) * 4000;
      break;
    case level < 36:
      xpNeeded = 40000 + (nextLevel - 16) * 5000;
      break;
    case level < 56:
      xpNeeded = 140000 + (nextLevel - 36) * 7500;
      break;
    case level >= 56:
      xpNeeded = 290000 + (nextLevel - 56) * 10000;
      break;
    default:
      xpNeeded = 0;
      break;
  }

  return xpNeeded;
};

// Constants for rarity levels
export const RARITY_COMMON = 'common';
export const RARITY_UNCOMMON = 'uncommon';
export const RARITY_RARE = 'rare';
export const RARITY_LEGENDARY = 'legendary';
export const RARITY_MYTHIC = 'mythic';
export const RARITY_COLORS = {
  [RARITY_COMMON]: '#FFFFFF',
  [RARITY_UNCOMMON]: '#14C25A',
  [RARITY_RARE]: '#21CCFF',
  [RARITY_LEGENDARY]: '#ffa32d',
  [RARITY_MYTHIC]: '#df5bff',
};
export const RARITY_LEVELS = [
  RARITY_COMMON,
  RARITY_UNCOMMON,
  RARITY_RARE,
  RARITY_LEGENDARY,
  RARITY_MYTHIC,
];

// Calculate current auction price
export const calculateCurrentAuctionPrice = (startingPrice, endingPrice, startedAt, duration) => {
  if (startingPrice === endingPrice) {
    return startingPrice;
  } else {
    const currentTime = DateTime.fromJSDate(new Date());
    const auctionStartedAt = DateTime.fromJSDate(new Date(startedAt * 1000));

    const diffInSeconds = auctionStartedAt.diff(currentTime, ['seconds']);
    const finalDiff = diffInSeconds.toObject().seconds;
    let percentTimeElapsed = 1;

    // If duration hasn't passed, calculate elapsed time percentage.
    if (finalDiff && finalDiff < 0) {
      percentTimeElapsed = Number(finalDiff) / Number(duration);
    }

    // Calculate price from percentage of elpased time.
    const priceDiff = startingPrice - endingPrice;
    const priceCut = -percentTimeElapsed * priceDiff;
    const currentPrice = startingPrice - priceCut;

    let finalPrice = currentPrice;
    if (
      (startingPrice > endingPrice && currentPrice < endingPrice) ||
      (startingPrice < endingPrice && currentPrice > endingPrice)
    ) {
      finalPrice = endingPrice;
    }

    // Round to 1 decimal.
    const currentPriceFormatted = (Math.round(finalPrice * 100) / 100).toFixed(1);
    return Number(currentPriceFormatted);
  }
};

/**
 * Returns a hero object the way the game likes it.
 */
export default function buildHero(heroRaw, owner) {
  const visualGenes = convertGenes(heroRaw.info.visualGenes, visualGenesMap);
  const statGenes = convertGenes(heroRaw.info.statGenes, statsGenesMap);
  const craftingProfessions = convertGenes(heroRaw.professions, craftingProfessionsMap);

  if (!owner) {
    owner = {
      id: '',
      name: 'N/A',
      picId: null,
    };
  }

  if (typeof heroRaw.id == 'string') {
    heroRaw.id = BigInt(heroRaw.id);
    heroRaw.state.xp = BigInt(heroRaw.state.xp);
    heroRaw.state.staminaFullAt = BigInt(heroRaw.state.staminaFullAt);
    heroRaw.summoningInfo.summonedTime = BigInt(heroRaw.summoningInfo.summonedTime);
    heroRaw.summoningInfo.nextSummonTime = BigInt(heroRaw.summoningInfo.nextSummonTime);
    heroRaw.info.rarity = RARITY_LEVELS.indexOf(heroRaw.info.rarity.toLowerCase());
  }

  return {
    owner: {
      name: owner.name ? owner.name : owner._name,
      owner: owner.owner ? owner.owner : owner._owner ? owner._owner : owner.id,
    },
    background: visualGenes.background,
    class: statGenes.class || statGenes.mainClass,
    subClass: statGenes.subClass,
    classType: 'basic',
    element: statGenes.element,
    gender: visualGenes.gender,
    generation: heroRaw.info.generation,
    id: heroRaw.id,
    heroId: heroRaw.id,
    summonerId: heroRaw.summoningInfo.summonerId,
    assistantId: heroRaw.summoningInfo.assistantId,
    currentQuest: heroRaw.state.currentQuest,
    isQuesting: heroRaw.state.currentQuest !== ZERO_ADDRESS,
    level: heroRaw.state.level,
    xp: Number(heroRaw.state.xp),
    firstName: getFirstName(visualGenes.gender, heroRaw.firstName),
    lastName: getLastName(heroRaw.lastName),
    name: getFullName(visualGenes.gender, heroRaw.info.firstName, heroRaw.info.lastName),
    rarity: RARITY_LEVELS[heroRaw.info.rarity],
    rarityNum: heroRaw.info.rarity,
    shiny: heroRaw.info.shiny,
    shinyStyle: heroRaw.info.shiny ? heroRaw.info.shinyStyle : 0,
    currentStamina: heroRaw.stats.stamina,
    staminaFullAt: DateTime.fromSeconds(Number(heroRaw.state.staminaFullAt)),
    summonedDate: DateTime.fromSeconds(Number(heroRaw.summoningInfo.summonedTime)),
    nextSummonTime: DateTime.fromSeconds(Number(heroRaw.summoningInfo.nextSummonTime)),
    summons: heroRaw.summoningInfo.summons,
    maxSummons: heroRaw.summoningInfo.maxSummons,
    summonsRemaining:
      heroRaw.summoningInfo.maxSummons < 11
        ? heroRaw.summoningInfo.maxSummons - heroRaw.summoningInfo.summons
        : 11,
    price: heroRaw.salePrice ? parseFloat(ethers.utils.formatEther(heroRaw.salePrice)) : 0,
    summoningPrice: heroRaw.summoningPrice
      ? parseFloat(ethers.utils.formatEther(heroRaw.summoningPrice))
      : 0,
    pjstatus: null,
    pjlevel: null,
    winner: heroRaw.winner ? heroRaw.winner : null,
    auction: {
      onAuction: heroRaw.startingPrice !== heroRaw.endingPrice ? true : false,
      startingPrice: heroRaw.startingPrice
        ? parseFloat(ethers.utils.formatEther(heroRaw.startingPrice))
        : 0,
      endingPrice: heroRaw.endingPrice
        ? parseFloat(ethers.utils.formatEther(heroRaw.endingPrice))
        : 0,
      startedAt: heroRaw.startedAt,
      duration: heroRaw.duration,
    },
    stats: {
      strength: heroRaw.stats.strength,
      intelligence: heroRaw.stats.intelligence,
      wisdom: heroRaw.stats.wisdom,
      luck: heroRaw.stats.luck,
      agility: heroRaw.stats.agility,
      vitality: heroRaw.stats.vitality,
      endurance: heroRaw.stats.endurance,
      dexterity: heroRaw.stats.dexterity,
      hp: heroRaw.stats.hp,
      mp: heroRaw.stats.mp,
      stamina: heroRaw.stats.stamina,
    },
    visualGenes: visualGenes,
    visual: {
      ...visualGenes,
      shiny: heroRaw.info.shiny,
      shinyStyle: heroRaw.info.shiny ? heroRaw.info.shinyStyle : 0,
    },
    statGrowth: {
      primary: {
        strength: heroRaw.primaryStatGrowth.strength,
        intelligence: heroRaw.primaryStatGrowth.intelligence,
        wisdom: heroRaw.primaryStatGrowth.wisdom,
        luck: heroRaw.primaryStatGrowth.luck,
        agility: heroRaw.primaryStatGrowth.agility,
        vitality: heroRaw.primaryStatGrowth.vitality,
        endurance: heroRaw.primaryStatGrowth.endurance,
        dexterity: heroRaw.primaryStatGrowth.dexterity,
      },
      secondary: {
        strength: heroRaw.secondaryStatGrowth.strength,
        intelligence: heroRaw.secondaryStatGrowth.intelligence,
        wisdom: heroRaw.secondaryStatGrowth.wisdom,
        luck: heroRaw.secondaryStatGrowth.luck,
        agility: heroRaw.secondaryStatGrowth.agility,
        vitality: heroRaw.secondaryStatGrowth.vitality,
        endurance: heroRaw.secondaryStatGrowth.endurance,
        dexterity: heroRaw.secondaryStatGrowth.dexterity,
      },
    },
    statGenes: statGenes,
    skills: {
      mining: heroRaw.professions.mining / 10,
      gardening: heroRaw.professions.gardening / 10,
      fishing: heroRaw.professions.fishing / 10,
      foraging: heroRaw.professions.foraging / 10,
      crafting1: craftingProfessions.crafting1,
      crafting2: craftingProfessions.crafting2,
    },
  };
}

/**
 * Returns a hero object the way the game likes it from the graph.
 */
export function buildGraphHero(heroRaw, owner) {
  const visualGenes = convertGenes(heroRaw.visualGenes, visualGenesMap);
  const statGenes = convertGenes(heroRaw.statGenes, statsGenesMap);
  const craftingProfessions = convertGenes(heroRaw.professions, craftingProfessionsMap);

  if (!owner) {
    owner = {
      id: '',
      name: 'N/A',
      picId: null,
    };
  }

  if (typeof heroRaw.id == 'string') {
    heroRaw.id = BigInt(heroRaw.id);
    heroRaw.xp = BigInt(heroRaw.xp);
    heroRaw.staminaFullAt = BigInt(heroRaw.staminaFullAt);
    heroRaw.summonedTime = BigInt(heroRaw.summonedTime);
    heroRaw.nextSummonTime = BigInt(heroRaw.nextSummonTime);
  }

  return {
    ownerName: owner.name ? owner.name : owner._name,
    ownerHash: owner.owner ? owner.owner : owner._owner ? owner._owner : owner.id,
    ownerPortrait: owner.picId ? owner.picId : owner._picId,
    background: visualGenes.background,
    class: statGenes.class || statGenes.mainClass,
    subClass: statGenes.subClass,
    classType: 'basic',
    element: statGenes.element,
    gender: visualGenes.gender,
    generation: heroRaw.generation,
    id: Number(heroRaw.id),
    heroId: Number(heroRaw.id),
    summonerId: heroRaw.summonerId,
    assistantId: heroRaw.assistantId,
    currentQuest: heroRaw.currentQuest,
    isQuesting: heroRaw.currentQuest !== ZERO_ADDRESS,
    xp: Number(heroRaw.xp),
    level: heroRaw.level,
    firstName: getFirstName(visualGenes.gender, heroRaw.firstName),
    lastName: getLastName(heroRaw.lastName),
    name: getFullName(visualGenes.gender, heroRaw.firstName, heroRaw.lastName),
    rarity: RARITY_LEVELS[heroRaw.rarity],
    rarityNum: heroRaw.rarity,
    shiny: heroRaw.shiny,
    shinyStyle: heroRaw.shiny ? heroRaw.shinyStyle : 0,
    staminaFullAt: DateTime.fromSeconds(Number(heroRaw.staminaFullAt)),
    summonedDate: DateTime.fromSeconds(Number(heroRaw.summonedTime)),
    nextSummonTime: DateTime.fromSeconds(Number(heroRaw.nextSummonTime)),
    summons: heroRaw.summons,
    maxSummons: heroRaw.maxSummons,
    summonsRemaining: heroRaw.maxSummons < 11 ? heroRaw.maxSummons - heroRaw.summons : 11,
    price: heroRaw.salePrice ? parseFloat(ethers.utils.formatEther(heroRaw.salePrice)) : 0,
    summoningPrice: heroRaw.summoningPrice
      ? parseFloat(ethers.utils.formatEther(heroRaw.summoningPrice))
      : 0,
    winner: heroRaw.winner ? heroRaw.winner : null,
    stats: {
      strength: heroRaw.strength,
      intelligence: heroRaw.intelligence,
      wisdom: heroRaw.wisdom,
      luck: heroRaw.luck,
      agility: heroRaw.agility,
      vitality: heroRaw.vitality,
      endurance: heroRaw.endurance,
      dexterity: heroRaw.dexterity,
      hp: heroRaw.hp,
      mp: heroRaw.mp,
      stamina: heroRaw.stamina,
    },
    visualGenes: visualGenes,
    visual: {
      ...visualGenes,
      shiny: heroRaw.shiny,
      shinyStyle: heroRaw.shiny ? heroRaw.shinyStyle : 0,
    },
    statGenes: statGenes,
    skills: {
      mining: heroRaw.mining / 10,
      gardening: heroRaw.gardening / 10,
      fishing: heroRaw.fishing / 10,
      foraging: heroRaw.foraging / 10,
      crafting1: craftingProfessions.crafting1,
      crafting2: craftingProfessions.crafting2,
    },
  };
}

export function buildLineageHero(hero = {}) {
  const statGenes = convertGenes(hero.statGenes, statsGenesMap);
  const craftingProfessions = convertGenes(hero.professions, craftingProfessionsMap);
  return {
    ...hero,
    rarity: RARITY_LEVELS[hero.rarity],
    rarityNum: hero.rarity,
    rarityColor: RARITY_COLORS[RARITY_LEVELS[hero.rarity]],
    class: statGenes.class || statGenes.mainClass,
    visualGenes: convertGenes(hero.visualGenes, visualGenesMap),
    statGenes,
    skills: {
      ...hero.skills,
      crafting1: craftingProfessions.crafting1,
      crafting2: craftingProfessions.crafting2,
    },
  };
}
