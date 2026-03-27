import maleFirstNames from '../data/maleFirstNames.json';
import femaleFirstNames from '../data/femaleFirstNames.json';
import lastNames from '../data/lastNames.json';
import { web3, DFKHeroContract } from '../Web3Config';
import { enhanceHeroWithGeneData, parseStatGenes, parseVisualGenes } from './heroGeneParser';
import { CONTRACT_ONLY_MODE } from '../constants';

// Mapping for crafting professions based on passive genes
const craftingProfessionMapping = {
  0: 'Blacksmithing',
  2: 'Goldsmithing',
  4: 'Armorsmithing',
  6: 'Woodworking',
  8: 'Leatherworking',
  10: 'Tailoring',
  12: 'Enchanting',
  14: 'Alchemy',
  none: 'none',
};

export const classMapping = {
  0: 'Warrior',
  1: 'Knight',
  2: 'Thief',
  3: 'Archer',
  4: 'Priest',
  5: 'Wizard',
  6: 'Monk',
  7: 'Pirate',
  8: 'Berserker',
  9: 'Seer',
  10: 'Legionnaire',
  11: 'Scholar',
  16: 'Paladin',
  17: 'DarkKnight',
  18: 'Summoner',
  19: 'Ninja',
  20: 'Shapeshifter',
  21: 'Bard',
  24: 'Dragoon',
  25: 'Sage',
  26: 'SpellBow',
  28: 'DreadKnight',
};

export const rarityMapping = {
  0: 'Common',
  1: 'Uncommon',
  2: 'Rare',
  3: 'Legendary',
  4: 'Mythic',
};

// Profession mapping for hero professions
export const professionMapping = {
  0: 'mining',
  2: 'gardening',
  4: 'fishing',
  6: 'foraging',
};

export const elementMapping = {
  0: 'fire',
  2: 'water',
  4: 'earth',
  6: 'wind',
  8: 'lightning',
  10: 'ice',
  12: 'light',
  14: 'dark',
};

export const backgroundMapping = {
  0: 'desert',
  2: 'forest',
  4: 'plains',
  6: 'island',
  8: 'swamp',
  10: 'mountains',
  12: 'city',
  14: 'arctic',
};

export const statsMapping = {
  0: 'STR',
  2: 'AGI',
  4: 'INT',
  6: 'WIS',
  8: 'LCK',
  10: 'VIT',
  12: 'END',
  14: 'DEX',
};

// Active/Passive ability mapping - these map to Basic1, Basic2, etc.
export const abilityMapping = {
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
  28: 'Exalted1',
};

// Specific ability names for reference
export const activeAbilityMapping = {
  0: 'Poisoned Blade (Basic1)', // Basic 1
  1: 'Blinding Winds (Basic2)', // Basic 2
  2: 'Heal (Basic3)', // Basic 3
  3: 'Cleanse (Basic4)', // Basic 4
  4: 'Iron Skin (Basic5)', // Basic 5
  5: 'Critical Aim (Basic6)', // Basic 6
  6: 'Speed (Basic7)', // Basic 7
  7: 'Deathmark (Basic8)', // Basic 8
  16: 'Exhaust (Advanced1)', // Advanced 1
  17: 'Daze (Advanced2)', // Advanced 2
  18: 'Explosion (Advanced3)', // Advanced 3
  19: 'Hardened Shield (Advanced4)', // Advanced 4
  24: 'Stun (Elite1)', // Elite 1
  25: 'Second Wind (Elite2)', // Elite 2
  28: 'Resurrection (Exalted1)', // Exalted 1
};

// Passive ability mappings
export const passiveAbilityMapping = {
  0: 'Duelist (Basic1)', // Basic 1
  1: 'Clutch (Basic2)', // Basic 2
  2: 'Foresight (Basic3)', // Basic 3
  3: 'Headstrong (Basic4)', // Basic 4
  4: 'Clear Vision (Basic5)', // Basic 5
  5: 'Fearless (Basic6)', // Basic 6
  6: 'Chatterbox (Basic7)', // Basic 7
  7: 'Stalwart (Basic8)', // Basic 8
  16: 'Leadership (Advanced1)', // Advanced 1
  17: 'Efficient (Advanced2)', // Advanced 2
  18: 'Menacing (Advanced3)', // Advanced 3
  19: 'Toxic (Advanced4)', // Advanced 4
  24: 'Giant Slayer (Elite1)', // Elite 1
  25: 'Last Stand (Elite2)', // Elite 2
  28: 'Second Life (Exalted1)', // Exalted 1
};

export const gatheringProfessionMapping = {
  0: 'mining',
  2: 'gardening',
  4: 'fishing',
  6: 'foraging',
  none: 'none',
};

const RETRY_DELAY = 1000; // 1 second delay between retries
const MAX_RETRIES = 3;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Rate limiter for API calls
class RateLimiter {
  constructor(maxRequests = 10, timeWindow = 1000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }

  async acquire() {
    const now = Date.now();
    this.requests = this.requests.filter((time) => time > now - this.timeWindow);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = oldestRequest + this.timeWindow - now;
      await sleep(waitTime);
      return this.acquire();
    }

    this.requests.push(now);
  }
}

const apiRateLimiter = new RateLimiter(10, 1000); // 10 requests per second

// Batch processor for parallel requests
const batchProcessor = async (requests, batchSize = 5) => {
  const results = [];
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }
  return results;
};

// eslint-disable-next-line no-unused-vars
const HERO_FIELDS = `
  id
  network
  mainClass
  subClass
  profession
  generation
  rarity
  level
  statGenes
  visualGenes
  summons
  maxSummons
  hp
  mp
  stamina
  strength
  agility
  intelligence
  wisdom
  luck
  dexterity
  vitality
  endurance
  xp
  mining
  gardening
  foraging
  fishing
`;

