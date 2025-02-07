import maleFirstNames from '../data/maleFirstNames.json';
import femaleFirstNames from '../data/femaleFirstNames.json';
import lastNames from '../data/lastNames.json';
import { web3 } from '../Web3Config';

// Mapping for crafting professions based on passive genes
const craftingProfessionMapping = {
  '0': 'blacksmithing',
  '2': 'goldsmithing',
  '4': 'armorsmithing',
  '6': 'woodworking',
  '8': 'leatherworking',
  '10': 'tailoring',
  '12': 'enchanting',
  '14': 'alchemy',
  'none': 'none'
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
  0: 'common',
  1: 'uncommon',
  2: 'rare',
  3: 'legendary',
  4: 'mythic',
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
    0: "Desert",
    2: "Forest",
    4: "Plains",
    6: "Island",
    8: "Swamp",
    10: "Mountains",
    12: "City",
    14: "Arctic"
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

export const gatheringProfessionMapping = {
  '0': 'mining',
  '2': 'gardening',
  '4': 'fishing',
  '6': 'foraging',
  'none': 'none'
};

const RETRY_DELAY = 1000; // 1 second delay between retries
const MAX_RETRIES = 3;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
    this.requests = this.requests.filter(time => time > now - this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = oldestRequest + this.timeWindow - now;
      await sleep(waitTime);
      return this.acquire();
    }
    
    this.requests.push(now);
  }
}

const apiRateLimiter = new RateLimiter(5, 1000); // 5 requests per second

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

const HERO_FIELDS = `
  id
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

export const getHeroesData = async (heroIds) => {
  try {
    await apiRateLimiter.acquire();
    // Use the full IDs for the query (including realm prefix)
    const stringIds = heroIds.map(id => id.toString());
    
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
        }
      }
    `;

    const response = await fetch('https://api.defikingdoms.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { heroIds: stringIds }
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
    const heroes = data.data?.heroes?.map(hero => {
      const gender = getGenderFromApi(hero.gender);
      
      // Get names using indices from API
      const nameList = gender === 'female' ? femaleFirstNames : maleFirstNames;
      const firstName = typeof hero.firstName === 'number' 
        ? getNameFromIndex(hero.firstName, nameList)
        : (hero.firstName || 'Unknown');
      const lastName = typeof hero.lastName === 'number'
        ? getNameFromIndex(hero.lastName, lastNames)
        : (hero.lastName || 'Unknown');

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
      const craftProf1 = hero.hasValidCraftingGenes && hero.passive1 ? craftingProfessionMapping[hero.passive1.toString()] || 'none' : 'none';
      const craftProf2 = hero.hasValidCraftingGenes && hero.passive2 ? craftingProfessionMapping[hero.passive2.toString()] || 'none' : 'none';

      // Capitalize first letter of crafting professions
      const formatProfession = (prof) => prof === 'none' ? prof : prof.charAt(0).toUpperCase() + prof.slice(1);

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
        craftProf2: formatProfession(craftProf2)
      };
    }) || [];

    return convertBigIntsToStrings(heroes);
  } catch (error) {
    return [];
  }
};

