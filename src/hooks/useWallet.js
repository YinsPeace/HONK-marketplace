import { useState, useEffect, useCallback } from 'react';
import { initWeb3, checkNetwork, reinitializeContracts, HONKTokenContract } from '../Web3Config';

export const useWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState(null);
  const [honkBalance, setHonkBalance] = useState('0');
  const [error, setError] = useState(null);

  const checkConnection = useCallback(async () => {
    console.log('Checking wallet connection...');
    const web3 = await initWeb3();
    const accounts = await web3.eth.getAccounts();
    console.log('Accounts:', accounts);
    if (accounts.length > 0) {
      setIsConnected(true);
      setConnectedAddress(accounts[0]);
      const networkCheck = await checkNetwork();
      setIsCorrectNetwork(networkCheck);
      console.log('Wallet connected:', { address: accounts[0], correctNetwork: networkCheck });
      return true;
    }
    console.log('No wallet connected');
    return false;
  }, []);

  const connect = useCallback(async () => {
    console.log('Attempting to connect wallet...');
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        await reinitializeContracts();
        const connected = await checkConnection();
        if (connected) {
          localStorage.setItem('walletConnected', 'true');
          localStorage.setItem('connectedAddress', await web3.eth.getAccounts()[0]);
          console.log('Wallet connected successfully');
        }
        return connected;
      } catch (error) {
        console.error('Failed to connect:', error);
        setError(error.message);
        return false;
      }
    } else {
      console.error('MetaMask is not installed');
      setError('MetaMask is not installed');
      return false;
    }
  }, [checkConnection]);

  const disconnect = useCallback(() => {
    console.log('Disconnecting wallet...');
    setIsConnected(false);
    setConnectedAddress(null);
    setHonkBalance('0');
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('connectedAddress');
    console.log('Wallet disconnected');
  }, []);

  const clearError = useCallback(() => {
    console.log('Clearing error');
    setError(null);
  }, []);

  const switchNetwork = useCallback(async () => {
    console.log('Attempting to switch network...');
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x14f' }], // DFK Testnet chain ID in hex
      });
      const networkCheck = await checkNetwork();
      setIsCorrectNetwork(networkCheck);
      console.log('Network switch result:', networkCheck);
      return networkCheck;
    } catch (error) {
      console.error('Failed to switch network:', error);
      setError('Failed to switch network');
      return false;
    }
  }, []);

  const updateBalance = useCallback(async () => {
    console.log('Updating HONK balance...');
    if (connectedAddress && HONKTokenContract && HONKTokenContract.methods) {
      try {
        const balance = await HONKTokenContract.methods.balanceOf(connectedAddress).call();
        setHonkBalance(balance);
        console.log('Updated HONK balance:', balance);
      } catch (error) {
        console.error('Error updating HONK balance:', error);
        setError('Failed to update balance');
      }
    } else {
      console.log('Unable to update balance: missing address or contract');
    }
  }, [connectedAddress]);

  useEffect(() => {
    console.log('useWallet effect running...');
    const init = async () => {
      const walletConnected = localStorage.getItem('walletConnected');
      const storedAddress = localStorage.getItem('connectedAddress');
      console.log('Stored wallet info:', { walletConnected, storedAddress });
      if (walletConnected === 'true' && storedAddress) {
        setIsConnected(true);
        setConnectedAddress(storedAddress);
        const networkCheck = await checkNetwork();
        setIsCorrectNetwork(networkCheck);
        if (networkCheck) {
          await reinitializeContracts();
          updateBalance();
        }
      } else {
        const connected = await checkConnection();
        if (connected) {
          updateBalance();
        }
      }
    };

    init();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', checkConnection);
      window.ethereum.on('chainChanged', checkConnection);
    }

    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', checkConnection);
        window.ethereum.removeListener('chainChanged', checkConnection);
      }
    };
  }, [checkConnection, updateBalance]);

  console.log('useWallet state:', {
    isConnected,
    isCorrectNetwork,
    connectedAddress,
    honkBalance,
    error,
  });

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
