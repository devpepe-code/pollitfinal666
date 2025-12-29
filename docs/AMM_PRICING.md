# Multi-Outcome AMM Pricing Explanation

## Overview

The prediction market uses a simplified Automated Market Maker (AMM) to price outcome shares. Unlike traditional order books, the AMM provides instant liquidity through a bonding curve that automatically adjusts prices based on supply and demand.

## Simplified Bonding Curve Model

For the MVP, we use a simplified constant product model per outcome with a bonding curve formula:

### Buy Shares (Spending Tokens)

When a user buys shares of an outcome:

```
shares = (tokens_after_fee * liquidity) / (liquidity + tokens_after_fee)
```

Where:
- `tokens_after_fee` = token amount - trading fee
- `liquidity` = current liquidity pool for that outcome

**Properties:**
- As more shares are bought, the price per share increases
- Higher liquidity = lower price impact
- Ensures shares are always available (no slippage beyond price impact)

### Sell Shares (Redeeming Tokens)

When a user sells shares:

```
tokens_before_fee = (shares * liquidity) / (liquidity - shares)
proceeds = tokens_before_fee - trading_fee
```

**Properties:**
- Inverse of buy function
- Selling shares decreases liquidity
- Price decreases as shares are sold

## Price Calculation

The current price to buy 1 share is calculated as:

```
price = liquidity / (liquidity + 1)
```

This represents the cost in MarketTokens to purchase 1 share at the current liquidity level.

## Implied Probability

For each outcome, the implied probability is derived from its price relative to all outcomes:

```
probability_i = price_i / Σ(price_j for all outcomes j)
```

However, in the simplified MVP implementation, we calculate probability per outcome independently. The frontend should normalize probabilities across all outcomes to sum to 100%.

## Example

### Initial State
- Outcome A: liquidity = 1000 tokens
- Outcome B: liquidity = 1000 tokens
- Outcome C: liquidity = 1000 tokens

### User Buys 100 tokens worth of Outcome A

1. Trading fee (0.3%): 0.3 tokens
2. Tokens after fee: 99.7 tokens
3. Shares received: (99.7 * 1000) / (1000 + 99.7) ≈ 90.6 shares
4. New liquidity: 1000 + 99.7 = 1099.7 tokens
5. New price: 1099.7 / (1099.7 + 1) ≈ 0.9991 tokens per share

### Price Impact

The price impact increases as more shares are bought:
- First 100 tokens: ~90.6 shares
- Next 100 tokens: ~82.3 shares (less shares due to higher price)
- This creates a natural incentive to buy early

## Trading Fees

Trading fees are distributed as:
- **Creator Fee**: 0.1% (10 bps) → Market creator
- **Protocol Fee**: 0.2% (20 bps) → Protocol treasury
- **Total Fee**: 0.3% (30 bps)

Fees are deducted before calculating shares, ensuring the liquidity pool grows with each trade.

## Liquidity Seeding

Market creators can seed initial liquidity by:
1. Depositing MarketTokens for each outcome
2. Receiving initial shares proportional to liquidity
3. Setting starting prices and probabilities

This ensures markets have liquidity from the start and reasonable initial prices.

## Limitations (MVP)

1. **Simplified Model**: Not a true LMSR (Logarithmic Market Scoring Rule)
2. **Independent Pricing**: Outcomes priced independently, not normalized
3. **No Cross-Outcome Arbitrage**: Can't automatically balance probabilities
4. **Fixed Fee Structure**: No dynamic fee adjustment
5. **Single Liquidity Pool**: Each outcome has its own pool, not shared

## Future Enhancements

1. **True LMSR Implementation**: More sophisticated pricing model
2. **Normalized Probabilities**: Ensure probabilities sum to 100%
3. **Cross-Outcome Pricing**: Shared liquidity pool across outcomes
4. **Dynamic Fees**: Adjust fees based on market conditions
5. **Liquidity Provider Rewards**: Incentivize liquidity provision

