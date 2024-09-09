const HONKToken = artifacts.require("HONKToken");
const fs = require('fs');

module.exports = async function(deployer) {
  await deployer.deploy(HONKToken, web3.utils.toWei('1000000', 'ether'));
  const honkToken = await HONKToken.deployed();
  
  // Save the address
  let addresses = {};
  if (fs.existsSync('contractAddresses.json')) {
    addresses = JSON.parse(fs.readFileSync('contractAddresses.json'));
  }
  addresses.HONKToken = honkToken.address;
  fs.writeFileSync('contractAddresses.json', JSON.stringify(addresses, null, 2));
};