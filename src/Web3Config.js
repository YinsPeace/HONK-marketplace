import Web3 from 'web3';
import HeroCoreDiamondABIFile from './HeroCoreDiamond.json';
import HONKMarketplaceABIFile from './HONKMarketplaceABI.json';
import HONKTokenABIFile from './HONKTokenABI.json';
import { RPCProvider } from './config/rpcConfig';
import contractAddresses from './contractAddresses.json';
import { updateApolloClientNetwork } from './apolloClient';

// Ensure ABI contains private-sale listing functions (may be missing if ABI not refreshed)
const ensurePrivateSaleAbi = (abi) => {
  if (!Array.isArray(abi)) return;
  const hasListPrivate = abi.some((item) => item.name === 'listHeroPrivate');
  if (!hasListPrivate) {
    abi.push(
      {
        inputs: [
          { internalType: 'uint256', name: '_heroId', type: 'uint256' },
          { internalType: 'uint256', name: '_price', type: 'uint256' },
          { internalType: 'address', name: '_allowedBuyer', type: 'address' },
        ],
        name: 'listHeroPrivate',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          { internalType: 'uint256[]', name: '_heroIds', type: 'uint256[]' },
          { internalType: 'uint256[]', name: '_prices', type: 'uint256[]' },
          { internalType: 'address', name: '_allowedBuyer', type: 'address' },
        ],
        name: 'bulkListHeroesPrivate',
        outputs: [
          { internalType: 'uint256', name: '', type: 'uint256' },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
      }
    );
  }
};

// Patch ABI at module load
ensurePrivateSaleAbi(HONKMarketplaceABIFile.abi);

let readWeb3; // For read operations
let web3; // For write operations (using wallet provider)
let DFKHeroContract;
let HONKMarketplaceContract;
let HONKTokenContract;
let isInitialized = false;
let rpcProvider;

const DFK_MAINNET_CHAIN_ID = 53935; // DFK Chain Mainnet
const DFK_TESTNET_CHAIN_ID = 335; // DFK Chain Testnet

// Keep track of contract instances to clean them up
let contractInstances = [];

const handleBigIntSerialization = () => {
  // Add BigInt serialization support
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
};

// Promise timeout helper to avoid indefinite hangs
const withTimeout = (promise, ms, label = 'timeout') =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(label)), ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });

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

    // Get current network ID to determine which RPC endpoints to use
    let chainId = 53935; // Default to mainnet
    if (typeof window !== 'undefined' && window.ethereum?.request) {
      try {
        const currentChainId = await withTimeout(
          window.ethereum.request({ method: 'eth_chainId' }),
          1500,
          'eth_chainId timeout'
        );
        chainId = parseInt(currentChainId, 16) || 53935;
      } catch (error) {
        console.warn('Could not get chain ID from wallet, using mainnet default');
      }
    }

    // Initialize RPC provider with network-specific endpoints
    rpcProvider = new RPCProvider(chainId);

    // Initialize read-only provider with fallback capability (for no-wallet environments)
    const initReadWeb3 = async (rpcUrl) => {
      // Add a timeout to avoid long stalls on slow RPCs
      const provider = new Web3.providers.HttpProvider(rpcUrl, { timeout: 10000 });
      return new Web3(provider);
    };

    // Initialize wallet provider for transactions
    if (typeof window.ethereum !== 'undefined') {
      web3 = new Web3(window.ethereum);
      // Use wallet provider for reads to avoid CORS issues against public RPCs in the browser
      readWeb3 = web3;
      return web3;
    } else {
      // No wallet available: use RPC provider for both reads and writes
      readWeb3 = await rpcProvider.executeWithFallback(initReadWeb3);
      web3 = readWeb3;
      return readWeb3;
    }
  } catch (error) {
    console.error('Failed to initialize Web3:', error);
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
    // Get current network to determine which contract addresses to use
    let chainId;
    try {
      const cid = await withTimeout(web3.eth.getChainId(), 4000, 'getChainId timeout');
      chainId = cid;
    } catch (e) {
      console.warn('getChainId timed out or failed, defaulting to mainnet');
      chainId = DFK_MAINNET_CHAIN_ID;
    }
    const chainIdNumber = typeof chainId === 'bigint' ? Number(chainId) : chainId;
    const chainIdString = chainIdNumber.toString();

    // Update Apollo client for the current network
    await updateApolloClientNetwork();

    // Update RPC provider for the current network
    if (rpcProvider) {
      rpcProvider.updateNetwork(chainIdNumber);

      // If we are not using a wallet provider, reinitialize readWeb3 with the correct network RPC
      if (!(typeof window !== 'undefined' && window.ethereum)) {
        const initReadWeb3 = async (rpcUrl) => {
          const provider = new Web3.providers.HttpProvider(rpcUrl, { timeout: 10000 });
          return new Web3(provider);
        };
        readWeb3 = await rpcProvider.executeWithFallback(initReadWeb3);
      } else {
        // Ensure readWeb3 follows the wallet provider when present
        readWeb3 = web3;
      }
    }

    // Get network-specific contract addresses
    const networkAddresses = contractAddresses[chainIdString];
    if (!networkAddresses) {
      throw new Error(`No contract addresses configured for network ${chainIdNumber}`);
    }

    const HONKMarketplaceAddress = networkAddresses.HONKMarketplace;
    const HONKTokenAddress = networkAddresses.HONKToken;
    const DFKHeroAddress = networkAddresses.DFKHero;

    if (!DFKHeroAddress || !HONKMarketplaceAddress || !HONKTokenAddress) {
      throw new Error(`One or more contract addresses are not set for network ${chainIdNumber}`);
    }

    const HeroCoreDiamondABI = HeroCoreDiamondABIFile.abi || HeroCoreDiamondABIFile;
    const HONKMarketplaceABI = HONKMarketplaceABIFile.abi || HONKMarketplaceABIFile;
    const HONKTokenABI = HONKTokenABIFile.abi || HONKTokenABIFile;

    HONKTokenContract = new web3.eth.Contract(HONKTokenABI, HONKTokenAddress);
    DFKHeroContract = new web3.eth.Contract(HeroCoreDiamondABI, DFKHeroAddress);
    HONKMarketplaceContract = new web3.eth.Contract(HONKMarketplaceABI, HONKMarketplaceAddress);

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
    console.error('Contract initialization failed:', error);
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
    const isCorrectNetwork =
      chainIdNumber === DFK_MAINNET_CHAIN_ID || chainIdNumber === DFK_TESTNET_CHAIN_ID;
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
