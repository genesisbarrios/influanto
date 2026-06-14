'use client';

import { useState, useEffect } from 'react';
import { ethers, BrowserProvider } from 'ethers';
import { useWallets } from '@privy-io/react-auth';

// Add your actual contract address here
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MUSIC_NFT_CONTRACT_ADDRESS || '';

const POLYGON_RPC_ENDPOINTS = [
  "https://rpc-amoy.polygon.technology",
  "https://polygon-amoy.drpc.org",
  "https://polygon-amoy-bor-rpc.publicnode.com",
];


declare global {
  interface Window {
    ethereum?: any;
  }
}

const CONTRACT_ABI = [
  // ── ERC1155 standard ──────────────────────────────────────────────────
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}, {"internalType": "uint256", "name": "id", "type": "uint256"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}],
    "name": "uri",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "operator", "type": "address"}, {"internalType": "bool", "name": "approved", "type": "bool"}],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable", "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}, {"internalType": "address", "name": "operator", "type": "address"}],
    "name": "isApprovedForAll",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "from", "type": "address"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "id", "type": "uint256"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "bytes", "name": "data", "type": "bytes"}
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable", "type": "function"
  },
  // ── Events ────────────────────────────────────────────────────────────
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "id", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "price", "type": "uint256"},
      {"indexed": false, "internalType": "uint32", "name": "maxEditions", "type": "uint32"},
      {"indexed": false, "internalType": "string", "name": "uri", "type": "string"}
    ],
    "name": "TokenCreated", "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "id", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "buyer", "type": "address"},
      {"indexed": false, "internalType": "uint32", "name": "edition", "type": "uint32"},
      {"indexed": false, "internalType": "uint256", "name": "price", "type": "uint256"}
    ],
    "name": "TokenPurchased", "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "account", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "FundsWithdrawn", "type": "event"
  },
  // ── Core functions ────────────────────────────────────────────────────
  {
    "inputs": [
      {"internalType": "string", "name": "metadataURI", "type": "string"},
      {"internalType": "uint256", "name": "price", "type": "uint256"},
      {"internalType": "uint32", "name": "maxEditions", "type": "uint32"}
    ],
    "name": "mint",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable", "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}],
    "name": "buy",
    "outputs": [{"internalType": "uint32", "name": "", "type": "uint32"}],
    "stateMutability": "payable", "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable", "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}],
    "name": "getTokenInfo",
    "outputs": [
      {"internalType": "address", "name": "creator", "type": "address"},
      {"internalType": "string", "name": "metadataURI", "type": "string"},
      {"internalType": "uint256", "name": "price", "type": "uint256"},
      {"internalType": "uint32", "name": "minted", "type": "uint32"},
      {"internalType": "uint32", "name": "maxEditions", "type": "uint32"},
      {"internalType": "bool", "name": "exists", "type": "bool"}
    ],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "getPendingBalance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [],
    "name": "nextId",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalTokens",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}],
    "name": "isSoldOut",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}],
    "name": "getRemainingEditions",
    "outputs": [{"internalType": "uint32", "name": "", "type": "uint32"}],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}, {"internalType": "uint256", "name": "newPrice", "type": "uint256"}],
    "name": "updatePrice",
    "outputs": [],
    "stateMutability": "nonpayable", "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view", "type": "function"
  }
] as const;


