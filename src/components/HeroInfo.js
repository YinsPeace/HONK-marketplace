const classMap = {
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

// Mapping for rarity
const rarityMap = {
  0: 'Common',
  1: 'Uncommon',
  2: 'Rare',
  3: 'Legendary',
  4: 'Mythic',
};

// Mapping for profession
const professionMap = {
  0: 'Mining',
  2: 'Gardening',
  4: 'Fishing',
  6: 'Foraging',
};

const backgroundMap = {
  0: 'Desert',
  2: 'Forest',
  4: 'Plains',
  6: 'Island',
  8: 'Swamp',
  10: 'Mountains',
  12: 'City',
  14: 'Arctic',
};

const elementMap = {
  0: 'Fire',
  2: 'Water',
  4: 'Earth',
  6: 'Wind',
  8: 'Lightning',
  10: 'Ice',
  12: 'Light',
  14: 'Dark',
};

export const mapClass = (classId) => {
  return classMap[classId] || 'Unknown Class';
};

export const mapRarity = (rarityId) => {
  return rarityMap[rarityId] || 'Unknown Rarity';
};

export const mapProfession = (professionId) => {
  return professionMap[professionId] || 'Unknown Profession';
};

export const mapBackground = (backgroundId) => {
  return backgroundMap[backgroundId] || 'Unknown Background';
};

export const mapElement = (elementId) => {
  return elementMap[elementId] || 'Unknown Element';
};
