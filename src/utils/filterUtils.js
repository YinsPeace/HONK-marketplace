export const applyFiltersAndSort = (heroes, filters, sortOrder, isSellTab = false) => {
  console.log('Applying filters and sort:');
  console.log('Heroes:', heroes);
  console.log('Filters:', filters);
  console.log('Sort order:', sortOrder);
  console.log('Is Sell Tab:', isSellTab);

  const filteredHeroes = heroes.filter((hero) => {
    console.log('Filtering hero:', hero.id);
    const heroAttributes = {
      heroClass: hero.attributes.find((attr) => attr.trait_type === 'Class')?.value,
      heroSubClass: hero.attributes.find((attr) => attr.trait_type === 'Sub Class')?.value,
      heroProfession: hero.attributes.find((attr) => attr.trait_type === 'Profession')?.value,
      heroCraft1: hero.attributes.find((attr) => attr.trait_type === 'Crafting 1')?.value,
      heroCraft2: hero.attributes.find((attr) => attr.trait_type === 'Crafting 2')?.value,
      heroRarity: hero.attributes.find((attr) => attr.trait_type === 'Rarity')?.value,
      heroRarityNumber: ['Common', 'Uncommon', 'Rare', 'Legendary', 'Mythic'].indexOf(
        hero.attributes.find((attr) => attr.trait_type === 'Rarity')?.value
      ),
      heroGeneration: parseInt(
        hero.attributes.find((attr) => attr.trait_type === 'Generation')?.value
      ),
      heroLevel: parseInt(hero.attributes.find((attr) => attr.trait_type === 'Level')?.value),
    };
    console.log('Hero attributes:', heroAttributes);

    let matches = true;

    // Apply class filter
    if (filters.class && filters.class.length > 0) {
      matches = matches && filters.class.includes(heroAttributes.heroClass);
      console.log('Class filter applied:', matches);
    }

    // Apply subclass filter
    if (filters.subclass && filters.subclass.length > 0) {
      matches = matches && filters.subclass.includes(heroAttributes.heroSubClass);
      console.log('Subclass filter applied:', matches);
    }

    // Apply profession filter
    if (filters.profession && filters.profession.length > 0) {
      matches = matches && filters.profession.includes(heroAttributes.heroProfession);
      console.log('Profession filter applied:', matches);
    }

    // Apply crafting filters
    if (filters.crafting1 && filters.crafting1.length > 0) {
      matches = matches && filters.crafting1.includes(heroAttributes.heroCraft1);
      console.log('Crafting1 filter applied:', matches);
    }
    if (filters.crafting2 && filters.crafting2.length > 0) {
      matches = matches && filters.crafting2.includes(heroAttributes.heroCraft2);
      console.log('Crafting2 filter applied:', matches);
    }

    // Apply range filters
    if (
      heroAttributes.heroRarityNumber < filters.rarityMin ||
      heroAttributes.heroRarityNumber > filters.rarityMax
    ) {
      matches = false;
      console.log('Rarity filter applied:', matches);
    }
    if (
      heroAttributes.heroGeneration < filters.generationMin ||
      heroAttributes.heroGeneration > filters.generationMax
    ) {
      matches = false;
      console.log('Generation filter applied:', matches);
    }
    if (
      heroAttributes.heroLevel < filters.levelMin ||
      heroAttributes.heroLevel > filters.levelMax
    ) {
      matches = false;
      console.log('Level filter applied:', matches);
    }

    // Apply hide options
    if (filters.hideQuesting && hero.isOnQuest) {
      matches = false;
      console.log('Hide questing filter applied:', matches);
    }
    if (filters.hideListedHeroes && hero.isForSale) {
      matches = false;
      console.log('Hide listed heroes filter applied:', matches);
    }

    console.log(`Hero ${hero.id} matches filters:`, matches);
    return matches;
  });

  console.log('Filtered heroes:', filteredHeroes);

  const sortedHeroes = filteredHeroes.sort((a, b) => {
    // Prioritize listed heroes in SellTab
    if (isSellTab) {
      if (a.isForSale && !b.isForSale) return -1;
      if (!a.isForSale && b.isForSale) return 1;
    }

    const getAttributeValue = (hero, attribute) => {
      return hero.attributes.find((attr) => attr.trait_type === attribute)?.value;
    };

    switch (sortOrder) {
      case 'price-asc':
        return parseFloat(a.price) - parseFloat(b.price);
      case 'price-desc':
        return parseFloat(b.price) - parseFloat(a.price);
      case 'generation-asc':
        return (
          parseInt(getAttributeValue(a, 'Generation')) -
          parseInt(getAttributeValue(b, 'Generation'))
        );
      case 'generation-desc':
        return (
          parseInt(getAttributeValue(b, 'Generation')) -
          parseInt(getAttributeValue(a, 'Generation'))
        );
      case 'rarity-asc':
        return (
          ['Common', 'Uncommon', 'Rare', 'Legendary', 'Mythic'].indexOf(
            getAttributeValue(a, 'Rarity')
          ) -
          ['Common', 'Uncommon', 'Rare', 'Legendary', 'Mythic'].indexOf(
            getAttributeValue(b, 'Rarity')
          )
        );
      case 'rarity-desc':
        return (
          ['Common', 'Uncommon', 'Rare', 'Legendary', 'Mythic'].indexOf(
            getAttributeValue(b, 'Rarity')
          ) -
          ['Common', 'Uncommon', 'Rare', 'Legendary', 'Mythic'].indexOf(
            getAttributeValue(a, 'Rarity')
          )
        );
      case 'level-asc':
        return parseInt(getAttributeValue(a, 'Level')) - parseInt(getAttributeValue(b, 'Level'));
      case 'level-desc':
        return parseInt(getAttributeValue(b, 'Level')) - parseInt(getAttributeValue(a, 'Level'));
      default:
        return 0;
    }
  });

  console.log('Sorted heroes:', sortedHeroes);
  return sortedHeroes;
};
