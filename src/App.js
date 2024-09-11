import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import honkLogo from './assets/images/honk/honkCoin.webp';
import './index.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './components/customToastStyles.css';
import {
  checkNetwork,
  validateContracts,
  checkMetaMaskConnection,
  reinitializeContracts,
  web3,
  HONKTokenContract,
  initWeb3,
  initializeContracts,
} from './Web3Config';
import { debounce } from 'lodash';
import LoadingIndicator from './components/LoadingIndicator';
import Sidebar from './components/Sidebar';

const BuyTab = lazy(() => import('./components/BuyTab'));
const SellTab = lazy(() => import('./components/SellTab'));

const ConnectionStatus = ({
  isConnected,
  isCorrectNetwork,
  walletAddress,
  honkBalance,
  onConnect,
  onSwitchNetwork,
  onRefreshBalance,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);

  const handleRefreshClick = async () => {
    setIsSpinning(true);
    await onRefreshBalance();
    setTimeout(() => setIsSpinning(false), 1000); // Stop spinning after 1 second
  };

  return (
    <div className="absolute top-2 right-4 text-right">
      {isConnected ? (
        <div className="flex flex-col items-end">
          <div className="flex items-center mb-2">
            <span
              className={`inline-block w-2 h-2 ${
                isCorrectNetwork ? 'bg-green-400' : 'bg-yellow-400'
              } rounded-full mr-2`}
            ></span>
            <span className="text-sm mr-4">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
            {!isCorrectNetwork && (
              <button
                onClick={onSwitchNetwork}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs"
              >
                Switch Network
              </button>
            )}
          </div>
          <div className="text-sm flex items-center">
            <button
              onClick={handleRefreshClick}
              className="mr-2 p-1 bg-gray-600 hover:bg-gray-700 text-white rounded"
              aria-label="Refresh balance"
              disabled={isSpinning}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 ${isSpinning ? 'spin-animation' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            Balance: {web3 ? formatBalance(honkBalance) : '0'}
            <img src={honkLogo} alt="HONK" className="ml-1 w-6 h-6" />
          </div>
        </div>
      ) : (
        <button
          onClick={onConnect}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};

const formatBalance = (balance) => {
  if (!web3 || !balance) return '0';
  const num = parseFloat(web3.utils.fromWei(balance, 'ether'));
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  } else {
    return num.toFixed(2);
  }
};

function App() {
  const navigate = useNavigate();
  const [connectedAddress, setConnectedAddress] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [honkBalance, setHonkBalance] = useState('0');

  const [filters, setFilters] = useState({
    class: [],
    subclass: [],
    profession: [],
    crafting1: [],
    crafting2: [],
    rarityMin: 0,
    rarityMax: 4,
    levelMin: 1,
    levelMax: 100,
    generationMin: 0,
    generationMax: 11,
    hideQuesting: false,
    hideListedHeroes: false,
  });
  const [sortOrder, setSortOrder] = useState('price-asc');

  const location = useLocation();

  const debouncedToast = useCallback((message, type) => {
    debounce((msg, t) => toast(msg, { type: t }), 300)(message, type);
  }, []);

  useEffect(() => {
    const initializeWeb3AndContracts = async () => {
      setIsLoading(true);
      try {
        if (!isInitialized) {
          const initializedWeb3 = await initWeb3();
          if (!initializedWeb3) {
            throw new Error('Failed to initialize Web3');
          }

          await initializeContracts();
        }

        const contractsValid = validateContracts();

        if (!contractsValid) {
          throw new Error('Contracts failed to initialize correctly');
        }

        const isCorrectNetwork = await checkNetwork();

        if (!isCorrectNetwork) {
          debouncedToast('Please connect to the DFK Testnet', 'warn');
          setIsCorrectNetwork(false);
        } else {
          setIsCorrectNetwork(true);
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize:', error);
        console.error('Error stack:', error.stack);
        debouncedToast(`Failed to initialize: ${error.message}`, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    initializeWeb3AndContracts();
  }, [debouncedToast]);

  const checkHONKBalance = useCallback(async () => {
    if (connectedAddress && HONKTokenContract && HONKTokenContract.methods) {
      try {
        const balance = await HONKTokenContract.methods.balanceOf(connectedAddress).call();
        setHonkBalance(balance);
      } catch (error) {
        console.error('Error checking HONK balance:', error);
      }
    }
  }, [connectedAddress]);

  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      checkHONKBalance();
    }
  }, [isConnected, isCorrectNetwork, checkHONKBalance]);

  const refreshBalance = useCallback(async () => {
    if (isConnected && isCorrectNetwork && connectedAddress) {
      try {
        const balance = await HONKTokenContract.methods.balanceOf(connectedAddress).call();
        setHonkBalance(balance);
        debouncedToast('Balance updated successfully', 'success');
      } catch (error) {
        console.error('Error refreshing HONK balance:', error);
        debouncedToast('Failed to update balance. Please try again.', 'error');
      }
    }
  }, [isConnected, isCorrectNetwork, connectedAddress, debouncedToast]);

  useEffect(() => {
    const checkNetworkStatus = async () => {
      if (isConnected) {
        console.log('Checking network status...');
        const networkCheck = await checkNetwork();
        console.log('Network check result:', networkCheck);
        setIsCorrectNetwork(networkCheck);
        if (!networkCheck) {
          console.log('Incorrect network detected');
          debouncedToast('Please connect to the DFK Testnet.', 'warn');
        } else {
          console.log('Correct network detected');
        }
      } else {
        console.log('Not connected, skipping network check');
      }
    };

    checkNetworkStatus();
  }, [isConnected, debouncedToast]);

  useEffect(() => {
    const checkMetaMask = () => {
      if (typeof window.ethereum !== 'undefined') {
        setIsMetaMaskInstalled(true);
        if (window.ethereum.isMetaMask !== true) {
          debouncedToast(
            "It seems you're using a different wallet. This dApp is optimized for MetaMask.",
            'warn'
          );
        }
      } else {
        setIsMetaMaskInstalled(false);
        debouncedToast('Please install MetaMask to use this dApp!', 'error');
      }
    };

    const initializeWeb3 = async () => {
      setIsLoading(true);
      checkMetaMask();

      if (!isMetaMaskInstalled) {
        setIsLoading(false);
        return;
      }

      const isMetaMaskConnected = await checkMetaMaskConnection();
      if (isMetaMaskConnected) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setConnectedAddress(accounts[0]);
          setIsConnected(true);
          localStorage.setItem('walletConnected', 'true');
          localStorage.setItem('connectedAddress', accounts[0]);
        }
      }

      const contractsValid = validateContracts();
      if (!contractsValid) {
        debouncedToast(
          'There was an issue with contract validation. Please contact support.',
          'error'
        );
      }

      const networkCheck = await checkNetwork();
      setIsCorrectNetwork(networkCheck);
      if (!networkCheck) {
        debouncedToast('Please connect to the DFK Testnet.', 'warn');
      }

      setIsLoading(false);
    };

    initializeWeb3();

    // Check localStorage on component mount
    const walletConnected = localStorage.getItem('walletConnected');
    const storedAddress = localStorage.getItem('connectedAddress');
    if (walletConnected === 'true' && storedAddress) {
      setIsConnected(true);
      setConnectedAddress(storedAddress);
      checkNetwork().then(setIsCorrectNetwork);
    }

    const handleChainChanged = async () => {
      try {
        await reinitializeContracts();
        const networkCheck = await checkNetwork();
        setIsCorrectNetwork(networkCheck);
        if (!networkCheck) {
          debouncedToast(
            'Connected to the wrong network. Please switch to the DFK Testnet.',
            'error'
          );
        }
      } catch (error) {
        console.error('Failed to reinitialize contracts after network change:', error);
        debouncedToast('Network change detected. Please refresh the page.', 'error');
      }
    };

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setConnectedAddress(accounts[0]);
        setIsConnected(true);
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('connectedAddress', accounts[0]);
      } else {
        setConnectedAddress(null);
        setIsConnected(false);
        localStorage.removeItem('walletConnected');
        localStorage.removeItem('connectedAddress');
        debouncedToast('Wallet disconnected.', 'info');
        navigate('/'); // Redirect to home page when disconnected
      }
    };

    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [isMetaMaskInstalled, navigate, debouncedToast]);

  const handleConnect = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        await reinitializeContracts();
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const networkIsValid = await checkNetwork();
          if (!networkIsValid) {
            debouncedToast(
              'Connected to the wrong network. Please switch to the DFK Testnet.',
              'error'
            );
            return;
          }

          setIsConnected(true);
          setConnectedAddress(accounts[0]);
          localStorage.setItem('walletConnected', 'true');
          localStorage.setItem('connectedAddress', accounts[0]);
        } else {
          debouncedToast('No accounts found after connection request', 'error');
        }
      } catch (error) {
        console.error('Failed to connect to MetaMask', error);
        debouncedToast('Failed to connect. Please check your MetaMask and try again.', 'error');
      }
    } else {
      debouncedToast('MetaMask is not installed. Please install it to use this app.', 'error');
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x14f' }], // DFK Testnet chain ID in hex (lowercase)
      });
      const networkCheck = await checkNetwork();
      if (networkCheck) {
        setIsCorrectNetwork(true);
        debouncedToast('Successfully switched to DFK Testnet!', 'success');
      } else {
        debouncedToast("Network switch didn't work as expected. Please try manually.", 'error');
      }
    } catch (error) {
      console.error('Failed to switch network', error);
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x14f', // Lowercase hex
                chainName: 'DFK Chain Testnet',
                nativeCurrency: {
                  name: 'JEWEL',
                  symbol: 'JEWEL',
                  decimals: 18,
                },
                rpcUrls: ['https://subnets.avax.network/defi-kingdoms/dfk-chain-testnet/rpc'],
                blockExplorerUrls: ['https://subnets-test.avax.network/defi-kingdoms/'],
              },
            ],
          });
          // Check network again after adding
          const addedNetworkCheck = await checkNetwork();
          if (addedNetworkCheck) {
            setIsCorrectNetwork(true);
            debouncedToast('Successfully added and switched to DFK Testnet!', 'success');
          } else {
            debouncedToast(
              "Added DFK Testnet, but switch didn't work. Please try manually.",
              'warn'
            );
          }
        } catch (addError) {
          console.error('Failed to add network', addError);
          debouncedToast('Failed to add DFK Testnet. Please add it manually.', 'error');
        }
      } else {
        debouncedToast('Failed to switch network. Please try manually.', 'error');
      }
    }
  };

  const handleFiltersChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleSortChange = (value) => {
    setSortOrder(value);
  };

  const updateBalance = useCallback(async () => {
    if (connectedAddress && HONKTokenContract && HONKTokenContract.methods) {
      try {
        const balance = await HONKTokenContract.methods.balanceOf(connectedAddress).call();
        setHonkBalance(balance);
      } catch (error) {
        console.error('Error updating HONK balance:', error);
      }
    }
  }, [connectedAddress]);

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (!isInitialized) {
    return <div>Initializing...</div>;
  }

  return (
    <div className="relative min-h-screen bg-gray-900 text-gray-300">
      <Sidebar
        onFiltersChange={handleFiltersChange}
        onSortChange={handleSortChange}
        filters={filters}
        sortOrder={sortOrder}
        disabled={!isConnected || !isCorrectNetwork}
        isBuyTab={location.pathname === '/'}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <div className={`flex-1 ${isSidebarOpen ? 'ml-96' : 'ml-16'} transition-all duration-300`}>
        <div className="p-4">
          <ConnectionStatus
            isConnected={isConnected}
            isCorrectNetwork={isCorrectNetwork}
            walletAddress={connectedAddress || ''}
            honkBalance={honkBalance}
            onConnect={handleConnect}
            onSwitchNetwork={handleSwitchNetwork}
            onRefreshBalance={refreshBalance}
          />
          <div className="container mx-auto p-4 flex justify-center items-center">
            <img
              src={honkLogo}
              alt="HONK Logo"
              className="mr-4"
              style={{ width: '100px', height: 'auto' }}
            />
            <h1 className="text-4xl font-bold my-8 text-white">HONK Marketplace</h1>
          </div>
          {isConnected ? (
            isCorrectNetwork ? (
              <Suspense fallback={<div>Loading...</div>}>
                <Routes>
                  <Route
                    path="/sell"
                    element={
                      <SellTab
                        userAddress={connectedAddress}
                        filters={filters}
                        sortOrder={sortOrder}
                      />
                    }
                  />
                  <Route
                    path="/"
                    element={
                      <BuyTab
                        connectedAddress={connectedAddress}
                        honkLogo={honkLogo}
                        filters={filters}
                        sortOrder={sortOrder}
                        onBalanceChange={updateBalance}
                      />
                    }
                  />
                </Routes>
              </Suspense>
            ) : (
              <div className="text-center mt-10">
                <p>Please switch to the DFK Testnet to access the marketplace.</p>
              </div>
            )
          ) : (
            <div className="text-center mt-10">
              <p>Please connect your wallet to access the marketplace.</p>
            </div>
          )}
        </div>
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </div>
    </div>
  );
}

export default App;
