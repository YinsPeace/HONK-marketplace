import Web3 from 'web3';

const TAVERN_ABI = [
  {
    "inputs": [{"internalType": "address","name": "_owner","type": "address"}],
    "name": "getUserAuctions",
    "outputs": [{"internalType": "uint256[]","name": "","type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256[]","name": "_tokenIds","type": "uint256[]"}],
    "name": "getAuctions",
    "outputs": [{
      "components": [
        {"internalType": "uint256","name": "id","type": "uint256"},
        {"internalType": "address","name": "seller","type": "address"},
        {"internalType": "uint256","name": "startingPrice","type": "uint256"},
        {"internalType": "uint256","name": "endingPrice","type": "uint256"},
        {"internalType": "uint256","name": "duration","type": "uint256"},
        {"internalType": "uint256","name": "startedAt","type": "uint256"},
        {"internalType": "address","name": "winner","type": "address"},
        {"internalType": "bool","name": "open","type": "bool"}
      ],
      "internalType": "struct IHeroAuction.Auction[]",
      "name": "",
      "type": "tuple[]"
    }],
    "stateMutability": "view",
    "type": "function"
  }
];

const TAVERN_ADDRESS = '0xc390fAA4C7f66E4D62E59C231D5beD32Ff77BEf0';
const RPC_URL = 'https://subnets.avax.network/defi-kingdoms/dfk-chain/rpc';

export class DFKTavernInterface {
  constructor() {
    this.web3 = new Web3(RPC_URL);
    this.contract = new this.web3.eth.Contract(TAVERN_ABI, TAVERN_ADDRESS);
  }

  async getUserAuctions(address) {
    try {
      const auctions = await this.contract.methods.getUserAuctions(address).call();
      return auctions;
    } catch (error) {
      return [];
    }
  }

  async getAuctions(tokenIds) {
    try {
      const auctions = await this.contract.methods.getAuctions(tokenIds).call();
      return auctions;
    } catch (error) {
      return [];
    }
  }
}
