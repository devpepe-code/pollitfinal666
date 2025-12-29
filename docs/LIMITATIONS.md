# Known Limitations, Assumptions, and Attack Vectors

## MVP Limitations

### 1. Resolution Mechanism
- **Current**: Creator proposes outcome, 7-day challenge window, simple majority vote
- **Limitation**: No oracle integration, relies on honest behavior
- **Risk**: Creator could propose incorrect outcome
- **Mitigation**: Challenge mechanism allows participants to dispute
- **Future**: Integrate with Chainlink oracles for automated resolution

### 2. Challenge Voting
- **Current**: Simple majority of participants who challenge
- **Limitation**: No weighted voting, no sybil resistance
- **Risk**: One user with multiple wallets could manipulate votes
- **Mitigation**: Track participation history, require minimum stake
- **Future**: Implement reputation system or stake-weighted voting

### 3. AMM Pricing
- **Current**: Simplified bonding curve per outcome
- **Limitation**: Not true LMSR, probabilities not normalized
- **Risk**: Prices may not reflect true probabilities
- **Mitigation**: Frontend normalizes probabilities for display
- **Future**: Implement proper LMSR with shared liquidity

### 4. Access Control
- **Current**: On-chain allowlist for Private/Group markets
- **Limitation**: No dynamic group membership updates
- **Risk**: Once added, participants can't be removed
- **Mitigation**: Document immutable nature in UI
- **Future**: Add group management contracts

### 5. No Order Book
- **Current**: AMM only, instant execution
- **Limitation**: No limit orders, no advanced trading
- **Risk**: Slippage on large trades
- **Mitigation**: Display price impact before trade
- **Future**: Add order book for advanced traders

### 6. Single Token
- **Current**: MarketToken (ERC-20) only
- **Limitation**: No ETH/USDC support, no fiat on-ramp
- **Risk**: Token liquidity issues
- **Mitigation**: Ensure sufficient token distribution
- **Future**: Multi-token support, fiat integration

## Assumptions

### 1. Honest Market Creators
- **Assumption**: Creators will propose correct outcomes
- **Reality**: Some may attempt to game the system
- **Impact**: Incorrect resolutions if not challenged

### 2. Sufficient Participation
- **Assumption**: Markets will have enough participants for meaningful prices
- **Reality**: Low liquidity markets may have inaccurate prices
- **Impact**: Poor price discovery, high slippage

### 3. Network Reliability
- **Assumption**: Ethereum network is available and fast
- **Reality**: Network congestion can delay transactions
- **Impact**: Poor user experience during high gas periods

### 4. Wallet Adoption
- **Assumption**: Users have Web3 wallets (MetaMask, etc.)
- **Reality**: Wallet setup is a barrier for new users
- **Impact**: Limited user base

### 5. Token Distribution
- **Assumption**: Users have MarketTokens to trade
- **Reality**: Token distribution may be uneven
- **Impact**: Some users can't participate

## Attack Vectors

### 1. Front-Running
- **Vector**: Attacker sees pending buy transaction, buys first at lower price
- **Impact**: User pays higher price, attacker profits
- **Mitigation**: Use private mempools (Flashbots), commit-reveal schemes
- **Status**: Not mitigated in MVP

### 2. Sybil Attacks on Resolution
- **Vector**: Attacker creates multiple wallets, participates in market, challenges resolution
- **Impact**: Could manipulate resolution votes
- **Mitigation**: Require minimum stake, track participation history
- **Status**: Partially mitigated (requires participation)

### 3. Market Manipulation
- **Vector**: Large trader buys/sells to move prices, then trades opposite direction
- **Impact**: Artificial price movements, other users lose
- **Mitigation**: Display large trade warnings, limit order sizes
- **Status**: Not mitigated in MVP

### 4. Flash Loan Attacks
- **Vector**: Attacker uses flash loan to buy large position, manipulates resolution, sells
- **Impact**: Could drain liquidity or manipulate outcomes
- **Mitigation**: Time-weighted voting, cooldown periods
- **Status**: Not mitigated in MVP

### 5. Reentrancy
- **Vector**: Malicious contract calls back into Market during execution
- **Impact**: Could drain funds or manipulate state
- **Mitigation**: Use checks-effects-interactions pattern, reentrancy guards
- **Status**: Should be mitigated (OpenZeppelin patterns)

### 6. Integer Overflow/Underflow
- **Vector**: Large numbers cause overflow, breaking calculations
- **Impact**: Incorrect share calculations, potential fund loss
- **Mitigation**: Solidity 0.8+ has built-in overflow protection
- **Status**: Mitigated (Solidity 0.8.20)

### 7. Access Control Bypass
- **Vector**: Attacker finds way to participate in Private/Group market without permission
- **Impact**: Unauthorized trading
- **Mitigation**: Strict access control checks, audit allowlist logic
- **Status**: Should be mitigated (on-chain checks)

### 8. Price Oracle Manipulation
- **Vector**: N/A in MVP (no oracles)
- **Impact**: N/A
- **Status**: Not applicable

### 9. Denial of Service
- **Vector**: Attacker spams market creation or trades
- **Impact**: Network congestion, high gas costs
- **Mitigation**: Rate limiting, minimum market requirements
- **Status**: Partially mitigated (gas costs act as rate limit)

### 10. Centralization Risks
- **Vector**: MarketFactory owner could pause/upgrade contracts
- **Impact**: Platform shutdown, fund lock
- **Mitigation**: Use timelock, multi-sig, consider decentralization
- **Status**: Not mitigated in MVP (single owner)

## Security Recommendations

### Before Mainnet Launch

1. **Smart Contract Audit**
   - Professional security audit
   - Formal verification of critical functions
   - Bug bounty program

2. **Access Control Hardening**
   - Multi-sig for MarketFactory owner
   - Timelock for upgrades
   - Pause mechanism with governance

3. **Resolution Improvements**
   - Oracle integration for automated resolution
   - Weighted voting based on stake
   - Reputation system for creators

4. **Trading Protections**
   - Maximum trade size limits
   - Price impact warnings
   - Slippage protection

5. **Monitoring**
   - Real-time anomaly detection
   - Large trade alerts
   - Unusual pattern identification

6. **User Education**
   - Clear documentation of risks
   - Trading guides
   - Resolution process explanation

## Risk Disclosure

Users should be aware that:
- Markets may resolve incorrectly if not properly challenged
- Prices may not reflect true probabilities due to low liquidity
- Smart contracts carry inherent risks (bugs, exploits)
- No insurance or guarantee of funds
- Platform may pause or upgrade contracts
- Regulatory uncertainty in some jurisdictions

