import { useState, useEffect, useCallback } from 'react';
import {
  initWeb3,
  checkNetwork,
  reinitializeContracts,
  HONKTokenContract,
} from '../Web3Config';

export const useWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState(null);
  const [honkBalance, setHonkBalance] = useState('0');
  const [error, setError] = useState(null);

  const checkConnection = useCallback(async () => {
    try {
      const web3 = await initWeb3();
      if (!web3) {
        setIsConnected(false);
        setConnectedAddress(null);
        return false;
      }

      const accounts = await web3.eth.getAccounts();
      const isConnected = accounts.length > 0;
      setIsConnected(isConnected);

      if (isConnected) {
        setConnectedAddress(accounts[0]);
        const networkCheck = await checkNetwork();
        setIsCorrectNetwork(networkCheck);
        return true;
      } else {
        setConnectedAddress(null);
        setIsCorrectNetwork(false);
        return false;
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      setIsConnected(false);
      setConnectedAddress(null);
      setIsCorrectNetwork(false);
      return false;
    }
  }, []);

  useEffect(() => {
    const checkWalletConnection = async () => {
      if (typeof window.ethereum === 'undefined') {
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setIsConnected(true);
        setConnectedAddress(accounts[0]);
        const networkCheck = await checkNetwork();
        setIsCorrectNetwork(networkCheck);
        await reinitializeContracts();
      } else {
        setIsConnected(false);
        setConnectedAddress(null);
      }
    };

    checkWalletConnection();
  }, []);

  useEffect(() => {
    if (typeof window.ethereum === 'undefined') return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        setIsConnected(false);
        setConnectedAddress(null);
        setIsCorrectNetwork(false);
      } else {
        setIsConnected(true);
        setConnectedAddress(accounts[0]);
        const networkCheck = await checkNetwork();
        setIsCorrectNetwork(networkCheck);
        await reinitializeContracts();
      }
    };

    const handleChainChanged = async () => {
      const networkCheck = await checkNetwork();
      setIsCorrectNetwork(networkCheck);
      if (networkCheck) {
        await reinitializeContracts();
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask is not installed');
      return false;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setIsConnected(true);
        setConnectedAddress(accounts[0]);
        const networkCheck = await checkNetwork();
        setIsCorrectNetwork(networkCheck);
        if (networkCheck) {
          await reinitializeContracts();
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('[useWallet] Connection error:', error);
      setError(error.message);
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setConnectedAddress(null);
    setHonkBalance('0');
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed');
      return false;
    }

    const chainIdHex = '0x' + (53935).toString(16);
    const networkConfig = {
      chainId: chainIdHex,
      chainName: 'DFK Chain',
      nativeCurrency: {
        name: 'JEWEL',
        symbol: 'JEWEL',
        decimals: 18,
      },
      rpcUrls: ['https://subnets.avax.network/defi-kingdoms/dfk-chain/rpc'],
      blockExplorerUrls: ['https://subnets.avax.network/defi-kingdoms/'],
    };

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
      const networkCheck = await checkNetwork();
      setIsCorrectNetwork(networkCheck);
      return networkCheck;
    } catch (error) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [networkConfig],
          });
          const networkCheck = await checkNetwork();
          setIsCorrectNetwork(networkCheck);
          return networkCheck;
        } catch (addError) {
          setError('Failed to add DFK Chain network');
          return false;
        }
      }
      if (error.code === 4001) {
        setError('User rejected the network switch');
      } else {
        setError('Failed to switch to DFK Chain network: ' + error.message);
      }
      return false;
    }
  }, []);

  const updateBalance = useCallback(async () => {
    try {
      if (!connectedAddress || !HONKTokenContract) {
        setHonkBalance('0');
        return;
      }
      const balance = await HONKTokenContract.methods.balanceOf(connectedAddress).call();
      setHonkBalance(BigInt(balance));
    } catch (error) {
      setHonkBalance('0');
    }
  }, [connectedAddress]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!mounted) return;
      await checkConnection();
      if (isConnected && mounted) {
        await updateBalance();
      }
    };

    init();
  }, [checkConnection, updateBalance]);

  return {
    isConnected,
    isCorrectNetwork,
    connectedAddress,
    honkBalance,
    error,
    connect,
    disconnect,
    switchNetwork,
    updateBalance,
    clearError,
  };
};

const getStoredWalletInfo = () => {
  const walletConnected = localStorage.getItem('walletConnected');
  const storedAddress = localStorage.getItem('connectedAddress');
  return { walletConnected, storedAddress };
};

const connectWallet = async (address) => {
  setIsConnected(true);
  setConnectedAddress(address);
  const networkCheck = await checkNetwork();
  setIsCorrectNetwork(networkCheck);
  if (networkCheck) {
    await reinitializeContracts();
    updateBalance();
  }
};
