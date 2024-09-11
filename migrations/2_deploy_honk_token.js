const HONKToken = artifacts.require("HONKToken");
const { getAddress, saveAddress } = require('./addressManager');

module.exports = async function(deployer, network) {
  let honkTokenAddress = getAddress('HONKToken');

  if (!honkTokenAddress || network === 'development' || network === 'test') {
    await deployer.deploy(HONKToken, web3.utils.toWei('1000000', 'ether'));
    const honkToken = await HONKToken.deployed();
    honkTokenAddress = honkToken.address;
    saveAddress('HONKToken', honkTokenAddress);
    console.log('HONKToken deployed at:', honkTokenAddress);
  } else {
    console.log('Using existing HONKToken at:', honkTokenAddress);
  }
};