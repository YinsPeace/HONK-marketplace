import React, { createContext, useContext, useState, useCallback } from 'react';

const HeroContext = createContext();

export const HeroProvider = ({ children }) => {
  const [heroCache, setHeroCache] = useState({
    owned: new Map(),
    market: new Map(),
    dfk: new Map(),
    lastFetched: {
      owned: null,
      market: null,
      dfk: null,
    },
  });

  const [cacheStats, setCacheStats] = useState({
    hits: 0,
    misses: 0,
    types: {
      owned: { hits: 0, misses: 0 },
      market: { hits: 0, misses: 0 },
      dfk: { hits: 0, misses: 0 },
    },
  });

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const getCachedHeroes = useCallback(
    (type) => {
      const cache = heroCache[type];
      const lastFetch = heroCache.lastFetched[type];

      if (lastFetch && Date.now() - lastFetch < CACHE_DURATION) {
        const heroes = Array.from(cache.values());
        setCacheStats((prev) => ({
          ...prev,
          hits: prev.hits + 1,
          types: {
            ...prev.types,
            [type]: {
              hits: prev.types[type].hits + 1,
              misses: prev.types[type].misses,
            },
          },
        }));
        return heroes;
      }

      setCacheStats((prev) => ({
        ...prev,
        misses: prev.misses + 1,
        types: {
          ...prev.types,
          [type]: {
            hits: prev.types[type].hits,
            misses: prev.types[type].misses + 1,
          },
        },
      }));
      return null;
    },
    [heroCache]
  );

  const updateHeroCache = useCallback((type, heroes) => {
    if (!heroes || heroes.length === 0) return;

    setHeroCache((prev) => {
      const newCache = new Map();
      heroes.forEach((hero) => {
        if (hero?.id) {
          newCache.set(hero.id, hero);
        }
      });

      return {
        ...prev,
        [type]: newCache,
        lastFetched: {
          ...prev.lastFetched,
          [type]: Date.now(),
        },
      };
    });
  }, []);

  const clearCache = useCallback((type) => {
    setHeroCache((prev) => ({
      ...prev,
      [type]: new Map(),
      lastFetched: {
        ...prev.lastFetched,
        [type]: null,
      },
    }));
  }, []);

  const value = {
    getCachedHeroes,
    updateHeroCache,
    clearCache,
    cacheStats,
  };

  return <HeroContext.Provider value={value}>{children}</HeroContext.Provider>;
};

export const useHeroCache = () => {
  const context = useContext(HeroContext);
  if (!context) {
    throw new Error('useHeroCache must be used within a HeroProvider');
  }
  return context;
};