// Network-specific GraphQL API endpoints
const getGraphQLEndpoint = async () => {
  if (!web3) {
    return 'https://api.defikingdoms.com/graphql'; // Default to mainnet
  }

  try {
    const chainId = await web3.eth.getChainId();
    const chainIdNumber = typeof chainId === 'bigint' ? Number(chainId) : chainId;

    switch (chainIdNumber) {
      case 335: // DFK Testnet
        return 'https://testnet.api.defikingdoms.com/graphql';
      case 53935: // DFK Mainnet
      default:
        return 'https://api.defikingdoms.com/graphql';
    }
  } catch (error) {
    console.warn('Could not determine network, using mainnet GraphQL API');
    return 'https://api.defikingdoms.com/graphql';
  }
};

// ---------------------------------------------------------------------------
// Contract-only hero fetching (used when CONTRACT_ONLY_MODE is true)
// ---------------------------------------------------------------------------

const getGenderFromGenes = (visualGenes) => {
  try {
    const parsed = parseVisualGenes(visualGenes);
    // Gene value 1 = Male, 3 = Female (all other values default to male)
    return parsed?.gender === 3 ? 'female' : 'male';
  } catch (error) {
    return 'unknown';
  }
};

export const getNameFromIndex = (index, nameList) => {
  if (typeof index !== 'number' || !nameList || !nameList.length) {
    return 'Unknown';
  }
  return nameList[index % nameList.length] || 'Unknown';
};

const CONTRACT_BATCH_SIZE = 300; // max IDs per getHeroesV3 call

/**
 * Fetch and shape hero data for an array of IDs using on-chain getHeroesV3.
 * Returns heroes in the same normalised shape the GraphQL path produces.
 */
const fetchHeroesFromContract = async (heroIds, ownerAddress = '') => {
  if (!heroIds || heroIds.length === 0) return [];

  const contract = DFKHeroContract;
  if (!contract) throw new Error('DFKHeroContract is not initialised');

  // Split into batches of CONTRACT_BATCH_SIZE
  const batches = [];
  for (let i = 0; i < heroIds.length; i += CONTRACT_BATCH_SIZE) {
    batches.push(heroIds.slice(i, i + CONTRACT_BATCH_SIZE));
  }

  const batchResults = await Promise.all(
    batches.map((batch) =>
      contract.methods
        .getHeroesV3(batch.map((id) => id.toString()))
        .call()
        .catch((err) => {
          console.error('[CONTRACT] getHeroesV3 batch failed:', err);
          return [];
        })
    )
  );

  const rawHeroes = batchResults.flat();

  return rawHeroes.map((raw) => shapeContractHero(raw, ownerAddress));
};

/**
 * Map a raw HeroV3 struct (as returned by web3.js) into the normalised hero
 * object shape the rest of the app expects (same keys the GraphQL path outputs).
 */
