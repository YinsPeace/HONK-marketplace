export const applyFiltersAndSort = (heroes, filters, sortOrder) => {
  console.log('Applying filters to heroes:', heroes, 'with filters:', filters);

  const rarityToNumber = {
    Common: 0,
    Uncommon: 1,
    Rare: 2,
    Legendary: 3,
    Mythic: 4,
  };

  let filtered = heroes.filter((hero) => {
    const heroClass = hero.attributes.find((attr) => attr.trait_type === 'Class')?.value || '';
    const heroSubClass =
      hero.attributes.find((attr) => attr.trait_type === 'Sub Class')?.value || '';
    const heroLevel =
      parseInt(hero.attributes.find((attr) => attr.trait_type === 'Level')?.value) || 0;
    const heroProfession =
      hero.attributes.find((attr) => attr.trait_type === 'Profession')?.value || '';
    const heroRarity = hero.attributes.find((attr) => attr.trait_type === 'Rarity')?.value || '';
    const heroRarityNumber = rarityToNumber[heroRarity] || 0;
    const heroGeneration =
      parseInt(hero.attributes.find((attr) => attr.trait_type === 'Generation')?.value) || 0;
    const heroCraft1 =
      hero.attributes.find((attr) => attr.trait_type === 'Crafting 1')?.value || '';
    const heroCraft2 =
      hero.attributes.find((attr) => attr.trait_type === 'Crafting 2')?.value || '';

    console.log('Hero attributes:', {
      heroClass,
      heroSubClass,
      heroLevel,
      heroProfession,
      heroRarity,
      heroRarityNumber,
      heroGeneration,
      heroCraft1,
      heroCraft2,
    });

    const matchesClass = filters.class.length === 0 || filters.class.includes(heroClass);
    const matchesSubclass =
      filters.subclass.length === 0 || filters.subclass.includes(heroSubClass);
    const matchesProfession =
      filters.profession.length === 0 ||
      filters.profession.some((prof) => prof.toLowerCase() === heroProfession.toLowerCase());
    const matchesCraft1 = filters.crafting1.length === 0 || filters.crafting1.includes(heroCraft1);
    const matchesCraft2 = filters.crafting2.length === 0 || filters.crafting2.includes(heroCraft2);
    const matchesRarity =
      heroRarityNumber >= filters.rarityMin && heroRarityNumber <= filters.rarityMax;
    const matchesGeneration =
      heroGeneration >= filters.generationMin && heroGeneration <= filters.generationMax;
    const matchesLevel = heroLevel >= filters.levelMin && heroLevel <= filters.levelMax;
    const matchesQuesting = !filters.hideQuesting || !hero.isOnQuest;
    const matchesListed = !filters.hideListedHeroes || !hero.isForSale;

    console.log('Filter matches:', {
      matchesClass,
      matchesSubclass,
      matchesProfession,
      matchesCraft1,
      matchesCraft2,
      matchesRarity,
      matchesGeneration,
      matchesLevel,
      matchesQuesting,
      matchesListed,
    });

    return (
      matchesClass &&
      matchesSubclass &&
      matchesProfession &&
      matchesCraft1 &&
      matchesCraft2 &&
      matchesRarity &&
      matchesGeneration &&
      matchesLevel &&
      matchesQuesting &&
      matchesListed
    );
  });

  console.log('Filtered heroes:', filtered);

  // Sorting logic
  filtered.sort((a, b) => {
    const priceA = typeof a.price === 'bigint' ? a.price : BigInt(a.price || '0');
    const priceB = typeof b.price === 'bigint' ? b.price : BigInt(b.price || '0');

    if (sortOrder === 'price-asc') {
      return priceA > priceB ? 1 : priceA < priceB ? -1 : 0;
    } else if (sortOrder === 'price-desc') {
      return priceB > priceA ? 1 : priceB < priceA ? -1 : 0;
    }
    return 0;
  });

  console.log('Sorted heroes:', filtered);

  return filtered;
};
