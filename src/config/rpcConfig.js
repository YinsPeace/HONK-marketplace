// RPC endpoints for DFK Chain Mainnet
export const RPC_ENDPOINTS = [
  'https://dfk-chain.api.onfinality.io/public', // Primary RPC
  'https://subnets.avax.network/defi-kingdoms/dfk-chain/rpc', // Public RPC
  'https://dfk.api.onfinality.io/public', // OnFinality public endpoint
  'https://klaytn.dfk.game', // Klaytn RPC
].filter(Boolean); // Remove any undefined endpoints

export class RPCProvider {
  constructor() {
    this.currentIndex = 0;
    this.providers = RPC_ENDPOINTS;
  }

  getCurrentRPC() {
    return this.providers[this.currentIndex];
  }

  rotateRPC() {
    this.currentIndex = (this.currentIndex + 1) % this.providers.length;
    return this.getCurrentRPC();
  }

  async executeWithFallback(operation) {
    const maxAttempts = this.providers.length;
    let lastError;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await operation(this.getCurrentRPC());
      } catch (error) {
        console.warn(`RPC attempt ${attempt + 1} failed:`, error.message);
        lastError = error;
        this.rotateRPC();
      }
    }

    throw lastError;
  }
}