// For backward compatibility
export const getHeroData = async (heroId) => {
  const heroes = await getHeroesData([heroId]);
  return heroes[0] || null;
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

const getGenderFromGenes = (visualGenes) => {
  try {
    const bigIntGenes = BigInt(visualGenes);
    // Get the last bit (bit 0) for gender
    const genderBit = bigIntGenes & 1n;
    
    // 0 = female, 1 = male (reverse of what we had before)
    return genderBit === 0n ? 'female' : 'male';
  } catch (error) {
    return 'unknown';
  }
};

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

  // Get the gender from genes if not provided
  const gender = hero.gender || getGenderFromGenes(hero.visualGenes);
  
  // Get names using indices from API
  const nameList = gender === 'female' ? femaleFirstNames : maleFirstNames;
  const firstName = typeof hero.firstName === 'number' 
    ? getNameFromIndex(hero.firstName, nameList)
    : (hero.firstName || 'Unknown');
  const lastName = typeof hero.lastName === 'number'
    ? getNameFromIndex(hero.lastName, lastNames)
    : (hero.lastName || 'Unknown');

  // Create attributes array for hero stats
  const attributes = [
    { trait_type: 'Strength', value: parseInt(hero.strength) || 0 },
    { trait_type: 'Agility', value: parseInt(hero.agility) || 0 },
    { trait_type: 'Endurance', value: parseInt(hero.endurance) || 0 },
    { trait_type: 'Wisdom', value: parseInt(hero.wisdom) || 0 },
    { trait_type: 'Dexterity', value: parseInt(hero.dexterity) || 0 },
    { trait_type: 'Vitality', value: parseInt(hero.vitality) || 0 },
    { trait_type: 'Intelligence', value: parseInt(hero.intelligence) || 0 },
    { trait_type: 'Luck', value: parseInt(hero.luck) || 0 }
  ];

  return {
    ...hero,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    gender,
    mainClass: hero.mainClass || 'Unknown',
    subClass: hero.subClass || 'Unknown',
    level: parseInt(hero.level) || 0,
    generation: parseInt(hero.generation) || 0,
    summons: parseInt(hero.summons) || 0,
    maxSummons: parseInt(hero.maxSummons) || 0,
    statBoost1: statsMapping[hero.statBoost1] || 'None',
    statBoost2: statsMapping[hero.statBoost2] || 'None',
    element: elementMapping[hero.element] || 'Unknown',
    background: backgroundMapping[hero.background] || 'Unknown',
    isQuesting: hero.isQuesting || false,
    isListed: hero.isListed || false,
    price: hero.price || '0',
    owner: hero.owner || '',
    attributes // Add the attributes array
  };
};

export const processHeroesData = async (heroes) => {
  if (!heroes || !Array.isArray(heroes)) {
    return [];
  }

  try {
    // Process each hero through our mapping functions
    const processedHeroes = await Promise.all(heroes.map(hero => processHeroData(hero)));
    return processedHeroes.filter(hero => hero !== null);
  } catch (error) {
    return [];
  }
};

// Batch process multiple heroes
export const getHeroesDataBatch = async (heroIds, onProgress) => {
  const fetchRequests = heroIds.map(id => async () => {
    const result = await getHeroData(id);
    if (onProgress) {
      onProgress(1, heroIds.length);
    }
    return result;
  });
  
  return batchProcessor(fetchRequests);
};