export const useContract = () => {
  const { wallets } = useWallets();

  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string>('');
  const [wallet, setWallet] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [networkId, setNetworkId] = useState<number | null>(null);
  const [contractStatus, setContractStatus] = useState<'unknown' | 'testing' | 'accessible' | 'error'>('unknown');

  const getEip1193Provider = async () => {
    // Prefer Privy wallet (works for both embedded and external wallets)
    if (wallets.length > 0) {
      return await wallets[0].getEthereumProvider();
    }
    // Fall back to injected provider (MetaMask etc.)
    if (typeof window !== 'undefined' && window.ethereum) {
      return window.ethereum;
    }
    throw new Error('No wallet found. Please connect a wallet via the app.');
  };

  const initContract = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Starting wallet connection...');

      const eip1193 = await getEip1193Provider();
      const web3Provider = new BrowserProvider(eip1193);

      const network = await web3Provider.getNetwork();
      const chainId = Number(network.chainId);
      setNetworkId(chainId);
      console.log('🌐 Network:', chainId);

      const signerObj = await web3Provider.getSigner();
      const userAccount = await signerObj.getAddress();

      setProvider(web3Provider);
      setSigner(signerObj);
      setAccount(userAccount);
      setWallet(userAccount);
      setIsConnected(true);

      // Always create the contract instance — mintTrack checks the chain before sending
      if (CONTRACT_ADDRESS) {
        const musicContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerObj);
        setContract(musicContract);
        setContractStatus('accessible');
        console.log('✅ Contract ready at', CONTRACT_ADDRESS);
      } else {
        console.warn('⚠️ NEXT_PUBLIC_MUSIC_NFT_CONTRACT_ADDRESS not set');
        setContractStatus('error');
      }
    } catch (error: any) {
      console.error('❌ Failed to initialize wallet/contract:', error);
      // Don't mark as disconnected for transient provider timeouts — the wallet is
      // still linked via Privy. mintTrack always fetches a fresh provider anyway.
      const isTimeout = error?.message?.includes('Wallet timeout') || error?.message?.includes('timeout');
      if (!isTimeout || wallets.length === 0) {
        setIsConnected(false);
      }
      setContractStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const testDifferentMintSignatures = async () => {
  if (!provider) return;
  
  const possibleSignatures = [
    'mint(string,uint256,uint32)',  // Your current ABI
    'mint(address,uint256)',        // Standard ERC721
    'safeMint(address,uint256)',    // OpenZeppelin ERC721
    'mintTo(address,string)',       // Custom variant
    'createToken(string,uint256,uint32)'  // Alternative name
  ];
  
  for (const sig of possibleSignatures) {
    const selector = ethers.id(sig).slice(0, 10);
    console.log(`${sig}: ${selector}`);
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
        for (const rpcUrl of POLYGON_RPC_ENDPOINTS) {
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
                for (const rpcUrl of POLYGON_RPC_ENDPOINTS) {
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
                for (const rpcUrl of POLYGON_RPC_ENDPOINTS) {
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

  // Re-init whenever the Privy wallet list changes (login, logout, wallet added)
  useEffect(() => {
    if (wallets.length > 0) {
      initContract().catch(console.error);
      return;
    }

    // Fall back to injected provider if no Privy wallets
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) initContract().catch(console.error);
        })
        .catch(console.error);

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
      const handleChainChanged = (chainId: string) => {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallets]);

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Requesting wallet connection...');
      // If using Privy, wallet connection is handled by Privy's login flow.
      // If a legacy injected provider is present, request accounts from it.
      if (wallets.length === 0 && typeof window !== 'undefined' && window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      }
      await initContract();
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      if (error.code === 4001) {
        alert('Please approve the wallet connection request.');
      } else {
        alert('Failed to connect wallet: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchToPolygon = async () => {
    try {
      setIsLoading(true);

      // Privy wallet: use switchChain directly
      if (wallets.length > 0) {
        await wallets[0].switchChain(80002);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await initContract();
        return;
      }

      // Injected provider fallback
      if (typeof window === 'undefined' || !window.ethereum) {
        alert('Please install MetaMask or connect a wallet');
        return;
      }

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x13882' }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x13882',
              chainName: 'Polygon Amoy Testnet',
              nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
              rpcUrls: POLYGON_RPC_ENDPOINTS,
              blockExplorerUrls: ['https://amoy.polygonscan.com'],
            }],
          });
        } else {
          throw switchError;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      await initContract();

    } catch (error: any) {
      console.error('Failed to switch to Polygon:', error);
      alert('Failed to switch to Polygon Amoy: ' + error.message);
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
    let contractCode = null;
    
    // Test 1: MetaMask provider
    try {
      const code = await provider.getCode(CONTRACT_ADDRESS);
      contractCode = code;
      codeTests.push({ 
        method: 'MetaMask Provider', 
        success: true, 
        codeLength: code.length,
        hasCode: code !== '0x' && code !== '0x0',
        codePreview: code.slice(0, 20) + '...'
      });
    } catch (error: any) {
      codeTests.push({ 
        method: 'MetaMask Provider', 
        success: false, 
        error: error.message 
      });
    }

    // Test 2: Alternative RPC providers
    if (!contractCode || contractCode === '0x') {
      for (const rpcUrl of POLYGON_RPC_ENDPOINTS) {
        try {
          const altProvider = new ethers.JsonRpcProvider(rpcUrl);
          const code = await altProvider.getCode(CONTRACT_ADDRESS);
          if (code !== '0x' && code !== '0x0') {
            contractCode = code;
            codeTests.push({ 
              method: `Alternative RPC: ${rpcUrl}`, 
              success: true, 
              codeLength: code.length,
              hasCode: true,
              codePreview: code.slice(0, 20) + '...'
            });
            break;
          }
        } catch (error: any) {
          codeTests.push({ 
            method: `Alternative RPC: ${rpcUrl}`, 
            success: false, 
            error: error.message 
          });
        }
      }
    }

    // NEW: Test different mint function signatures
    const mintSignatureTests = [];
    if (contractCode && contractCode !== '0x') {
      console.log('🧪 Testing different mint function signatures...');
      
      const possibleMintSignatures = [
        { name: 'mint(string,uint256,uint32)', sig: 'mint(string,uint256,uint32)', expected: true },
        { name: 'mint(address,uint256)', sig: 'mint(address,uint256)', expected: false },
        { name: 'safeMint(address,uint256)', sig: 'safeMint(address,uint256)', expected: false },
        { name: 'mintTo(address,string)', sig: 'mintTo(address,string)', expected: false },
        { name: 'createToken(string,uint256,uint32)', sig: 'createToken(string,uint256,uint32)', expected: false },
        { name: 'mint(address,uint256,string)', sig: 'mint(address,uint256,string)', expected: false },
        { name: 'publicMint(uint256)', sig: 'publicMint(uint256)', expected: false },
        { name: 'mint(uint256)', sig: 'mint(uint256)', expected: false }
      ];
      
      for (const mintSig of possibleMintSignatures) {
        try {
          const selector = ethers.id(mintSig.sig).slice(0, 10);
          
          // Try calling the function selector directly
          const callData = selector; // Just the selector for testing
          const rawResult = await provider.call({
            to: CONTRACT_ADDRESS,
            data: callData
          });
          
          mintSignatureTests.push({
            name: mintSig.name,
            signature: mintSig.sig,
            selector: selector,
            expected: mintSig.expected,
            rawCallSuccess: true,
            rawResult: rawResult,
            exists: true
          });
          
        } catch (error: any) {
          const selector = ethers.id(mintSig.sig).slice(0, 10);
          let exists = false;
          
          // Check if the error suggests the function doesn't exist vs other issues
          if (error.message.includes('function selector was not recognized')) {
            exists = false;
          } else if (error.message.includes('missing revert data') || error.code === 'CALL_EXCEPTION') {
            exists = true; // Function exists but call failed (probably needs parameters)
          }
          
          mintSignatureTests.push({
            name: mintSig.name,
            signature: mintSig.sig,
            selector: selector,
            expected: mintSig.expected,
            rawCallSuccess: false,
            error: error.message,
            exists: exists
          });
        }
      }
    }

    // Test contract functions with detailed error analysis
    const functionTests = [];
    if (contract && contractCode && contractCode !== '0x') {
      console.log('🧪 Testing individual contract functions...');
      
      // Test each function individually with detailed error handling
      const testFunctions = [
        { name: 'nextId', selector: '0x61b8ce8c' },
        { name: 'owner', selector: '0x8da5cb5b' },
        { name: 'withdraw', selector: '0x3ccfd60b' }
      ];
      
      for (const func of testFunctions) {
        try {
          console.log(`🔍 Testing ${func.name}()...`);
          
          // Try direct function call
          const result = await Promise.race([
            contract[func.name](),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout after 10s')), 10000)
            )
          ]);
          
          functionTests.push({ 
            function: func.name, 
            selector: func.selector,
            success: true, 
            result: result.toString(),
            type: 'function_call'
          });
          
        } catch (funcError: any) {
          console.error(`❌ ${func.name}() failed:`, funcError);
          
          // Try raw call to see if function exists
          try {
            const rawResult = await provider.call({
              to: CONTRACT_ADDRESS,
              data: func.selector
            });
            
            functionTests.push({ 
              function: func.name, 
              selector: func.selector,
              success: false, 
              error: funcError.message,
              rawCallSuccess: true,
              rawResult: rawResult,
              type: 'raw_call_success'
            });
          } catch (rawError: any) {
            functionTests.push({ 
              function: func.name, 
              selector: func.selector,
              success: false, 
              error: funcError.message,
              rawCallSuccess: false,
              rawError: rawError.message,
              type: 'raw_call_failed'
            });
          }
        }
      }
    }

    // Check if this might be a different contract
    let contractAnalysis = null;
    if (contractCode && contractCode !== '0x') {
      try {
        // Try to call some common contract functions to identify what type of contract this is
        const commonChecks = [];
        
        // Check if it's an ERC20 token
        try {
          const nameResult = await provider.call({
            to: CONTRACT_ADDRESS,
            data: '0x06fdde03' // name()
          });
          commonChecks.push({ type: 'ERC20', function: 'name', success: true, result: nameResult });
        } catch {
          commonChecks.push({ type: 'ERC20', function: 'name', success: false });
        }
        
        // Check if it's an ERC721 token
        try {
          const supportsInterface = await provider.call({
            to: CONTRACT_ADDRESS,
            data: '0x01ffc9a7000000000000000000000000000000000000000000000000000000000001ffc9a7' // supportsInterface(0x01ffc9a7)
          });
          commonChecks.push({ type: 'ERC721', function: 'supportsInterface', success: true, result: supportsInterface });
        } catch {
          commonChecks.push({ type: 'ERC721', function: 'supportsInterface', success: false });
        }
        
        contractAnalysis = { commonChecks };
        
      } catch (analysisError) {
        contractAnalysis = { error: 'Failed to analyze contract type' };
      }
    }

    const workingCodeTests = codeTests.filter(t => t.success && t.hasCode);
    const workingFunctionTests = functionTests.filter(t => t.success);
    const existingMintFunctions = mintSignatureTests.filter(t => t.exists);

    return {
      success: workingCodeTests.length > 0,
      details: {
        address: CONTRACT_ADDRESS,
        network: networkId,
        contractStatus,
        codeTests,
        functionTests,
        mintSignatureTests, // NEW: Include mint signature test results
        contractAnalysis,
        workingCodeProviders: workingCodeTests.length,
        workingFunctions: workingFunctionTests.length,
        totalFunctions: functionTests.length,
        foundMintFunctions: existingMintFunctions.length, // NEW: Count of found mint functions
        explorerUrl: `https://amoy.polygonscan.com/address/${CONTRACT_ADDRESS}`,
        recommendations: workingCodeTests.length === 0 ?
          ['Contract not found at address', 'Check deployment on Polygon Amoy Testnet', 'Verify contract address'] :
          workingFunctionTests.length === 0 ?
          ['Contract exists but expected functions are missing', 'This might be a different contract than expected', 'Check if you have the correct contract address', 'Verify the contract was deployed with the expected ABI'] :
          ['Contract is working properly'],
        nextSteps: [
          'Visit the Polygonscan link to see what contract is actually deployed',
          'Check the contract source code if verified',
          'Compare the expected ABI with the actual contract functions',
          'Verify you have the correct contract address',
          existingMintFunctions.length > 0 ? `Found ${existingMintFunctions.length} possible mint function(s)` : 'No mint functions found'
        ]
      }
    };

  } catch (error: any) {
    console.error('❌ Debug failed:', error);
    return { success: false, error: error.message };
  }
};


  // Add this temporary debug function to see the current status
  const debugContractStatus = () => {
    console.log('🔍 Current contract status debug:', {
      contractStatus,
      contract: !!contract,
      isConnected,
      networkId,
      contractAddress: CONTRACT_ADDRESS,
      provider: !!provider,
      signer: !!signer
    });
  };

