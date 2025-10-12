export const CONTRACT_CONFIG = {
  // Contract address (set after deployment)
  CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_MUSIC_COLLECTIBLE_CONTRACT_ADDRESS || '',
  
  // Network configuration
  NETWORK: {
    RPC_URL: process.env.NEXT_PUBLIC_POLKADOT_RPC_URL || 'wss://rococo-contracts-rpc.polkadot.io',
    CHAIN_NAME: 'Rococo Contracts',
  },
  
  // Gas limits
  GAS_LIMITS: {
    MINT_SINGLE: 50000000000,
    MINT_ALBUM: 100000000000,
    PURCHASE: 30000000000,
    QUERY: 10000000000,
  },
};