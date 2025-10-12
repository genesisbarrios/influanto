#!/bin/bash

echo "🚀 Deploying music NFT smart contract..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACT_DIR="$SCRIPT_DIR/../music_nft"

cd "$CONTRACT_DIR"

# Check if contract is built
if [ ! -f "target/ink/music_nft.contract" ]; then
    echo "❌ Contract not built. Run build.sh first."
    exit 1
fi

echo "📋 Contract ready for deployment:"
echo "   - File: target/ink/music_nft.contract"
echo "   - Size: $(du -h target/ink/music_nft.contract | cut -f1)"
echo ""
echo "🌐 Deploy using Polkadot.js Apps:"
echo "   1. Go to https://polkadot.js.org/apps/#/contracts"
echo "   2. Connect to Rococo Contracts testnet"
echo "   3. Upload target/ink/music_nft.contract"
echo "   4. Set platform_fee parameter (e.g., 5 for 5%)"
echo "   5. Deploy and save the contract address"