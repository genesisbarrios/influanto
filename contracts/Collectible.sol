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
    
    constructor() { 
        owner = msg.sender;
    }
    
    function mint(string memory hash, uint256 price, uint32 maxEditions) public returns (uint256) {
        uint256 id = nextId++;
        creators[id] = msg.sender;
        hashes[id] = hash;
        prices[id] = price;
        editions[id] = maxEditions;
        return id;
    }
    
    function buy(uint256 id) public payable returns (uint32) {
        require(sold[id] < editions[id] && msg.value >= prices[id]);
        
        uint32 edition = ++sold[id];
        pending[creators[id]] += (prices[id] * 95) / 100;
        pending[owner] += prices[id] / 20;
        
        if (msg.value > prices[id]) {
            payable(msg.sender).transfer(msg.value - prices[id]);
        }
        
        return edition;
    }
    
    function withdraw() public {
        uint256 amount = pending[msg.sender];
        require(amount > 0);
        pending[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
}