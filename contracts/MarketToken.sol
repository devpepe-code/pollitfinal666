// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MarketToken
 * @notice ERC-20 utility token for the prediction market platform
 * Users spend tokens to buy outcome shares
 */
contract MarketToken is ERC20, Ownable {
    constructor() ERC20("Market Token", "MKT") Ownable(msg.sender) {
        // Initial supply for seeding markets and user rewards
        _mint(msg.sender, 1_000_000 * 10**decimals());
    }

    /**
     * @notice Mint tokens (only owner, for seeding markets)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

