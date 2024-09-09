# HONK Hero Marketplace

HONK Hero Marketplace is a decentralized application (dApp) for trading DFK Heroes using HONK tokens on the DFK Chain Testnet.

## Features

- List DFK Heroes for sale
- Purchase listed Heroes using HONK tokens
- View and manage your listed Heroes
- Responsive design for desktop and mobile use

## Technologies Used

- React.js
- Web3.js
- Apollo Client (for GraphQL queries)
- Tailwind CSS
- Express.js (for serving the production build)

## Prerequisites

- Node.js (v14 or later recommended)
- npm or yarn
- MetaMask browser extension

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/hero-marketplace-ui.git
   cd hero-marketplace-ui
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Copy the `.env.example` file to a new file named `.env`:
     ```
     cp .env.example .env
     ```
   - Open the `.env` file and fill in the appropriate values for your environment:
     ```
     REACT_APP_HONK_TOKEN_ADDRESS=0x2F511575AA738Db96597e86B41bb0aB634689266
     REACT_APP_HONK_MARKETPLACE_ADDRESS=0x7482eFaE2EB545DA06dED1D26a22870C94E0d568
     REACT_APP_DFK_HERO_ADDRESS=0x3bcaCBeAFefed260d877dbE36378008D4e714c8E
     REACT_APP_DFK_TESTNET_RPC=https://subnets.avax.network/defi-kingdoms/dfk-chain-testnet/rpc
     REACT_APP_FEE_RECIPIENT=your_fee_recipient_address
     ```
   - Replace `your_fee_recipient_address` with the actual address you want to use as the fee recipient.
   - If you're deploying contracts, make sure to set a secure mnemonic:
     ```
     REACT_APP_MNEMONIC=your secure mnemonic phrase
     ```

   Note: Never commit your `.env` file to version control. It's included in `.gitignore` for your protection.

## Running the Application

For development:
```
npm start
```

For production build:
```
npm run build
npm run serve
```

## Connecting to DFK Chain Testnet

Ensure your MetaMask is connected to the DFK Chain Testnet. If not already added, you can add it with the following details:

- Network Name: DFK Chain Testnet
- RPC URL: https://subnets.avax.network/defi-kingdoms/dfk-chain-testnet/rpc
- Chain ID: 335
- Currency Symbol: JEWEL

## Contract Addresses (DFK Chain Testnet)

- HONK Token: 0x2F511575AA738Db96597e86B41bb0aB634689266
- HONK Marketplace: 0x7482eFaE2EB545DA06dED1D26a22870C94E0d568
- DFK Hero: 0x3bcaCBeAFefed260d877dbE36378008D4e714c8E

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.