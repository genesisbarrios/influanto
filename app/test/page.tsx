'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWallet, faTimes, faExternalLinkAlt, faExclamationTriangle, faCopy, faGavel, faUser } from "@fortawesome/free-solid-svg-icons";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { ethers, parseEther } from 'ethers';
import { useContract } from '@/hooks/useContract';

// Contract configuration with better error handling
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MUSIC_NFT_CONTRACT_ADDRESS || '';
const MOONBASE_RPC_ENDPOINTS = [
  'https://rpc.api.moonbase.moonbeam.network',
  'https://moonbase-alpha.public.blastapi.io',
  'https://moonbeam-alpha.api.onfinality.io/public',
  'https://rpc.testnet.moonbeam.network'
];
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
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
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
  // Simple judge functions for hackathon
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "trackId",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "score",
        "type": "uint8"
      }
    ],
    "name": "judgeScore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "trackId",
        "type": "uint256"
      }
    ],
    "name": "getScore",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

type WalletType = 'polkadot' | 'evm';

interface ConnectedWallet {
  address: string;
  type: WalletType;
  name?: string;
  source?: string;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Helper function to check if address is valid
const isValidAddress = (address: string): boolean => {
  try {
    return ethers.isAddress ? ethers.isAddress(address) : /^0x[a-fA-F0-9]{40}$/.test(address);
  } catch {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
};

// Helper function to parse ether (compatible with both v5 and v6)
const parseEtherCompat = (value: string): bigint => {
  try {
    return parseEther(value);
  } catch {
    return BigInt(value) * BigInt(10 ** 18);
  }
};

export default function TestContract() {
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [currentNetwork, setCurrentNetwork] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [showWalletDialog, setShowWalletDialog] = useState<boolean>(false);
  const [showInstallDialog, setShowInstallDialog] = useState<boolean>(false);
  const [selectedWalletType, setSelectedWalletType] = useState<WalletType | null>(null);
  const [availableWallets, setAvailableWallets] = useState<string[]>([]);
  const [availableAccounts, setAvailableAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [testResults, setTestResults] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [networkSwitchStatus, setNetworkSwitchStatus] = useState<string>('');

  // Judge inputs
  const [judgeTrackId, setJudgeTrackId] = useState<string>('1');
  const [judgeScore, setJudgeScore] = useState<string>('85');
  const [readTrackId, setReadTrackId] = useState<string>('1');

  const polkadotWalletOptions = [
    {
      name: "Polkadot{.js}",
      icon: "🟠",
      description: "Official Polkadot extension wallet",
      url: "https://polkadot.js.org/extension/",
      platforms: ["Browser Extension"]
    },
    {
      name: "Talisman",
      icon: "🔮",
      description: "Beautiful wallet for Polkadot & Ethereum",
      url: "https://talisman.xyz/",
      platforms: ["Browser Extension"]
    },
    {
      name: "SubWallet",
      icon: "🌐",
      description: "Comprehensive wallet for all Substrate chains",
      url: "https://subwallet.app/",
      platforms: ["Browser Extension", "Mobile"]
    }
  ];

  const evmWalletOptions = [
    {
      name: "MetaMask",
      icon: "🦊",
      description: "Popular Ethereum wallet and gateway to blockchain apps",
      url: "https://metamask.io/",
      platforms: ["Browser Extension", "Mobile"]
    },
    {
        name: "Brave Wallet",
        icon: "🦁",
        description: "Built-in wallet in the Brave browser",
        url: "https://brave.com/wallet/",
        platforms: ["Browser Extension", "Desktop"]
    },
    {
        name: "Rainbow",
        icon: "🌈",
        description: "User-friendly mobile wallet for Ethereum",
        url: "https://rainbow.me/",
        platforms: ["Mobile", "Browser Extension"],
    },
    {
      name: "WalletConnect",
      icon: "🔗",
      description: "Connect to mobile wallets via QR code",
      url: "https://walletconnect.com/",
      platforms: ["Mobile Bridge"]
    },
    {
      name: "Coinbase Wallet",
      icon: "🔵",
      description: "Self-custody wallet from Coinbase",
      url: "https://wallet.coinbase.com/",
      platforms: ["Browser Extension", "Mobile"]
    }
  ];

  // Initialize contract when wallet connects
  useEffect(() => {
    if (wallet && wallet.type === 'evm' && typeof window !== 'undefined' && window.ethereum) {
      initializeContract();
    }
  }, [wallet]);

  // Check network on load
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      checkCurrentNetwork();
    }
  }, []);

  // Handle extension errors - IMPROVED ERROR SUPPRESSION
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.error?.message || event.message || '';
      
