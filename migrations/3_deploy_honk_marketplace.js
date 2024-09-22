const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const HONKMarketplace = artifacts.require('HONKMarketplace');
const { getAddress, saveAddress } = require('./addressManager'); // Import utility functions
require('dotenv').config();

module.exports = async function (deployer, network, accounts) {
  try {
    // Get environment variables or fallback to provided accounts
    const honkTokenAddress = process.env.REACT_APP_HONK_TOKEN_ADDRESS;
    const dfkHeroContractAddress = process.env.REACT_APP_DFK_HERO_ADDRESS;
    const feeRecipient = process.env.REACT_APP_FEE_RECIPIENT || accounts[0];

    // Get the saved contract address (if already deployed)
    let honkMarketplaceAddress = getAddress('HONKMarketplace');

    let honkMarketplace;

    if (!honkMarketplaceAddress) {
      // First-time deployment (Proxy pattern)
      console.log('Deploying a new HONKMarketplace contract...');
      honkMarketplace = await deployProxy(
        HONKMarketplace,
        [honkTokenAddress, dfkHeroContractAddress, feeRecipient],
        { deployer, initializer: 'initialize' }
      );
      honkMarketplaceAddress = honkMarketplace.address;

      // Save the new proxy contract address
      saveAddress('HONKMarketplace', honkMarketplaceAddress);
      console.log('HONKMarketplace deployed at:', honkMarketplaceAddress);
    } else {
      // Upgrade existing contract
      console.log('Upgrading existing HONKMarketplace contract at:', honkMarketplaceAddress);
      honkMarketplace = await upgradeProxy(honkMarketplaceAddress, HONKMarketplace, { deployer });
      console.log('HONKMarketplace upgraded at:', honkMarketplaceAddress);
    }

    // Optionally log the initial fee recipient and other parameters
    console.log('HONKToken address:', honkTokenAddress);
    console.log('DFKHeroContract address:', dfkHeroContractAddress);
    console.log('Fee recipient address:', feeRecipient);
  } catch (error) {
    console.error('Error in migration:', error);
  }
};