const mintTrack = async (hash: string, price: bigint | string, maxEditions: number) => {
  if (!isConnected && wallets.length === 0) throw new Error('Wallet not connected. Please connect your wallet first.');
  if (!CONTRACT_ADDRESS) throw new Error('Contract address not configured.');
  if (!hash || hash.trim() === '') throw new Error('Metadata URI cannot be empty.');

  const priceWei = typeof price === 'string' ? ethers.parseEther(price) : price;
  if (priceWei <= BigInt(0)) throw new Error('Price must be greater than 0.');
  if (maxEditions <= 0 || maxEditions > 10000) throw new Error('Max editions must be between 1 and 10000.');

  // ── 1. Check chain and auto-switch if needed ─────────────────────────
  const eip1193 = await getEip1193Provider();
  const freshProvider = new BrowserProvider(eip1193);
  const { chainId } = await freshProvider.getNetwork();

  if (Number(chainId) !== 80002) {
    console.log('🔄 Wrong chain, switching to Polygon Amoy...');
    if (wallets.length > 0) {
      await wallets[0].switchChain(80002);
    } else if (typeof window !== 'undefined' && window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x13882' }],
        });
      } catch (e: any) {
        if (e.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x13882',
              chainName: 'Polygon Amoy Testnet',
              nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
              rpcUrls: POLYGON_RPC_ENDPOINTS,
              blockExplorerUrls: ['https://amoy.polygonscan.com'],
            }],
          });
        } else throw e;
      }
    } else {
      throw new Error('Please switch your wallet to Polygon Amoy Testnet (chain ID 80002).');
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  // ── 2. Get fresh signer + contract after potential chain switch ───────
  const postSwitchEip1193 = await getEip1193Provider();
  const postSwitchProvider = new BrowserProvider(postSwitchEip1193);
  const freshSigner = await postSwitchProvider.getSigner();
  const activeContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, freshSigner);

  // ── 3. Send mint transaction ──────────────────────────────────────────
  try {
    console.log('🚀 Minting:', { hash, priceWei: priceWei.toString(), maxEditions });
    const tx = await activeContract.mint(hash, priceWei, maxEditions, { gasLimit: 500_000 });
    console.log('📝 Tx sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Tx confirmed:', receipt);

    let tokenId: number;
    try {
      const nextId = await activeContract.nextId();
      tokenId = Number(nextId) - 1;
    } catch {
      tokenId = Date.now();
    }

    return { tokenId, transactionHash: tx.hash, blockNumber: receipt.blockNumber, receipt };
  } catch (error: any) {
    if (error.code === 4001 || error.message?.includes('user rejected')) throw new Error('Transaction cancelled by user.');
    if (error.code === 'INSUFFICIENT_FUNDS' || error.message?.includes('insufficient funds')) throw new Error('Insufficient MATIC for gas fees.');
    if (error.code === 'CALL_EXCEPTION') throw new Error(`Contract call failed: ${error.reason ?? error.message}`);
    throw error;
  }
};

  const buyTrack = async (tokenId: number, price: string) => {
    if (!contract) throw new Error('Contract not initialized');
    if (networkId !== 80002) throw new Error('Please switch to Polygon Amoy Testnet');
    
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
    if (networkId !== 80002) throw new Error('Please switch to Polygon Amoy Testnet');
    
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
      const [creator, metadataURI, price, minted, maxEditions] = await contract.getTokenInfo(tokenId);
      return {
        creator,
        hash: metadataURI,
        price: ethers.formatEther(price),
        sold: Number(minted),
        editions: Number(maxEditions),
        available: Number(maxEditions) - Number(minted)
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
      const amount = await contract.getPendingBalance(targetAddress);
      return ethers.formatEther(amount);
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
    wallet,
    isConnected,
    isLoading,
    networkId,
    contractStatus,
    connectWallet,
    switchToPolygon,
    mintTrack,
    buyTrack,
    withdrawEarnings,
    getTrackInfo,
    getPendingEarnings,
    debugContract,
    debugContractStatus  // Add this temporarily
  };
};