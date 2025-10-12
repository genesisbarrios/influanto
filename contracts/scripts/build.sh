#!/bin/bash

echo "🔨 Building ink! smart contract..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACT_DIR="$SCRIPT_DIR/../music_nft"

echo "📁 Contract directory: $CONTRACT_DIR"

# Check if contract directory exists
if [ ! -d "$CONTRACT_DIR" ]; then
    echo "❌ Contract directory not found: $CONTRACT_DIR"
    echo "Creating directory structure..."
    mkdir -p "$CONTRACT_DIR"
fi

cd "$CONTRACT_DIR"

# Check if Cargo.toml exists
if [ ! -f "Cargo.toml" ]; then
    echo "❌ Cargo.toml not found. Please create the contract files first."
    exit 1
fi

# Install ink! CLI if not present
if ! command -v cargo-contract &> /dev/null; then
    echo "📦 Installing cargo-contract..."
    cargo install cargo-contract --force --locked
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
cargo clean

# Build the contract
echo "🔨 Building contract..."
cargo contract build --release

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Contract built successfully!"
    echo "📁 Files generated:"
    echo "   - target/ink/music_nft.contract (combined)"
    echo "   - target/ink/music_nft.wasm"
    echo "   - target/ink/music_nft.json (ABI)"
    
    # Copy ABI to libs folder
    mkdir -p ../../libs/contracts
    if [ -f "target/ink/music_nft.json" ]; then
        cp target/ink/music_nft.json ../../libs/contracts/music-nft-abi.json
        echo "📋 ABI copied to libs/contracts/"
    fi
else
    echo "❌ Build failed!"
    exit 1
fi