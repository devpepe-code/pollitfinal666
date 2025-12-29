-- Database Schema for Prediction Market MVP
-- PostgreSQL

-- Markets table
CREATE TABLE IF NOT EXISTS markets (
    address VARCHAR(42) PRIMARY KEY,
    creator VARCHAR(42) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resolution_criteria TEXT,
    end_time BIGINT NOT NULL,
    visibility_type VARCHAR(20) NOT NULL CHECK (visibility_type IN ('Public', 'Private', 'Group')),
    state VARCHAR(20) DEFAULT 'Active' CHECK (state IN ('Active', 'Resolved', 'Challenged')),
    proposed_outcome_index INTEGER,
    winning_outcome_index INTEGER,
    total_volume DECIMAL(20, 0) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Outcomes table
CREATE TABLE IF NOT EXISTS outcomes (
    id SERIAL PRIMARY KEY,
    market_address VARCHAR(42) NOT NULL REFERENCES markets(address) ON DELETE CASCADE,
    index INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    share_token_address VARCHAR(42),
    liquidity DECIMAL(20, 0) DEFAULT 0,
    volume DECIMAL(20, 0) DEFAULT 0,
    is_winner BOOLEAN DEFAULT FALSE,
    UNIQUE(market_address, index)
);

-- User positions table
CREATE TABLE IF NOT EXISTS user_positions (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(42) NOT NULL,
    market_address VARCHAR(42) NOT NULL REFERENCES markets(address) ON DELETE CASCADE,
    outcome_index INTEGER NOT NULL,
    shares DECIMAL(20, 0) DEFAULT 0,
    UNIQUE(user_address, market_address, outcome_index)
);

-- Market participants (for Private/Group markets)
CREATE TABLE IF NOT EXISTS market_participants (
    id SERIAL PRIMARY KEY,
    market_address VARCHAR(42) NOT NULL REFERENCES markets(address) ON DELETE CASCADE,
    user_address VARCHAR(42) NOT NULL,
    allowed BOOLEAN DEFAULT TRUE,
    invited_by VARCHAR(42),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(market_address, user_address)
);

-- Market invites (for Private markets with invite links)
CREATE TABLE IF NOT EXISTS market_invites (
    id SERIAL PRIMARY KEY,
    market_address VARCHAR(42) NOT NULL REFERENCES markets(address) ON DELETE CASCADE,
    invite_token VARCHAR(64) NOT NULL UNIQUE,
    created_by VARCHAR(42) NOT NULL,
    max_uses INTEGER DEFAULT NULL,
    uses INTEGER DEFAULT 0,
    expires_at TIMESTAMP DEFAULT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_markets_visibility ON markets(visibility_type);
CREATE INDEX IF NOT EXISTS idx_markets_state ON markets(state);
CREATE INDEX IF NOT EXISTS idx_markets_creator ON markets(creator);
CREATE INDEX IF NOT EXISTS idx_participants_market ON market_participants(market_address);
CREATE INDEX IF NOT EXISTS idx_participants_user ON market_participants(user_address);
CREATE INDEX IF NOT EXISTS idx_invites_token ON market_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_invites_market ON market_invites(market_address);
CREATE INDEX IF NOT EXISTS idx_markets_end_time ON markets(end_time);
CREATE INDEX IF NOT EXISTS idx_outcomes_market ON outcomes(market_address);
CREATE INDEX IF NOT EXISTS idx_positions_user ON user_positions(user_address);
CREATE INDEX IF NOT EXISTS idx_positions_market ON user_positions(market_address);
CREATE INDEX IF NOT EXISTS idx_participants_market ON market_participants(market_address);
CREATE INDEX IF NOT EXISTS idx_participants_user ON market_participants(user_address);

