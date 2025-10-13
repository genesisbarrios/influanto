// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MusicNFT {
    mapping(uint256 => address) public creators;
    mapping(uint256 => string) public hashes;
    mapping(uint256 => uint256) public prices;
    mapping(uint256 => uint32) public sold;
    mapping(uint256 => uint32) public editions;
    mapping(address => uint256) public pending;
    
    uint256 public nextId = 1;
    address public owner;
    
    // Reentrancy protection
    bool private locked;
    
    // Westend Asset Hub specific settings
    uint256 public constant MIN_PRICE = 1e10; // 0.01 WND minimum (12 decimals)
    uint32 public constant MAX_EDITIONS = 1000; // Reasonable limit for Westend
    uint256 public constant MAX_GAS = 2000000; // Gas limit for Westend Asset Hub
    
    // Events for better transparency on Westend
    event TokenMinted(uint256 indexed id, address indexed creator, uint256 price, uint32 maxEditions);
    event TokenBought(uint256 indexed id, address indexed buyer, uint32 edition, uint256 price);
    event FundsWithdrawn(address indexed account, uint256 amount);
    
    modifier nonReentrant() {
        require(!locked, "ReentrancyGuard: reentrant call");
        locked = true;
        _;
        locked = false;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor() { 
        owner = msg.sender;
    }
    
    /**
     * @dev Mint a new music NFT with Westend Asset Hub optimizations
     * @param hash IPFS hash of the music metadata
     * @param price Price per edition in WND (minimum 0.01 WND)
     * @param maxEditions Maximum number of editions (max 1000)
     */
    function mint(string memory hash, uint256 price, uint32 maxEditions) 
        public 
        returns (uint256) 
    {
        require(bytes(hash).length > 0, "Hash cannot be empty");
        require(price >= MIN_PRICE, "Price too low (min 0.01 WND)");
        require(maxEditions > 0 && maxEditions <= MAX_EDITIONS, "Invalid max editions (1-1000)");
        
        uint256 id = nextId++;
        creators[id] = msg.sender;
        hashes[id] = hash;
        prices[id] = price;
        editions[id] = maxEditions;
        
        emit TokenMinted(id, msg.sender, price, maxEditions);
        
        return id;
    }
    
    /**
     * @dev Buy an edition of a music NFT
     * @param id Token ID to purchase
     */
    function buy(uint256 id) 
        public 
        payable 
        nonReentrant 
        returns (uint32) 
    {
        require(creators[id] != address(0), "Token does not exist");
        require(sold[id] < editions[id], "Sold out");
        require(msg.value >= prices[id], "Insufficient payment");
        
        uint32 edition = ++sold[id];
        
        // Calculate fees (95% to creator, 5% to platform)
        uint256 creatorAmount = (prices[id] * 95) / 100;
        uint256 platformAmount = prices[id] - creatorAmount;
        
        pending[creators[id]] += creatorAmount;
        pending[owner] += platformAmount;
        
        // Handle refund using call for Westend Asset Hub compatibility
        if (msg.value > prices[id]) {
            uint256 refund = msg.value - prices[id];
            (bool success, ) = payable(msg.sender).call{value: refund, gas: 21000}("");
            require(success, "Refund failed");
        }
        
        emit TokenBought(id, msg.sender, edition, prices[id]);
        
        return edition;
    }
    
    /**
     * @dev Withdraw pending earnings
     */
    function withdraw() 
        public 
        nonReentrant 
    {
        uint256 amount = pending[msg.sender];
        require(amount > 0, "No pending balance");
        
        // Update state before external call (CEI pattern)
        pending[msg.sender] = 0;
        
        // Use call instead of transfer for Westend Asset Hub
        (bool success, ) = payable(msg.sender).call{value: amount, gas: 21000}("");
        require(success, "Withdrawal failed");
        
        emit FundsWithdrawn(msg.sender, amount);
    }
    
    /**
     * @dev Get token information
     */
    function getTokenInfo(uint256 id) 
        public 
        view 
        returns (
            address creator,
            string memory hash,
            uint256 price,
            uint32 soldCount,
            uint32 maxEditions,
            bool exists
        ) 
    {
        return (
            creators[id],
            hashes[id],
            prices[id],
            sold[id],
            editions[id],
            creators[id] != address(0)
        );
    }
    
    /**
     * @dev Get pending balance for an account
     */
    function getPendingBalance(address account) 
        public 
        view 
        returns (uint256) 
    {
        return pending[account];
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() 
        public 
        view 
        returns (uint256) 
    {
        return address(this).balance;
    }
    
    /**
     * @dev Check if token is sold out
     */
    function isSoldOut(uint256 id) 
        public 
        view 
        returns (bool) 
    {
        return sold[id] >= editions[id];
    }
    
    /**
     * @dev Get remaining editions for a token
     */
    function getRemainingEditions(uint256 id) 
        public 
        view 
        returns (uint32) 
    {
        if (creators[id] == address(0)) return 0;
        return editions[id] - sold[id];
    }
    
    /**
     * @dev Update token price (creator only)
     */
    function updatePrice(uint256 id, uint256 newPrice) 
        public 
    {
        require(creators[id] == msg.sender, "Only creator can update price");
        require(newPrice >= MIN_PRICE, "Price too low");
        
        prices[id] = newPrice;
    }
    
    /**
     * @dev Emergency functions for owner
     */
    function emergencyWithdraw() 
        public 
        onlyOwner 
    {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Emergency withdrawal failed");
    }
    
    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address newOwner) 
        public 
        onlyOwner 
    {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
    
    /**
     * @dev Get total tokens minted
     */
    function getTotalTokens() 
        public 
        view 
        returns (uint256) 
    {
        return nextId - 1;
    }
}