import Web3 from 'web3';
import HeroCoreDiamondABIFile from './HeroCoreDiamond.json';
import HONKMarketplaceABIFile from './HONKMarketplaceABI.json';
import HONKTokenABIFile from './HONKTokenABI.json';
import { RPCProvider } from './config/rpcConfig';
import contractAddresses from './contractAddresses.json';

let readWeb3; // For read operations
let web3; // For write operations (using wallet provider)
let DFKHeroContract;
let HONKMarketplaceContract;
let HONKTokenContract;
let isInitialized = false;
let rpcProvider;

const DFK_MAINNET_CHAIN_ID = 53935; // DFK Chain Mainnet

// Keep track of contract instances to clean them up
let contractInstances = [];

const handleBigIntSerialization = () => {
  // Add BigInt serialization support
  BigInt.prototype.toJSON = function() {
    return this.toString();
  };
};

const cleanupContracts = () => {
  if (web3?.currentProvider?.removeAllListeners) {
    web3.currentProvider.removeAllListeners();
  }

  contractInstances.forEach((contract) => {
    if (contract?.subscriptionManager?.unsubscribeAll) {
      contract.subscriptionManager.unsubscribeAll();
    }
  });
  contractInstances = [];
  isInitialized = false;
};

const initWeb3 = async () => {
  try {
    // Initialize BigInt serialization
    handleBigIntSerialization();

    // Initialize RPC provider with rotation capability
    rpcProvider = new RPCProvider();

    // Initialize read-only provider with fallback capability
    const initReadWeb3 = async (rpcUrl) => {
      const provider = new Web3.providers.HttpProvider(rpcUrl);
      return new Web3(provider);
    };

    readWeb3 = await rpcProvider.executeWithFallback(initReadWeb3);

    // Initialize wallet provider for transactions
    if (typeof window.ethereum !== 'undefined') {
      web3 = new Web3(window.ethereum);
      readWeb3 = web3;
      return web3;
    } else {
      readWeb3 = new Web3(new Web3.providers.HttpProvider(RPCProvider.RPC_ENDPOINTS[0]));
      return readWeb3;
    }
  } catch (error) {
    return null;
  }
};

const initializeContracts = async () => {
  if (!web3) {
    web3 = await initWeb3();
  }

  // Clean up existing contracts before initializing new ones
  cleanupContracts();

  try {
    const HONKMarketplaceAddress = contractAddresses.HONKMarketplace;
    const HONKTokenAddress = contractAddresses.HONKToken;
    const DFKHeroAddress = '0xEb9B61B145D6489Be575D3603F4a704810e143dF'; // DFK Hero contract on mainnet

    if (!DFKHeroAddress || !HONKMarketplaceAddress || !HONKTokenAddress) {
      throw new Error('One or more contract addresses are not set in contractAddresses.json');
    }

    const HeroCoreDiamondABI = HeroCoreDiamondABIFile.abi || HeroCoreDiamondABIFile;
    const HONKMarketplaceABI = HONKMarketplaceABIFile.abi || HONKMarketplaceABIFile;
    const HONKTokenABI = HONKTokenABIFile.abi || HONKTokenABIFile;

    HONKTokenContract = new web3.eth.Contract(HONKTokenABI, HONKTokenAddress);
    DFKHeroContract = new web3.eth.Contract(HeroCoreDiamondABI, DFKHeroAddress);
    HONKMarketplaceContract = new web3.eth.Contract(
      HONKMarketplaceABI,
      HONKMarketplaceAddress
    );

    const readOnlyDFKHeroContract = new readWeb3.eth.Contract(HeroCoreDiamondABI, DFKHeroAddress);
    const readOnlyHONKMarketplaceContract = new readWeb3.eth.Contract(
      HONKMarketplaceABI,
      HONKMarketplaceAddress
    );
    const readOnlyHONKTokenContract = new readWeb3.eth.Contract(HONKTokenABI, HONKTokenAddress);

    DFKHeroContract.methods.readOnly = readOnlyDFKHeroContract.methods;
    HONKMarketplaceContract.methods.readOnly = readOnlyHONKMarketplaceContract.methods;
    HONKTokenContract.methods.readOnly = readOnlyHONKTokenContract.methods;

    contractInstances.push(DFKHeroContract);
    contractInstances.push(HONKMarketplaceContract);
    contractInstances.push(HONKTokenContract);

    if (
      !DFKHeroContract.options.address ||
      !HONKMarketplaceContract.options.address ||
      !HONKTokenContract.options.address
    ) {
      throw new Error('One or more contracts failed to initialize properly');
    }

    isInitialized = true;
    return true;
  } catch (error) {
    return false;
  }
};

const checkNetwork = async () => {
  try {
    if (!web3) {
      web3 = await initWeb3();
    }
    const chainId = await web3.eth.getChainId();
    const chainIdNumber = typeof chainId === 'bigint' ? Number(chainId) : chainId;
    const isCorrectNetwork = chainIdNumber === DFK_MAINNET_CHAIN_ID;
    return isCorrectNetwork;
  } catch (error) {
    return false;
  }
};

const validateContracts = () => {
  if (!HONKTokenContract || !DFKHeroContract || !HONKMarketplaceContract) {
    return false;
  }
  return true;
};

const checkMetaMaskConnection = async () => {
  try {
    if (typeof window.ethereum !== 'undefined') {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      return accounts.length > 0;
    }
    return false;
  } catch (error) {
    return false;
  }
};

const reinitializeContracts = async () => {
  try {
    await initWeb3();
    await initializeContracts();
    return true;
  } catch (error) {
    return false;
  }
};

export {
  initWeb3,
  initializeContracts,
  checkNetwork,
  validateContracts,
  checkMetaMaskConnection,
  reinitializeContracts,
  web3,
  readWeb3,
  HONKTokenContract,
  DFKHeroContract,
  HONKMarketplaceContract,
  isInitialized,
};
