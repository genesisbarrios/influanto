'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

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
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const initContract = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      console.error('MetaMask not found');
      return;
    }

    try {
      setIsLoading(true);
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = web3Provider.getSigner();
      const userAccount = await signer.getAddress();
      
      if (!CONTRACT_ADDRESS) {
        throw new Error('Contract address not configured');
      }

      const musicContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      setProvider(web3Provider);
      setSigner(signer);
      setAccount(userAccount);
      setContract(musicContract);
      setIsConnected(true);
      
      console.log('Contract initialized:', CONTRACT_ADDRESS);
      console.log('Connected account:', userAccount);
    } catch (error) {
      console.error('Failed to initialize contract:', error);
      setIsConnected(false);
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
            initContract();
          }
        })
        .catch(console.error);
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
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet');
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

  const mintTrack = async (hash: string, price: string, maxEditions: number) => {
    if (!contract) throw new Error('Contract not initialized');
    
    const priceWei = ethers.utils.parseEther(price);
    const tx = await contract.mint(hash, priceWei, maxEditions);
    return await tx.wait();
  };

  const buyTrack = async (tokenId: number, price: string) => {
    if (!contract) throw new Error('Contract not initialized');
    
    const priceWei = ethers.utils.parseEther(price);
    const tx = await contract.buy(tokenId, { value: priceWei });
    return await tx.wait();
  };

  const withdrawEarnings = async () => {
    if (!contract) throw new Error('Contract not initialized');
    
    const tx = await contract.withdraw();
    return await tx.wait();
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
        price: ethers.utils.formatEther(price),
        sold: sold.toNumber(),
        editions: editions.toNumber(),
        available: editions.toNumber() - sold.toNumber()
      };
    } catch (error) {
      console.error('Failed to get track info:', error);
      throw error;
    }
  };

  const getPendingEarnings = async (address?: string) => {
    if (!contract) throw new Error('Contract not initialized');
    
    const targetAddress = address || account;
    const pending = await contract.pending(targetAddress);
    return ethers.utils.formatEther(pending);
  };

  return {
    contract,
    provider,
    signer,
    account,
    isConnected,
    isLoading,
    connectWallet,
    switchToMoonbeam,
    mintTrack,
    buyTrack,
    withdrawEarnings,
    getTrackInfo,
    getPendingEarnings
  };
};