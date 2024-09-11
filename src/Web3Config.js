import Web3 from 'web3';
import HeroCoreDiamondABIFile from './HeroCoreDiamond.json';
import HONKMarketplaceABIFile from './HONKMarketplaceABI.json';
import HONKTokenABIFile from './HONKTokenABI.json';

let web3;
let DFKHeroContract;
let HONKMarketplaceContract;
let HONKTokenContract;
let isInitialized = false;

const DFK_TESTNET_CHAIN_ID = 335;
const DFK_TESTNET_RPC = process.env.REACT_APP_DFK_TESTNET_RPC;

const initWeb3 = async () => {
  if (typeof window.ethereum !== 'undefined') {
    web3 = new Web3(window.ethereum);
  } else {
    web3 = new Web3(new Web3.providers.HttpProvider(DFK_TESTNET_RPC));
  }
  return web3;
};

const initializeContracts = async () => {
  if (isInitialized) return;

  if (!web3) {
    web3 = await initWeb3();
  }

  const DFKHeroAddress = process.env.REACT_APP_DFK_HERO_ADDRESS;
  const HONKMarketplaceAddress = process.env.REACT_APP_HONK_MARKETPLACE_ADDRESS;
  const HONKTokenAddress = process.env.REACT_APP_HONK_TOKEN_ADDRESS;

  if (!DFKHeroAddress || !HONKMarketplaceAddress || !HONKTokenAddress) {
    throw new Error('One or more contract addresses are not set in environment variables');
  }

  console.log('Initializing contracts with addresses:');
  console.log('DFKHeroAddress:', DFKHeroAddress);
  console.log('HONKMarketplaceAddress:', HONKMarketplaceAddress);
  console.log('HONKTokenAddress:', HONKTokenAddress);

  try {
    const HeroCoreDiamondABI = HeroCoreDiamondABIFile.abi || HeroCoreDiamondABIFile;
    const HONKMarketplaceABI = HONKMarketplaceABIFile.abi || HONKMarketplaceABIFile;
    const HONKTokenABI = HONKTokenABIFile.abi || HONKTokenABIFile;

    DFKHeroContract = new web3.eth.Contract(HeroCoreDiamondABI, DFKHeroAddress);
    HONKMarketplaceContract = new web3.eth.Contract(HONKMarketplaceABI, HONKMarketplaceAddress);
    HONKTokenContract = new web3.eth.Contract(HONKTokenABI, HONKTokenAddress);

    console.log('Contracts initialized. Checking addresses:');
    console.log('DFKHeroContract address:', DFKHeroContract.options.address);
    console.log('HONKMarketplaceContract address:', HONKMarketplaceContract.options.address);
    console.log('HONKTokenContract address:', HONKTokenContract.options.address);

    if (
      !DFKHeroContract.options.address ||
      !HONKMarketplaceContract.options.address ||
      !HONKTokenContract.options.address
    ) {
      throw new Error('One or more contracts failed to initialize properly');
    }

    isInitialized = true;
    console.log('All contracts initialized successfully');
  } catch (error) {
    console.error('Error initializing contracts:', error);
    throw error;
  }
};

const checkNetwork = async () => {
  try {
    if (!web3) {
      web3 = await initWeb3();
    }
    const chainId = await web3.eth.getChainId();
    const chainIdNumber = typeof chainId === 'bigint' ? Number(chainId) : chainId;
    const isCorrectNetwork = chainIdNumber === DFK_TESTNET_CHAIN_ID;
    return isCorrectNetwork;
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
};

const validateContracts = () => {
  if (!HONKMarketplaceContract || !HONKTokenContract || !DFKHeroContract) {
    console.error('One or more contracts are not initialized correctly');
    return false;
  }
  return true;
};

const checkMetaMaskConnection = async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      return accounts.length > 0;
    } catch (error) {
      console.error('Error checking MetaMask connection:', error);
      return false;
    }
  } else {
    console.error('MetaMask is not installed');
    return false;
  }
};

const reinitializeContracts = async () => {
  try {
    await initWeb3();
    await initializeContracts();
  } catch (error) {
    console.error('Error reinitializing contracts:', error);
    throw error;
  }
};

// Remove or export unused functions:
export const formatPrice = (price) => {
  /* ... */
};
export const compareBN = (a, b) => {
  /* ... */
};
export const getHONKTokenAddress = () => {
  /* ... */
};
export const checkNetworkStatus = async () => {
  /* ... */
};
export const checkBlockSyncing = async () => {
  /* ... */
};
export const getLatestBlock = async () => {
  /* ... */
};
export const checkGasPrice = async () => {
  /* ... */
};

// If these functions are not needed elsewhere, you can remove them entirely

// Single export statement at the end of the file
export {
  initWeb3,
  initializeContracts,
  checkNetwork,
  validateContracts,
  checkMetaMaskConnection,
  reinitializeContracts,
  web3,
  HONKTokenContract,
  DFKHeroContract,
  HONKMarketplaceContract,
  isInitialized, // Export this variable
};

// Use the new function instead of directly accessing the contract
// console.log('HONK Token Address:', getHONKTokenAddress());
