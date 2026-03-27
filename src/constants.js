// App configuration constants
export const APP_VERSION = process.env.REACT_APP_VERSION || 'dev';

// When true, hero data is fetched directly from on-chain contracts (getHeroesV3 / getUserHeroes)
// instead of the DeFi Kingdoms GraphQL API (which is no longer available).
// Override with REACT_APP_CONTRACT_ONLY_MODE=false in .env to revert to the GraphQL path.
export const CONTRACT_ONLY_MODE =
  process.env.REACT_APP_CONTRACT_ONLY_MODE ?? 'true';