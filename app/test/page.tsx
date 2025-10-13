'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWallet, faTimes, faExternalLinkAlt, faExclamationTriangle, faCopy, faUser, faMusic } from "@fortawesome/free-solid-svg-icons";

// Polkadot imports - keep for future use
import { web3Accounts, web3Enable, web3FromAddress } from "@polkadot/extension-dapp";
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

// Ethereum imports
import { BrowserProvider, Contract, formatEther, parseEther } from 'ethers';

// Solidity ABI for EVM (your actual deployed contract)
const SOLIDITY_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "account", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "FundsWithdrawn",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "id", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "buyer", "type": "address"},
      {"indexed": false, "internalType": "uint32", "name": "edition", "type": "uint32"},
      {"indexed": false, "internalType": "uint256", "name": "price", "type": "uint256"}
    ],
    "name": "TokenBought",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "id", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "price", "type": "uint256"},
      {"indexed": false, "internalType": "uint32", "name": "maxEditions", "type": "uint32"}
    ],
    "name": "TokenMinted",
    "type": "event"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}],
    "name": "buy",
    "outputs": [{"internalType": "uint32", "name": "", "type": "uint32"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "hash", "type": "string"},
      {"internalType": "uint256", "name": "price", "type": "uint256"},
      {"internalType": "uint32", "name": "maxEditions", "type": "uint32"}
    ],
    "name": "mint",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
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
    "inputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}],
    "name": "getTokenInfo",
    "outputs": [
      {"internalType": "address", "name": "creator", "type": "address"},
      {"internalType": "string", "name": "hash", "type": "string"},
      {"internalType": "uint256", "name": "price", "type": "uint256"},
      {"internalType": "uint32", "name": "soldCount", "type": "uint32"},
      {"internalType": "uint32", "name": "maxEditions", "type": "uint32"},
      {"internalType": "bool", "name": "exists", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "getPendingBalance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextId",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Network configurations - PASEO TESTNET EVM
const PASEO_RPC_ENDPOINTS = [
  'https://paseo-asset-hub-eth-rpc.polkadot.io/',
  'wss://paseo-asset-hub-eth-rpc.polkadot.io',
  'https://rpc-paseo.luckyfriday.io/',
  'https://paseo-rpc.dwellir.com/'
];

const PASEO_EVM_RPC = PASEO_RPC_ENDPOINTS[0]; // Use first as primary
const PASEO_CHAIN_ID = '0x1A5'; // 421 in hex
const PASEO_CHAIN_ID_DECIMAL = 421;
const CONTRACT_ADDRESS_EVM = process.env.NEXT_PUBLIC_MUSIC_NFT_CONTRACT_ADDRESS || '';
type WalletType = 'polkadot' | 'metamask';

interface ConnectedWallet {
  address: string;
  type: WalletType;
  name?: string;
  source?: string;
}

const walletOptions = [
  // Polkadot Wallets
  { 
    name: "Talisman",
    icon: "🔮",
    description: "Beautiful wallet for Polkadot & Ethereum",
    url: "https://talisman.xyz/",
    type: "polkadot",
    platforms: ["Browser Extension"]
  },
  {
    name: "Polkadot{.js}",
    icon: "🟠",
    description: "Official Polkadot extension wallet",
    url: "https://polkadot.js.org/extension/",
    type: "polkadot",
    platforms: ["Browser Extension"]
  },
  {
    name: "SubWallet",
    icon: "🌐",
    description: "Comprehensive wallet for all Substrate chains",
    url: "https://subwallet.app/",
    type: "polkadot",
    platforms: ["Browser Extension", "Mobile"]
  },
  // EVM Wallets
  {
    name: "MetaMask",
    icon: "🦊",
    description: "Most popular Ethereum wallet (for EVM contracts)",
    url: "https://metamask.io/",
    type: "evm",
    platforms: ["Browser Extension", "Mobile"]
  },
  {
    name: "Rabby",
    icon: "🐰",
    description: "Ethereum & EVM wallet for pros",
    url: "https://rabby.io/",
    type: "evm",
    platforms: ["Browser Extension"]
  }
];

export default function TestContract() {
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [showWalletDialog, setShowWalletDialog] = useState<boolean>(false);
  const [showInstallDialog, setShowInstallDialog] = useState<boolean>(false);
  const [availableWallets, setAvailableWallets] = useState<string[]>([]);
  const [availableAccounts, setAvailableAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [testResults, setTestResults] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<string>('');

  // Test inputs
  const [mintHash, setMintHash] = useState<string>('QmTestHash123456789');
  const [mintPrice, setMintPrice] = useState<string>('0.01');
  const [mintEditions, setMintEditions] = useState<string>('10');
  const [buyTokenId, setBuyTokenId] = useState<string>('1');
  const [viewTokenId, setViewTokenId] = useState<string>('1');

  // Paseo Asset Hub EVM network config
  const paseoNetwork = {
    chainId: '0x1A5', // 421 in hex  
    chainName: 'Paseo Asset Hub EVM',
    nativeCurrency: {
      name: 'PAS',
      symbol: 'PAS', 
      decimals: 18
    },
    rpcUrls: PASEO_RPC_ENDPOINTS, // Multiple RPC options for wallet
    blockExplorerUrls: ['https://paseo.subscan.io/']
  };


  // Initialize contract when wallet connects (only for EVM wallets)
  useEffect(() => {
    if (wallet?.type === 'metamask' && provider) {
      initializeEvmContract();
    }
  }, [wallet, provider]);

  const detectWallets = async () => {
    setIsConnecting(true);
    setShowWalletDialog(true);
    
    try {
      // Check for Polkadot wallets
      const originalConsoleError = console.error;
      console.error = (...args) => {
        const message = args[0]?.toString() || '';
        if (!message.includes('runtime.sendMessage') && !message.includes('Extension')) {
          originalConsoleError(...args);
        }
      };
      
      const extensions = await web3Enable("Influanto Music NFT").catch(() => []);
      console.error = originalConsoleError;
      
      if (extensions.length > 0) {
        const walletNames = extensions.map(ext => ext.name);
        setAvailableWallets(walletNames);

        const accounts = await web3Accounts().catch(() => []);
        setAvailableAccounts(accounts);
        console.log(`Found ${extensions.length} Polkadot wallet(s) and ${accounts.length} account(s)`);
      }

      // Check for EVM providers (MetaMask, Talisman EVM, etc.)
      if (typeof window.ethereum !== 'undefined') {
        console.log('✅ EVM provider detected');
        
        // Check if it's Talisman's EVM provider
        if (window.ethereum.isTalisman) {
          console.log('✅ Talisman EVM provider detected - this is what you used for deployment!');
        } else if (window.ethereum.isMetaMask) {
          console.log('✅ MetaMask detected');
        } else {
          console.log('✅ Unknown EVM provider detected');
        }
      }

      setIsConnecting(false);
      
    } catch (err: any) {
      console.error("Failed to detect wallets:", err);
      setShowInstallDialog(true);
      setIsConnecting(false);
    }
  };

  const connectToEvm = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      if (typeof window.ethereum === 'undefined') {
        throw new Error('No EVM wallet detected. Please install MetaMask or Talisman.');
      }

      const walletName = window.ethereum.isTalisman ? 'Talisman' : 
                        window.ethereum.isMetaMask ? 'MetaMask' : 
                        'Unknown EVM Wallet';
      
      console.log(`🔗 Connecting to ${walletName} EVM...`);
      
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error(`No accounts found. Please create an account in ${walletName}.`);
      }

      // Create provider first
      const web3Provider = new BrowserProvider(window.ethereum);
      
      // Check current network before switching
      try {
        const network = await web3Provider.getNetwork();
        console.log(`📡 Current network: ${network.name} (Chain ID: ${network.chainId})`);
        
        // If we're already on the right network, don't switch
        if (Number(network.chainId) === 421) {
          console.log('✅ Already on Paseo Asset Hub EVM (421)');
          setNetworkStatus(`✅ Connected to ${walletName} on Paseo Asset Hub EVM (Chain ID: ${network.chainId})`);
        } else {
          // Try to switch to Paseo Asset Hub EVM
          console.log(`⚠️ Wrong network detected. Current: ${network.chainId}, Need: 421`);
          try {
            await switchToPaseo();
            setNetworkStatus(`✅ Connected to ${walletName} on Paseo Asset Hub EVM`);
          } catch (networkError: any) {
            console.warn('⚠️ Network switch failed, continuing with current network:', networkError.message);
            setNetworkStatus(`⚠️ Connected to ${walletName} on ${network.name} (Chain ID: ${network.chainId}) - Need Chain ID 421`);
            setError(`Wrong network! You're on Chain ID ${network.chainId} but need Chain ID 421 (Paseo Asset Hub EVM). Please switch networks in your wallet.`);
          }
        }
      } catch (networkCheckError: any) {
        console.warn('⚠️ Could not check network, continuing...', networkCheckError.message);
        setNetworkStatus(`⚠️ Connected to ${walletName} (Network check failed - RPC issues)`);
        setError(`Network check failed: ${networkCheckError.message}. This might be an RPC connectivity issue.`);
      }

      const signer = await web3Provider.getSigner();
      const address = await signer.getAddress();

      setProvider(web3Provider);
      setWallet({
        address,
        type: 'metamask', // Keep as 'metamask' for EVM functionality
        name: `${walletName} Account`
      });

      setShowWalletDialog(false);
      console.log(`✅ Connected to ${walletName} EVM:`, address);
      
      setTimeout(() => setNetworkStatus(''), 10000);
      
    } catch (error: any) {
      console.error('❌ EVM connection failed:', error);
      setError(`EVM connection failed: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const switchToPaseo = async () => {
    try {
      console.log(`🔗 Attempting to switch to Paseo Asset Hub EVM (Chain ID: ${PASEO_CHAIN_ID})`);
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: PASEO_CHAIN_ID }],
      });
      
      console.log('✅ Successfully switched to Paseo Asset Hub EVM');
      
    } catch (switchError: any) {
      console.log('⚠️ Switch failed, attempting to add network...', switchError.code);
      
      if (switchError.code === 4902) {
        // Network not added to wallet
        try {
          console.log('📡 Adding Paseo Asset Hub EVM network to wallet...');
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [paseoNetwork],
          });
          console.log('✅ Successfully added Paseo Asset Hub EVM network');
        } catch (addError: any) {
          console.error('❌ Failed to add network:', addError);
          throw new Error(`Failed to add Paseo Asset Hub EVM network: ${addError.message}`);
        }
      } else if (switchError.code === 4001) {
        // User rejected the request
        throw new Error('User rejected network switch request');
      } else {
        console.warn('⚠️ Network switch failed, continuing with current network');
      }
    }
  };

  const connectToPolkadotAccount = async (account: InjectedAccountWithMeta) => {
    try {
      setIsConnecting(true);
      setError(null);
      
      // Connect the wallet
      const walletData: ConnectedWallet = {
        address: account.address,
        type: 'polkadot',
        name: account.meta.name || 'Polkadot Account',
        source: account.meta.source
      };

      setWallet(walletData);
      setShowWalletDialog(false);
      
      console.log('✅ Connected to Polkadot account:', account.address);
      setNetworkStatus('✅ Connected to Polkadot wallet');
      
      setTimeout(() => setNetworkStatus(''), 5000);
      
    } catch (err: any) {
      console.error("Polkadot wallet connection failed:", err);
      setError(`Wallet connection failed: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const initializeEvmContract = async () => {
    try {
      if (!CONTRACT_ADDRESS_EVM || CONTRACT_ADDRESS_EVM === '') {
        console.log('ℹ️ EVM contract address not configured - testing will show expected errors');
        return;
      }

      if (!provider) {
        throw new Error('EVM provider not initialized.');
      }

      if (!wallet || wallet.type !== 'metamask') {
        throw new Error('EVM wallet not connected.');
      }

      console.log('🔗 Initializing EVM contract with address:', CONTRACT_ADDRESS_EVM);

      // Verify network first
      try {
        const network = await provider.getNetwork();
        console.log(`📡 Provider network: ${network.name} (Chain ID: ${network.chainId})`);
      } catch (networkError: any) {
        console.warn('⚠️ Could not verify network:', networkError.message);
      }

      const signer = await provider.getSigner();
      const contractInstance = new Contract(CONTRACT_ADDRESS_EVM, SOLIDITY_ABI, signer);
      
      // Test connection with better error handling
      try {
        console.log('🔍 Testing contract connection...');
        const nextId = await contractInstance.nextId();
        console.log('✅ EVM contract connection verified, next ID:', nextId.toString());
        
        setContract(contractInstance);
        setError(null);
        setTestResults((prev: any) => ({ 
          ...prev, 
          connection: { 
            status: 'success', 
            type: 'EVM',
            nextId: nextId.toString(),
            contractAddress: CONTRACT_ADDRESS_EVM,
            timestamp: new Date().toISOString()
          } 
        }));
      } catch (callError: any) {
        console.log('ℹ️ Contract verification failed (will still load for testing):', callError.message);
        setContract(contractInstance); // Still set contract for testing
        setTestResults((prev: any) => ({ 
          ...prev, 
          connection: { 
            status: 'partial', 
            type: 'EVM',
            error: callError.message,
            contractAddress: CONTRACT_ADDRESS_EVM,
            timestamp: new Date().toISOString(),
            note: 'Contract loaded but verification failed - may still work for some operations'
          } 
        }));
      }
      
    } catch (error: any) {
      console.error('❌ Failed to initialize EVM contract:', error);
      setError(`EVM contract initialization failed: ${error.message}`);
    }
  };

  const getWalletIcon = (walletName: string) => {
    const name = walletName.toLowerCase();
    if (name.includes('polkadot') || name.includes('polkadot-js')) return '🟠';
    if (name.includes('talisman')) return '🔮';
    if (name.includes('subwallet')) return '🌐';
    if (name.includes('metamask')) return '🦊';
    if (name.includes('rabby')) return '🐰';
    return '👛';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  // Verification function
  const verifyContractDeployment = async () => {
    try {
      if (!provider) {
        if (wallet?.type === 'polkadot') {
          throw new Error('Contract verification requires an EVM provider. Connect with Talisman EVM or MetaMask to verify your deployed contract.');
        }
        throw new Error('No provider available');
      }

      setError(null);
      console.log('🔍 Verifying contract deployment...');

      const network = await provider.getNetwork();
      console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

      // Check if address has bytecode
      const bytecode = await provider.getCode(CONTRACT_ADDRESS_EVM);
      console.log(`📄 Bytecode at ${CONTRACT_ADDRESS_EVM}:`, bytecode);

      // Check transaction history for this address
      const transactionCount = await provider.getTransactionCount(CONTRACT_ADDRESS_EVM);
      console.log(`📊 Transaction count:`, transactionCount);

      // Check balance at address
      const balance = await provider.getBalance(CONTRACT_ADDRESS_EVM);
      console.log(`💰 Balance:`, formatEther(balance), 'PAS');

      setTestResults((prev: any) => ({
        ...prev,
        verification: {
          status: 'completed',
          network: {
            name: network.name,
            chainId: network.chainId.toString()
          },
          contractAddress: CONTRACT_ADDRESS_EVM,
          bytecode: bytecode,
          bytecodeLength: bytecode.length,
          hasContract: bytecode !== '0x',
          transactionCount: transactionCount,
          balance: formatEther(balance) + ' PAS',
          timestamp: new Date().toISOString(),
          verdict: bytecode === '0x' 
            ? 'NO CONTRACT FOUND - Address has no bytecode' 
            : 'CONTRACT EXISTS - Bytecode detected'
        }
      }));

      if (bytecode === '0x') {
        setError(`No contract found at ${CONTRACT_ADDRESS_EVM}. This address has no bytecode, meaning no contract is deployed there.`);
      } else {
        console.log('✅ Contract exists at this address');
      }

    } catch (error: any) {
      console.error('❌ Verification failed:', error);
      setTestResults((prev: any) => ({
        ...prev,
        verification: {
          status: 'failed',
          error: error.message,
          contractAddress: CONTRACT_ADDRESS_EVM,
          walletType: wallet?.type,
          suggestion: wallet?.type === 'polkadot' 
            ? 'Connect with Talisman EVM mode to verify your deployed contract'
            : 'Check network connection and provider status'
        }
      }));
      setError(`Verification failed: ${error.message}`);
    }
  };
  
  // Test functions for EVM
  const testEvmMint = async () => {
    try {
      if (!contract) {
        // Allow Polkadot wallets to see the error message
        if (wallet?.type === 'polkadot') {
          throw new Error('EVM contract requires an EVM wallet (Talisman EVM or MetaMask). You are connected to Polkadot mode. Please switch to Talisman EVM to test your deployed contract.');
        }
        throw new Error('EVM contract not initialized - configure CONTRACT_ADDRESS_EVM or connect EVM wallet');
      }

      setError(null);
      console.log('🎵 Testing EVM mint function...');

      const priceInWei = parseEther(mintPrice);
      
      const tx = await contract.mint(
        mintHash,
        priceInWei,
        parseInt(mintEditions)
      );

      console.log('🔄 EVM mint transaction sent:', tx.hash);
      
      setTestResults((prev: any) => ({ 
        ...prev, 
        mint: { 
          status: 'pending', 
          type: 'EVM',
          txHash: tx.hash,
          params: {
            hash: mintHash,
            price: mintPrice + ' PAS',
            editions: mintEditions
          }
        } 
      }));

      const receipt = await tx.wait();
      
      console.log('✅ EVM mint transaction confirmed');
      setTestResults((prev: any) => ({ 
        ...prev, 
        mint: { 
          status: 'confirmed', 
          type: 'EVM',
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          params: {
            hash: mintHash,
            price: mintPrice + ' PAS',
            editions: mintEditions
          }
        } 
      }));

    } catch (error: any) {
      console.error('❌ EVM mint failed:', error);
      setTestResults((prev: any) => ({ 
        ...prev, 
        mint: { 
          error: error.message, 
          type: 'EVM',
          walletType: wallet?.type,
          suggestion: wallet?.type === 'polkadot' 
            ? 'Switch to Talisman EVM mode to test your deployed contract'
            : 'Check contract configuration and network connection'
        } 
      }));
      setError(error.message);
    }
  };

  const testEvmBuy = async () => {
    try {
      if (!contract) {
        if (wallet?.type === 'polkadot') {
          throw new Error('EVM contract requires an EVM wallet (Talisman EVM or MetaMask). You are connected to Polkadot mode. Please switch to Talisman EVM to test your deployed contract.');
        }
        throw new Error('EVM contract not initialized - configure CONTRACT_ADDRESS_EVM or connect EVM wallet');
      }

      setError(null);
      console.log('🛒 Testing EVM buy function...');

      // First get token info to know the price
      const tokenInfo = await contract.getTokenInfo(parseInt(buyTokenId));
      const tokenPrice = tokenInfo[2]; // price is at index 2

      const tx = await contract.buy(parseInt(buyTokenId), {
        value: tokenPrice
      });

      console.log('🔄 EVM buy transaction sent:', tx.hash);
      
      setTestResults((prev: any) => ({ 
        ...prev, 
        buy: { 
          status: 'pending', 
          type: 'EVM',
          txHash: tx.hash,
          params: {
            tokenId: buyTokenId,
            price: formatEther(tokenPrice) + ' PAS'
          }
        } 
      }));

      const receipt = await tx.wait();
      
      console.log('✅ EVM buy transaction confirmed');
      setTestResults((prev: any) => ({ 
        ...prev, 
        buy: { 
          status: 'confirmed', 
          type: 'EVM',
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          params: {
            tokenId: buyTokenId,
            price: formatEther(tokenPrice) + ' PAS'
          }
        } 
      }));

    } catch (error: any) {
      console.error('❌ EVM buy failed:', error);
      setTestResults((prev: any) => ({ 
        ...prev, 
        buy: { 
          error: error.message, 
          type: 'EVM',
          walletType: wallet?.type,
          suggestion: wallet?.type === 'polkadot' 
            ? 'Switch to Talisman EVM mode to test your deployed contract'
            : 'Check contract configuration and network connection'
        } 
      }));
      setError(error.message);
    }
  };

  const testEvmView = async () => {
    try {
      if (!contract) {
        if (wallet?.type === 'polkadot') {
          throw new Error('EVM contract requires an EVM wallet (Talisman EVM or MetaMask). You are connected to Polkadot mode. Please switch to Talisman EVM to test your deployed contract.');
        }
        throw new Error('EVM contract not initialized - configure CONTRACT_ADDRESS_EVM or connect EVM wallet');
      }

      setError(null);
      console.log('👁️ Testing EVM view functions...');

      const tokenInfo = await contract.getTokenInfo(parseInt(viewTokenId));
      const pendingBalance = await contract.getPendingBalance(wallet!.address);
      const nextId = await contract.nextId();

      setTestResults((prev: any) => ({ 
        ...prev, 
        view: { 
          status: 'success',
          type: 'EVM',
          data: {
            tokenInfo: {
              creator: tokenInfo[0],
              hash: tokenInfo[1],
              price: formatEther(tokenInfo[2]) + ' PAS',
              soldCount: tokenInfo[3].toString(),
              maxEditions: tokenInfo[4].toString(),
              exists: tokenInfo[5]
            },
            pendingBalance: formatEther(pendingBalance) + ' PAS',
            nextId: nextId.toString()
          }
        } 
      }));

    } catch (error: any) {
      console.error('❌ EVM view failed:', error);
      setTestResults((prev: any) => ({ 
        ...prev, 
        view: { 
          error: error.message, 
          type: 'EVM',
          walletType: wallet?.type,
          suggestion: wallet?.type === 'polkadot' 
            ? 'Switch to Talisman EVM mode to test your deployed contract'
            : 'Check contract configuration and network connection'
        } 
      }));
      setError(error.message);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      
      {/* Install Dialog */}
      {showInstallDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-[600px] shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Install Wallet
              </h2>
              <button
                onClick={() => setShowInstallDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-600 text-sm mb-3">
                Choose a wallet to test the Music NFT contract:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs mb-3">
                <div className="p-2 bg-blue-50 rounded">
                  <strong>🔮 Polkadot Wallets</strong><br/>
                  For future contracts
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <strong>🦊 EVM Wallets</strong><br/>
                  For your current Solidity contract
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {walletOptions.map((wallet) => (
                <div
                  key={wallet.name}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{wallet.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                          {wallet.name}
                          <span className={`text-xs px-2 py-1 rounded ${
                            wallet.type === 'polkadot' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {wallet.type === 'polkadot' ? 'Polkadot' : 'EVM'}
                          </span>
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">{wallet.description}</p>
                        <div className="flex gap-1">
                          {wallet.platforms.map((platform) => (
                            <span key={platform} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {platform}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => window.open(wallet.url, '_blank')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                    >
                      Install
                      <FontAwesomeIcon icon={faExternalLinkAlt} className="text-xs" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">💡 Current Status</h4>
              <div className="text-sm text-yellow-700 space-y-2">
                <p><strong>✅ EVM (Solidity):</strong> Your deployed contract on Paseo Asset Hub</p>
                <p><strong>🚧 Polkadot:</strong> Wallet connection available for testing</p>
              </div>
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

            {/* EVM Wallets Section */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">🦊 EVM Wallets (Your Deployed Contract):</h3>
              {typeof window !== 'undefined' && window.ethereum ? (
                <div className="space-y-2">
                  <button
                    onClick={connectToEvm}
                    disabled={isConnecting}
                    className="w-full p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {window.ethereum.isTalisman ? '🔮' : window.ethereum.isMetaMask ? '🦊' : '👛'}
                      </span>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm">
                          {window.ethereum.isTalisman ? 'Talisman EVM' : 
                           window.ethereum.isMetaMask ? 'MetaMask' : 
                           'EVM Wallet'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {isConnecting ? 'Connecting...' : 
                           window.ethereum.isTalisman ? '🎯 Use this - same wallet you deployed with!' :
                           'Connect to Paseo Asset Hub EVM'}
                        </p>
                      </div>
                      {window.ethereum.isTalisman && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          Recommended
                        </span>
                      )}
                    </div>
                  </button>
                  
                  {window.ethereum.isTalisman && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800">
                        <strong>✅ Perfect!</strong> Talisman EVM detected. This is the same wallet mode you used to deploy your contract.
                        Click above to connect to the EVM side and test your deployed contract.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl opacity-50">👛</span>
                      <div>
                        <p className="font-medium text-sm text-gray-600">EVM Wallet</p>
                        <p className="text-xs text-gray-500">Not detected</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open('https://talisman.xyz/', '_blank')}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
                      >
                        Talisman
                      </button>
                      <button
                        onClick={() => window.open('https://metamask.io/', '_blank')}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
                      >
                        MetaMask
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Polkadot Wallets */}
            {availableWallets.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">🔮 Polkadot Wallets:</h3>
                <div className="flex flex-wrap gap-2 mb-3">
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

                <div className="space-y-2">
                  {availableAccounts.map((account, index) => (
                    <div
                      key={account.address}
                      onClick={() => connectToPolkadotAccount(account)}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getWalletIcon(account.meta.source || '')}</span>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {account.meta.name || `Account ${index + 1}`}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {account.address.slice(0, 8)}...{account.address.slice(-8)}
                          </p>
                          <p className="text-xs text-blue-600">
                            via {account.meta.source}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {availableWallets.length === 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">🔮 Polkadot Wallets:</h3>
                <div className="p-3 border rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-600">
                    No Polkadot wallets detected. 
                    <button
                      onClick={() => setShowInstallDialog(true)}
                      className="text-blue-600 hover:text-blue-800 ml-1"
                    >
                      Install one here
                    </button>
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
      
      <h1 className="text-3xl font-bold mb-6 text-center">
        🎵 Music NFT Contract Test - Paseo Asset Hub
      </h1>
      
      {/* Configuration Status */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">🔧 Configuration Status</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>🦊 EVM Contract:</span>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
              {CONTRACT_ADDRESS_EVM || 'Not configured'}
            </code>
          </div>
          <div className="flex items-center justify-between">
            <span>EVM Provider:</span>
            <span className={provider ? 'text-green-600' : 'text-red-600'}>
              {provider ? '✅ Connected' : '❌ Disconnected'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Contract:</span>
            <span className={contract ? 'text-green-600' : 'text-red-600'}>
              {contract ? '✅ Loaded' : '❌ Not loaded'}
            </span>
          </div>
        </div>
        
        {!CONTRACT_ADDRESS_EVM && (
          <div className="mt-3 p-3 bg-yellow-100 rounded border border-yellow-300">
            <p className="text-sm text-yellow-800">
              <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
              Configure contract address in .env.local:
            </p>
            <code className="block mt-2 text-xs bg-gray-100 p-2 rounded">
              NEXT_PUBLIC_MUSIC_NFT_CONTRACT_ADDRESS=0xYourContractAddress
            </code>
          </div>
        )}
      </div>

      {/* Network Status */}
      {networkStatus && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-800">{networkStatus}</p>
        </div>
      )}

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
        </div>
      )}

      {/* Connection Section */}
      {!wallet ? (
        <div className="mb-6 text-center">
          <button 
            onClick={detectWallets}
            disabled={isConnecting}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-lg disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faWallet} className="mr-2" />
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-1">🔮 Polkadot Wallets</h4>
              <p className="text-blue-700">Test wallet connections</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-1">🦊 EVM Wallets</h4>
              <p className="text-green-700">Test your deployed Solidity contract</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center px-4 py-2 bg-green-100 rounded-lg">
              <span className="mr-2">{getWalletIcon(wallet.source || wallet.type)}</span>
              <span className="font-mono text-sm">
                {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
              </span>
              <span className="ml-2 text-xs text-gray-500">
                ({wallet.name}) - {wallet.type === 'metamask' ? 'EVM' : 'Polkadot'}
              </span>
            </div>
          </div>

          {/* Show warning if Polkadot wallet is connected but we have an EVM contract */}
          {wallet.type === 'polkadot' && CONTRACT_ADDRESS_EVM && (
            <div className="mb-4 p-4 bg-orange-50 rounded-lg border-2 border-orange-300">
              <div className="flex items-start gap-3">
                <span className="text-3xl">🔮⚡</span>
                <div className="flex-1">
                  <h4 className="font-bold text-orange-800 mb-2">Switch to Talisman EVM Mode</h4>
                  <p className="text-sm text-orange-700 mb-3">
                    You deployed your contract with <strong>Talisman EVM</strong>, but you&apos;re currently connected to <strong>Talisman Substrate</strong>. 
                    To test your deployed contract at <code className="bg-white px-1 rounded font-mono">{CONTRACT_ADDRESS_EVM}</code>, 
                    you need to switch to Talisman&apos;s EVM mode.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="p-3 bg-red-50 rounded border border-red-200">
                      <div className="text-xs font-medium text-red-800 mb-1">❌ Current Connection</div>
                      <div className="text-sm text-red-700">Talisman Substrate → Polkadot parachains</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded border border-green-200">
                      <div className="text-xs font-medium text-green-800 mb-1">✅ Needed Connection</div>
                      <div className="text-sm text-green-700">Talisman EVM → Your deployed contract</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setWallet(null);
                        setContract(null);
                        setProvider(null);
                        detectWallets();
                      }}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-medium"
                    >
                      🔄 Switch to Talisman EVM
                    </button>
                    <button 
                      onClick={() => window.open('https://docs.talisman.xyz/', '_blank')}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                    >
                      📖 Talisman Guide
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button 
              onClick={() => {
                setWallet(null);
                setContract(null);
                setProvider(null);
                setError(null);
                setTestResults({});
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm"
            >
              🚪 Disconnect
            </button>
            <button 
              onClick={detectWallets}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
            >
              🔄 Switch Wallet
            </button>
            {wallet.type === 'metamask' && (
              <button 
                onClick={initializeEvmContract}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm"
              >
                🔗 Reinit Contract
              </button>
            )}
            <button 
              onClick={() => {
                if (CONTRACT_ADDRESS_EVM) copyToClipboard(CONTRACT_ADDRESS_EVM);
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm"
            >
              📋 Copy Address
            </button>
          </div>
        </div>
      )}

      {/* Contract Status Section */}
      {CONTRACT_ADDRESS_EVM && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">📄 Contract Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>🏠 Contract Address:</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                {CONTRACT_ADDRESS_EVM}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span>🌐 Target Network:</span>
              <span className="text-blue-600">Paseo Asset Hub EVM (Chain ID: 421)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>👛 Wallet Type:</span>
              <span className={wallet?.type === 'metamask' ? 'text-green-600' : 'text-orange-600'}>
                {wallet?.type === 'metamask' ? '✅ EVM (Compatible)' : '⚠️ Polkadot (Incompatible)'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>🔗 Provider:</span>
              <span className={provider ? 'text-green-600' : 'text-red-600'}>
                {provider ? '✅ Available' : '❌ Not Available'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Test Functions - Show regardless of wallet type or contract status */}
      {wallet && (
        <div className="space-y-6">
          
         {/* Update button states to show they're available but will show helpful errors */}
          <div className="bg-white p-6 rounded-lg border shadow-sm border-orange-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              🔍 Contract Verification
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Check if your contract is actually deployed at the configured address.
            </p>
            
            {/* Show warning if using Polkadot wallet */}
            {wallet?.type === 'polkadot' && (
              <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-800">
                  <strong>⚠️ Note:</strong> You&apos;re connected with a Polkadot wallet. Contract verification requires an EVM wallet like Talisman EVM.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Contract Address:</label>
                <input
                  type="text"
                  value={CONTRACT_ADDRESS_EVM}
                  readOnly
                  className="w-full border rounded px-3 py-2 text-sm bg-gray-50 font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status:</label>
                <div className="text-sm">
                  {testResults.verification?.hasContract === true ? (
                    <span className="text-green-600">✅ Contract Found</span>
                  ) : testResults.verification?.hasContract === false ? (
                    <span className="text-red-600">❌ No Contract</span>
                  ) : (
                    <span className="text-gray-500">❓ Not Checked</span>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={verifyContractDeployment}
              className={`px-4 py-2 rounded ${
                wallet?.type === 'polkadot' 
                  ? 'bg-orange-400 hover:bg-orange-500 text-white' 
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              🔍 Verify Contract {wallet?.type === 'polkadot' ? '(Requires EVM wallet)' : ''}
            </button>
          </div>

          {/* Mint Test */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faMusic} className="text-green-600" />
              🎵 Mint New Music NFT
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">IPFS Hash:</label>
                <input
                  type="text"
                  value={mintHash}
                  onChange={(e) => setMintHash(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="QmTestHash..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price (PAS):</label>
                <input
                  type="text"
                  value={mintPrice}
                  onChange={(e) => setMintPrice(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Editions:</label>
                <input
                  type="text"
                  value={mintEditions}
                  onChange={(e) => setMintEditions(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="10"
                />
              </div>
            </div>
            <button 
              onClick={testEvmMint}
              className={`px-4 py-2 rounded ${
                wallet?.type === 'polkadot' 
                  ? 'bg-green-400 hover:bg-green-500 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              🎵 Mint Track {wallet?.type === 'polkadot' ? '(Requires EVM wallet)' : ''}
            </button>
          </div>

          {/* Buy Test */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              🛒 Buy Music NFT
            </h3>
            
            {wallet?.type === 'polkadot' && (
              <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-800">
                  <strong>⚠️ Note:</strong> Buying requires an EVM wallet. Switch to Talisman EVM to interact with your deployed contract.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Token ID:</label>
                <input
                  type="text"
                  value={buyTokenId}
                  onChange={(e) => setBuyTokenId(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="1"
                />
              </div>
            </div>
            <button 
              onClick={testEvmBuy}
              className={`px-4 py-2 rounded ${
                wallet?.type === 'polkadot' 
                  ? 'bg-blue-400 hover:bg-blue-500 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              🛒 Buy Token {wallet?.type === 'polkadot' ? '(Requires EVM wallet)' : ''}
            </button>
          </div>

          {/* View Test */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              👁️ View Contract Data
            </h3>
            
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Token ID to View:</label>
                <input
                  type="text"
                  value={viewTokenId}
                  onChange={(e) => setViewTokenId(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="1"
                />
              </div>
            </div>
            <button 
              onClick={testEvmView}
              className={`px-4 py-2 rounded ${
                wallet?.type === 'polkadot' 
                  ? 'bg-purple-400 hover:bg-purple-500 text-white' 
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
              }`}
            >
              👁️ View Data
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">📋 Test Results:</h2>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-sm max-h-96 font-mono">
          {Object.keys(testResults).length > 0 ? (
            JSON.stringify(testResults, null, 2)
          ) : (
            '// No test results yet. Connect a wallet and run tests to see results here.'
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2">📋 Testing Instructions</h3>
        <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
          <li>Install Talisman or MetaMask for EVM contract testing</li>
          <li>Get PAS test tokens from the <a href="https://faucet.polkadot.io/" target="_blank" className="underline">Polkadot Faucet</a></li>
          <li>Connect your wallet using the button above</li>
          <li>Configure your contract address in .env.local: <code>NEXT_PUBLIC_MUSIC_NFT_CONTRACT_ADDRESS=0xYourAddress</code></li>
          <li><strong>⚠️ IMPORTANT:</strong> Use the &quot;🔍 Verify Contract&quot; button to check if your contract is deployed</li>
          <li>Test functions - connect with Talisman EVM mode to test your deployed contract</li>
        </ol>

        {/* Troubleshooting Section */}
        <div className="mt-4 p-3 bg-red-50 rounded border border-red-200">
          <h4 className="font-medium text-red-800 mb-2">🔧 Contract Not Found? Check These:</h4>
          <div className="text-sm text-red-700 space-y-2">
            <p><strong>1. Deployment Network:</strong> Was your contract deployed to Paseo Asset Hub EVM?</p>
            <p><strong>2. Deployment Success:</strong> Did the deployment transaction complete successfully?</p>
            <p><strong>3. Contract Address:</strong> Check your deployment logs for the actual contract address</p>
            <p><strong>4. Network Match:</strong> Ensure your wallet is on Paseo Asset Hub EVM (Chain ID: 421)</p>
            <div className="mt-2 p-2 bg-white rounded border">
              <p className="font-medium">Target Network:</p>
              <ul className="list-disc list-inside text-xs space-y-1">
                <li>Paseo Asset Hub EVM: Chain ID 421</li>
                <li>RPC: https://testnet-passet-hub-eth-rpc.polkadot.io</li>
                <li>Currency: PAS</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add type for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}