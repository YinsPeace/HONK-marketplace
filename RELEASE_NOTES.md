# HONK Marketplace v4.1.0 - Works Again Without the DFK API

DeFi Kingdoms paused its game services, and that took down the data and image endpoints older HONK builds depended on. This release makes the marketplace fully self sufficient: it reads everything it needs straight from the chain and draws every hero locally, so you can browse, list, and trade again.

## What is fixed

### Hero data comes straight from the chain

Hero stats, genes, classes, rarity, listings, and ownership are now read directly from DFK Chain contracts (getHeroesV3 / getUserHeroes). The paused GraphQL API is no longer used for hero data, so the Buy and Sell tabs populate again.

### Heroes are drawn locally

Hero portraits used to load from a DFK image service that is now offline. v4.1.0 composes each hero from its on chain genes using the open hero art (built on omer-bar's DFK Hero Viewer, with the newer class outfits from MrZipper7). No external image service is involved, so every hero renders, including the advanced, elite, and legendary classes.

### Starts without a wallet

Earlier builds could hang on "Initializing..." when no wallet extension was present, and could stall on a dead RPC. Startup is fixed and the app now rotates past unreachable RPC endpoints automatically.

### ADFK links disabled

The DFK Adventures site is offline, so its buttons are greyed out instead of opening dead links. They will return if and when that service does.

## Download

Choose the build for your operating system:

- Windows: HONK-Marketplace-win.exe
- macOS: HONK-Marketplace-mac
- Linux: HONK-Marketplace-linux

## Note on Windows Defender

Some users may see a Windows Defender warning when running the executable. This is a known false positive for standalone packaged apps that make blockchain network calls. The app has been scanned with multiple antivirus tools. If you prefer, you can build from source with the instructions in the README.

## Contracts

- HONK Token: `0x11C3b7bADC5359242c34C68C1F0f071bFf49a3D8`
- HONK Marketplace: `0x78a816b8bbef40ced1ac62c99573c6b8fe2674b4`
- DFK Hero (Mainnet): `0xEb9B61B145D6489Be575D3603F4a704810e143dF`

## Support

If you run into anything:

- Open a GitHub issue
- Reach out on Discord #yinspeace

## Support Development

Like the project? Tips are welcome: `0x8ac1daf59154641766bCa01c753dEF9C68010Bb4`

Happy trading.
