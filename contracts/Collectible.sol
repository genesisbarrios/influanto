// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MusicNFT is ERC1155, Ownable, ReentrancyGuard {

    struct TokenData {
        address creator;
        string  metadataURI;
        uint256 price;
        uint32  maxEditions;
        uint32  minted;
    }

    mapping(uint256 => TokenData) public tokens;
    mapping(address => uint256)   public pending;

    uint256 public nextId = 1;

    uint256 public constant MIN_PRICE     = 1e16;  // 0.01 MATIC
    uint32  public constant MAX_EDITIONS  = 10000;
    uint16  public constant PLATFORM_FEE  = 500;   // 5% in basis points

    event TokenCreated(
        uint256 indexed id,
        address indexed creator,
        uint256 price,
        uint32  maxEditions,
        string  uri
    );
    event TokenPurchased(
        uint256 indexed id,
        address indexed buyer,
        uint32  edition,
        uint256 price
    );
    event FundsWithdrawn(address indexed account, uint256 amount);

    constructor() ERC1155("") Ownable(msg.sender) {}

    // Returns per-token metadata URI (overrides ERC1155 base)
    function uri(uint256 id) public view override returns (string memory) {
        return tokens[id].metadataURI;
    }

    // Create a new music collectible token type
    function mint(string memory metadataURI, uint256 price, uint32 maxEditions)
        public
        returns (uint256)
    {
        require(bytes(metadataURI).length > 0, "URI cannot be empty");
        require(price >= MIN_PRICE, "Price too low (min 0.01 MATIC)");
        require(maxEditions > 0 && maxEditions <= MAX_EDITIONS, "Invalid max editions (1-10000)");

        uint256 id = nextId++;
        tokens[id] = TokenData({
            creator:     msg.sender,
            metadataURI: metadataURI,
            price:       price,
            maxEditions: maxEditions,
            minted:      0
        });

        emit TokenCreated(id, msg.sender, price, maxEditions, metadataURI);
        return id;
    }

    // Purchase one edition — mints an ERC1155 token to the buyer
    function buy(uint256 id)
        public
        payable
        nonReentrant
        returns (uint32)
    {
        TokenData storage token = tokens[id];
        require(token.creator != address(0), "Token does not exist");
        require(token.minted < token.maxEditions, "Sold out");
        require(msg.value >= token.price, "Insufficient payment");

        uint32 edition = ++token.minted;

        _mint(msg.sender, id, 1, "");

        uint256 platformAmount = (token.price * PLATFORM_FEE) / 10000;
        uint256 creatorAmount  = token.price - platformAmount;

        pending[token.creator] += creatorAmount;
        pending[owner()]       += platformAmount;

        if (msg.value > token.price) {
            (bool ok, ) = payable(msg.sender).call{value: msg.value - token.price}("");
            require(ok, "Refund failed");
        }

        emit TokenPurchased(id, msg.sender, edition, token.price);
        return edition;
    }

    // Withdraw accumulated earnings
    function withdraw() public nonReentrant {
        uint256 amount = pending[msg.sender];
        require(amount > 0, "No pending balance");
        pending[msg.sender] = 0;
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Withdrawal failed");
        emit FundsWithdrawn(msg.sender, amount);
    }

    // --- View helpers ---

    function getTokenInfo(uint256 id)
        public
        view
        returns (
            address creator,
            string  memory metadataURI,
            uint256 price,
            uint32  minted,
            uint32  maxEditions,
            bool    exists
        )
    {
        TokenData storage t = tokens[id];
        return (t.creator, t.metadataURI, t.price, t.minted, t.maxEditions, t.creator != address(0));
    }

    function getPendingBalance(address account) public view returns (uint256) {
        return pending[account];
    }

    function isSoldOut(uint256 id) public view returns (bool) {
        return tokens[id].minted >= tokens[id].maxEditions;
    }

    function getRemainingEditions(uint256 id) public view returns (uint32) {
        if (tokens[id].creator == address(0)) return 0;
        return tokens[id].maxEditions - tokens[id].minted;
    }

    function getTotalTokens() public view returns (uint256) {
        return nextId - 1;
    }

    // Creator can update the price while there are still editions left
    function updatePrice(uint256 id, uint256 newPrice) public {
        require(tokens[id].creator == msg.sender, "Only creator can update price");
        require(newPrice >= MIN_PRICE, "Price too low");
        tokens[id].price = newPrice;
    }

    function getNetworkInfo()
        public
        pure
        returns (string memory networkName, uint256 chainId, string memory currency)
    {
        return ("Polygon Amoy Testnet", 80002, "MATIC");
    }

    function emergencyWithdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        (bool ok, ) = payable(owner()).call{value: balance}("");
        require(ok, "Emergency withdrawal failed");
    }
}
