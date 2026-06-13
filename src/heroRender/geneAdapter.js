// Gene-to-hex color tables sourced from dfk-classic/hero-viewer heroes.ts (ISC).
// Numeric gene values from HONK's parseVisualGenes -> hex string without '#'.

import { parseVisualGenes } from '../utils/heroGeneParser';

const skinColorTable = {
  0: 'c58135',
  2: 'f1ca9e',
  4: '985e1c',
  6: '57340c',
  8: 'e6a861',
  10: '7b4a11',
  12: 'e5ac91',
  14: 'aa5c38',
  16: '7db44f',
  18: '7786b8',
  20: 'd8d4d8',
  22: 'e03f3f',
  24: '6a3671',
};

const hairColorTable = {
  0: 'ab9159',
  1: 'af3853',
  2: '578761',
  3: '068483',
  4: '48321e',
  5: '66489e',
  6: 'ca93a7',
  7: '62a7e6',
  8: 'c34b1e',
  9: '326988',
  10: '513f4f',
  11: 'd48b41',
  16: 'd7bc65',
  17: '9b68ab',
  18: '8d6b3a',
  19: '566377',
  20: '275435',
  21: '77b23c',
  24: '880016',
  25: '353132',
  26: 'dbfbf5',
  28: '8f9bb3',
};

const eyeColorTable = {
  0: '203997',
  2: '896693',
  4: 'bb3f55',
  6: '0d7634',
  8: '8d7136',
  10: '613d8a',
  12: '2494a2',
  14: 'a41e12',
};

const appendageColorTable = {
  0: 'c5bfa7',
  1: 'a88b47',
  2: '58381e',
  3: '566f7d',
  4: '2a386d',
  5: '3f2e40',
  6: '830e18',
  7: '6f3a3c',
  8: 'cddef0',
  9: 'df7126',
  10: '835138',
  11: '86a637',
  16: '6b173c',
  17: 'a0304d',
  18: '78547c',
  19: '352a51',
  20: '147256',
  21: 'cf7794',
  24: 'c29d35',
  25: '211f1f',
  26: '77b5cf',
  28: 'd7d7d7',
};

function lookupColor(table, key) {
  const n = parseInt(key, 10);
  return table[n] || table[0] || 'cccccc';
}

// Derives visualGenes sub-object from a HONK hero.
// Two cases:
//   (A) GraphQL hero: flat hairStyle/hairColor/eyeColor/skinColor fields (already numbers)
//   (B) Contract hero: only hero.visualGenes bigint string; parse it fresh
function getVisualGeneNumbers(hero) {
  // Prefer flat fields if present and look like gene indices (0-31)
  if (
    hero.hairStyle !== undefined &&
    hero.hairStyle !== null &&
    !isNaN(parseInt(hero.hairStyle, 10))
  ) {
    return {
      hairStyle: parseInt(hero.hairStyle, 10),
      hairColor: parseInt(hero.hairColor, 10),
      eyeColor: parseInt(hero.eyeColor, 10),
      skinColor: parseInt(hero.skinColor, 10),
      headAppendage: parseInt(hero.headAppendage, 10),
      backAppendage: parseInt(hero.backAppendage, 10),
      appendageColor: parseInt(hero.appendageColor, 10),
      backAppendageColor: parseInt(hero.backAppendageColor, 10),
    };
  }
  // Fall back: parse from visualGenes bigint string
  const parsed = parseVisualGenes(hero.visualGenes);
  if (parsed) {
    return {
      hairStyle: parsed.hairStyle || 0,
      hairColor: parsed.hairColor || 0,
      eyeColor: parsed.eyeColor || 0,
      skinColor: parsed.skinColor || 0,
      headAppendage: parsed.headAppendage || 0,
      backAppendage: parsed.backAppendage || 0,
      appendageColor: parsed.appendageColor || 0,
      backAppendageColor: parsed.backAppendageColor || 0,
    };
  }
  // Safe defaults
  return {
    hairStyle: 0, hairColor: 0, eyeColor: 0, skinColor: 0,
    headAppendage: 0, backAppendage: 0, appendageColor: 0, backAppendageColor: 0,
  };
}

// The renderer's part switches key on camelCase tokens for the multi-word classes
// (darkKnight, spellBow, dreadKnight). A plain toLowerCase would yield darkknight etc,
// miss every case, and render those classes with no clothing. Remap the exceptions.
const CLASS_TOKENS = {
  darkknight: 'darkKnight',
  spellbow: 'spellBow',
  dreadknight: 'dreadKnight',
};

export function adaptHeroToViewerProps(hero) {
  const nums = getVisualGeneNumbers(hero);

  const gender = (hero.gender === 'female' || hero.gender === 3) ? 'female' : 'male';
  const rawClass = (hero.mainClass || hero.class || 'warrior').toLowerCase();
  const heroClass = CLASS_TOKENS[rawClass] || rawClass;
  const background = (hero.background || 'plains').toLowerCase();

  return {
    gender,
    class: heroClass,
    background,
    visualGenes: {
      hairStyle: nums.hairStyle,
      hairColor: lookupColor(hairColorTable, nums.hairColor),
      eyeColor: lookupColor(eyeColorTable, nums.eyeColor),
      skinColor: lookupColor(skinColorTable, nums.skinColor),
      headAppendage: nums.headAppendage,
      appendageColor: lookupColor(appendageColorTable, nums.appendageColor),
      backAppendage: nums.backAppendage,
      backAppendageColor: lookupColor(appendageColorTable, nums.backAppendageColor),
    },
  };
}
