'use client';

import { useState, useEffect } from 'react';
import { ethers, BrowserProvider } from 'ethers';

// Add your actual contract address here
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MUSIC_NFT_CONTRACT_ADDRESS || '';

// Use the exact ABI from your contract.abi file
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

// Alternative RPC endpoints for Moonbase Alpha
const MOONBASE_RPC_ENDPOINTS = [
  'https://rpc.api.moonbase.moonbeam.network',
  'https://moonbase-alpha.public.blastapi.io',
  'https://moonbeam-alpha.api.onfinality.io/public'
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
  const [contractStatus, setContractStatus] = useState<'unknown' | 'testing' | 'accessible' | 'error'>('unknown');

  const initContract = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      console.error('MetaMask not found');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔄 Starting wallet connection...');
      
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

      const signer = await web3Provider.getSigner();
      const userAccount = await signer.getAddress();
      
      console.log('✅ Wallet connected:', {
        account: userAccount,
        network: chainId
      });

      // Set basic connection info first
      setProvider(web3Provider);
      setSigner(signer);
      setAccount(userAccount);
      setIsConnected(true);

      // Only test contract if we have the address and we're on the right network
      if (CONTRACT_ADDRESS && chainId === 1287) {
        await testContract(web3Provider, signer);
      } else if (!CONTRACT_ADDRESS) {
        console.warn('⚠️ No contract address configured');
        setContractStatus('error');
      } else {
        console.warn('⚠️ Wrong network for contract testing');
        setContractStatus('unknown');
      }
      
    } catch (error: any) {
      console.error('❌ Failed to initialize wallet/contract:', error);
      setIsConnected(false);
      setContractStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const testContract = async (web3Provider: BrowserProvider, signer: ethers.Signer) => {
    try {
      setContractStatus('testing');
      console.log('🧪 Testing contract accessibility...');
      console.log('📍 Contract address:', CONTRACT_ADDRESS);

      // Try multiple approaches to test the contract
      let contractCode;
      let codeError = null;

      // Method 1: Try with MetaMask provider
      try {
        contractCode = await web3Provider.getCode(CONTRACT_ADDRESS);
        console.log('✅ getCode via MetaMask provider successful, length:', contractCode.length);
      } catch (error: any) {
        codeError = error;
        console.warn('⚠️ getCode via MetaMask failed:', error.message);
        
        // Method 2: Try with alternative RPC provider
        for (const rpcUrl of MOONBASE_RPC_ENDPOINTS) {
          try {
            console.log('🔄 Trying alternative RPC:', rpcUrl);
            const altProvider = new ethers.JsonRpcProvider(rpcUrl);
            contractCode = await altProvider.getCode(CONTRACT_ADDRESS);
            console.log('✅ getCode via alternative RPC successful, length:', contractCode.length);
            break;
          } catch (altError: any) {
            console.warn(`⚠️ Alternative RPC ${rpcUrl} failed:`, altError.message);
          }
        }
      }
      
      if (!contractCode || contractCode === '0x' || contractCode === '0x0') {
        console.error('❌ No contract bytecode found at address:', CONTRACT_ADDRESS);
        setContractStatus('error');
        return;
      }
      
      console.log('✅ Contract has bytecode, creating contract instance...');
      
      // Create contract instance
      const musicContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      // Test contract functions with multiple strategies
      console.log('🔍 Testing contract functions...');
      
      const functionTests = [
        {
          name: 'nextId',
          test: async () => {
            // Try with timeout and multiple providers if needed
            try {
              const result = await Promise.race([
                musicContract.nextId(),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Timeout after 15s')), 15000)
                )
              ]);
              return result.toString();
            } catch (error: any) {
              // If MetaMask provider fails, try with read-only provider
              if (error.message.includes('Timeout') || error.code === -32603) {
                console.log('🔄 Retrying nextId with alternative RPC...');
                for (const rpcUrl of MOONBASE_RPC_ENDPOINTS) {
                  try {
                    const altProvider = new ethers.JsonRpcProvider(rpcUrl);
                    const altContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, altProvider);
                    const result = await Promise.race([
                      altContract.nextId(),
                      new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout')), 10000)
                      )
                    ]);
                    return result.toString();
                  } catch (altError) {
                    console.warn(`Alternative RPC failed for nextId:`, altError);
                  }
                }
              }
              throw error;
            }
          }
        },
        {
          name: 'owner',
          test: async () => {
            try {
              const result = await Promise.race([
                musicContract.owner(),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Timeout after 15s')), 15000)
                )
              ]);
              return result;
            } catch (error: any) {
              // Similar fallback for owner function
              if (error.message.includes('Timeout') || error.code === -32603) {
                console.log('🔄 Retrying owner with alternative RPC...');
                for (const rpcUrl of MOONBASE_RPC_ENDPOINTS) {
                  try {
                    const altProvider = new ethers.JsonRpcProvider(rpcUrl);
                    const altContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, altProvider);
                    const result = await Promise.race([
                      altContract.owner(),
                      new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout')), 10000)
                      )
                    ]);
                    return result;
                  } catch (altError) {
                    console.warn(`Alternative RPC failed for owner:`, altError);
                  }
                }
              }
              throw error;
            }
          }
        }
      ];

      const testResults = [];
      for (const funcTest of functionTests) {
        try {
          const result = await funcTest.test();
          console.log(`✅ ${funcTest.name}() works:`, result);
          testResults.push({ name: funcTest.name, success: true, result });
        } catch (funcError: any) {
          console.error(`❌ ${funcTest.name}() failed:`, funcError.message);
          testResults.push({ name: funcTest.name, success: false, error: funcError.message });
        }
      }

      const workingFunctions = testResults.filter(t => t.success);
      console.log('📊 Function test results:', testResults);
      
      if (workingFunctions.length > 0) {
        console.log(`✅ Contract accessible (${workingFunctions.length}/${testResults.length} functions working)`);
        setContract(musicContract);
        setContractStatus('accessible');
      } else {
        console.error('❌ No contract functions accessible');
        setContractStatus('error');
        
        // Still set the contract instance so users can debug
        setContract(musicContract);
      }
      
    } catch (error: any) {
      console.error('❌ Contract test failed:', error);
      setContractStatus('error');
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
          setContractStatus('unknown');
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
      console.log('🔄 Requesting wallet connection...');
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

  const debugContract = async () => {
    if (!provider) {
      console.error('❌ No provider available');
      return { success: false, error: 'No provider available' };
    }

    try {
      console.log('🔍 Starting comprehensive contract debug...');
      console.log('📍 Contract address:', CONTRACT_ADDRESS);
      console.log('🌐 Network ID:', networkId);
      console.log('🔗 Connected:', isConnected);
      console.log('📄 Contract status:', contractStatus);

      if (!CONTRACT_ADDRESS) {
        return { 
          success: false, 
          error: 'No contract address configured',
          details: {
            fix: 'Add NEXT_PUBLIC_MUSIC_NFT_CONTRACT_ADDRESS to your .env.local file'
          }
        };
      }

      // Test contract bytecode with multiple methods
      const codeTests = [];
      
      // Test 1: MetaMask provider
      try {
        const code = await provider.getCode(CONTRACT_ADDRESS);
        codeTests.push({ 
          method: 'MetaMask Provider', 
          success: true, 
          codeLength: code.length,
          hasCode: code !== '0x' && code !== '0x0'
        });
      } catch (error: any) {
        codeTests.push({ 
          method: 'MetaMask Provider', 
          success: false, 
          error: error.message 
        });
      }

      // Test 2: Alternative RPC providers
      for (const rpcUrl of MOONBASE_RPC_ENDPOINTS) {
        try {
          const altProvider = new ethers.JsonRpcProvider(rpcUrl);
          const code = await altProvider.getCode(CONTRACT_ADDRESS);
          codeTests.push({ 
            method: `Alternative RPC: ${rpcUrl}`, 
            success: true, 
            codeLength: code.length,
            hasCode: code !== '0x' && code !== '0x0'
          });
          break; // If one works, we're good
        } catch (error: any) {
          codeTests.push({ 
            method: `Alternative RPC: ${rpcUrl}`, 
            success: false, 
            error: error.message 
          });
        }
      }

      // Test contract functions if we have a working provider
      const functionTests = [];
      if (contract) {
        const functions = ['nextId', 'owner'];
        
        for (const funcName of functions) {
          try {
            const result = await Promise.race([
              contract[funcName](),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 15000)
              )
            ]);
            functionTests.push({ 
              function: funcName, 
              success: true, 
              result: result.toString() 
            });
          } catch (error: any) {
            functionTests.push({ 
              function: funcName, 
              success: false, 
              error: error.message 
            });
          }
        }
      }

      const workingCodeTests = codeTests.filter(t => t.success && t.hasCode);
      const workingFunctionTests = functionTests.filter(t => t.success);

      return {
        success: workingCodeTests.length > 0,
        details: {
          address: CONTRACT_ADDRESS,
          network: networkId,
          contractStatus,
          codeTests,
          functionTests,
          workingCodeProviders: workingCodeTests.length,
          workingFunctions: workingFunctionTests.length,
          totalFunctions: functionTests.length,
          explorerUrl: `https://moonbase.moonscan.io/address/${CONTRACT_ADDRESS}`,
          recommendations: workingCodeTests.length === 0 ? 
            ['Contract not found at address', 'Check deployment on Moonbase Alpha', 'Verify contract address'] :
            workingFunctionTests.length === 0 ?
            ['Contract exists but functions fail', 'Check ABI compatibility', 'Try refreshing or switching networks'] :
            ['Contract is working properly']
        }
      };

    } catch (error: any) {
      console.error('❌ Debug failed:', error);
      return { success: false, error: error.message };
    }
  };

  const mintTrack = async (hash: string, price: bigint | string, maxEditions: number) => {
    if (!contract) throw new Error('Contract not initialized');
    if (!isConnected) throw new Error('Wallet not connected');
    if (networkId !== 1287) throw new Error('Please switch to Moonbase Alpha network');
    if (contractStatus !== 'accessible') throw new Error('Contract not accessible. Please check contract status.');
    
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
    contractStatus,
    connectWallet,
    switchToMoonbeam,
    mintTrack,
    buyTrack,
    withdrawEarnings,
    getTrackInfo,
    getPendingEarnings,
    debugContract
  };
};