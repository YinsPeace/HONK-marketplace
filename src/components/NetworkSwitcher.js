import React, { useState, useEffect } from 'react';
import {
  addDFKTestnetToWallet,
  addDFKMainnetToWallet,
  getCurrentChainId,
} from '../utils/networkUtils';
import { toast } from 'react-toastify';

const NetworkSwitcher = ({ className = '' }) => {
  const [currentNetwork, setCurrentNetwork] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Network info
  const networks = {
    335: {
      name: 'DFK Testnet',
      shortName: 'Testnet',
      color: 'bg-yellow-500',
      textColor: 'text-black',
    },
    53935: {
      name: 'DFK Mainnet',
      shortName: 'Mainnet',
      color: 'bg-green-500',
      textColor: 'text-white',
    },
    other: {
      name: 'Unknown Network',
      shortName: 'Unknown',
      color: 'bg-red-500',
      textColor: 'text-white',
    },
  };

  // Check current network on component mount and when wallet changes
  useEffect(() => {
    const checkNetwork = async () => {
      const chainId = await getCurrentChainId();
      setCurrentNetwork(chainId);
    };

    checkNetwork();

    // Listen for network changes
    if (window.ethereum) {
      const handleChainChanged = (chainId) => {
        setCurrentNetwork(parseInt(chainId, 16));
      };

      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const handleSwitchToTestnet = async () => {
    setIsLoading(true);
    setIsDropdownOpen(false);
    try {
      await addDFKTestnetToWallet();
      toast.success('Switched to DFK Chain Testnet!');
    } catch (error) {
      console.error('Error switching to testnet:', error);
      toast.error(`Failed to switch to testnet: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToMainnet = async () => {
    setIsLoading(true);
    setIsDropdownOpen(false);
    try {
      await addDFKMainnetToWallet();
      toast.success('Switched to DFK Chain Mainnet!');
    } catch (error) {
      console.error('Error switching to mainnet:', error);
      toast.error(`Failed to switch to mainnet: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentNetworkInfo = () => {
    if (currentNetwork === 335) return networks[335];
    if (currentNetwork === 53935) return networks[53935];
    return networks.other;
  };

  const networkInfo = getCurrentNetworkInfo();

  return (
    <div className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={isLoading}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          networkInfo.color
        } ${networkInfo.textColor} hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white`}
      >
        <span>{isLoading ? '...' : networkInfo.shortName}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
          <div className="py-1">
            {/* Current Network Display */}
            <div className="px-4 py-2 border-b border-gray-700">
              <div className="text-xs text-gray-400">Current Network</div>
              <div
                className={`text-sm font-medium ${networkInfo.textColor === 'text-black' ? 'text-yellow-400' : 'text-green-400'}`}
              >
                {networkInfo.name}
              </div>
            </div>

            {/* Network Options */}
            <button
              onClick={handleSwitchToTestnet}
              disabled={isLoading || currentNetwork === 335}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                currentNetwork === 335
                  ? 'text-gray-500 cursor-not-allowed bg-gray-700'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-yellow-400'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>DFK Testnet</span>
                {currentNetwork === 335 && <span className="text-xs">(Current)</span>}
              </div>
            </button>

            <button
              onClick={handleSwitchToMainnet}
              disabled={isLoading || currentNetwork === 53935}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                currentNetwork === 53935
                  ? 'text-gray-500 cursor-not-allowed bg-gray-700'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-green-400'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>DFK Mainnet</span>
                {currentNetwork === 53935 && <span className="text-xs">(Current)</span>}
              </div>
            </button>

            {/* Warning for wrong network */}
            {currentNetwork && currentNetwork !== 335 && currentNetwork !== 53935 && (
              <div className="px-4 py-2 border-t border-gray-700">
                <div className="text-xs text-red-400 flex items-center space-x-1">
                  <span>⚠️</span>
                  <span>Please switch to DFK Chain</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
      )}
    </div>
  );
};

export default NetworkSwitcher;
