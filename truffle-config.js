const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config();
const mnemonic = process.env.REACT_APP_MNEMONIC;
const path = require("path");

module.exports = {
  networks: {
    dfkTestnet: {
      provider: () => new HDWalletProvider(mnemonic, `https://subnets.avax.network/defi-kingdoms/dfk-chain-testnet/rpc`),
      network_id: 335,
      gas: 5500000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
  },
  compilers: {
    solc: {
      version: "0.8.20",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
      }
    }
  },
  contracts_directory: './contracts/',
  contracts_build_directory: './build/contracts/',
  migrations_directory: './migrations/',
  
  plugins: [
    'truffle-plugin-verify'
  ],
  api_keys: {
  },
  mocha: {
    timeout: 100000
  }
};