const shapeContractHero = (raw, ownerAddress = '') => {
  const id = raw.id?.toString() || '0';

  // --- sub-structs ---
  const info = raw.info || {};
  const state = raw.state || {};
  const stats = raw.stats || {};
  const summoningInfo = raw.summoningInfo || {};
  const primaryStatGrowth = raw.primaryStatGrowth || {};
  const secondaryStatGrowth = raw.secondaryStatGrowth || {};
  const professions = raw.professions || {};

  // statGenes / visualGenes come back as BigInt from web3.js — convert to string
  const statGenes = info.statGenes?.toString() || '0';
  const visualGenes = info.visualGenes?.toString() || '0';

  // gender from visualGenes bit 0 (0 = female, 1 = male)
  const gender = getGenderFromGenes(visualGenes);

  // names come back as uint32 indices from the contract
  const nameList = gender === 'female' ? femaleFirstNames : maleFirstNames;
  const firstNameIdx = parseInt(info.firstName) || 0;
  const lastNameIdx = parseInt(info.lastName) || 0;
  const firstName = getNameFromIndex(firstNameIdx, nameList);
  const lastName = getNameFromIndex(lastNameIdx, lastNames);

  // class / rarity / element / background
  const mainClassNum = parseInt(info.class) || 0;
  const subClassNum = parseInt(info.subClass) || 0;
  const mainClass = classMapping[mainClassNum] || 'Unknown';
  const subClass = classMapping[subClassNum] || 'Unknown';
  const rarity = rarityMapping[parseInt(info.rarity)] || 'Common';

  // Parse stat genes now so we can populate all gene-derived flat fields before
  // calling enhanceHeroWithGeneData (which reads those flat fields to build its sub-objects).
  const parsedGenes = parseStatGenes(statGenes);
  const parsedVisualGenes = parseVisualGenes(visualGenes);

  // element is encoded in stat genes (kai slot 10)
  const element = parsedGenes ? (elementMapping[parsedGenes.element] || 'unknown') : 'unknown';
  // background is visual gene trait 3
  const background = parsedVisualGenes
    ? (backgroundMapping[parsedVisualGenes.background] || 'plains')
    : 'plains';

  // Gathering profession from stat genes
  const profession = parsedGenes ? (professionMapping[parsedGenes.profession] || 'none') : 'none';

  // Stat boosts from stat genes
  const statBoost1 = parsedGenes ? (statsMapping[parsedGenes.statBoost1] || 'None') : 'None';
  const statBoost2 = parsedGenes ? (statsMapping[parsedGenes.statBoost2] || 'None') : 'None';

  // Ability indices from stat genes (enhanceHeroWithGeneData reads these as numbers)
  const passive1 = parsedGenes ? (parsedGenes.passive1 || 0) : 0;
  const passive2 = parsedGenes ? (parsedGenes.passive2 || 0) : 0;
  const active1 = parsedGenes ? (parsedGenes.active1 || 0) : 0;
  const active2 = parsedGenes ? (parsedGenes.active2 || 0) : 0;

  // Profession skill values from the contract's professions struct (these are skill ranks, always 0 for most heroes)
  const miningRaw = parseInt(professions.mining) || 0;
  const gardeningRaw = parseInt(professions.gardening) || 0;
  const foragingRaw = parseInt(professions.foraging) || 0;
  const fishingRaw = parseInt(professions.fishing) || 0;

  // Crafting profession names come from stat genes (crafting1/crafting2 kai slots), NOT professions.craft*
  const craftProf1Name = parsedGenes ? (craftingProfessionMapping[parsedGenes.crafting1] || 'none') : 'none';
  const craftProf2Name = parsedGenes ? (craftingProfessionMapping[parsedGenes.crafting2] || 'none') : 'none';
  const formatCraft = (p) => (p === 'none' ? p : p.charAt(0).toUpperCase() + p.slice(1));

  // Growth stats — contract stores them as percentage × 10 (i.e. 1000 = 100%)
  // The gene parser re-derives these from statGenes, but we populate the raw
  // fields so the enhancer has them if needed.
  const toGrowthPct = (v) => ((parseInt(v) || 0) / 10).toFixed(1);

  const imageUrl = `https://heroes.defikingdoms.com/image/${id}`;

  const shaped = {
    id,
    fullId: id,
    displayId: id,
    shortId: id,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    gender,
    mainClass,
    subClass,
    mainClassStr: mainClass,
    subClassStr: subClass,
    rarity,
    element,
    background,
    image: imageUrl,
    statGenes,
    visualGenes,
    // state
    level: parseInt(state.level) || 0,
    xp: parseInt(state.xp) || 0,
    staminaFullAt: parseInt(state.staminaFullAt) || 0,
    hpFullAt: parseInt(state.hpFullAt) || 0,
    mpFullAt: parseInt(state.mpFullAt) || 0,
    sp: parseInt(state.sp) || 0,
    status: parseInt(state.status) || 0,
    currentQuest: state.currentQuest || '0x0000000000000000000000000000000000000000',
    // summoning
    summons: parseInt(summoningInfo.summons) || 0,
    maxSummons: parseInt(summoningInfo.maxSummons) || 0,
    summonsRemaining: Math.max(
      0,
      (parseInt(summoningInfo.maxSummons) || 0) - (parseInt(summoningInfo.summons) || 0)
    ),
    summonedTime: parseInt(summoningInfo.summonedTime) || 0,
    nextSummonTime: parseInt(summoningInfo.nextSummonTime) || 0,
    summonsDisplay: `${parseInt(summoningInfo.summons) || 0}/${parseInt(summoningInfo.maxSummons) || 0}`,
    // stats
    hp: parseInt(stats.hp) || 0,
    mp: parseInt(stats.mp) || 0,
    stamina: parseInt(stats.stamina) || 0,
    strength: parseInt(stats.strength) || 0,
    agility: parseInt(stats.agility) || 0,
    intelligence: parseInt(stats.intelligence) || 0,
    wisdom: parseInt(stats.wisdom) || 0,
    luck: parseInt(stats.luck) || 0,
    dexterity: parseInt(stats.dexterity) || 0,
    vitality: parseInt(stats.vitality) || 0,
    endurance: parseInt(stats.endurance) || 0,
    // professions (raw values)
    mining: miningRaw,
    gardening: gardeningRaw,
    foraging: foragingRaw,
    fishing: fishingRaw,
    // growth (raw percentage fields expected by the gene parser / UI)
    strengthGrowthP: toGrowthPct(primaryStatGrowth.strength),
    strengthGrowthS: toGrowthPct(secondaryStatGrowth.strength),
    agilityGrowthP: toGrowthPct(primaryStatGrowth.agility),
    agilityGrowthS: toGrowthPct(secondaryStatGrowth.agility),
    intelligenceGrowthP: toGrowthPct(primaryStatGrowth.intelligence),
    intelligenceGrowthS: toGrowthPct(secondaryStatGrowth.intelligence),
    wisdomGrowthP: toGrowthPct(primaryStatGrowth.wisdom),
    wisdomGrowthS: toGrowthPct(secondaryStatGrowth.wisdom),
    luckGrowthP: toGrowthPct(primaryStatGrowth.luck),
    luckGrowthS: toGrowthPct(secondaryStatGrowth.luck),
    vitalityGrowthP: toGrowthPct(primaryStatGrowth.vitality),
    vitalityGrowthS: toGrowthPct(secondaryStatGrowth.vitality),
    enduranceGrowthP: toGrowthPct(primaryStatGrowth.endurance),
    enduranceGrowthS: toGrowthPct(secondaryStatGrowth.endurance),
    dexterityGrowthP: toGrowthPct(primaryStatGrowth.dexterity),
    dexterityGrowthS: toGrowthPct(secondaryStatGrowth.dexterity),
    // ability genes (placeholders — gene parser overwrites these)
    statBoost1,
    statBoost2,
    passive1,
    passive2,
    active1,
    active2,
    // profession string (gene parser fills in dominant profession)
    profession,
    professionStr: profession,
    // crafting
    craftProf1: formatCraft(craftProf1Name),
    craftProf2: formatCraft(craftProf2Name),
    hasValidCraftingGenes: parsedGenes ? (parsedGenes.crafting1 > 0 || parsedGenes.crafting2 > 0) : false,
    // generation / shiny
    generation: parseInt(info.generation) || 0,
    shiny: info.shiny || false,
    shinyStyle: parseInt(info.shinyStyle) || 0,
    // other info
    darkSummoned: false,
    darkSummonLevels: 0,
    network: '',
    originRealm: '',
    owner: ownerAddress,
    ownerName: '',
    // attributes array for Modal
    attributes: [
      { trait_type: 'Strength', value: parseInt(stats.strength) || 0 },
      { trait_type: 'Agility', value: parseInt(stats.agility) || 0 },
      { trait_type: 'Endurance', value: parseInt(stats.endurance) || 0 },
      { trait_type: 'Wisdom', value: parseInt(stats.wisdom) || 0 },
      { trait_type: 'Dexterity', value: parseInt(stats.dexterity) || 0 },
      { trait_type: 'Vitality', value: parseInt(stats.vitality) || 0 },
      { trait_type: 'Intelligence', value: parseInt(stats.intelligence) || 0 },
      { trait_type: 'Luck', value: parseInt(stats.luck) || 0 },
      { trait_type: 'Mining', value: miningRaw },
      { trait_type: 'Gardening', value: gardeningRaw },
      { trait_type: 'Fishing', value: fishingRaw },
      { trait_type: 'Foraging', value: foragingRaw },
    ],
  };

  return enhanceHeroWithGeneData(shaped);
};

