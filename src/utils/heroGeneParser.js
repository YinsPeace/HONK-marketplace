// Hero Gene Parser - Utility functions for parsing hero genes
import {
  classMapping,
  elementMapping,
  statsMapping,
  professionMapping,
  activeAbilityMapping,
  passiveAbilityMapping,
} from './heroUtils';

// Helper to display ability as "Name (B7)" etc.
export function abilityWithShortCode(abilityName) {
  if (!abilityName || abilityName === 'Unknown') return 'Unknown';
  const match = abilityName.match(/^(.*?)\s*\(([^)]+)\)$/);
  if (match) {
    // match[1] = name, match[2] = code (e.g. Basic7)
    let code = match[2];
    if (/^Basic\d+$/.test(code)) code = 'B' + code.replace('Basic', '');
    if (/^Advanced\d+$/.test(code)) code = 'A' + code.replace('Advanced', '');
    if (/^Elite\d+$/.test(code)) code = 'E' + code.replace('Elite', '');
    if (/^Exalted\d+$/.test(code)) code = 'X' + code.replace('Exalted', '');
    return `${match[1].trim()} (${code})`;
  }
  // fallback: just show name
  return abilityName;
}

// Helper to convert ability name to short code (e.g. "Heal (Basic3)" -> "B3")
function abilityShortCode(abilityName) {
  if (!abilityName || abilityName === 'Unknown') return 'Unknown';
  // Match B7, Basic7, Advanced1, Elite2, Exalted1, etc.
  const match = abilityName.match(/\(([^)]+)\)/);
  if (match) {
    // Prefer B7 over Basic7, etc.
    let code = match[1];
    if (/^Basic\d+$/.test(code)) return 'B' + code.replace('Basic', '');
    if (/^Advanced\d+$/.test(code)) return 'A' + code.replace('Advanced', '');
    if (/^Elite\d+$/.test(code)) return 'E' + code.replace('Elite', '');
    if (/^Exalted\d+$/.test(code)) return 'X' + code.replace('Exalted', '');
    return code;
  }
  // fallback: just take trailing digit(s)
  const fallback = abilityName.match(/(\d+)$/);
  if (fallback) return 'B' + fallback[1];
  return abilityName;
}

