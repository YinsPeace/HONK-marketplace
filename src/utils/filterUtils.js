export const applyFiltersAndSort = (heroes, filters, sortOrder) => {
  console.log('Applying filters to heroes:', heroes);
  console.log('Filters:', filters);
  console.log('Sort order:', sortOrder);

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

    // Apply checkbox filters
    const checkboxFilters = ['class', 'subclass', 'profession', 'crafting1', 'crafting2'];
    checkboxFilters.forEach((filterType) => {
      if (filters[filterType] && filters[filterType].length > 0) {
        const heroValue =
          heroAttributes[`hero${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`];
        if (!filters[filterType].includes(heroValue)) {
          matches = false;
        }
      }
    });

    // Apply range filters
    if (
      heroAttributes.heroRarityNumber < filters.rarityMin ||
      heroAttributes.heroRarityNumber > filters.rarityMax
    ) {
      matches = false;
    }
    if (
      heroAttributes.heroGeneration < filters.generationMin ||
      heroAttributes.heroGeneration > filters.generationMax
    ) {
      matches = false;
    }
    if (
      heroAttributes.heroLevel < filters.levelMin ||
      heroAttributes.heroLevel > filters.levelMax
    ) {
      matches = false;
    }

    // Apply hide options
    if (filters.hideQuesting && hero.isOnQuest) {
      matches = false;
    }
    if (filters.hideListedHeroes && hero.isForSale) {
      matches = false;
    }

    console.log(`Hero ${hero.id} matches filters:`, matches);
    return matches;
  });

  console.log('Filtered heroes:', filteredHeroes);

  const sortedHeroes = filteredHeroes.sort((a, b) => {
    if (sortOrder === 'price-asc') {
      return parseFloat(a.price) - parseFloat(b.price);
    } else if (sortOrder === 'price-desc') {
      return parseFloat(b.price) - parseFloat(a.price);
    }
    return 0;
  });

  console.log('Sorted heroes:', sortedHeroes);
  return sortedHeroes;
};
