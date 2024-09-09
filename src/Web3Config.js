import Web3 from 'web3';
import HeroCoreDiamondABI from './HeroCoreDiamond.json';
import HONKMarketplaceABIFile from './HONKMarketplaceABI.json';
import HONKTokenABIFile from './HONKTokenABI.json';
import contractAddresses from './contractAddresses.json';

let web3;
let DFKHeroContract;
let HONKMarketplaceContract;
let HONKTokenContract;

const DFK_TESTNET_CHAIN_ID = 335;
const DFK_TESTNET_RPC = process.env.REACT_APP_DFK_TESTNET_RPC || 'https://subnets.avax.network/defi-kingdoms/dfk-chain-testnet/rpc';

const initWeb3 = async () => {
  // Check if MetaMask is installed
  if (typeof window.ethereum !== 'undefined') {
    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      web3 = new Web3(window.ethereum);

      // Check if we're connected to the correct network
      const chainId = await web3.eth.getChainId();
      if (chainId !== DFK_TESTNET_CHAIN_ID) {
        try {
          // Try to switch to the DFK Testnet
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: Web3.utils.toHex(DFK_TESTNET_CHAIN_ID) }],
          });
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: Web3.utils.toHex(DFK_TESTNET_CHAIN_ID),
                  chainName: 'DFK Chain Testnet',
                  nativeCurrency: {
                    name: 'Jewel',
                    symbol: 'JEWEL',
                    decimals: 18
                  },
                  rpcUrls: [DFK_TESTNET_RPC],
                  blockExplorerUrls: ['https://subnets-test.avax.network/defi-kingdoms/']
                }],
              });
            } catch (addError) {
              console.error('Failed to add the DFK Testnet:', addError);
            }
          } else {
            console.error('Failed to switch to the DFK Testnet:', switchError);
          }
        }
      }
    } catch (error) {
      console.error('Failed to connect to MetaMask:', error);
    }
  } else {
    console.log('MetaMask not detected. Falling back to read-only mode with default provider.');
    web3 = new Web3(new Web3.providers.HttpProvider(DFK_TESTNET_RPC));
  }
  return web3;
};

const initializeContracts = async () => {
  if (!web3) {
    web3 = await initWeb3();
  }

  const DFKHeroAddress = process.env.REACT_APP_DFK_HERO_ADDRESS || '0x3bcaCBeAFefed260d877dbE36378008D4e714c8E';
  const HONKMarketplaceAddress = process.env.REACT_APP_HONK_MARKETPLACE_ADDRESS || contractAddresses.HONKMarketplace;
  const HONKTokenAddress = process.env.REACT_APP_HONK_TOKEN_ADDRESS || contractAddresses.HONKToken;

  DFKHeroContract = new web3.eth.Contract(HeroCoreDiamondABI, DFKHeroAddress);
  HONKMarketplaceContract = new web3.eth.Contract(HONKMarketplaceABIFile, HONKMarketplaceAddress);
  HONKTokenContract = new web3.eth.Contract(HONKTokenABIFile, HONKTokenAddress);
};

export const reinitializeContracts = async () => {
  try {
    await initializeWeb3();
    await initializeContracts();
    console.log('Contracts reinitialized successfully');
  } catch (error) {
    console.error('Error reinitializing contracts:', error);
    throw error;
  }
};

export const formatPrice = (price) => {
  if (!price) return 'N/A';
  try {
    const priceInEther = web3.utils.fromWei(price.toString(), 'ether');
    const formattedPrice = Number(priceInEther).toFixed(1);
    return formattedPrice.endsWith('.0') ? formattedPrice.slice(0, -2) : formattedPrice;
  } catch (error) {
    console.error('Error formatting price:', error);
    return price;
  }
};

export const toBN = (value) => BigInt(value);

export const compareBN = (a, b) => {
  const aBN = toBN(a);
  const bBN = toBN(b);
  return aBN < bBN ? -1 : aBN > bBN ? 1 : 0;
};

export const checkNetwork = async () => {
  try {
    const chainId = await web3.eth.getChainId();
    console.log('Current chain ID:', chainId);
    // Convert chainId to a number if it's a BigInt
    const chainIdNumber = typeof chainId === 'bigint' ? Number(chainId) : chainId;
    const isCorrectNetwork = chainIdNumber === DFK_TESTNET_CHAIN_ID;
    console.log(
      `DFK Testnet Chain ID: ${DFK_TESTNET_CHAIN_ID}, Current Chain ID: ${chainIdNumber}`
    );
    console.log(isCorrectNetwork ? 'Connected to DFK Testnet' : 'Not connected to DFK Testnet');
    return isCorrectNetwork;
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
};

export const validateContracts = () => {
  if (!HONKMarketplaceContract || !HONKTokenContract || !DFKHeroContract) {
    console.error('One or more contracts are not initialized correctly');
    return false;
  }
  return true;
};

export const getCurrentAccount = async () => {
  try {
    const accounts = await web3.eth.getAccounts();
    return accounts[0];
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
};

export const checkMetaMaskConnection = async () => {
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

export { initWeb3, initializeContracts, web3, DFKHeroContract, HONKMarketplaceContract, HONKTokenContract };
