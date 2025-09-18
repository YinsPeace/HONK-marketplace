# HONK Marketplace Refactoring Plan

## Overview

This plan combines comprehensive improvements with a streamlined, practical implementation approach. The focus is on essential improvements while maintaining the option for future enhancements.

## Phase 1: TypeScript Migration and Core Infrastructure

1. **Initial TypeScript Setup**

   - [ ] Add TypeScript and essential dependencies

   ```bash
   npm install typescript @types/react @types/node
   ```

   - [ ] Create focused tsconfig.json with strict mode

   ```json
   {
     "compilerOptions": {
       "target": "es2020",
       "lib": ["dom", "dom.iterable", "esnext"],
       "allowJs": true,
       "skipLibCheck": true,
       "strict": true,
       "module": "esnext",
       "moduleResolution": "node",
       "isolatedModules": true,
       "jsx": "react-jsx"
     },
     "include": ["src"]
   }
   ```

2. **Core Type Definitions**

   ```typescript
   // src/types/marketplace.ts
   interface HeroListing {
     id: string;
     price: bigint;
     seller: string;
     isActive: boolean;
   }

   interface MarketplaceState {
     listings: HeroListing[];
     pendingTransactions: Record<string, boolean>;
     error: string | null;
   }
   ```

3. **Contract Type Generation** (Optional Enhancement)
   - [ ] Set up TypeChain for contract types
   - [ ] Generate typed contracts from ABIs

## Phase 2: Core Functionality and Error Handling

1. **Streamlined Contract Service**

   ```typescript
   // src/services/MarketplaceService.ts
   class MarketplaceService {
     constructor(private contract: Contract) {}

     async listHero(heroId: string, price: bigint): Promise<boolean> {
       try {
         const tx = await this.contract.listHero(heroId, price);
         const receipt = await tx.wait();
         return receipt.status === 1;
       } catch (error) {
         handleMarketplaceError(error);
         return false;
       }
     }

     async buyHero(heroId: string): Promise<boolean> {
       try {
         const tx = await this.contract.buyHero(heroId);
         const receipt = await tx.wait();
         return receipt.status === 1;
       } catch (error) {
         handleMarketplaceError(error);
         return false;
       }
     }

     async getHeroListing(heroId: string): Promise<HeroListing | null> {
       try {
         const listing = await this.contract.getHeroListing(heroId);
         return listing;
       } catch (error) {
         handleMarketplaceError(error);
         return null;
       }
     }

     async cancelListing(heroId: string): Promise<boolean> {
       try {
         const tx = await this.contract.cancelListing(heroId);
         const receipt = await tx.wait();
         return receipt.status === 1;
       } catch (error) {
         handleMarketplaceError(error);
         return false;
       }
     }
   }
   ```

2. **Error Handling System**

   ```typescript
   // src/utils/errors.ts
   enum MarketplaceError {
     WALLET_REJECTED = 'User rejected transaction',
     INSUFFICIENT_BALANCE = 'Insufficient balance',
     ALREADY_LISTED = 'Hero already listed',
     NETWORK_ERROR = 'Network error occurred',
     NOT_LISTED = 'Hero is not listed',
   }

   function handleMarketplaceError(error: any): void {
     if (error.code === 4001) throw new Error(MarketplaceError.WALLET_REJECTED);
     // Handle other specific errors
   }
   ```

3. **Transaction Handler** (Optional Enhancement)
   ```typescript
   interface TransactionHandler {
     prepare: () => Promise<void>;
     execute: () => Promise<TransactionResponse>;
     confirm: () => Promise<TransactionReceipt>;
     handleError: (error: Error) => void;
   }
   ```

## Phase 3: State Management

1. **Essential Zustand Store**

   ```typescript
   // src/store/marketplaceStore.ts
   const useMarketplaceStore = create<MarketplaceStore>((set) => ({
     listings: [],
     pendingTransactions: {},
     error: null,
     setListings: (listings) => set({ listings }),
     setPendingTransaction: (id: string, isPending: boolean) =>
       set((state) => ({
         pendingTransactions: {
           ...state.pendingTransactions,
           [id]: isPending,
         },
       })),
     addListing: (listing) =>
       set((state) => ({
         listings: [...state.listings, listing],
       })),
     removeListing: (heroId) =>
       set((state) => ({
         listings: state.listings.filter((l) => l.id !== heroId),
       })),
   }));
   ```

2. **Transaction Management Hook**

   ```typescript
   // src/hooks/useMarketplaceTransaction.ts
   function useMarketplaceTransaction() {
     const setPending = useMarketplaceStore((state) => state.setPendingTransaction);

     const executeTransaction = async (fn: () => Promise<boolean>, id: string) => {
       setPending(id, true);
       try {
         const result = await fn();
         setPending(id, false);
         return result;
       } catch (error) {
         setPending(id, false);
         throw error;
       }
     };

     return { executeTransaction };
   }
   ```

