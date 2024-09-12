# HONK Hero Marketplace

HONK Hero Marketplace is an open-source decentralized application (dApp) for trading DFK Heroes using HONK tokens on the DFK Chain Testnet. This project is initially developed for and owned by Team Goose.

** Like this project? Consider supporting future developments by:
Making a donation to 0xd72730C437f4B044e57DbBE4Acf2A61201Dc9F6b

## Purpose

This project serves as both a functional marketplace for Heroes in the blockchain game DefiKingdoms and as an open-source template for other teams or individuals who want to build their own marketplace using HONK or similar tokens. By making this project open source, we aim to:

1. Provide transparency in the HONK ecosystem
2. Encourage community contributions and improvements
3. Allow other projects to adapt and build upon this foundation

## Features

- List DFK Heroes for sale
- Purchase listed Heroes using HONK tokens
- View and manage your listed Heroes
- Responsive design for desktop and mobile use
- More to come...!

## For Developers

This project is open source and can be used as a starting point for your own marketplace. Feel free to fork this repository and adapt it to your needs. We welcome contributions and suggestions to improve the core functionality.

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

We welcome contributions from the community! If you'd like to contribute to the HONK Hero Marketplace, please follow these steps:

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes and commit them with clear, descriptive messages
4. Push your changes to your fork
5. Submit a pull request to the main repository

Please ensure that your code adheres to the existing style and that all tests pass before submitting a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. This means you're free to use, modify, and distribute this code, even for commercial purposes, as long as you include the original copyright and license notice.

## Acknowledgements

- Team Goose for creating and distributing HONK
- The DFK community for their support and inspiration

## Disclaimer

This project is provided as-is, and while we strive for reliability and security, we cannot guarantee its performance in all situations. Use at your own risk.

## Downloads

You can download pre-packaged executables for different operating systems:

- [Windows](https://github.com/YinsPeace/HONK-marketplace/releases/download/v1.0.0/HONK-Marketplace-win.exe)
- [macOS](https://github.com/YinsPeace/HONK-marketplace/releases/download/v1.0.0/HONK-Marketplace-mac)
- [Linux](https://github.com/YinsPeace/HONK-marketplace/releases/download/v1.0.0/HONK-Marketplace-linux)

## Running the Application

### Windows
1. Download HONK-Marketplace-win.exe and HONK_Marketplace.bat
2. Place both files in the same directory
3. Double-click HONK_Marketplace.bat to start the application

### macOS and Linux
1. Download the appropriate executable (HONK-Marketplace-mac or HONK-Marketplace-linux) and HONK_Marketplace.sh
2. Place both files in the same directory
3. Open a terminal, navigate to the directory, and run:
   ```
   chmod +x HONK-Marketplace-mac  # or HONK-Marketplace-linux
   chmod +x HONK_Marketplace.sh
   ./HONK_Marketplace.sh
   ```

## Packaging the Application

To package the application yourself:

1. Clone the repository
2. Install dependencies: `npm install`
3. Package for your platform:
   - Windows: `npm run package-win`
   - macOS: `npm run package-mac`
   - Linux: `npm run package-linux`
   - All platforms: `npm run package-all`

The packaged executables will be in the `dist` directory.

Note: To package for a different platform than your current OS, you may need to use a virtual machine or cross-compilation tools.