// Capitalize first letter
function capitalize(str) {
  if (!str || typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Ability mappings are now imported from heroUtils to ensure consistency across the codebase.

// Hair Style Mapping (for hairStyle) - male and female have different styles
export const hairStyleMapping = {
  0: 'Battle Hawk',
  1: 'Wolf Mane',
  2: 'Enchanter',
  3: 'Wild Growth',
  4: 'Pixel',
  5: 'Sunrise',
  6: 'Bouffant',
  7: 'Agleam Spike',
  8: 'Wayfinder',
  9: 'Faded Topknot',
  10: 'Side Shave',
  11: 'Ronin',
  16: 'Gruff',
  17: 'Rogue Locs',
  18: 'Stone Cold',
  19: "Zinra's Tail",
  20: 'Hedgehog',
  21: 'Delinquent',
  24: 'Skegg',
  25: 'Shinobi',
  26: 'Sanjo',
  28: 'Perfect Form',
};

// Hair Color Mapping (for hairColor)
export const hairColorMapping = {
  0: 'Dried Mud',
  1: 'Light Red',
  2: 'Middle Green',
  3: 'Teal Green',
  4: 'Café Noir',
  5: 'Lavender',
  6: 'Parrot Pink',
  7: 'Blue Jeans',
  8: 'Pastel Red',
  9: 'Teal Blue',
  10: 'Purple Taupe',
  11: 'Peru',
  16: 'Earth Yellow',
  17: 'Purple Majesty',
  18: 'Raw Umber',
  19: 'Electric Blue',
  20: 'Pomona Green',
  21: 'Muted Pink',
  24: 'Red Devil',
  25: 'Dark Charcoal',
  26: 'Glacier',
  28: 'Cadet Grey',
};

// Eye Color Mapping (for eyeColor)
export const eyeColorMapping = {
  0: 'Blue',
  2: 'Pink',
  4: 'Rouge',
  6: 'Green',
  8: 'Brown',
  10: 'Purple',
  12: 'Azure',
  14: 'Red',
};

// Skin Color Mapping (for skinColor)
export const skinColorMapping = {
  0: 'Bronze',
  2: 'Vanilla',
  4: 'Golden',
  6: 'Cocoa',
  8: 'Honey',
  10: 'Toffee',
  12: 'Peach',
  14: 'Almond',
};

// Head Appendage Mapping (for headAppendage)
export const headAppendageMapping = {
  0: 'None',
  1: 'Kitsune Ears',
  2: 'Satyr Horns',
  3: 'Ram Horns',
  4: 'Imp Horns',
  5: 'Cat Ears',
  6: 'Minotaur Horns',
  7: 'Faun Horns',
  8: 'Draconic Horns',
  9: 'Fae Circlet',
  10: 'Ragfly Antennae',
  11: 'Royal Crown',
  16: 'Jagged Horns',
  17: 'Spindle Horns',
  18: 'Bear Ears',
  19: 'Antennae',
  20: 'Fallen Angel Coronet',
  21: 'Power Horn',
  24: 'Wood Elf Ears',
  25: 'Snow Elf Ears',
  26: 'Cranial Wings',
  28: 'Insight Jewel',
};

// Back Appendage Mapping (for backAppendage)
export const backAppendageMapping = {
  0: 'None',
  1: 'Monkey Tail',
  2: 'Cat Tail',
  3: 'Imp Tail',
  4: 'Minotaur Tail',
  5: 'Daishō',
  6: 'Kitsune Tail',
  7: 'Zweihänder',
  8: 'Skeletal Wings',
  9: 'Skeletal Tail',
  10: 'Afflicted Spikes',
  11: "Traveler's Pack",
  16: 'Gryphon Wings',
  17: 'Draconic Wings',
  18: 'Butterfly Wings',
  19: 'Phoenix Wings',
  20: 'Fallen Angel',
  21: 'Crystal Wings',
  24: 'Aura of the Inner Grove',
  25: 'Ancient Orbs',
  26: 'Arachnid Legs',
  28: 'Cecaelia Tentacles',
};

// Appendage Color Mapping (for appendageColor and backAppendageColor)
export const appendageColorMapping = {
  0: 'Dark Vanilla',
  1: 'Bronze',
  2: 'Liver',
  3: 'Electric Blue',
  4: 'Indigo',
  5: 'Onyx',
  6: 'Dark Red',
  7: 'Catawba',
  8: 'Columbia Blue',
  9: 'Deep Carrot',
  10: 'Milk Chocolate',
  11: 'Palm Leaf',
  16: 'Red Wine',
  17: 'Maroon',
  18: 'Old Lavender',
  19: 'Jacarta',
  20: 'Salem',
  21: 'Muted Pink',
  24: 'Satin Gold',
  25: 'Dark Charcoal',
  26: 'Glacier',
  28: 'Light Silver',
};

// Gender Mapping (for better readability)
export const genderMapping = {
  1: 'Male',
  3: 'Female',
};

// Helper function to get ability descriptions
export const getAbilityDescription = (abilityId, isPassive = false) => {
  const descriptions = {
    // Active Abilities
    5: 'Reduce Physical damage taken by 15% for 80 ticks.',
    6: 'Deal damage to target enemy. This attack has +35% CSC. Gain +20% CSC for 2 turns.', // Critical Aim

    // Passive Abilities
    0: 'Gain +2.5% Block and Spell Block. When fighting 1 versus 1, increase damage dealt by 20%.',
    7: 'Increase resistance to Poison by 32.5%. Increase Status Effect Resistance by 2.5%.',
  };

  return descriptions[abilityId] || 'No description available.';
};

/**
 * Convert genes to kai format (from original DFK code)
 */
function genesToKai(genes) {
  const ALPHABET = '123456789abcdefghijkmnopqrstuvwx';
  const BASE = BigInt(ALPHABET.length);

  let buf = '';
  while (genes >= BASE) {
    const mod = genes % BASE;
    buf = ALPHABET[Number(mod)] + buf;
    genes = (genes - mod) / BASE;
  }

  // Add the last digit
  buf = ALPHABET[Number(genes)] + buf;

  // Pad with leading 1s to 48 characters
  buf = buf.padStart(48, '1');

  return buf;
}

/**
 * Convert kai character to decimal (from original DFK code)
 */
function kai2dec(kai) {
  const ALPHABET = '123456789abcdefghijkmnopqrstuvwx';
  return ALPHABET.indexOf(kai);
}

// Using the existing genesToKai and kai2dec functions defined above

// Parse stat genes from the encrypted string
export const parseStatGenes = (statGenesString) => {
  try {
    if (!statGenesString) {
      console.error('Missing stat genes string');
      return null;
    }

    // Handle input validation
    let genesStr;
    if (typeof statGenesString === 'object' && statGenesString !== null) {
      // If object already contains parsed data, just return it
      if (
        statGenesString.recessive ||
        (statGenesString.mainClass !== undefined && statGenesString.subClass !== undefined)
      ) {
        return statGenesString;
      }

      // If ethers.js BigNumber or similar with hex representation
      if (statGenesString._hex) {
        genesStr = statGenesString._hex;
      } else if (statGenesString.hex) {
        genesStr = statGenesString.hex;
      } else if (typeof statGenesString === 'bigint') {
        genesStr = statGenesString.toString();
      } else if (statGenesString.toString && typeof statGenesString.toString === 'function') {
        genesStr = statGenesString.toString();
        if (genesStr === '[object Object]') {
          console.error('parseStatGenes received invalid object');
          return null;
        }
      } else {
        console.error('Cannot convert object to gene string:', statGenesString);
        return null;
      }
    } else {
      genesStr = String(statGenesString);
    }

    if (genesStr === '[object Object]' || genesStr === 'undefined' || genesStr === 'null') {
      console.error('parseStatGenes received invalid gene string:', genesStr);
      return null;
    }

    // Handle both hex and decimal formats
    let genes;
    if (genesStr.startsWith('0x')) {
      genes = BigInt(genesStr);
    } else if (/^\d+$/.test(genesStr)) {
      genes = BigInt(genesStr);
    } else {
      console.error('Invalid stat genes string format:', genesStr);
      return null;
    }

    // OFFICIAL Stat Traits mapping from DFK docs
    const STAT_GENE_MAP = {
      0: 'mainClass', // Class
      1: 'subClass', // SubClass
      2: 'profession', // Profession
      3: 'passive1', // Passive1
      4: 'passive2', // Passive2
      5: 'active1', // Active1
      6: 'active2', // Active2
      7: 'statBoost1', // StatBoost1
      8: 'statBoost2', // StatBoost2
      9: 'crafting1', // Crafting1
      10: 'element', // Element
      11: 'crafting2', // Crafting2
    };

    // Convert genes to Kai format
    let rawKai = genesToKai(genes);

    // Ensure we have full 48 characters (12 traits * 4)
    if (rawKai.length < 48) {
      rawKai = rawKai.padStart(48, '1'); // '1' represents 0 in Kai alphabet
    }

    const geneMap = {};
    const recessives = { r1: {}, r2: {} };

    // Process each character in groups of 4 (one trait per group)
    for (let traitIndex = 0; traitIndex < 12; traitIndex++) {
      const traitName = STAT_GENE_MAP[traitIndex];
      const startPos = traitIndex * 4;

      // Extract the 4 characters for this trait
      const chars = rawKai.slice(startPos, startPos + 4);

      // Convert each character to decimal
      const dominant = kai2dec(chars[0]); // Position 0: Dominant
      const r1_raw = kai2dec(chars[1]); // Position 1: Raw R1
      const r2_raw = kai2dec(chars[2]); // Position 2: Raw R2

      // FIXED: Swap R1 and R2 to match expected results
      const r1 = r2_raw; // R1 should be what was parsed as R2
      const r2 = r1_raw; // R2 should be what was parsed as R1

      // Store genes
      geneMap[traitName] = dominant;
      recessives.r1[traitName] = r1;
      recessives.r2[traitName] = r2;
    }

    return {
      ...geneMap,
      recessive: recessives,
    };
  } catch (error) {
    console.error('Error parsing stat genes:', error);
    return null;
  }
};

/**
 * Get the name of a passive ability by its ID
 */
export const getPassiveAbilityName = (passiveId) => {
  return passiveAbilityMapping[passiveId] || 'Unknown';
};

/**
 * Get the name of an active ability by its ID
 */
export const getActiveAbilityName = (activeId) => {
  return activeAbilityMapping[activeId] || 'Unknown';
};

// Format recessive stat genes with mappings
export const formatRecessiveStatGenes = (statGenes) => {
  // Accept both raw gene strings and already-parsed objects
  try {
    const parsed =
      typeof statGenes === 'object' && statGenes.recessive ? statGenes : parseStatGenes(statGenes);
    if (!parsed) return null;

    return {
      r1: {
        mainClass: classMapping[parsed.recessive.r1.mainClass] || 'Unknown',
        subClass: classMapping[parsed.recessive.r1.subClass] || 'Unknown',
        profession: capitalize(professionMapping[parsed.recessive.r1.profession]) || 'Unknown',
        passive1: abilityWithShortCode(passiveAbilityMapping[parsed.recessive.r1.passive1]),
        passive2: abilityWithShortCode(passiveAbilityMapping[parsed.recessive.r1.passive2]),
        active1: abilityWithShortCode(activeAbilityMapping[parsed.recessive.r1.active2]), // SWAP active1/active2
        active2: abilityWithShortCode(activeAbilityMapping[parsed.recessive.r1.active1]),
        statBoost1: statsMapping[parsed.recessive.r1.statBoost1] || 'None',
        statBoost2: statsMapping[parsed.recessive.r1.statBoost2] || 'None',
        element: elementMapping[parsed.recessive.r1.element] || 'Unknown',
      },
      r2: {
        mainClass: classMapping[parsed.recessive.r2.mainClass] || 'Unknown',
        subClass: classMapping[parsed.recessive.r2.subClass] || 'Unknown',
        profession: capitalize(professionMapping[parsed.recessive.r2.profession]) || 'Unknown',
        passive1: abilityWithShortCode(passiveAbilityMapping[parsed.recessive.r2.passive1]),
        passive2: abilityWithShortCode(passiveAbilityMapping[parsed.recessive.r2.passive2]),
        active1: abilityWithShortCode(activeAbilityMapping[parsed.recessive.r2.active2]), // SWAP active1/active2
        active2: abilityWithShortCode(activeAbilityMapping[parsed.recessive.r2.active1]),
        statBoost1: statsMapping[parsed.recessive.r2.statBoost1] || 'None',
        statBoost2: statsMapping[parsed.recessive.r2.statBoost2] || 'None',
        element: elementMapping[parsed.recessive.r2.element] || 'Unknown',
      },
    };
  } catch (error) {
    console.error('Error formatting recessive stat genes:', error);
    return null;
  }
};

// Enhanced hero processing function to add gene data
export const enhanceHeroWithGeneData = (hero) => {
  if (!hero) return null;

  try {
    // Create a deep copy of the hero object to avoid modifying the original
    const heroClone = JSON.parse(JSON.stringify(hero));

    // Format growth stats as percentages
    // The API returns values like 4000 which should be displayed as 40%
    const growthStats = {
      primary: {
        STR: Math.round(parseInt(heroClone.strengthGrowthP || 0) / 100),
        AGI: Math.round(parseInt(heroClone.agilityGrowthP || 0) / 100),
        INT: Math.round(parseInt(heroClone.intelligenceGrowthP || 0) / 100),
        WIS: Math.round(parseInt(heroClone.wisdomGrowthP || 0) / 100),
        LCK: Math.round(parseInt(heroClone.luckGrowthP || 0) / 100),
        VIT: Math.round(parseInt(heroClone.vitalityGrowthP || 0) / 100),
        END: Math.round(parseInt(heroClone.enduranceGrowthP || 0) / 100),
        DEX: Math.round(parseInt(heroClone.dexterityGrowthP || 0) / 100),
      },
      secondary: {
        STR: Math.round(parseInt(heroClone.strengthGrowthS || 0) / 100),
        AGI: Math.round(parseInt(heroClone.agilityGrowthS || 0) / 100),
        INT: Math.round(parseInt(heroClone.intelligenceGrowthS || 0) / 100),
        WIS: Math.round(parseInt(heroClone.wisdomGrowthS || 0) / 100),
        LCK: Math.round(parseInt(heroClone.luckGrowthS || 0) / 100),
        VIT: Math.round(parseInt(heroClone.vitalityGrowthS || 0) / 100),
        END: Math.round(parseInt(heroClone.enduranceGrowthS || 0) / 100),
        DEX: Math.round(parseInt(heroClone.dexterityGrowthS || 0) / 100),
      },
    };

    // Ability genes - make sure to convert to number if needed
    const abilityGenes = {
      active1: {
        name: activeAbilityMapping[parseInt(heroClone.active1) || 0] || 'Unknown',
        description: getAbilityDescription(parseInt(heroClone.active1) || 0),
      },
      active2: {
        name: activeAbilityMapping[parseInt(heroClone.active2) || 0] || 'Unknown',
        description: getAbilityDescription(parseInt(heroClone.active2) || 0),
      },
      passive1: {
        name: passiveAbilityMapping[parseInt(heroClone.passive1) || 0] || 'Unknown',
        description: getAbilityDescription(parseInt(heroClone.passive1) || 0, true),
      },
      passive2: {
        name: passiveAbilityMapping[parseInt(heroClone.passive2) || 0] || 'Unknown',
        description: getAbilityDescription(parseInt(heroClone.passive2) || 0, true),
      },
    };

    // Parse recessive genes - only if the gene strings are valid
    let recessiveStatGenes = {};
    let statGenes = null;

    // Store the original gene data for fallback parsing
    const originalStatGenes = heroClone.statGenes;

    // Try to parse the stat genes directly
    if (originalStatGenes) {
      try {
        if (typeof originalStatGenes === 'object' && originalStatGenes.recessive) {
          // Already parsed object
          statGenes = originalStatGenes;
          recessiveStatGenes = formatRecessiveStatGenes(originalStatGenes);
        } else {
          // Parse from raw string/number
          statGenes = parseStatGenes(originalStatGenes);
          recessiveStatGenes = formatRecessiveStatGenes(originalStatGenes);
        }
        recessiveStatGenes = recessiveStatGenes || {};
      } catch (error) {
        console.error('Error handling stat genes:', error);
        statGenes = null;
        recessiveStatGenes = {};
      }
    }

    // Return the enhanced hero data with raw gene data for fallback parsing
    return {
      ...heroClone,
      growthStats,
      abilityGenes,
      recessiveStatGenes,
      statGenes, // Add this for HeroCard compatibility

      // Store the raw gene data in multiple formats for fallback parsing
      originalStatGenes: originalStatGenes,
      statGenesRaw: originalStatGenes ? originalStatGenes.toString() : null,
      formattedRecessiveGenes: {
        stat: recessiveStatGenes,
      },
    };
  } catch (error) {
    console.error('Error enhancing hero with gene data:', error);
    // Return the original hero object if there's an error
    return hero;
  }
};