3. **Apollo Client Integration** (Optional Enhancement)
   - [ ] Set up Apollo Client caching
   - [ ] Implement optimistic updates

## Phase 4: Testing Strategy

1. **Essential Tests**

   ```typescript
   // src/services/__tests__/MarketplaceService.test.ts
   describe('MarketplaceService', () => {
     it('should list a hero for sale', async () => {
       // Test hero listing
     });

     it('should handle listing errors', async () => {
       // Test error scenarios
     });

     it('should buy a listed hero', async () => {
       // Test hero purchase
     });
   });
   ```

2. **Extended Testing** (Optional Enhancement)
   - [ ] Integration tests for contract interactions
   - [ ] E2E tests for critical flows
   - [ ] Performance testing

## Phase 5: Security and Performance

1. **Essential Security**

   - [ ] Input validation for price and hero IDs
   - [ ] Basic contract allowance checks
   - [ ] User-friendly error messages

2. **Advanced Security** (Optional Enhancement)
   - [ ] Signature verification
   - [ ] Rate limiting
   - [ ] Advanced contract validation

## Phase 6: UI/UX Improvements

1. **Core Improvements**

   - [ ] Loading indicators for transactions
   - [ ] Clear error messages
   - [ ] Transaction status feedback

2. **Enhanced UX** (Optional Enhancement)
   - [ ] Skeleton screens
   - [ ] Transaction simulation
   - [ ] Advanced error recovery

## DFK Chain Integration Updates

### RPC Connection Changes

1. **Current Situation**

   - DFK Chain has discontinued WebSocket access to public RPC
   - AvaLabs recommends using Glacier Webhooks for real-time events
   - HTTP RPC endpoints remain available for basic interactions

2. **Required Changes**

   ```typescript
   // src/services/MarketplaceService.ts
   class MarketplaceService {
     constructor(
       private contract: Contract,
       private webhookUrl?: string
     ) {}

     // Add webhook subscription for real-time updates
     async subscribeToMarketEvents(): Promise<void> {
       if (!this.webhookUrl) return;

       // Configure Glacier webhook for:
       // - New listings
       // - Price updates
       // - Sales
       // - Listing cancellations
     }
   }
   ```

3. **Event Handling**
   ```typescript
   // src/types/events.ts
   interface MarketplaceEvent {
     webhookId: string;
     eventType: 'address_activity';
     messageId: string;
     event: {
       transaction: {
         // Transaction details
         erc721Transfers: Array<{
           from: string;
           to: string;
           tokenId: string;
         }>;
       };
     };
   }
   ```

### Implementation Changes

1. **Replace WebSocket Listeners**

   - Remove WebSocket-based event listeners
   - Implement Glacier webhook endpoints
   - Add webhook verification and security

2. **State Updates**

   - Use HTTP polling as fallback for non-critical updates
   - Implement optimistic updates for better UX
   - Cache recent events to reduce RPC calls

3. **Error Handling**
   - Add specific handling for RPC connection issues
   - Implement retry logic for failed HTTP calls
   - Provide clear user feedback for connection status

## Implementation Phases

### Phase 1: TypeScript + Core Contract Interactions

- TypeScript setup and configuration
- Core marketplace service implementation
- Contract type definitions
- Basic transaction handling

### Phase 2: Transaction Management + Error Handling

- Transaction status tracking
- Error handling system
- Transaction management hook
- User feedback mechanisms

### Phase 3: UI Components + State Management

- Zustand store implementation
- UI components with loading states
- Transaction status indicators
- Form validation and error display

### Phase 4: Testing + Bug Fixes

- Core service tests
- Transaction flow testing
- UI component testing
- Bug fixes and optimizations

## Directory Structure

```
src/
├── services/
│   └── MarketplaceService.ts
├── types/
│   └── marketplace.ts
├── utils/
│   └── errors.ts
├── store/
│   └── marketplaceStore.ts
├── hooks/
│   └── useMarketplaceTransaction.ts
└── components/
    └── marketplace/
        ├── ListingCard.tsx
        └── TransactionStatus.tsx
```

## Implementation Timeline

1. **Week 1: Core TypeScript and Services**

   - TypeScript setup
   - Core marketplace service
   - Basic error handling

2. **Week 2: State and UI**

   - Zustand store implementation
   - Essential UI components
   - Loading states

3. **Week 3: Testing and Refinement**

   - Core test implementation
   - Error handling improvements
   - Transaction feedback

4. **Week 4: Polish and Optional Enhancements**
   - Security improvements
   - Performance optimization
   - Additional features as needed

## Getting Started

1. Install core dependencies:

   ```bash
   npm install typescript @types/react @types/node zustand
   ```

2. Optional enhancements:
   ```bash
   npm install typechain @apollo/client
   ```

## Notes

- Start with essential improvements and add enhancements as needed
- Maintain backwards compatibility during migration
- Focus on user experience and reliability
- Document changes as they are implemented