      // Suppress known extension errors
      if (
        errorMessage.includes('chrome.runtime.sendMessage') ||
        errorMessage.includes('Extension context invalidated') ||
        errorMessage.includes('Cannot access') ||
        errorMessage.includes('runtime.sendMessage')
      ) {
        console.warn('Extension error suppressed:', errorMessage);
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
      
      // Only show meaningful errors
      if (errorMessage && !errorMessage.includes('extension')) {
        setError(errorMessage);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.message || event.reason || '';
      
      // Suppress extension-related promise rejections
      if (
        typeof errorMessage === 'string' && (
          errorMessage.includes('chrome.runtime.sendMessage') ||
          errorMessage.includes('Extension context invalidated') ||
          errorMessage.includes('runtime.sendMessage')
        )
      ) {
        console.warn('Extension promise rejection suppressed:', errorMessage);
        event.preventDefault();
        return;
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const checkCurrentNetwork = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          // Get current chain ID directly from MetaMask
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          const chainIdNumber = parseInt(chainId, 16);
          
          console.log('Current chain ID:', chainIdNumber);
          
          let networkName = 'Unknown';
          switch (chainIdNumber) {
            case 1287:
              networkName = 'Moonbase Alpha';
              break;
            case 1:
              networkName = 'Ethereum Mainnet';
              break;
            case 11155111:
              networkName = 'Sepolia Testnet';
              break;
            case 137:
              networkName = 'Polygon Mainnet';
              break;
            default:
              networkName = 'Unknown Network';
          }
          
          setCurrentNetwork(`${networkName} (${chainIdNumber})`);
          
          // If we're on Moonbase Alpha, try to initialize contract
          if (chainIdNumber === 1287 && wallet?.type === 'evm') {
            console.log('On correct network, attempting to initialize contract...');
            setTimeout(() => {
              initializeContract();
            }, 1000);
          }
          
        } catch (error) {
          console.error('Failed to get network:', error);
          setCurrentNetwork('Unknown');
        }
      }
    };

  const verifyContractManually = async () => {
  try {
    if (!CONTRACT_ADDRESS || !isValidAddress(CONTRACT_ADDRESS)) {
      alert('Please configure a valid contract address first');
      return;
    }

    setError(null);
    console.log('🔍 Starting manual contract verification...');
    
    // Check what network we're on
    let chainId, chainIdNumber;
    try {
      chainId = await window.ethereum.request({ method: 'eth_chainId' });
      chainIdNumber = parseInt(chainId, 16);
      console.log('✅ Current network:', chainIdNumber);
    } catch (networkError: any) {
      console.error('❌ Failed to get network:', networkError);
      alert(`Failed to get current network: ${networkError.message}`);
      return;
    }
    
    if (chainIdNumber !== 1287) {
      alert(`Wrong network. You're on chain ${chainIdNumber}, but need to be on Moonbase Alpha (1287)`);
      return;
    }

    console.log('✅ On correct network (Moonbase Alpha)');

    // Try multiple verification methods
    let verificationResults: any = {};
    
    // Method 1: Direct RPC call via MetaMask
    try {
      console.log('🧪 Method 1: Direct RPC call via MetaMask...');
      const contractCode = await window.ethereum.request({
        method: 'eth_getCode',
        params: [CONTRACT_ADDRESS, 'latest']
      });
      
      verificationResults.metamask = {
        success: true,
        codeLength: contractCode.length,
        hasCode: contractCode !== '0x' && contractCode !== '0x0'
      };
      
      console.log(`✅ MetaMask RPC: Found ${contractCode.length} bytes of code`);
      
    } catch (metamaskError: any) {
      console.warn('⚠️ MetaMask RPC failed:', metamaskError.message);
      verificationResults.metamask = {
        success: false,
        error: metamaskError.message
      };
    }

    // Method 2: Try each custom RPC endpoint
    console.log('🧪 Method 2: Testing custom RPC endpoints...');
    
    for (let i = 0; i < MOONBASE_RPC_ENDPOINTS.length; i++) {
      const rpcUrl = MOONBASE_RPC_ENDPOINTS[i];
      try {
        console.log(`  Testing ${rpcUrl}...`);
        
        // Use fetch instead of ethers to avoid provider issues
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getCode',
            params: [CONTRACT_ADDRESS, 'latest'],
            id: 1
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error.message || 'RPC Error');
        }

        const code = data.result;
        verificationResults[rpcUrl] = {
          success: true,
          codeLength: code.length,
          hasCode: code !== '0x' && code !== '0x0'
        };
        
        console.log(`  ✅ ${rpcUrl}: ${code.length} bytes`);
        
      } catch (rpcError: any) {
        console.warn(`  ❌ ${rpcUrl}: ${rpcError.message}`);
        verificationResults[rpcUrl] = {
          success: false,
          error: rpcError.message
        };
      }
    }

    // Method 3: Try with ethers providers as fallback
    console.log('🧪 Method 3: Testing with ethers providers...');
    
    for (let i = 0; i < Math.min(2, MOONBASE_RPC_ENDPOINTS.length); i++) {
      const rpcUrl = MOONBASE_RPC_ENDPOINTS[i];
      try {
        console.log(`  Testing ethers provider for ${rpcUrl}...`);
        
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout after 10 seconds')), 10000);
        });
        
        const codePromise = provider.getCode(CONTRACT_ADDRESS);
        const code = await Promise.race([codePromise, timeoutPromise]);
        
