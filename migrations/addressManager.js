const fs = require('fs');
const path = require('path');

// Path to save the contract addresses file
const addressesFile = path.join(__dirname, '..', 'src', 'contractAddresses.json');

// Helper function to get existing addresses from the file
function getAddresses() {
  if (fs.existsSync(addressesFile)) {
    return JSON.parse(fs.readFileSync(addressesFile));
  }
  return {};
}

// Helper function to save addresses back to the file
function saveAddresses(addresses) {
  fs.writeFileSync(addressesFile, JSON.stringify(addresses, null, 2));
}

// Get address of a specific contract by name
function getAddress(contractName) {
  const addresses = getAddresses();
  return addresses[contractName] || null; // Return null if not found
}

// Save a new contract address to the file
function saveAddress(contractName, address) {
  const addresses = getAddresses();
  addresses[contractName] = address;
  saveAddresses(addresses);
}

module.exports = {
  getAddresses,
  saveAddresses,
  getAddress,
  saveAddress,
};
