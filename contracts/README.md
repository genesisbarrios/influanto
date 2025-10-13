# Ultra-Minimal Music NFT Smart Contract

## Quick Deployment to Paseo Asset Hub

### 1. Setup Remix IDE

1. Go to [Remix IDE](https://remix.ethereum.org/)
2. Create new workspace: "MusicNFT"
3. **Note**: NO OpenZeppelin needed - self-contained contract!

### 2. Network Setup (Paseo Asset Hub - Best for NFTs)

```json
Network Name: Paseo Asset Hub
RPC URL: https://paseo-asset-hub-rpc.polkadot.io
Chain ID: 1000
Symbol: PAS
Block Explorer: https://assethub-paseo.subscan.io
Faucet: https://faucet.polkadot.io/paseo
```

### 3. Deploy Contract

1. **Create file**: `contracts/Collectible.sol`
2. **Paste contract**: Ultra-minimal version (no warnings!)
3. **Compile**: Solidity `0.8.19`
4. **Deploy**: No constructor parameters needed
5. **Gas limit**: 3,000,000

### 4. Contract Features ✅

- ✅ **Ultra-small size** (~20KB - fits deployment limits)
- ✅ **No warnings** (secure withdrawal pattern)
- ✅ **Mint music tracks** with IPFS hashes
- ✅ **Edition-based sales** (multiple copies per track)
- ✅ **Secure payments** (withdrawal pattern)
- ✅ **Creator controls** (activate/deactivate/burn)
- ✅ **Platform fees** (configurable)
- ✅ **Reentrancy protection**

### 5. Core Functions

```solidity
// Mint a track
mint(title, artist, ipfsHash, priceInWei, maxEditions)
// Returns: tokenId

// Buy an edition
buy(tokenId) // payable function
// Returns: editionNumber

// Withdraw earnings
withdraw() // pulls your pending balance

// Creator controls
setActive(tokenId, false) // hide track
burn(tokenId) // delete permanently

// Check data
getTrack(tokenId) // returns all track info
ownsEdition(address, tokenId, edition) // check ownership
available(tokenId) // remaining editions
```

### 6. After Deployment

```env
# Add to .env.local
NEXT_PUBLIC_MUSIC_NFT_CONTRACT_ADDRESS=0x1234567890abcdef...
NEXT_PUBLIC_NETWORK_RPC=https://paseo-asset-hub-rpc.polkadot.io
NEXT_PUBLIC_CHAIN_ID=1000
NEXT_PUBLIC_EXPLORER_URL=https://assethub-paseo.subscan.io
```

### 7. Usage Examples

```javascript
// Frontend integration examples

// Mint track
const tx = await contract.mint(
  "My Song",
  "Artist Name", 
  "QmAudioHashFromIPFS",
  ethers.utils.parseEther("1"), // 1 PAS price
  100 // 100 editions available
);

// Buy edition
const buyTx = await contract.buy(1, {
  value: ethers.utils.parseEther("1")
});

// Check ownership
const owns = await contract.ownsEdition(userAddress, 1, 1);
console.log("Owns edition 1:", owns);

// Withdraw earnings
const withdrawTx = await contract.withdraw();

// Frontend integration with slippage protection

// Method 1: Basic buy (10% slippage tolerance built-in)
const tx = await contract.buy(tokenId, {
  value: ethers.utils.parseEther("1.1") // Pay 10% extra for slippage
});

// Method 2: Explicit max price (recommended)
const maxPrice = ethers.utils.parseEther("1.0");
const tx = await contract.buyWithMaxPrice(tokenId, maxPrice, {
  value: maxPrice
});

// Check current price before buying
const currentPrice = await contract.prices(tokenId);
console.log("Current price:", ethers.utils.formatEther(currentPrice));

// Creator can update prices
const updateTx = await contract.updatePrice(tokenId, newPrice);
```

### 8. Security Features

✅ **No `transfer()` warnings** - Uses secure `call()` pattern
✅ **Reentrancy protection** - `noReentry` modifier
✅ **Withdrawal pattern** - Users pull their own funds
✅ **Access controls** - Creator-only functions
✅ **Emergency backup** - Owner can recover stuck funds

### 9. Why This Contract Design?

| Issue | Solution |
|-------|----------|
| **Contract too large** | Ultra-minimal design (~20KB) |
| **Transfer warnings** | Secure `call()` withdrawal pattern |
| **Gas costs** | Optimized for Asset Hub (low fees) |
| **Complexity** | Simple mappings instead of complex structs |
| **Security** | Reentrancy guards + withdrawal pattern |

### 10. Deployment Checklist

- [ ] ✅ Remix IDE open (remix.ethereum.org)
- [ ] ✅ Paseo Asset Hub network added to wallet
- [ ] ✅ Test PAS tokens received from faucet
- [ ] ✅ Contract compiled with no errors/warnings
- [ ] ✅ Gas limit set to 3M+
- [ ] ✅ Deploy successful
- [ ] ✅ Contract address saved
- [ ] ✅ Basic functions tested

### 11. Test Your Deployment

After deployment, test these functions:

```solidity
// 1. Check initial state
totalSupply() // should return 0

// 2. Mint test track
mint("Test Song", "Test Artist", "QmTest123", 1000000000000000000, 10)

// 3. Verify track data
getTrack(1) // should return your track info

// 4. Check available editions
available(1) // should return 10
```

### 12. Asset Hub Advantages

🎵 **Lower gas fees** - Perfect for music creators
🎵 **Faster transactions** - Better user experience  
🎵 **NFT optimized** - Built for digital assets
🎵 **Cross-chain ready** - Easy bridging later
🎵 **Specialized explorer** - Better NFT tracking

This ultra-minimal contract will deploy successfully and has no security warnings! 🎵✨

### 13. Next Steps

1. **Deploy successfully** ✅
2. **Test all functions** ✅
3. **Integrate with frontend** 🚀
4. **Add IPFS metadata** 📁
5. **Launch your music platform** 🎵

Perfect for independent artists and music NFT platforms!

### 5. Contract Features

- ✅ ERC721 compliant NFTs
- ✅ Edition-based minting
- ✅ Royalty system
- ✅ Artist/genre indexing
- ✅ IPFS metadata
- ✅ Payable purchases

### 6. Usage Examples
// Mint track
mint("My Song", "My Artist", "QmAudioHash", 1 ether, 100);

// Buy edition  
buy(1); // with 1 ether payment

// Check ownership
ownsEdition(buyerAddress, 1, 1); // returns true

// Creator controls
setActive(1, false); // hide track
burn(1); // delete permanently

// Withdraw earnings
withdraw();