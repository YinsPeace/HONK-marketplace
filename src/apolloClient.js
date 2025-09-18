import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

// Network-specific GraphQL API endpoints
const getGraphQLEndpoint = async () => {
  try {
    if (typeof window !== 'undefined' && window.ethereum?.request) {
      const chainIdHex = await Promise.race([
        window.ethereum.request({ method: 'eth_chainId' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('chainId timeout')), 1500)),
      ]);
      const chainId = parseInt(chainIdHex, 16);
      if (chainId === 335) return 'https://testnet.api.defikingdoms.com/graphql';
    }
  } catch (error) {
    // fall back below
  }
  return 'https://api.defikingdoms.com/graphql';
};

// Create a dynamic HTTP link that switches based on network
const createHttpLink = async () => {
  const uri = await getGraphQLEndpoint();
  return new HttpLink({
    uri,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
};

// Create the Apollo client with initial link (will be updated when network changes)
const client = new ApolloClient({
  link: new HttpLink({
    uri: 'https://api.defikingdoms.com/graphql', // Initial default
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  }),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
    },
    query: {
      fetchPolicy: 'network-only',
    },
  },
});

// Function to update the client's link when network changes
export const updateApolloClientNetwork = async () => {
  try {
    const link = await createHttpLink();
    client.setLink(link);
  } catch (error) {
    console.warn('Failed to update Apollo client network:', error);
  }
};

export default client;