        verificationResults[`${rpcUrl}_ethers`] = {
          success: true,
          codeLength: (code as string).length,
          hasCode: code !== '0x' && code !== '0x0'
        };
        
        console.log(`  ✅ Ethers ${rpcUrl}: ${(code as string).length} bytes`);
        
      } catch (ethersError: any) {
        console.warn(`  ❌ Ethers ${rpcUrl}: ${ethersError.message}`);
        verificationResults[`${rpcUrl}_ethers`] = {
          success: false,
          error: ethersError.message
        };
      }
    }

    // Analyze results
    console.log('\n📊 Verification Results:');
    console.table(verificationResults);

    const successfulMethods = Object.entries(verificationResults).filter(([_, result]: any) => result.success);
    const methodsWithCode = successfulMethods.filter(([_, result]: any) => result.hasCode);

    let message = `🔍 Manual Verification Complete!\n\n`;
    message += `Contract Address: ${CONTRACT_ADDRESS}\n`;
    message += `Network: Moonbase Alpha (${chainIdNumber})\n`;
    message += `Successful verifications: ${successfulMethods.length}\n`;
    message += `Methods that found contract code: ${methodsWithCode.length}\n\n`;

    if (methodsWithCode.length > 0) {
      message += `✅ CONTRACT FOUND!\n`;
      message += `The contract exists at this address.\n\n`;
      
      const codeLength = (methodsWithCode[0][1] as { codeLength: number }).codeLength;
      message += `Code length: ${codeLength} bytes\n\n`;
      
      message += `Working verification methods:\n`;
      methodsWithCode.forEach(([method, result]: any) => {
        message += `• ${method}: ${result.codeLength} bytes\n`;
      });
      
      message += `\n✅ You can now try initializing the contract!`;
      
    } else if (successfulMethods.length > 0) {
      message += `⚠️ NO CONTRACT CODE FOUND\n`;
      message += `RPC connections work, but no contract exists at this address.\n\n`;
      message += `This means:\n`;
      message += `1. Wrong contract address\n`;
      message += `2. Contract not deployed on Moonbase Alpha\n`;
      message += `3. Deployment transaction failed\n`;
      
    } else {
      message += `❌ ALL VERIFICATION METHODS FAILED\n`;
      message += `Unable to connect to any RPC endpoints.\n\n`;
      message += `This suggests network connectivity issues.\n`;
    }

    message += `\n🛠️ Next Steps:\n`;
    message += `1. Check Moonbase Alpha explorer for your contract\n`;
    message += `2. Verify the contract address is correct\n`;
    message += `3. Ensure deployment was successful\n`;

    alert(message);

    // If contract was found, offer to initialize
    if (methodsWithCode.length > 0) {
      if (confirm('Contract verification successful! Would you like to try initializing the contract now?')) {
        setTimeout(() => {
          initializeContract();
        }, 1000);
      }
    }

    // Always offer to check explorer
    const explorerUrl = `https://moonbase.moonscan.io/address/${CONTRACT_ADDRESS}`;
    if (confirm('Would you like to open Moonbase Alpha explorer to verify your contract?')) {
      window.open(explorerUrl, '_blank');
    }
    
  } catch (error: any) {
    console.error('❌ Manual verification failed:', error);
    alert(`Verification failed: ${error.message}`);
  }
};


