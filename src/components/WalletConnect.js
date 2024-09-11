import React, { useState, useEffect } from 'react';
import { web3, checkNetwork, reinitializeContracts } from '../Web3Config';

const WalletConnect = ({ onConnect }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkIfWalletIsConnected = async () => {
      const walletConnected = localStorage.getItem('walletConnected');
      const storedAddress = localStorage.getItem('connectedAddress');

      if (walletConnected === 'true' && storedAddress) {
        try {
          await reinitializeContracts();
          const networkIsValid = await checkNetwork();
          if (!networkIsValid) {
            setError('Connected to the wrong network. Please switch to the DFK Testnet.');
            return;
          }

          setIsConnected(true);
          setUserAddress(storedAddress);
          onConnect(storedAddress);
        } catch (error) {
          console.error('Failed to reinitialize contracts:', error);
          setError('Failed to reconnect. Please try again.');
        }
      } else if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await reinitializeContracts();
            const networkIsValid = await checkNetwork();
            if (!networkIsValid) {
              setError('Connected to the wrong network. Please switch to the DFK Testnet.');
              return;
            }

            setIsConnected(true);
            setUserAddress(accounts[0]);
            onConnect(accounts[0]);
            localStorage.setItem('walletConnected', 'true');
            localStorage.setItem('connectedAddress', accounts[0]);
          }
        } catch (error) {
          console.error('Error checking connected accounts:', error);
        }
      }
    };

    checkIfWalletIsConnected();

    if (window.ethereum) {
      window.ethereum.on('chainChanged', async () => {
        try {
          await reinitializeContracts();
          const networkIsValid = await checkNetwork();
          if (!networkIsValid) {
            setError('Connected to the wrong network. Please switch to the DFK Testnet.');
          } else {
            setError(null);
          }
        } catch (error) {
          console.error('Failed to reinitialize contracts after network change:', error);
          setError('Network change detected. Please refresh the page.');
        }
      });
    }

    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('chainChanged', reinitializeContracts);
      }
    };
  }, [onConnect]);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        await reinitializeContracts();
        const accounts = await web3.eth.getAccounts();
        if (accounts.length > 0) {
          const networkIsValid = await checkNetwork();
          if (!networkIsValid) {
            setError('Connected to the wrong network. Please switch to the DFK Testnet.');
            return;
          }

          setIsConnected(true);
          setUserAddress(accounts[0]);
          onConnect(accounts[0]);
          localStorage.setItem('walletConnected', 'true');
          localStorage.setItem('connectedAddress', accounts[0]);
        } else {
          setError('No accounts found after connection request');
        }
      } catch (error) {
        console.error('Failed to connect to MetaMask', error);
        setError('Failed to connect. Please check your MetaMask and try again.');
      }
    } else {
      setError('MetaMask is not installed. Please install it to use this app.');
    }
  };

  if (error) {
    return (
      <div>
        Error: {error} <button onClick={() => setError(null)}>Try Again</button>
      </div>
    );
  }

  if (isConnected) {
    return null; // Don't render anything when connected
  }

  return (
    <button onClick={connectWallet} className="connect-wallet-button">
      Connect Wallet
    </button>
  );
};

export default WalletConnect;