export const getHeroesByOwner = async (ownerAddress) => {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      await apiRateLimiter.acquire();
      
      const query = `
        query getHeroesByOwner($owner: String!) {
          heroes(where: { owner: $owner }, first: 1000, orderBy: id) {
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
          }
        }
      `;

      const variables = { 
        owner: ownerAddress.toLowerCase()
      };
      
      const response = await fetch('https://api.defikingdoms.com/graphql', {
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
        await sleep(RETRY_DELAY * (retries + 1));
        retries++;
        continue;
      }

      if (!response.ok) {
        console.error('GraphQL request failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || !data.data || !data.data.heroes) {
        throw new Error('Invalid response format from GraphQL API');
      }

      const heroes = data.data.heroes;

      // Process each hero through our mapping functions
      return heroes.map(hero => {
        const gender = getGenderFromApi(hero.gender);
        
        // Ensure we have the full ID
        const fullId = hero.id.toString();
        
        // Get names using indices from API
        const nameList = gender === 'female' ? femaleFirstNames : maleFirstNames;
        let firstName = hero.firstName;
        let lastName = hero.lastName;
        
        // Only use name generation if we have numeric indices
        if (typeof hero.firstName === 'number' || typeof hero.firstName === 'string' && !isNaN(hero.firstName)) {
          firstName = getNameFromIndex(parseInt(hero.firstName), nameList);
        } else if (typeof hero.firstName === 'string') {
          firstName = hero.firstName; // Use the actual name from API
        } else {
          firstName = 'Unknown';
        }
        
        if (typeof hero.lastName === 'number' || typeof hero.lastName === 'string' && !isNaN(hero.lastName)) {
          lastName = getNameFromIndex(parseInt(hero.lastName), lastNames);
        } else if (typeof hero.lastName === 'string') {
          lastName = hero.lastName; // Use the actual name from API
        } else {
          lastName = 'Unknown';
        }
        
        // Get crafting professions from statsUnknown
        const statsUnknown1Num = parseInt(hero.statsUnknown1);
        const statsUnknown2Num = parseInt(hero.statsUnknown2);
        
        // Only include valid crafting professions (even numbers from 0 to 14)
        const craftProf1 = statsUnknown1Num >= 0 && statsUnknown1Num <= 14 && statsUnknown1Num % 2 === 0 
          ? craftingProfessionMapping[statsUnknown1Num.toString()]
          : 'none';
          
        const craftProf2 = statsUnknown2Num >= 0 && statsUnknown2Num <= 14 && statsUnknown2Num % 2 === 0
          ? craftingProfessionMapping[statsUnknown2Num.toString()]
          : 'none';
        
        return {
          ...hero,
          id: fullId,
          displayId: fullId, // Use full ID for display
          shortId: fullId, // Use full ID here too
          mainClass: classMapping[hero.mainClass] || 'Unknown',
          subClass: classMapping[hero.subClass] || 'Unknown',
          rarity: rarityMapping[hero.rarity] || 'Unknown',
          element: elementMapping[hero.element] 
            ? elementMapping[hero.element].toLowerCase() 
            : (typeof hero.element === 'string' ? hero.element.toLowerCase() : 'unknown'),
          background: backgroundMapping[hero.background] 
            ? backgroundMapping[hero.background].toLowerCase() 
            : (typeof hero.background === 'string' ? hero.background.toLowerCase() : 'plains'),
          gender,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          image: `https://heroes.defikingdoms.com/image/${hero.id}`,
          statBoost1: statsMapping[hero.statBoost1] || '',
          statBoost2: statsMapping[hero.statBoost2] || '',
          craftProf1,
          craftProf2,
          // Convert numeric values to strings or numbers as needed
          level: parseInt(hero.level) || 0,
          generation: parseInt(hero.generation) || 0,
          hp: parseInt(hero.hp) || 0,
          mp: parseInt(hero.mp) || 0,
          stamina: parseInt(hero.stamina) || 0,
          xp: parseInt(hero.xp) || 0,
          strength: parseInt(hero.strength) || 0,
          dexterity: parseInt(hero.dexterity) || 0,
          agility: parseInt(hero.agility) || 0,
          vitality: parseInt(hero.vitality) || 0,
          endurance: parseInt(hero.endurance) || 0,
          intelligence: parseInt(hero.intelligence) || 0,
          wisdom: parseInt(hero.wisdom) || 0,
          luck: parseInt(hero.luck) || 0,
          mining: Math.floor(parseFloat(hero.mining)) || 0,
          gardening: Math.floor(parseFloat(hero.gardening)) || 0,
          fishing: Math.floor(parseFloat(hero.fishing)) || 0,
          foraging: Math.floor(parseFloat(hero.foraging)) || 0,
          // Format summons as current/max
          summons: parseInt(hero.summons) || 0,
          maxSummons: parseInt(hero.maxSummons) || 0,
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
            { trait_type: 'Leatherworking', value: Math.floor(parseFloat(hero.leatherworking)) || 0 }
          ]
        };
      });

    } catch (error) {
      if (retries >= MAX_RETRIES - 1) return [];
      
      await sleep(RETRY_DELAY * (retries + 1));
      retries++;
    }
  }
  
  return [];
};

const getIdForName = (id, originRealm) => {
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

export const getNameFromIndex = (index, nameList) => {
  if (typeof index !== 'number' || !nameList || !nameList.length) {
    return 'Unknown';
  }
  return nameList[index % nameList.length] || 'Unknown';
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