const initializeContract = async () => {
  try {
    // Check if contract address is configured
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '') {
      throw new Error('Contract address not configured. Please add NEXT_PUBLIC_MUSIC_NFT_CONTRACT_ADDRESS to your .env.local file');
    }

    // Validate contract address format
    if (!isValidAddress(CONTRACT_ADDRESS)) {
      throw new Error(`Invalid contract address format: ${CONTRACT_ADDRESS}`);
    }

    console.log('Initializing contract with address:', CONTRACT_ADDRESS);

    // Try multiple RPC endpoints for better reliability
    let web3Provider;
    let providerConnected = false;
    
    for (const rpcUrl of MOONBASE_RPC_ENDPOINTS) {
      try {
        console.log(`Trying RPC endpoint: ${rpcUrl}`);
        
        // Create provider with custom RPC
        const customProvider = new ethers.JsonRpcProvider(rpcUrl);
        
        // Test the connection with a simple call
        const network = await customProvider.getNetwork();
        console.log(`Successfully connected to ${rpcUrl}, network:`, network.name);
        
        web3Provider = customProvider;
        providerConnected = true;
        break;
        
      } catch (rpcError) {
        console.warn(`RPC ${rpcUrl} failed:`, rpcError.message);
        continue;
      }
    }
    
    // Fallback to MetaMask provider if all custom RPCs fail
    if (!providerConnected) {
      console.log('All custom RPCs failed, falling back to MetaMask provider...');
      try {
        web3Provider = new ethers.BrowserProvider(window.ethereum);
        console.log('Using MetaMask provider');
      } catch {
        web3Provider = new ethers.BrowserProvider(window.ethereum);
        console.log('Using legacy MetaMask provider');
      }
    }
    
    // Get network info with retry logic
    let network;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        if (!web3Provider) {
          throw new Error('web3Provider is undefined. Cannot get network information.');
        }
        network = await web3Provider.getNetwork();
        console.log('Network retrieved:', network);
        break;
      } catch (networkError) {
        attempts++;
        console.warn(`Network attempt ${attempts} failed:`, networkError.message);
        
        if (attempts === maxAttempts) {
          throw new Error(`Failed to get network information after ${maxAttempts} attempts. Please check your connection.`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }

    const chainId = typeof network?.chainId === 'bigint' ? Number(network.chainId) : network?.chainId;
    console.log('Chain ID:', chainId);
    
    // Check if we're on Moonbase Alpha
    if (chainId !== 1287) {
      throw new Error(`Wrong network. Please switch to Moonbase Alpha (Chain ID: 1287). Current: ${chainId}`);
    }

    // Get signer for MetaMask, or use provider for read-only operations
    let contractSigner;
    if (window.ethereum && providerConnected) {
      // Use MetaMask for signing but custom RPC for reading
      const metaMaskProvider = new ethers.BrowserProvider(window.ethereum);
      contractSigner = await metaMaskProvider.getSigner();
    } else {
      // Fallback to MetaMask provider
      if (!web3Provider) {
        throw new Error('No web3 provider available to get signer.');
      }
      contractSigner = await web3Provider.getSigner();
    }

    const userAddress = await contractSigner.getAddress();
    console.log('User address:', userAddress);
    
    // Check contract with retry logic and multiple endpoints
    let contractCode;
    let codeCheckSuccess = false;
    
    for (const rpcUrl of MOONBASE_RPC_ENDPOINTS) {
      try {
        console.log(`Checking contract code via ${rpcUrl}...`);
        const checkProvider = new ethers.JsonRpcProvider(rpcUrl);
        contractCode = await checkProvider.getCode(CONTRACT_ADDRESS);
        console.log(`Contract code length: ${contractCode.length} (via ${rpcUrl})`);
        codeCheckSuccess = true;
        break;
      } catch (codeError) {
        console.warn(`Code check failed on ${rpcUrl}:`, codeError.message);
        continue;
      }
    }
    
    if (!codeCheckSuccess) {
      // Final attempt with MetaMask provider
      try {
        if (!web3Provider) {
          throw new Error('No web3 provider available to check contract code.');
        }
        contractCode = await web3Provider.getCode(CONTRACT_ADDRESS);
        console.log('Contract code check via MetaMask:', contractCode.length);
      } catch (finalError) {
        throw new Error(`Unable to verify contract deployment. All RPC endpoints failed. Please try again later or check if the contract is properly deployed.`);
      }
    }
    
    if (contractCode === '0x' || contractCode === '0x0') {
      throw new Error(`No contract found at address ${CONTRACT_ADDRESS}. Please verify the contract is deployed on Moonbase Alpha network.`);
    }
    
    console.log('Contract exists, creating contract instance...');
    
    // Create contract instance with the signer
    const musicContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      contractSigner
    );

    // Test contract connection with retry
    let connectionTest = false;
    attempts = 0;
    
    while (attempts < maxAttempts && !connectionTest) {
      try {
        console.log(`Testing contract connection (attempt ${attempts + 1})...`);
        const nextId = await musicContract.nextId();
        console.log('Contract connection verified, next ID:', nextId.toString());
        connectionTest = true;
      } catch (contractError) {
        attempts++;
        console.warn(`Contract test attempt ${attempts} failed:`, contractError.message);
        
        if (attempts === maxAttempts) {
          // More specific error messages
          if (contractError.message?.includes('execution reverted')) {
            throw new Error(`Contract call failed: The contract function reverted. This might mean the contract is not properly deployed or has different functions than expected.`);
          } else if (contractError.message?.includes('NETWORK_ERROR')) {
            throw new Error(`Network error when calling contract. Please check your internet connection and try again.`);
          }
          
          throw new Error(`Contract connection test failed after ${maxAttempts} attempts: ${contractError.message || 'The contract may not have the expected functions or there might be a network issue.'}`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
      }
    }

    setContract(musicContract);
    setProvider(web3Provider);
    setCurrentNetwork(`${network?.name || 'Moonbase Alpha'} (${chainId})`);
    setError(null);
    
    console.log('✅ Contract initialized successfully');
    console.log('- Address:', CONTRACT_ADDRESS);
    console.log('- Network:', network?.name, chainId);
    console.log('- User:', userAddress);
    
  } catch (error: any) {
    console.error('❌ Failed to initialize contract:', error);
    setError(error.message || 'Failed to initialize contract');
    setContract(null);
    setProvider(null);
  }
};

  const detectWallets = async () => {
    setIsConnecting(true);
    setSelectedWalletType(null);
    setShowWalletDialog(true);
    setIsConnecting(false);
  };

  const connectPolkadotWallet = async () => {
    try {
      setIsConnecting(true);
      
      // Suppress console errors during web3Enable
      const originalConsoleError = console.error;
      console.error = (...args) => {
        const message = args[0]?.toString() || '';
        if (!message.includes('runtime.sendMessage') && !message.includes('Extension')) {
          originalConsoleError(...args);
        }
      };
      
      const extensions = await web3Enable("Influanto Test").catch(() => []);
      
      // Restore console.error
      console.error = originalConsoleError;
      
      if (extensions.length === 0) {
        setShowInstallDialog(true);
        setSelectedWalletType('polkadot');
        setIsConnecting(false);
        return;
      }

      const walletNames = extensions.map(ext => ext.name);
      setAvailableWallets(walletNames);

      const accounts = await web3Accounts().catch(() => []);
      setAvailableAccounts(accounts);

      if (accounts.length === 0) {
        alert("No accounts found in your Polkadot wallet(s). Please create an account first.");
        setIsConnecting(false);
        return;
      }

      setSelectedWalletType('polkadot');
      setIsConnecting(false);
    } catch (err) {
      console.error("Failed to detect Polkadot wallets:", err);
      setShowInstallDialog(true);
      setSelectedWalletType('polkadot');
      setIsConnecting(false);
    }
  };

  const connectMetaMask = async () => {
    try {
      setIsConnecting(true);

      if (!window.ethereum) {
        setShowInstallDialog(true);
        setSelectedWalletType('evm');
        setIsConnecting(false);
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        alert("No accounts found in MetaMask. Please create an account first.");
        setIsConnecting(false);
        return;
      }

      const account = accounts[0];
      await connectToEvmAccount(account);
      setIsConnecting(false);
    } catch (err) {
      console.error("Failed to connect to MetaMask:", err);
      alert("Failed to connect to MetaMask. Please try again.");
      setIsConnecting(false);
    }
  };

  const connectToPolkadotAccount = async (account: InjectedAccountWithMeta) => {
    try {
      const walletData: ConnectedWallet = {
        address: account.address,
        type: 'polkadot',
        name: account.meta.name || 'Polkadot Account',
        source: account.meta.source
      };

      setWallet(walletData);
      setShowWalletDialog(false);
      console.log('Connected to Polkadot account:', account.address);
    } catch (err) {
      console.error("Polkadot wallet connection failed:", err);
    }
  };

  const connectToEvmAccount = async (address: string) => {
    try {
      const walletData: ConnectedWallet = {
        address,
        type: 'evm',
        name: 'MetaMask',
        source: 'metamask'
      };

      setWallet(walletData);
      setShowWalletDialog(false);
      console.log('Connected to EVM account:', address);
    } catch (err) {
      console.error("EVM wallet connection failed:", err);
    }
  };

  // Also improve the network switch function with better RPC handling
const switchToMoonbeam = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    alert('Please install MetaMask');
    return;
  }

  setNetworkSwitchStatus('⏳ Switching network...');
  
  try {
    console.log('Attempting to switch to Moonbase Alpha...');
    
    // ALWAYS try to add the network first (safer approach)
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x507', // 1287 in hex
            chainName: 'Moonbase Alpha',
            nativeCurrency: {
              name: 'DEV',
              symbol: 'DEV',
              decimals: 18,
            },
            // Use multiple RPC URLs for better reliability
            rpcUrls: MOONBASE_RPC_ENDPOINTS,
            blockExplorerUrls: ['https://moonbase.moonscan.io/'],
            iconUrls: ['https://moonbeam.network/favicon.ico']
          },
        ],
      });
      
      setNetworkSwitchStatus('✅ Network added/updated successfully!');
      console.log('Network added/updated successfully');
      
    } catch (addError: any) {
      console.log('Add network error (might already exist):', addError.message);
      
      // If network already exists, try to switch to it
      if (addError.code === 4001) {
        setNetworkSwitchStatus('❌ User cancelled network addition');
        return;
      }
    }
    
    // Now try to switch to the network
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x507' }], // 1287 in hex
      });
      
      setNetworkSwitchStatus('✅ Successfully switched to Moonbase Alpha!');
      console.log('Network switched successfully');
      
    } catch (switchError: any) {
      console.log('Switch error:', switchError);
      
      if (switchError.code === 4001) {
        setNetworkSwitchStatus('❌ User cancelled network switch');
        return;
      }
      
      setNetworkSwitchStatus('⚠️ Please manually switch to Moonbase Alpha in MetaMask');
    }
    
    // Wait a bit then check network and reinitialize with longer delay
    setTimeout(async () => {
      await checkCurrentNetwork();
      if (wallet?.type === 'evm') {
        // Wait longer for network to stabilize
        setTimeout(() => {
          console.log('Reinitializing contract after network switch...');
          initializeContract();
        }, 2000);
      }
      
      // Clear status after 8 seconds (longer for network issues)
      setTimeout(() => {
        setNetworkSwitchStatus('');
      }, 8000);
    }, 3000);
    
  } catch (error: any) {
    console.error('Network switch failed:', error);
    setNetworkSwitchStatus(`❌ Failed: ${error.message || 'Unknown error'}`);
    
    // Clear error after 8 seconds
    setTimeout(() => {
      setNetworkSwitchStatus('');
    }, 8000);
  }
};

  const getWalletIcon = (walletName: string) => {
    switch (walletName.toLowerCase()) {
      case 'polkadot-js':
        return '🟠';
      case 'talisman':
        return '🔮';
      case 'subwallet':
        return '🌐';
      case 'fearless wallet':
        return '💎';
      case 'metamask':
        return '🦊';
      default:
        return '👛';
    }
  };

  const openWalletLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  // Existing contract test functions
  const testMint = async () => {
    try {
      if (!contract) {
        throw new Error('Contract not initialized. Please check the contract address configuration.');
      }
      
      setError(null);
      const priceWei = parseEtherCompat("0.1");
      const tx = await contract.mint("QmTestHash123", priceWei, 10);
      
      console.log('Transaction sent:', tx.hash);
      setTestResults((prev: any) => ({ ...prev, mint: { status: 'pending', hash: tx.hash } }));
      
      const receipt = await tx.wait();
      setTestResults((prev: any) => ({ ...prev, mint: { status: 'confirmed', receipt } }));
      console.log('Mint successful:', receipt);
    } catch (error: any) {
      const errorMsg = error?.message || 'Mint failed';
      console.error('Mint failed:', error);
      setTestResults((prev: any) => ({ ...prev, mint: { error: errorMsg } }));
      setError(errorMsg);
    }
  };

  const testBuy = async () => {
    try {
      if (!contract) {
        throw new Error('Contract not initialized');
      }
      
      setError(null);
      const priceWei = parseEtherCompat("0.1");
      const tx = await contract.buy(1, { value: priceWei });
      
      console.log('Transaction sent:', tx.hash);
      setTestResults((prev: any) => ({ ...prev, buy: { status: 'pending', hash: tx.hash } }));
      
      const receipt = await tx.wait();
      setTestResults((prev: any) => ({ ...prev, buy: { status: 'confirmed', receipt } }));
      console.log('Buy successful:', receipt);
    } catch (error: any) {
      const errorMsg = error?.message || 'Buy failed';
      console.error('Buy failed:', error);
      setTestResults((prev: any) => ({ ...prev, buy: { error: errorMsg } }));
      setError(errorMsg);
    }
  };

  const testWithdraw = async () => {
    try {
      if (!contract) {
        throw new Error('Contract not initialized');
      }
      
      setError(null);
      const tx = await contract.withdraw();
      
      console.log('Transaction sent:', tx.hash);
      setTestResults((prev: any) => ({ ...prev, withdraw: { status: 'pending', hash: tx.hash } }));
      
      const receipt = await tx.wait();
      setTestResults((prev: any) => ({ ...prev, withdraw: { status: 'confirmed', receipt } }));
      console.log('Withdraw successful:', receipt);
    } catch (error: any) {
      const errorMsg = error?.message || 'Withdraw failed';
      console.error('Withdraw failed:', error);
      setTestResults((prev: any) => ({ ...prev, withdraw: { error: errorMsg } }));
      setError(errorMsg);
    }
  };


    const { 
        debugContract  // ✅ Add this line
        } = useContract();

    

  return (
    <div className="p-8">
     
      {/* Wallet Installation Dialog */}
      {showInstallDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-[600px] shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Install {selectedWalletType === 'evm' ? 'EVM' : 'Polkadot'} Wallet
              </h2>
              <button
                onClick={() => setShowInstallDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-600 text-sm">
                To test the contract, you&apos;ll need to install a compatible wallet. 
                Choose one of the recommended wallets below:
              </p>
            </div>

            <div className="space-y-3">
              {(selectedWalletType === 'evm' ? evmWalletOptions : polkadotWalletOptions).map((wallet) => (
                <div
                  key={wallet.name}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{wallet.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">{wallet.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{wallet.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => openWalletLink(wallet.url)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                    >
                      Install
                      <FontAwesomeIcon icon={faExternalLinkAlt} className="text-xs" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Wallet Selection Dialog */}
      {showWalletDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-[500px] shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Connect Wallet</h2>
              <button
                onClick={() => setShowWalletDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {!selectedWalletType && (
              <div className="space-y-4">
                <p className="text-gray-600 text-sm mb-4">
                  Choose your preferred wallet type to connect:
                </p>

                {/* EVM Wallets */}
                <div 
                  onClick={connectMetaMask}
                  className="p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🦊</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">EVM Wallets (MetaMask)</h3>
                      <p className="text-sm text-gray-600">Connect with MetaMask, Coinbase Wallet, etc.</p>
                      <div className="flex gap-1 mt-1">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          Moonbeam
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Polkadot Wallets */}
                <div 
                  onClick={connectPolkadotWallet}
                  className="p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🟠</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">Polkadot Wallets</h3>
                      <p className="text-sm text-gray-600">Connect with Polkadot.js, Talisman, SubWallet</p>
                      <div className="flex gap-1 mt-1">
                        <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full">
                          Polkadot
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Polkadot Account Selection */}
            {selectedWalletType === 'polkadot' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Detected Wallets:</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableWallets.map((wallet) => (
                      <div
                        key={wallet}
                        className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                      >
                        <span className="mr-1">{getWalletIcon(wallet)}</span>
                        {wallet}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Select Account:</h3>
                  <div className="space-y-2">
                    {availableAccounts.map((account, index) => (
                      <div
                        key={account.address}
                        onClick={() => connectToPolkadotAccount(account)}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getWalletIcon(account.meta.source || '')}</span>
                              <div>
                                <p className="font-medium text-sm">
                                  {account.meta.name || `Account ${index + 1}`}
                                </p>
                                <p className="text-xs text-gray-500 font-mono">
                                  {account.address.slice(0, 8)}...{account.address.slice(-8)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedWalletType(null)}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-800"
                >
                  ← Back to wallet selection
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      <h1 className="text-2xl font-bold mb-6">🎵 Music Collectibles - Polkadot Moonbase Contract Test Page</h1>
      
      {/* Configuration Status */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">🔧 Configuration Status</h3>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span>Contract Address:</span>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {CONTRACT_ADDRESS || 'Not configured'}
              </code>
              {CONTRACT_ADDRESS && (
                <button 
                  onClick={() => copyToClipboard(CONTRACT_ADDRESS)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <FontAwesomeIcon icon={faCopy} />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>Address Valid:</span>
            <span className={CONTRACT_ADDRESS && isValidAddress(CONTRACT_ADDRESS) ? 'text-green-600' : 'text-red-600'}>
              {CONTRACT_ADDRESS && isValidAddress(CONTRACT_ADDRESS) ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Current Network:</span>
            <span>{currentNetwork || 'Not connected'}</span>
          </div>
        </div>
        
        {(!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '') && (
          <div className="mt-3 p-3 bg-yellow-100 rounded border border-yellow-300">
            <p className="text-sm text-yellow-800">
              <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
              Contract address not configured. Please add your deployed contract address to:
            </p>
            <code className="block mt-2 text-xs bg-gray-100 p-2 rounded">
              .env.local → NEXT_PUBLIC_MUSIC_NFT_CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS
            </code>
          </div>
        )}
      </div>

      {/* Error Display */}
        {error && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="text-sm text-red-800">
            <strong>Error:</strong> {error}
            <button 
                onClick={() => setError(null)}
                className="ml-2 text-red-600 hover:text-red-800"
            >
                ✕
            </button>
            </div>
            {/* Add retry button for contract-related errors */}
            {(error.includes('RPC') || error.includes('network') || error.includes('connection') || error.includes('Contract') || error.includes('CALL_EXCEPTION') || error.includes('missing revert data')) && (
            <div className="mt-3 flex gap-2">
            <button 
            onClick={async () => {
                try {
                setError(null);
                console.log('🐛 Starting debug...');
                
                const result = await debugContract();
                console.log('🐛 Debug result:', result);
                
                if (result && result.success) {
                    const details = result.details;
                    const message = `🔍 Contract Debug Results:

            📍 Address: ${details?.address}
            🌐 Network: ${details?.network}
            📊 Status: ${details?.contractStatus}

            💻 Code Tests:
            ${details?.codeTests?.map((t: any) => 
            t.success ? `✅ ${t.method}: ${t.hasCode ? 'Has Code' : 'No Code'} (${t.codeLength} bytes)` : `❌ ${t.method}: ${t.error}`
            ).join('\n') || 'No code tests performed'}

            🔧 Function Tests:
            ${details?.functionTests?.map((t: any) => 
            t.success ? `✅ ${t.function}: ${t.result}` : 
            `❌ ${t.function}: ${t.error}${t.rawCallSuccess ? ' (but raw call worked)' : ' (raw call also failed)'}`
            ).join('\n') || 'No function tests performed'}

            🎯 Mint Function Signature Tests:
            ${details?.mintSignatureTests ? details?.mintSignatureTests.map((t: any) => 
            `${t.exists ? '✅' : '❌'} ${t.name} (${t.selector})${t.expected ? ' [EXPECTED]' : ''}${t.error ? ` - Error: ${t.error}` : t.rawResult ? ` - Result: ${t.rawResult}` : ''}`
            ).join('\n') : 'No mint signature tests performed'}

            ${details?.contractAnalysis ? `
            🔍 Contract Analysis:
            ${details?.contractAnalysis.commonChecks ? 
            details?.contractAnalysis.commonChecks.map((c: any) => `${c.success ? '✅' : '❌'} ${c.type} ${c.function}`).join('\n') :
            details?.contractAnalysis.error || 'No analysis available'
            }` : ''}

            💡 Summary:
            - Found ${details?.foundMintFunctions || 0} potential mint function(s)
            - ${details?.workingFunctions || 0}/${details?.totalFunctions || 0} standard functions working

            💡 Recommendations:
            ${details?.recommendations?.join('\n') || 'No recommendations available'}

            🚀 Next Steps:
            ${details?.nextSteps?.join('\n') || 'No next steps available'}

            🔗 Explorer: ${details?.explorerUrl || 'No explorer URL available'}`;

                    alert(message);
                    
                    // Also log to console for easier copying
                    console.log('📋 Full debug results:', details);
                    
                } else {
                    const errorMessage = `❌ Contract Debug Failed: ${result?.error || 'Unknown error - result is null or undefined'}`;
                    alert(errorMessage);
                    console.error('🐛 Debug failed:', result);
                }
                
                } catch (error: any) {
                console.error('❌ Debug function error:', error);
                const errorMessage = `❌ Debug function failed: ${error.message}`;
                alert(errorMessage);
                setError(`Debug failed: ${error.message}`);
                }
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm"
            >
            🐛 Debug Contract
            </button>
            </div>
            )}
        </div>
        )}

      {/* Network Switch Status */}
      {networkSwitchStatus && (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-sm text-purple-800">
            <strong>Network Switch:</strong> {networkSwitchStatus}
          </div>
        </div>
      )}
      
      {/* Contract Info */}
      <div className="mb-6 bg-gray-100 p-4 rounded">
        <p><strong>Account:</strong> {wallet?.address || 'Not connected'}</p>
        <p><strong>Wallet Type:</strong> {wallet?.type || 'None'}</p>
        <p><strong>Contract Initialized:</strong> {contract ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Required Network:</strong> Moonbase Alpha (Chain ID: 1287)</p>
      </div>

     {/* Connection Section */}
    {!wallet ? (
    <div className="mb-6">
        <button 
        onClick={detectWallets}
        disabled={isConnecting}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2 disabled:opacity-50"
        >
        <FontAwesomeIcon icon={faWallet} className="mr-2" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
    </div>
    ) : (
    <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center px-4 py-2 bg-green-100 rounded-lg">
            <span className="mr-2">{wallet.type === 'evm' ? '🦊' : '🟠'}</span>
            <span className="font-mono text-sm">
            {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
            </span>
            <span className="ml-2 text-xs text-gray-500 capitalize">
            ({wallet.type})
            </span>
        </div>
        
        {/* Network status indicator */}
        <div className={`px-3 py-1 rounded-full text-xs ${
            currentNetwork.includes('1287') 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
            {currentNetwork.includes('1287') ? '✅ Correct Network' : '❌ Wrong Network'}
        </div>
        </div>

       {wallet.type === 'evm' && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <button 
            onClick={switchToMoonbeam}
            className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm"
            >
            🌙 Switch to Moonbeam
            </button>
            <button 
            onClick={checkCurrentNetwork}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
            >
            🔄 Check Network
            </button>
            <button 
            onClick={initializeContract}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm"
            >
            🔗 Init Contract
            </button>
            <button 
            onClick={verifyContractManually}
            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded text-sm"
            >
            🔍 Verify Contract
            </button>
            <button 
            onClick={debugContract}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm"
            >
            🐛 Debug Contract
            </button>
            <button 
            onClick={() => {
                setWallet(null);
                setContract(null);
                setProvider(null);
                setError(null);
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm"
            >
            🚪 Disconnect
            </button>
        </div>
        )}
        
        {/* Network switching instructions */}
        {wallet.type === 'evm' && !currentNetwork.includes('1287') && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-800 mb-2">📋 Manual Network Switch Instructions:</h4>
            <div className="text-sm text-yellow-700 space-y-1">
            <p>1. Open MetaMask extension</p>
            <p>2. Click the network dropdown (currently showing &apos;{currentNetwork}&apos;)</p>
            <p>3. Select &quot;Moonbase Alpha&quot; or click &quot;Add Network&quot; if not visible</p>
            <p>4. Use these network details if adding manually:</p>
            <div className="mt-2 p-2 bg-yellow-100 rounded text-xs font-mono">
                <div>Network Name: Moonbase Alpha</div>
                <div>RPC URL: https://rpc.api.moonbase.moonbeam.network</div>
                <div>Chain ID: 1287</div>
                <div>Symbol: DEV</div>
                <div>Explorer: https://moonbase.moonscan.io/</div>
            </div>
            </div>
        </div>
        )}
    </div>
    )}

      {/* Test Functions */}
      {wallet?.type === 'evm' && contract && (
        <div className="space-y-8">
          

          {/* Basic Contract Functions */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faUser} className="text-blue-600" />
              🎵 Basic Contract Functions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={testMint}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                Mint New Track
              </button>
              
              <button 
                onClick={testBuy}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
              >
                Buy Track (ID: 1)
              </button>
              
              <button 
                onClick={testWithdraw}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                Withdraw Earnings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info for non-EVM wallets */}
      {wallet?.type === 'polkadot' && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-800">
            ℹ️ Polkadot wallet connected, but contract testing requires MetaMask (EVM wallet) for Moonbeam network.
          </div>
        </div>
      )}

      {/* Results */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">📋 Test Results:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm max-h-96">
          {JSON.stringify(testResults, null, 2)}
        </pre>
      </div>
    </div>
  );
}