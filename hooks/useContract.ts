'use client';

import { useState, useEffect } from 'react';
import { ethers, BrowserProvider } from 'ethers';

// Add your actual contract address here
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MUSIC_NFT_CONTRACT_ADDRESS || '';

const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "buy",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "creators",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "editions",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "hashes",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "hash",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "uint32",
        "name": "maxEditions",
        "type": "uint32"
      }
    ],
    "name": "mint",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "pending",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "prices",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "sold",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const useContract = () => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [networkId, setNetworkId] = useState<number | null>(null);

  const initContract = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      console.error('MetaMask not found');
      return;
    }

    try {
      setIsLoading(true);
      const web3Provider = new BrowserProvider(window.ethereum);
      
      // Check network first
      const network = await web3Provider.getNetwork();
      const chainId = Number(network.chainId);
      setNetworkId(chainId);
      
      console.log('🌐 Current network:', {
        chainId,
        name: network.name,
        expected: 1287 // Moonbase Alpha
      });

      // Warn if not on Moonbase Alpha
      if (chainId !== 1287) {
        console.warn('⚠️ Not on Moonbase Alpha network. Current chain:', chainId);
        // Don't return - still initialize for network switching
      }

      const signer = await web3Provider.getSigner();
      const userAccount = await signer.getAddress();
      
      if (!CONTRACT_ADDRESS) {
        throw new Error('Contract address not configured. Please check NEXT_PUBLIC_MUSIC_NFT_CONTRACT_ADDRESS environment variable.');
      }

      console.log('📋 Contract details:', {
        address: CONTRACT_ADDRESS,
        account: userAccount,
        network: chainId
      });

      const musicContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      // Test contract connection
      try {
        await musicContract.nextId();
        console.log('✅ Contract connection verified');
      } catch (testError) {
        console.error('❌ Contract test failed:', testError);
        throw new Error('Contract not accessible. Please check the contract address and network.');
      }

      setProvider(web3Provider);
      setSigner(signer);
      setAccount(userAccount);
      setContract(musicContract);
      setIsConnected(true);
      
      console.log('✅ Contract initialized successfully');
      
    } catch (error: any) {
      console.error('❌ Failed to initialize contract:', error);
      setIsConnected(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      // Check if already connected
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            initContract().catch(console.error);
          }
        })
        .catch(console.error);

      // Listen for account changes
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setIsConnected(false);
          setAccount('');
          setContract(null);
        } else {
          initContract().catch(console.error);
        }
      };

      // Listen for network changes
      const handleChainChanged = (chainId: string) => {
        console.log('🔄 Network changed to:', parseInt(chainId, 16));
        setNetworkId(parseInt(chainId, 16));
        initContract().catch(console.error);
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask');
      return;
    }

    try {
      setIsLoading(true);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await initContract();
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      if (error.code === 4001) {
        alert('Please connect to MetaMask.');
      } else {
        alert('Failed to connect wallet: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchToMoonbeam = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask');
      return;
    }

    try {
      setIsLoading(true);
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x507' }], // 1287 in hex
      });
      
      // Wait a bit for the network to switch
      await new Promise(resolve => setTimeout(resolve, 1000));
      await initContract();
      
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x507',
                chainName: 'Moonbase Alpha',
                nativeCurrency: {
                  name: 'DEV',
                  symbol: 'DEV',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc.api.moonbase.moonbeam.network'],
                blockExplorerUrls: ['https://moonbase.moonscan.io/'],
              },
            ],
          });
          
          // Wait for network to be added and switched
          await new Promise(resolve => setTimeout(resolve, 2000));
          await initContract();
          
        } catch (addError) {
          console.error('Failed to add Moonbeam network:', addError);
          alert('Failed to add Moonbeam network');
        }
      } else {
        console.error('Failed to switch to Moonbeam:', switchError);
        alert('Failed to switch to Moonbeam network');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fix: Accept bigint or string for price, and ensure proper parameter types
  const mintTrack = async (hash: string, price: bigint | string, maxEditions: number) => {
    if (!contract) throw new Error('Contract not initialized');
    if (!isConnected) throw new Error('Wallet not connected');
    if (networkId !== 1287) throw new Error('Please switch to Moonbase Alpha network');
    
    try {
      console.log('🔨 Minting track with params:', { hash, price, maxEditions });
      
      // Convert price to Wei if it's a string
      const priceWei = typeof price === 'string' ? ethers.parseEther(price) : price;
      
      console.log('💰 Price in Wei:', priceWei.toString());
      console.log('🎯 Contract address:', CONTRACT_ADDRESS);
      console.log('👤 Account:', account);
      
      // Validate parameters
      if (!hash || hash.trim() === '') {
        throw new Error('Hash cannot be empty');
      }
      
      if (priceWei <= 0) {
        throw new Error('Price must be greater than 0');
      }
      
      if (maxEditions <= 0 || maxEditions > 10000) {
        throw new Error('Max editions must be between 1 and 10000');
      }

      // Estimate gas first
      try {
        const gasEstimate = await contract.mint.estimateGas(hash, priceWei, maxEditions);
        console.log('⛽ Estimated gas:', gasEstimate.toString());
      } catch (gasError) {
        console.error('❌ Gas estimation failed:', gasError);
        throw new Error('Transaction would fail. Please check your parameters and try again.');
      }
      
      // Call the mint function with explicit gas limit
      const tx = await contract.mint(hash, priceWei, maxEditions, {
        gasLimit: 500000 // Set a reasonable gas limit
      });
      
      console.log('📝 Transaction sent:', tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt);
      
      // Get the token ID from the contract
      let tokenId;
      try {
        const nextId = await contract.nextId();
        tokenId = Number(nextId) - 1;
      } catch (idError) {
        console.warn('Could not get token ID:', idError);
        tokenId = Date.now(); // Fallback
      }
      
      return {
        tokenId,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        receipt,
        gasUsed: receipt.gasUsed
      };
      
    } catch (error: any) {
      console.error('❌ Mint failed:', error);
      
      // Enhanced error handling
      if (error.code === 'CALL_EXCEPTION') {
        throw new Error('Contract call failed. Please check your parameters and network connection.');
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('Insufficient DEV tokens for gas fees.');
      } else if (error.code === 4001) {
        throw new Error('Transaction cancelled by user.');
      } else if (error.message?.includes('user rejected')) {
        throw new Error('Transaction cancelled by user.');
      } else if (error.message?.includes('network')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      throw error;
    }
  };

  const buyTrack = async (tokenId: number, price: string) => {
    if (!contract) throw new Error('Contract not initialized');
    if (networkId !== 1287) throw new Error('Please switch to Moonbase Alpha network');
    
    try {
      const priceWei = ethers.parseEther(price);
      const tx = await contract.buy(tokenId, { value: priceWei });
      return await tx.wait();
    } catch (error: any) {
      console.error('Buy failed:', error);
      throw error;
    }
  };

  const withdrawEarnings = async () => {
    if (!contract) throw new Error('Contract not initialized');
    if (networkId !== 1287) throw new Error('Please switch to Moonbase Alpha network');
    
    try {
      const tx = await contract.withdraw();
      return await tx.wait();
    } catch (error: any) {
      console.error('Withdraw failed:', error);
      throw error;
    }
  };

  const getTrackInfo = async (tokenId: number) => {
    if (!contract) throw new Error('Contract not initialized');
    
    try {
      const [creator, hash, price, sold, editions] = await Promise.all([
        contract.creators(tokenId),
        contract.hashes(tokenId),
        contract.prices(tokenId),
        contract.sold(tokenId),
        contract.editions(tokenId)
      ]);

      return {
        creator,
        hash,
        price: ethers.formatEther(price),
        sold: Number(sold),
        editions: Number(editions),
        available: Number(editions) - Number(sold)
      };
    } catch (error) {
      console.error('Failed to get track info:', error);
      throw error;
    }
  };

  const getPendingEarnings = async (address?: string) => {
    if (!contract) throw new Error('Contract not initialized');
    
    try {
      const targetAddress = address || account;
      const pending = await contract.pending(targetAddress);
      return ethers.formatEther(pending);
    } catch (error: any) {
      console.error('Failed to get pending earnings:', error);
      throw error;
    }
  };

  return {
    contract,
    provider,
    signer,
    account,
    isConnected,
    isLoading,
    networkId,
    connectWallet,
    switchToMoonbeam,
    mintTrack,
    buyTrack,
    withdrawEarnings,
    getTrackInfo,
    getPendingEarnings
  };
};