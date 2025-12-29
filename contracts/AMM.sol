// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AMM
 * @notice Simplified multi-outcome Automated Market Maker
 * Uses Logarithmic Market Scoring Rule (LMSR) for pricing
 * 
 * Price calculation: P = e^(q/b) / Σ(e^(qi/b))
 * Where:
 * - q is the quantity of shares for an outcome
 * - b is the liquidity parameter (spread control)
 * - Σ is sum over all outcomes
 * 
 * For MVP, we use a simplified constant product model per outcome
 * with a bonding curve: price = liquidity / (liquidity + shares)
 */
contract AMM {
    uint256 public constant LIQUIDITY_PARAMETER = 1000; // Controls price sensitivity

    /**
     * @notice Calculate shares received for token amount (buy)
     * Simplified formula: shares = (tokens * liquidity) / (liquidity + tokens)
     */
    function calculateBuy(
        uint256 liquidity,
        uint256 tokenAmount,
        uint256 feeBps
    ) external pure returns (uint256 shares, uint256 fee) {
        require(liquidity > 0, "No liquidity");
        
        fee = (tokenAmount * feeBps) / 10000;
        uint256 tokensAfterFee = tokenAmount - fee;
        
        // Simplified bonding curve: shares = (tokens * liquidity) / (liquidity + tokens)
        // This ensures price increases as more shares are bought
        shares = (tokensAfterFee * liquidity) / (liquidity + tokensAfterFee);
        
        // Ensure minimum shares
        if (shares == 0 && tokensAfterFee > 0) {
            shares = 1;
        }
    }

    /**
     * @notice Calculate tokens received for share amount (sell)
     * Inverse of buy: tokens = (shares * liquidity) / (liquidity - shares)
     */
    function calculateSell(
        uint256 liquidity,
        uint256 shareAmount,
        uint256 feeBps
    ) external pure returns (uint256 proceeds, uint256 fee) {
        require(liquidity > shareAmount, "Insufficient liquidity");
        
        // Inverse bonding curve: tokens = (shares * liquidity) / (liquidity - shares)
        uint256 tokensBeforeFee = (shareAmount * liquidity) / (liquidity - shareAmount);
        
        fee = (tokensBeforeFee * feeBps) / 10000;
        proceeds = tokensBeforeFee - fee;
    }

    /**
     * @notice Get current price and implied probability for an outcome
     * Price = liquidity / (liquidity + totalShares)
     * Probability = price (normalized across all outcomes)
     */
    function getPrice(uint256 liquidity)
        external
        pure
        returns (uint256 price, uint256 probability)
    {
        // For single outcome price calculation
        // In full implementation, would need total liquidity across all outcomes
        // Price represents cost to buy 1 share
        if (liquidity == 0) {
            price = 1e18; // 1 token per share if no liquidity
            probability = 0; // 0% probability when no liquidity (market hasn't started)
        } else {
            // Simplified: price increases with liquidity
            // More liquidity = higher price per share
            price = (liquidity * 1e18) / (liquidity + 1e18);
            probability = price; // Will be normalized by frontend across all outcomes
        }
    }

    /**
     * @notice Calculate total cost to buy shares across all outcomes
     * Used for probability normalization
     */
    function calculateTotalCost(uint256[] memory liquidities, uint256 shareAmount)
        external
        pure
        returns (uint256 totalCost)
    {
        totalCost = 0;
        for (uint256 i = 0; i < liquidities.length; i++) {
            (uint256 shares, ) = this.calculateBuy(liquidities[i], shareAmount, 0);
            if (shares > 0) {
                totalCost += shareAmount;
            }
        }
    }
}