export const getHeroesData = async (heroIds) => {
  if (CONTRACT_ONLY_MODE) {
    return fetchHeroesFromContract(heroIds);
  }

  try {
    await apiRateLimiter.acquire();
    // Use the full IDs for the query (including realm prefix)
    const stringIds = heroIds.map((id) => id.toString());

    const query = `
      query getHeroes($heroIds: [ID]!) {
        heroes(where: { id_in: $heroIds }, first: 1000) {
          id
          normalizedId
          owner {
            id
            owner
            name
          }
          network
          originRealm
          mainClass
          subClass
          profession
          generation
          rarity
          shiny
          level
          statGenes
          visualGenes
          summons
          maxSummons
          summonsRemaining
          staminaFullAt
          xp
          strength
          intelligence
          wisdom
          luck
          agility
          vitality
          endurance
          dexterity
          hp
          mp
          stamina
          mining
          gardening
          foraging
          fishing
          statBoost1
          statBoost2
          element
          gender
          background
          statsUnknown1
          statsUnknown2
          firstName
          lastName
          darkSummoned
          darkSummonLevels
          professionStr
          mainClassStr
          subClassStr
          hasValidCraftingGenes
          passive1
          passive2
          active1
          active2
          strengthGrowthP
          strengthGrowthS
          agilityGrowthP
          agilityGrowthS
          intelligenceGrowthP
          intelligenceGrowthS
          wisdomGrowthP
          wisdomGrowthS
          luckGrowthP
          luckGrowthS
          vitalityGrowthP
          vitalityGrowthS
          enduranceGrowthP
          enduranceGrowthS
          dexterityGrowthP
          dexterityGrowthS
        }
      }
    `;

    const response = await fetch(await getGraphQLEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { heroIds: stringIds },
      }),
    });

    if (!response.ok) {
      console.error('GraphQL request failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      throw new Error('GraphQL query failed');
    }

    // Process each hero through our mapping functions
    const heroes =
      data.data?.heroes?.map((hero) => {
        const gender = getGenderFromApi(hero.gender);

        // Get names using indices from API
        const nameList = gender === 'female' ? femaleFirstNames : maleFirstNames;
        const firstName =
          typeof hero.firstName === 'number'
            ? getNameFromIndex(hero.firstName, nameList)
            : hero.firstName || 'Unknown';
        const lastName =
          typeof hero.lastName === 'number'
            ? getNameFromIndex(hero.lastName, lastNames)
            : hero.lastName || 'Unknown';

        // Map class, rarity, and element to their string values
        const mainClass = classMapping[parseInt(hero.mainClass)] || 'Unknown';
        const subClass = classMapping[parseInt(hero.subClass)] || 'Unknown';
        const rarity = rarityMapping[parseInt(hero.rarity)] || 'common';

        // Safely convert element and background to lowercase strings
        let element = elementMapping[parseInt(hero.element)] || 'unknown';
        if (typeof hero.element === 'string') {
          element = hero.element;
        }
        element = element.toLowerCase();

        let background = backgroundMapping[parseInt(hero.background)] || 'plains';
        if (typeof hero.background === 'string') {
          background = hero.background;
        }
        background = background.toLowerCase();

        // Construct hero image URL
        const imageUrl = `https://heroes.defikingdoms.com/image/${hero.id}`;

        // Map crafting professions from passive genes
        const craftProf1 =
          hero.hasValidCraftingGenes && hero.passive1
            ? craftingProfessionMapping[hero.passive1.toString()] || 'none'
            : 'none';
        const craftProf2 =
          hero.hasValidCraftingGenes && hero.passive2
            ? craftingProfessionMapping[hero.passive2.toString()] || 'none'
            : 'none';

        // Capitalize first letter of crafting professions
        const formatProfession = (prof) =>
          prof === 'none' ? prof : prof.charAt(0).toUpperCase() + prof.slice(1);

        return {
          ...hero,
          id: hero.normalizedId || hero.id.toString(),
          fullId: hero.id.toString(),
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          gender,
          mainClass,
          subClass,
          rarity,
          element,
          background,
          image: imageUrl,
          level: parseInt(hero.level) || 0,
          generation: parseInt(hero.generation) || 0,
          summons: parseInt(hero.summons) || 0,
          maxSummons: parseInt(hero.maxSummons) || 0,
          summonsRemaining: parseInt(hero.summonsRemaining) || 0,
          hp: parseInt(hero.hp) || 0,
          mp: parseInt(hero.mp) || 0,
          stamina: parseInt(hero.stamina) || 0,
          strength: parseInt(hero.strength) || 0,
          agility: parseInt(hero.agility) || 0,
          intelligence: parseInt(hero.intelligence) || 0,
          wisdom: parseInt(hero.wisdom) || 0,
          luck: parseInt(hero.luck) || 0,
          dexterity: parseInt(hero.dexterity) || 0,
          vitality: parseInt(hero.vitality) || 0,
          endurance: parseInt(hero.endurance) || 0,
          mining: parseInt(hero.mining) || 0,
          gardening: parseInt(hero.gardening) || 0,
          foraging: parseInt(hero.foraging) || 0,
          fishing: parseInt(hero.fishing) || 0,
          xp: parseInt(hero.xp) || 0,
          statBoost1: hero.statBoost1 || 'None',
          statBoost2: hero.statBoost2 || 'None',
          profession: hero.professionStr || hero.profession || 'none',
          owner: hero.owner?.owner || '',
          ownerName: hero.owner?.name || '',
          darkSummoned: hero.darkSummoned || false,
          darkSummonLevels: parseInt(hero.darkSummonLevels) || 0,
          network: hero.network || '',
          originRealm: hero.originRealm || '',
          hasValidCraftingGenes: hero.hasValidCraftingGenes || false,
          passive1: hero.passive1 || 0,
          passive2: hero.passive2 || 0,
          active1: hero.active1 || 0,
          active2: hero.active2 || 0,
          mainClassStr: hero.mainClassStr || mainClass,
          subClassStr: hero.subClassStr || subClass,
          craftProf1: formatProfession(craftProf1),
          craftProf2: formatProfession(craftProf2),
        };
      }) || [];

    // Convert BigInts to strings and enhance with gene data
    const heroesWithStringValues = convertBigIntsToStrings(heroes);

    // Enhance each hero with gene data
    return heroesWithStringValues.map((hero) => enhanceHeroWithGeneData(hero));
  } catch (error) {
    return [];
  }
};

