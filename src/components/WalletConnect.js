import React from 'react';
import { useWallet } from '../hooks/useWallet';

const WalletConnect = () => {
  const { isConnected, connect, error } = useWallet();

  if (error) {
    return (
      <div>
        Error: {error} <button onClick={connect}>Try Again</button>
      </div>
    );
  }

  if (isConnected) {
    return null; // Don't render anything when connected
  }

  return (
    <button onClick={connect} className="connect-wallet-button">
      Connect Wallet
    </button>
  );
};

export default WalletConnect;
