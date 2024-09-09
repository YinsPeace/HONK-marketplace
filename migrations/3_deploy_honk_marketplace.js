const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const HONKMarketplace = artifacts.require("HONKMarketplace");
const HONKToken = artifacts.require("HONKToken");
const fs = require('fs');
const path = require('path');
require('dotenv').config();

module.exports = async function(deployer, network, accounts) {
  try {
    // Deploy HONKToken if it hasn't been deployed yet
    if (network === 'development' || network === 'test') {
      await deployer.deploy(HONKToken);
    }
    
    const honkTokenAddress = process.env.REACT_APP_HONK_TOKEN_ADDRESS || (await HONKToken.deployed()).address;
    const dfkHeroContractAddress = process.env.REACT_APP_DFK_HERO_ADDRESS;
    const feeRecipient = process.env.REACT_APP_FEE_RECIPIENT || accounts[0];

    console.log('Deploying HONKMarketplace...');
    const honkMarketplace = await deployProxy(HONKMarketplace, 
      [honkTokenAddress, dfkHeroContractAddress, feeRecipient], 
      { deployer, initializer: 'initialize' }
    );

    console.log('HONKMarketplace deployed at:', honkMarketplace.address);
    console.log('HONKToken address used:', honkTokenAddress);
    console.log('DFKHeroContract address used:', dfkHeroContractAddress);
    console.log('Fee recipient address:', feeRecipient);

    // Save addresses to file
    let addresses = {};
    const addressesFile = path.join(__dirname, '..', 'src', 'contractaddresses.json');
    if (fs.existsSync(addressesFile)) {
      addresses = JSON.parse(fs.readFileSync(addressesFile));
    }
    addresses.HONKMarketplace = honkMarketplace.address;
    addresses.HONKToken = honkTokenAddress;
    fs.writeFileSync(addressesFile, JSON.stringify(addresses, null, 2));
    console.log('Contract addresses saved to', addressesFile);

  } catch (error) {
    console.error('Error in migration:', error);
  }
};