// Network configuration for DFK Chain
export const DFK_TESTNET_CONFIG = {
  chainId: '0x14F', // 335 in hex
  chainName: 'DFK Chain Testnet',
  nativeCurrency: {
    name: 'JEWEL',
    symbol: 'JEWEL',
    decimals: 18,
  },
  rpcUrls: ['https://subnets.avax.network/defi-kingdoms/dfk-chain-testnet/rpc'],
  blockExplorerUrls: ['https://explorer-testnet.dfkchain.com/'],
};

export const DFK_MAINNET_CONFIG = {
  chainId: '0xD2AF', // 53935 in hex
  chainName: 'DFK Chain',
  nativeCurrency: {
    name: 'JEWEL',
    symbol: 'JEWEL',
    decimals: 18,
  },
  rpcUrls: ['https://subnets.avax.network/defi-kingdoms/dfk-chain/rpc'],
  blockExplorerUrls: ['https://explorer.dfkchain.com/'],
};

// Function to add DFK Chain Testnet to MetaMask
export const addDFKTestnetToWallet = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    // Try to switch to the network first
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: DFK_TESTNET_CONFIG.chainId }],
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [DFK_TESTNET_CONFIG],
        });
      } catch (addError) {
        throw new Error('Failed to add DFK Chain Testnet to wallet');
      }
    } else {
      throw switchError;
    }
  }
};

// Function to add DFK Chain Mainnet to MetaMask
export const addDFKMainnetToWallet = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    // Try to switch to the network first
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: DFK_MAINNET_CONFIG.chainId }],
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [DFK_MAINNET_CONFIG],
        });
      } catch (addError) {
        throw new Error('Failed to add DFK Chain Mainnet to wallet');
      }
    } else {
      throw switchError;
    }
  }
};

// Function to check current network
export const getCurrentChainId = async () => {
  if (!window.ethereum) {
    return null;
  }

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    return parseInt(chainId, 16);
  } catch (error) {
    console.error('Error getting chain ID:', error);
    return null;
  }
};

// Function to check if user is on correct network
export const isOnDFKTestnet = async () => {
  const chainId = await getCurrentChainId();
  return chainId === 335;
};

export const isOnDFKMainnet = async () => {
  const chainId = await getCurrentChainId();
  return chainId === 53935;
};