// For backward compatibility
export const getHeroData = async (heroId) => {
  const heroes = await getHeroesData([heroId]);
  const hero = heroes[0] || null;

  if (hero) {
    // Ensure hero data is enhanced with gene information
    return enhanceHeroWithGeneData(hero);
  }

  return null;
};

export const formatPrice = (price) => {
  try {
    if (!price) return '0';
    const priceInHONK = web3.utils.fromWei(price.toString(), 'ether');
    return priceInHONK;
  } catch (error) {
    return '0';
  }
};

const getGenderFromApi = (genderValue) => {
  // Gender 3 = female, Gender 1 = male
  return genderValue === 3 ? 'female' : 'male';
};

// eslint-disable-next-line no-unused-vars
const fetchHeroMetadata = async (id) => {
  try {
    const response = await fetch(`/heroes/token/${id}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
};

export const processHeroData = async (hero) => {
  if (!hero) return null;

  try {
    // Get the gender from genes if not provided
    const gender = hero.gender || getGenderFromGenes(hero.visualGenes);

    // Get names using indices from API
    const nameList = gender === 'female' ? femaleFirstNames : maleFirstNames;
    const firstName =
      typeof hero.firstName === 'number'
        ? getNameFromIndex(hero.firstName, nameList)
        : hero.firstName || 'Unknown';
    const lastName =
      typeof hero.lastName === 'number'
        ? getNameFromIndex(hero.lastName, lastNames)
        : hero.lastName || 'Unknown';

    // Create attributes array for hero stats
    const attributes = [
      { trait_type: 'Strength', value: parseInt(hero.strength) || 0 },
      { trait_type: 'Agility', value: parseInt(hero.agility) || 0 },
      { trait_type: 'Endurance', value: parseInt(hero.endurance) || 0 },
      { trait_type: 'Wisdom', value: parseInt(hero.wisdom) || 0 },
      { trait_type: 'Dexterity', value: parseInt(hero.dexterity) || 0 },
      { trait_type: 'Vitality', value: parseInt(hero.vitality) || 0 },
      { trait_type: 'Intelligence', value: parseInt(hero.intelligence) || 0 },
      { trait_type: 'Luck', value: parseInt(hero.luck) || 0 },
    ];

    // Preserve the original gene data for later processing
    const originalStatGenes = hero.statGenes;
    const originalVisualGenes = hero.visualGenes;

    // Process basic hero data
    const processedHero = {
      ...hero,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      gender,
      mainClass: hero.mainClassStr || hero.mainClass || 'Unknown',
      subClass: hero.subClassStr || hero.subClass || 'Unknown',
      level: parseInt(hero.level) || 0,
      generation: parseInt(hero.generation) || 0,
      summons: parseInt(hero.summons) || 0,
      maxSummons: parseInt(hero.maxSummons) || 0,
      statBoost1: statsMapping[parseInt(hero.statBoost1)] || 'None',
      statBoost2: statsMapping[parseInt(hero.statBoost2)] || 'None',
      element: elementMapping[parseInt(hero.element)] || hero.element || 'Unknown',
      background: backgroundMapping[parseInt(hero.background)] || hero.background || 'Unknown',
      isQuesting: hero.isQuesting || false,
      isListed: hero.isListed || false,
      price: hero.price || '0',
      owner: hero.owner || '',
      attributes, // Add the attributes array
      passive1: parseInt(hero.passive1 || 0),
      passive2: parseInt(hero.passive2 || 0),
      active1: parseInt(hero.active1 || 0),
      active2: parseInt(hero.active2 || 0),
      hairStyle: parseInt(hero.hairStyle || 0),
      hairColor: parseInt(hero.hairColor || 0),
      eyeColor: parseInt(hero.eyeColor || 0),
      skinColor: parseInt(hero.skinColor || 0),
      headAppendage: parseInt(hero.headAppendage || 0),
      backAppendage: parseInt(hero.backAppendage || 0),
      appendageColor: parseInt(hero.appendageColor || 0),
      backAppendageColor: parseInt(hero.backAppendageColor || 0),

      // Store the raw gene data in multiple formats for fallback parsing
      originalStatGenes: originalStatGenes,
      originalVisualGenes: originalVisualGenes,
      statGenesRaw: originalStatGenes ? originalStatGenes.toString() : null,
      visualGenesRaw: originalVisualGenes ? originalVisualGenes.toString() : null,
    };

    // Enhance hero with gene data (growth stats, abilities, visual genes, recessive genes)
    const enhancedHero = enhanceHeroWithGeneData(processedHero);

    return enhancedHero;
  } catch (error) {
    console.error('Error processing hero data:', error);
    return hero; // Return the original hero if processing fails
  }
};

export const processHeroesData = async (heroes) => {
  if (!heroes || !Array.isArray(heroes)) {
    return [];
  }

  try {
    // Process each hero through our mapping functions
    const processedHeroes = await Promise.all(heroes.map((hero) => processHeroData(hero)));
    return processedHeroes.filter((hero) => hero !== null);
  } catch (error) {
    return [];
  }
};

// Batch process multiple heroes
export const getHeroesDataBatch = async (heroIds, onProgress) => {
  const fetchRequests = heroIds.map((id) => async () => {
    const result = await getHeroData(id);
    if (onProgress) {
      onProgress(1, heroIds.length);
    }
    return result;
  });

  return batchProcessor(fetchRequests);
};

export const getHeroesByOwner = async (ownerAddress, onProgress = null) => {
  // Mark start time for benchmarking
  const fetchStart = performance.now();

  // --- Contract-only path ---
  if (CONTRACT_ONLY_MODE) {
    const contract = DFKHeroContract;
    if (!contract) {
      console.error('[CONTRACT] DFKHeroContract not initialised');
      if (onProgress) {
        onProgress({
          heroes: [],
          totalProcessed: 0,
          isFirstBatch: true,
          hasMore: false,
          isDone: true,
          elapsedMs: 0,
        });
      }
      return [];
    }

    let heroIds;
    try {
      heroIds = await contract.methods.getUserHeroes(ownerAddress).call();
    } catch (err) {
      console.error('[CONTRACT] getUserHeroes failed:', err);
      if (onProgress) {
        onProgress({
          heroes: [],
          totalProcessed: 0,
          isFirstBatch: true,
          hasMore: false,
          isDone: true,
          elapsedMs: 0,
        });
      }
      return [];
    }

    if (!heroIds || heroIds.length === 0) {
      if (onProgress) {
        onProgress({
          heroes: [],
          totalProcessed: 0,
          isFirstBatch: true,
          hasMore: false,
          isDone: true,
          elapsedMs: Math.round(performance.now() - fetchStart),
        });
      }
      return [];
    }

    // Map returned IDs to plain strings
    const idStrings = heroIds.map((id) => id.toString());

    // Fetch & report in batches of CONTRACT_BATCH_SIZE
    const allHeroes = [];
    let firstBatchReturned = false;

    for (let i = 0; i < idStrings.length; i += CONTRACT_BATCH_SIZE) {
      const batchIds = idStrings.slice(i, i + CONTRACT_BATCH_SIZE);
      const isLastBatch = i + CONTRACT_BATCH_SIZE >= idStrings.length;

      let batchHeroes = [];
      try {
        batchHeroes = await fetchHeroesFromContract(batchIds, ownerAddress);
      } catch (err) {
        console.error('[CONTRACT] fetchHeroesFromContract batch failed:', err);
      }

      allHeroes.push(...batchHeroes);

      if (onProgress) {
        const isFirstBatch = !firstBatchReturned;
        firstBatchReturned = true;
        onProgress({
          heroes: batchHeroes,
          totalProcessed: allHeroes.length,
          isFirstBatch,
          hasMore: !isLastBatch,
          isDone: isLastBatch,
          elapsedMs: Math.round(performance.now() - fetchStart),
        });
      }
    }

    return allHeroes;
  }

  // --- GraphQL path (legacy) ---
  // console.log(`[HONK] Starting to fetch heroes for owner: ${ownerAddress}`);

  const REQUEST_BATCH_SIZE = 1000; // GraphQL API limit
  const PARALLEL_LIMIT = 3;
  const MAX_RETRIES_LOCAL = MAX_RETRIES;
  const RETRY_DELAY_LOCAL = RETRY_DELAY;

  // Track processed hero IDs to prevent duplicates
  const processedHeroIds = new Set();

  // eslint-disable-next-line no-loop-func
  const fetchBatch = async (skip) => {
    let retries = 0;
    while (retries < MAX_RETRIES_LOCAL) {
      try {
        await apiRateLimiter.acquire();
        const query = `
          query getHeroesByOwner($owner: String!, $skip: Int!) {
            heroes(where: { owner: $owner }, first: ${REQUEST_BATCH_SIZE}, skip: $skip, orderBy: id) {
              id
              mainClass
              subClass
              level
              generation
              summons
              maxSummons
              statGenes
              visualGenes
              rarity
              shiny
              firstName
              lastName
              subClassStr
              professionStr
              summonedTime
              nextSummonTime
              staminaFullAt
              xp
              strength
              intelligence
              wisdom
              luck
              agility
              vitality
              endurance
              dexterity
              hp
              mp
              stamina
              mining
              gardening
              foraging
              fishing
              statBoost1
              statBoost2
              element
              gender
              background
              statsUnknown1
              statsUnknown2
              originRealm
              network
              passive1
              passive2
              active1
              active2
              strengthGrowthP
              strengthGrowthS
              agilityGrowthP
              agilityGrowthS
              intelligenceGrowthP
              intelligenceGrowthS
              wisdomGrowthP
              wisdomGrowthS
              luckGrowthP
              luckGrowthS
              vitalityGrowthP
              vitalityGrowthS
              enduranceGrowthP
              enduranceGrowthS
              dexterityGrowthP
              dexterityGrowthS
              hairStyle
              hairColor
              eyeColor
              skinColor
              headAppendage
              backAppendage
              appendageColor
              backAppendageColor
            }
          }
        `;
        const variables = {
          owner: ownerAddress.toLowerCase(),
          skip,
        };
        const response = await fetch(await getGraphQLEndpoint(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            variables: convertBigIntsToStrings(variables),
          }),
        });
        if (response.status === 429) {
          await sleep(RETRY_DELAY_LOCAL * (retries + 1));
          retries++;
          continue;
        }
        if (!response.ok) {
          const errorText = await response.text();
          console.error('GraphQL error', response.status, errorText);
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (!data?.data?.heroes) {
          throw new Error('Malformed response');
        }
        return data.data.heroes;
      } catch (err) {
        if (retries >= MAX_RETRIES_LOCAL - 1) {
          throw err;
        }
        await sleep(RETRY_DELAY_LOCAL * (retries + 1));
        retries++;
      }
    }
    return [];
  };

  let allHeroes = [];
  let skip = 0;
  let hasMore = true;
  let processedCount = 0;
  let firstBatchReturned = false;

  while (hasMore) {
    // Prepare parallel requests with proper skip values
    const parallelSkips = Array.from(
      { length: PARALLEL_LIMIT },
      (_, i) => skip + i * REQUEST_BATCH_SIZE
    );

    // eslint-disable-next-line no-loop-func
    const results = await Promise.all(parallelSkips.map((s) => fetchBatch(s)));

    // Process results and check for end condition
    const newHeroes = [];
    let shouldStop = false;

    for (const heroes of results) {
      if (heroes.length === 0) {
        shouldStop = true;
        break;
      }

      // Filter out duplicates based on hero ID
      const uniqueHeroes = heroes.filter((hero) => {
        const heroId = hero.id.toString();
        if (processedHeroIds.has(heroId)) {
          return false;
        }
        processedHeroIds.add(heroId);
        return true;
      });

      newHeroes.push(...uniqueHeroes);

      // Check if we've reached the end (fewer heroes than requested)
      if (heroes.length < REQUEST_BATCH_SIZE) {
        shouldStop = true;
      }
    }

    if (shouldStop || newHeroes.length === 0) {
      hasMore = false;
    }

    // Process this batch of heroes only once
    if (newHeroes.length > 0) {
      const processedHeroes = newHeroes.map((hero) => {
        const gender = getGenderFromApi(hero.gender);
        const fullId = hero.id.toString();

        // Get names using indices from API
        const nameList = gender === 'female' ? femaleFirstNames : maleFirstNames;
        let firstName = hero.firstName;
        let lastName = hero.lastName;

        // Only use name generation if we have numeric indices
        if (
          typeof hero.firstName === 'number' ||
          (typeof hero.firstName === 'string' && !isNaN(hero.firstName))
        ) {
          firstName = getNameFromIndex(parseInt(hero.firstName), nameList);
        } else if (typeof hero.firstName === 'string') {
          firstName = hero.firstName; // Use the actual name from API
        } else {
          firstName = 'Unknown';
        }

        if (
          typeof hero.lastName === 'number' ||
          (typeof hero.lastName === 'string' && !isNaN(hero.lastName))
        ) {
          lastName = getNameFromIndex(parseInt(hero.lastName), lastNames);
        } else if (typeof hero.lastName === 'string') {
          lastName = hero.lastName; // Use the actual name from API
        } else {
          lastName = 'Unknown';
        }

        // Get formatted values
        const mainClass = classMapping[parseInt(hero.mainClass)] || 'Unknown';
        const subClass = classMapping[parseInt(hero.subClass)] || 'Unknown';
        const rarity = rarityMapping[parseInt(hero.rarity)] || 'common';

        // Format element and background
        let element = elementMapping[parseInt(hero.element)] || 'neutral';
        if (typeof element === 'string') element = element.toLowerCase();

        let background = backgroundMapping[parseInt(hero.background)] || 'plains';
        if (typeof background === 'string') background = background.toLowerCase();

        // Create image URL
        const imageUrl = `https://heroes.defikingdoms.com/image/${fullId}`;

        // Get crafting professions from statsUnknown
        const statsUnknown1Num = parseInt(hero.statsUnknown1);
        const statsUnknown2Num = parseInt(hero.statsUnknown2);

        // Only include valid crafting professions (even numbers from 0 to 14)
        const craftProf1 =
          statsUnknown1Num >= 0 && statsUnknown1Num <= 14 && statsUnknown1Num % 2 === 0
            ? craftingProfessionMapping[statsUnknown1Num.toString()]
            : 'none';

        const craftProf2 =
          statsUnknown2Num >= 0 && statsUnknown2Num <= 14 && statsUnknown2Num % 2 === 0
            ? craftingProfessionMapping[statsUnknown2Num.toString()]
            : 'none';

        // Map network to realm name
        const networkToRealm = {
          kla: 'Serendale',
          dfk: 'Crystalvale',
          met: 'Sundered Isles',
        };

        // Get network and realm information
        const network = hero.network || '';
        const realmName = networkToRealm[network] || 'Unknown Realm';

        return enhanceHeroWithGeneData({
          ...hero,
          id: fullId,
          fullId,
          displayId: fullId, // Use full ID for display
          shortId: fullId, // Use full ID here too
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          mainClass,
          subClass,
          rarity,
          element,
          background,
          image: imageUrl,
          summons: parseInt(hero.summons) || 0,
          maxSummons: parseInt(hero.maxSummons) || 0,
          mining: parseInt(hero.mining) || 0,
          gardening: parseInt(hero.gardening) || 0,
          foraging: parseInt(hero.foraging) || 0,
          fishing: parseInt(hero.fishing) || 0,
          stamina: parseInt(hero.stamina) || 0,
          owner: ownerAddress,
          network,
          realmName,
          statBoost1: statsMapping[hero.statBoost1] || '',
          statBoost2: statsMapping[hero.statBoost2] || '',
          craftProf1,
          craftProf2,
          // Convert numeric values to strings or numbers as needed
          level: parseInt(hero.level) || 0,
          generation: parseInt(hero.generation) || 0,
          hp: parseInt(hero.hp) || 0,
          mp: parseInt(hero.mp) || 0,
          xp: parseInt(hero.xp) || 0,
          strength: parseInt(hero.strength) || 0,
          dexterity: parseInt(hero.dexterity) || 0,
          agility: parseInt(hero.agility) || 0,
          vitality: parseInt(hero.vitality) || 0,
          endurance: parseInt(hero.endurance) || 0,
          intelligence: parseInt(hero.intelligence) || 0,
          wisdom: parseInt(hero.wisdom) || 0,
          luck: parseInt(hero.luck) || 0,
          // Format summons as current/max
          summonsDisplay: `${parseInt(hero.summons) || 0}/${parseInt(hero.maxSummons) || 0}`,
          staminaFullAt: parseInt(hero.staminaFullAt) || 0,
          // Add attributes array for Modal component
          attributes: [
            { trait_type: 'Strength', value: parseInt(hero.strength) || 0 },
            { trait_type: 'Agility', value: parseInt(hero.agility) || 0 },
            { trait_type: 'Endurance', value: parseInt(hero.endurance) || 0 },
            { trait_type: 'Wisdom', value: parseInt(hero.wisdom) || 0 },
            { trait_type: 'Dexterity', value: parseInt(hero.dexterity) || 0 },
            { trait_type: 'Vitality', value: parseInt(hero.vitality) || 0 },
            { trait_type: 'Intelligence', value: parseInt(hero.intelligence) || 0 },
            { trait_type: 'Luck', value: parseInt(hero.luck) || 0 },
            { trait_type: 'Mining', value: Math.floor(parseFloat(hero.mining)) || 0 },
            { trait_type: 'Gardening', value: Math.floor(parseFloat(hero.gardening)) || 0 },
            { trait_type: 'Fishing', value: Math.floor(parseFloat(hero.fishing)) || 0 },
            { trait_type: 'Foraging', value: Math.floor(parseFloat(hero.foraging)) || 0 },
            { trait_type: 'Tailoring', value: Math.floor(parseFloat(hero.tailoring)) || 0 },
            {
              trait_type: 'Leatherworking',
              value: Math.floor(parseFloat(hero.leatherworking)) || 0,
            },
          ],
        });
      });

      // Add processed heroes to the main array
      allHeroes.push(...processedHeroes);
      processedCount += processedHeroes.length;

      // Call the progress callback if provided
      if (onProgress) {
        const elapsed = performance.now() - fetchStart;
        const isFirstBatch = !firstBatchReturned;
        firstBatchReturned = true;

        onProgress({
          heroes: processedHeroes,
          totalProcessed: processedCount,
          isFirstBatch,
          hasMore,
          isDone: !hasMore,
          elapsedMs: Math.round(elapsed),
        });
      }
    }

    // Move to next batch set
    skip += PARALLEL_LIMIT * REQUEST_BATCH_SIZE;
  }

  // Final progress callback when done
  if (onProgress && !firstBatchReturned) {
    onProgress({
      heroes: [],
      totalProcessed: 0,
      isFirstBatch: true,
      hasMore: false,
      isDone: true,
      elapsedMs: Math.round(performance.now() - fetchStart),
    });
  }

  return allHeroes;
};

