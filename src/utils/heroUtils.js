import maleFirstNames from '../assets/images/maleFirstNames.json';
import femaleFirstNames from '../assets/images/femaleFirstNames.json';
import lastNames from '../assets/images/lastNames.json';
import { web3 } from '../Web3Config';

export const getFirstName = (id, gender) =>
  gender === 3 ? femaleFirstNames[id] : maleFirstNames[id];
export const getLastName = (id) => lastNames[id];

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

export const elementMapping = {
  0: 'Fire',
  2: 'Water',
  4: 'Earth',
  6: 'Wind',
  8: 'Lightning',
  10: 'Ice',
  12: 'Light',
  14: 'Dark',
};

export const backgroundMapping = {
  0: 'Desert',
  2: 'Forest',
  4: 'Plains',
  6: 'Island',
  8: 'Swamp',
  10: 'Mountains',
  12: 'City',
  14: 'Arctic',
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

export const craftingProfessionMapping = {
  0: 'Blacksmithing',
  2: 'Goldsmithing',
  4: 'Armorsmithing',
  6: 'Woodworking',
  8: 'Leatherworking',
  10: 'Tailoring',
  12: 'Enchanting',
  14: 'Alchemy',
};

export const getHeroData = async (heroId) => {
  const response = await fetch('https://testnet.api.defikingdoms.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        {
          hero(id: "${heroId}") {
            id
            normalizedId
            owner { id }
            originRealm
            statGenes
            visualGenes
            rarity
            shiny
            generation
            firstName
            lastName
            mainClass
            subClassStr
            professionStr
            summonedTime
            nextSummonTime
            summons
            maxSummons
            staminaFullAt
            level
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
          }
        }
      `,
    }),
  });

  const { data } = await response.json();
  return data.hero;
};
export const formatPrice = (price) => {
  if (!price) return 'N/A';
  try {
    // Check if the price string already includes "HONK" to prevent double appending
    if (typeof price === 'string' && price.toLowerCase().includes('honk')) {
      return price.trim(); // Return the already formatted price
    }
    const priceInEther = web3.utils.fromWei(price.toString(), 'ether');
    return parseFloat(priceInEther).toFixed(2) + ' HONK'; // Format to 2 decimal places and append " HONK"
  } catch (error) {
    console.error('Error formatting price:', error);
    return 'Error';
  }
};

export const processHeroData = (hero) => {
  return {
    id: hero.id,
    shortId: hero.normalizedId,
    name: `${getFirstName(hero.firstName, hero.gender)} ${getLastName(hero.lastName)}`,
    image: `https://testnet.heroes.defikingdoms.com/image/${hero.id}`,
    attributes: [
      { trait_type: 'ID', value: hero.normalizedId },
      { trait_type: 'Class', value: classMapping[hero.mainClass] },
      { trait_type: 'Sub Class', value: hero.subClassStr },
      { trait_type: 'Level', value: hero.level },
      { trait_type: 'Rarity', value: rarityMapping[hero.rarity] },
      { trait_type: 'Generation', value: hero.generation },
      { trait_type: 'Gender', value: hero.gender === 3 ? 'Female' : 'Male' },
      { trait_type: 'Background', value: backgroundMapping[hero.background] },
      { trait_type: 'Element', value: elementMapping[hero.element] },
      { trait_type: 'HP', value: hero.hp },
      { trait_type: 'MP', value: hero.mp },
      { trait_type: 'Stamina', value: hero.stamina },
      { trait_type: 'XP', value: hero.xp },
      { trait_type: 'Strength', value: hero.strength },
      { trait_type: 'Dexterity', value: hero.dexterity },
      { trait_type: 'Agility', value: hero.agility },
      { trait_type: 'Vitality', value: hero.vitality },
      { trait_type: 'Intelligence', value: hero.intelligence },
      { trait_type: 'Wisdom', value: hero.wisdom },
      { trait_type: 'Luck', value: hero.luck },
      { trait_type: 'Endurance', value: hero.endurance },
      { trait_type: 'Mining', value: hero.mining / 10 },
      { trait_type: 'Gardening', value: hero.gardening / 10 },
      { trait_type: 'Fishing', value: hero.fishing / 10 },
      { trait_type: 'Foraging', value: hero.foraging / 10 },
      { trait_type: 'Summons Remaining', value: hero.maxSummons - hero.summons },
      { trait_type: 'Max Summons', value: hero.maxSummons },
      { trait_type: 'Stat Boost 1', value: statsMapping[hero.statBoost1] },
      { trait_type: 'Stat Boost 2', value: statsMapping[hero.statBoost2] },
      { trait_type: 'Profession', value: hero.professionStr },
      { trait_type: 'Crafting 1', value: craftingProfessionMapping[hero.statsUnknown1] },
      { trait_type: 'Crafting 2', value: craftingProfessionMapping[hero.statsUnknown2] },
    ],
  };
};
