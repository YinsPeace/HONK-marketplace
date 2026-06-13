// Network-specific RPC endpoints
const RPC_ENDPOINTS = {
  // DFK Chain Mainnet (Chain ID: 53935)
  53935: [
    'https://subnets.avax.network/defi-kingdoms/dfk-chain/rpc', // Primary RPC (official subnet endpoint, verified reliable)
    'https://avax-dfk.gateway.pokt.network/v1/lb/6244818c00b9f0003ad1b619/ext/bc/q2aTwKuyzgs8pynF7UXBZCU7DejbZbZ6EUyHr3JQzYgwNPUPi/rpc', // POKT Network
    'https://dfk-chain.api.onfinality.io/public', // OnFinality (DNS dead as of 2026-06-12, kept as last-resort fallback)
    'https://dfk.api.onfinality.io/public', // OnFinality public endpoint
  ],
  // DFK Chain Testnet (Chain ID: 335)
  335: [
    'https://subnets.avax.network/defi-kingdoms/dfk-chain-testnet/rpc', // Primary testnet RPC
    // Add more testnet RPC endpoints here if available
  ],
};

// Get network-aware RPC endpoints
export const getRPCEndpoints = (chainId) => {
  const endpoints = RPC_ENDPOINTS[chainId];
  if (!endpoints) {
    console.warn(`No RPC endpoints configured for chain ID ${chainId}, falling back to mainnet`);
    return RPC_ENDPOINTS[53935]; // Fallback to mainnet
  }
  return endpoints.filter(Boolean); // Remove any undefined endpoints
};

export class RPCProvider {
  constructor(chainId = 53935) {
    this.chainId = chainId;
    this.currentIndex = 0;
    this.providers = getRPCEndpoints(chainId);
  }

  // Update the provider when network changes
  updateNetwork(chainId) {
    if (this.chainId !== chainId) {
      this.chainId = chainId;
      this.currentIndex = 0; // Reset to first RPC
      this.providers = getRPCEndpoints(chainId);
      console.log(`RPC Provider updated for network ${chainId}:`, this.providers);
    }
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
        console.warn(
          `RPC attempt ${attempt + 1} failed for network ${this.chainId}:`,
          error.message
        );
        lastError = error;
        this.rotateRPC();
      }
    }

    throw lastError;
  }
}

// Legacy export for backwards compatibility
export { getRPCEndpoints as RPC_ENDPOINTS };