export const getIdForName = (id, originRealm) => {
  // Based on originRealm, determine how to handle the ID
  if (!originRealm || originRealm === 'SER') {
    // Harmony hero - use full ID
    const result = parseInt(id);
    return result;
  }
  if (originRealm === 'CRY') {
    // Crystalvale hero - remove 1000000000000 prefix
    const result = parseInt(id.slice(12));
    return result;
  }
  if (originRealm === 'SER2') {
    // Serendale 2 hero - remove 2000000000000 prefix
    const result = parseInt(id.slice(12));
    return result;
  }
  // Fallback - use full ID
  const result = parseInt(id);
  return result;
};

export const getFirstName = (id, gender, originRealm) => {
  try {
    const nameList = gender === 'female' ? femaleFirstNames : maleFirstNames;
    const idForName = getIdForName(id, originRealm);
    const nameIndex = idForName % nameList.length;
    if (isNaN(nameIndex)) {
      return 'Unknown';
    }
    const name = nameList[nameIndex];
    return name;
  } catch (error) {
    return 'Unknown';
  }
};

export const getLastName = (id, originRealm) => {
  try {
    const idForName = getIdForName(id, originRealm);
    const nameIndex = idForName % lastNames.length;
    if (isNaN(nameIndex)) {
      return 'Hero';
    }
    const name = lastNames[nameIndex];
    return name;
  } catch (error) {
    return 'Hero';
  }
};

// Convert BigInt values to strings in an object
const convertBigIntsToStrings = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntsToStrings);
  }

  const converted = {};
  for (const [key, value] of Object.entries(obj)) {
    converted[key] = convertBigIntsToStrings(value);
  }
  return converted;
};
