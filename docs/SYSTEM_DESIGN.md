# Prediction Market MVP - System Design

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Market List  │  │ Create Market│  │ Trade Shares │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                  │
│         └──────────────────┼──────────────────┘                  │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                             │ HTTP/REST
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                    Backend API (Express.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Market Index │  │ User Positions│  │ Access Control│         │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                  │
│         └──────────────────┼──────────────────┘                  │
│                            │                                     │
│                            │ Sequelize ORM                        │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                             │ SQL
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                    PostgreSQL Database                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Markets    │  │  Outcomes    │  │  Positions   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Smart Contracts (Solidity)                    │
│                                                                  │
│  ┌──────────────────┐                                           │
│  │  MarketFactory   │  Creates new markets                      │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           │ creates                                             │
│           │                                                      │
│  ┌────────▼─────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     Market       │  │  MarketToken │  │     AMM       │     │
│  │                  │  │   (ERC-20)   │  │   Pricing     │     │
│  │ - Outcomes       │  │              │  │               │     │
│  │ - Visibility     │  │              │  │               │     │
│  │ - Resolution     │  │              │  │               │     │
│  │ - Trading        │  │              │  │               │     │
│  └──────────────────┘  └──────────────┘  └──────────────┘     │
│           │                                                      │
│           │ mints                                                │
│           │                                                      │
│  ┌────────▼─────────┐                                           │
│  │ OutcomeShareToken│  ERC-20 tokens per outcome                │
│  │   (ERC-20)       │                                           │
│  └──────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ Web3 RPC
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                    Ethereum Network                              │
│              (Localhost / Testnet / Mainnet)                     │
└─────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### Smart Contracts

1. **MarketFactory**
   - Creates new Market instances
   - Tracks all markets
   - Enforces creation parameters

2. **Market**
   - Manages market lifecycle (Active → Challenged → Resolved)
   - Handles outcome creation and share token minting
   - Implements visibility/access control
   - Processes buy/sell transactions via AMM
   - Manages resolution and redemption

3. **MarketToken (ERC-20)**
   - Utility token for platform
   - Used to buy outcome shares
   - Distributed as rewards on redemption

4. **AMM (Automated Market Maker)**
   - Calculates share prices based on liquidity
   - Implements bonding curve pricing
   - Handles buy/sell calculations with fees

5. **OutcomeShareToken (ERC-20)**
   - Represents shares in a specific outcome
   - Minted on buy, burned on sell/redeem
   - Redeemed 1:1 if winning, 0 if losing

### Backend API

1. **Market Indexing**
   - Syncs market data from blockchain
   - Stores market metadata, outcomes, prices
   - Enforces visibility rules for discovery

2. **User Positions**
   - Tracks user share holdings per outcome
   - Calculates portfolio value
   - Provides position history

3. **Access Control**
   - Validates user access for Private/Group markets
   - Manages participant allowlists
   - Enforces visibility restrictions

### Frontend

1. **Market Discovery**
   - Lists public markets
   - Filters by state, visibility, creator
   - Displays market cards with key info

2. **Market Creation**
   - Multi-step form for market setup
   - Outcome configuration (2-N outcomes)
   - Visibility selection
   - Participant allowlist (for Private/Group)

3. **Trading Interface**
   - Display outcomes with prices/probabilities
   - Buy/sell share functionality
   - Position tracking
   - Real-time price updates

## Data Flow

### Market Creation Flow

1. User fills creation form (title, description, outcomes, visibility)
2. Frontend calls MarketFactory.createMarket()
3. Factory deploys new Market contract
4. Market creates OutcomeShareToken for each outcome
5. Backend indexes new market via API
6. Market appears in public/private listings

### Trading Flow

1. User selects outcome and amount
2. Frontend calls Market.buyShares(outcomeIndex, tokenAmount)
3. Market transfers MarketToken from user
4. AMM calculates shares based on liquidity
5. Market mints OutcomeShareToken to user
6. Backend updates user position
7. Prices update based on new liquidity

### Resolution Flow

1. Market end time passes
2. Creator calls Market.proposeOutcome(outcomeIndex)
3. 7-day challenge window opens
4. Participants can challenge via Market.challengeOutcome()
5. After challenge period, Market.finalizeResolution()
6. Users redeem shares via Market.redeemShares()
7. Winning shares redeem 1:1, losing shares redeem 0

## Visibility Types

### Public Market
- Listed in public market discovery
- Anyone can view and participate
- No access restrictions

### Private Market
- Not indexed in public listings
- Accessible via invite link or direct address
- Participant allowlist enforced on-chain
- Backend validates access before showing market

### Group Market
- Visible only to group members
- Group membership tracked in database
- Access control at contract and backend level
- Used for friends, DAOs, teams

