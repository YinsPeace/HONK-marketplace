import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import honkLogo from './assets/images/honk/honkCoin.webp';
import './index.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './components/customToastStyles.css';
import { useWallet } from './hooks/useWallet';
import { validateContracts, initWeb3, initializeContracts, web3 } from './Web3Config';
import { debounce } from 'lodash';
import LoadingIndicator from './components/LoadingIndicator';
import SidebarWithFilters from './components/SidebarWithFilters';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDonate } from '@fortawesome/free-solid-svg-icons';

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
    setTimeout(() => setIsSpinning(false), 1000);
  };

  const handleConnect = async () => {
    await onConnect();
  };

  const handleSwitchNetwork = async () => {
    await onSwitchNetwork();
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
                onClick={handleSwitchNetwork}
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
          onClick={handleConnect}
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

const CreditsIcon = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const donationAddress = '0xd72730C437f4B044e57DbBE4Acf2A61201Dc9F6b';

  const handleClick = () => {
    navigator.clipboard.writeText(donationAddress);
    toast.success('Donation address copied to clipboard!');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className="bg-gray-800 rounded-full p-2 cursor-pointer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={handleClick}
      >
        <FontAwesomeIcon icon={faDonate} className="text-gray-300 w-5 h-5" />
      </div>
      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-2 p-4 bg-gray-800 text-gray-300 rounded shadow-lg w-64">
          <p>Created by: Yin | Team Goose</p>
          <p>Donations to:</p>
          <p className="text-xs">{donationAddress}</p>
          <p className="text-xs mt-1">(click icon to copy wallet address)</p>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const {
    isConnected,
    isCorrectNetwork,
    connectedAddress,
    honkBalance,
    error,
    connect,
    switchNetwork,
    updateBalance,
    clearError,
  } = useWallet();

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
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const location = useLocation();

  const debouncedToast = useCallback((message, type) => {
    debounce((msg, t) => toast(msg, { type: t }), 300)(message, type);
  }, []);

  useEffect(() => {
    if (error) {
      debouncedToast(error, 'error');
      clearError();
    }
  }, [error, debouncedToast, clearError]);

  const handleConnect = async () => {
    const success = await connect();
    if (success) {
      debouncedToast('Successfully connected', 'success');
    }
  };

  const handleSwitchNetwork = async () => {
    const success = await switchNetwork();
    if (success) {
      debouncedToast('Successfully switched network', 'success');
    }
  };

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
  }, [debouncedToast, isInitialized]);

  const handleFiltersChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleSortChange = (value) => {
    setSortOrder(value);
  };

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (!isInitialized) {
    return <div>Initializing...</div>;
  }

  return (
    <div className="relative min-h-screen bg-gray-900 text-gray-300">
      <SidebarWithFilters
        onFiltersChange={handleFiltersChange}
        onSortChange={handleSortChange}
        filters={filters}
        sortOrder={sortOrder}
        sortOptions={[
          { value: 'price-asc', label: 'Price: Low to High' },
          { value: 'price-desc', label: 'Price: High to Low' },
          { value: 'level-asc', label: 'Level: Low to High' },
          { value: 'level-desc', label: 'Level: High to Low' },
          { value: 'rarity-asc', label: 'Rarity: Common to Mythic' },
          { value: 'rarity-desc', label: 'Rarity: Mythic to Common' },
          { value: 'generation-asc', label: 'Generation: Low to High' },
          { value: 'generation-desc', label: 'Generation: High to Low' },
        ]}
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
            walletAddress={connectedAddress}
            honkBalance={honkBalance}
            onConnect={handleConnect}
            onSwitchNetwork={handleSwitchNetwork}
            onRefreshBalance={updateBalance}
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
                        isConnected={isConnected}
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
        <CreditsIcon />
      </div>
    </div>
  );
};

export default App;
