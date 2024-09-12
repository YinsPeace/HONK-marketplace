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
        let heroValue;
        if (filterType === 'subclass') {
          heroValue = heroAttributes.heroSubClass;
        } else {
          heroValue =
            heroAttributes[`hero${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`];
        }
        console.log(`Checking ${filterType}:`, {
          filterValues: filters[filterType],
          heroValue: heroValue,
        });
        if (!filters[filterType].includes(heroValue)) {
          matches = false;
          console.log(`${filterType} doesn't match`);
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
