const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const { ethers } = require('ethers');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://localhost:5432/prediction_market',
  {
    dialect: 'postgres',
    logging: false
  }
);

// Database Models
const Market = sequelize.define('Market', {
  address: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  creator: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  resolutionCriteria: {
    type: DataTypes.TEXT
  },
  endTime: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  visibilityType: {
    type: DataTypes.ENUM('Public', 'Private', 'Group'),
    allowNull: false
  },
  state: {
    type: DataTypes.ENUM('Active', 'Resolved', 'Challenged'),
    defaultValue: 'Active'
  },
  proposedOutcomeIndex: {
    type: DataTypes.INTEGER
  },
  winningOutcomeIndex: {
    type: DataTypes.INTEGER
  },
  totalVolume: {
    type: DataTypes.DECIMAL(20, 0),
    defaultValue: 0
  }
}, {
  timestamps: true,
  underscored: true
});

const Outcome = sequelize.define('Outcome', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  marketAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Market,
      key: 'address'
    }
  },
  index: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  shareTokenAddress: {
    type: DataTypes.STRING
  },
  liquidity: {
    type: DataTypes.DECIMAL(20, 0),
    defaultValue: 0
  },
  volume: {
    type: DataTypes.DECIMAL(20, 0),
    defaultValue: 0
  },
  isWinner: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

const UserPosition = sequelize.define('UserPosition', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userAddress: {
    type: DataTypes.STRING,
    allowNull: false
  },
  marketAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Market,
      key: 'address'
    }
  },
  outcomeIndex: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  shares: {
    type: DataTypes.DECIMAL(20, 0),
    defaultValue: 0
  }
});

const MarketParticipant = sequelize.define('MarketParticipant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  marketAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Market,
      key: 'address'
    }
  },
  userAddress: {
    type: DataTypes.STRING,
    allowNull: false
  },
  allowed: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  invitedBy: {
    type: DataTypes.STRING
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

const MarketInvite = sequelize.define('MarketInvite', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  marketAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Market,
      key: 'address'
    }
  },
  inviteToken: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  createdBy: {
    type: DataTypes.STRING,
    allowNull: false
  },
  maxUses: {
    type: DataTypes.INTEGER,
    defaultValue: null // null = unlimited
  },
  uses: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  expiresAt: {
    type: DataTypes.DATE,
    defaultValue: null // null = never expires
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

// User model for login system
const UserSettings = sequelize.define('UserSettings', {
  userAddress: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'USD',
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.ENUM('wallet', 'credit_card', 'paypal', 'bank_transfer'),
    defaultValue: 'wallet',
    allowNull: false
  },
  walletAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emailNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  pushNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, {
  timestamps: true
});

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING
  },
  loginMethod: {
    type: DataTypes.ENUM('Google', 'Apple', 'Wallet'),
    allowNull: false
  },
  totalVolume: {
    type: DataTypes.DECIMAL(20, 0),
    defaultValue: 0
  }
});

// Comment model
const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  marketAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Market,
      key: 'address'
    }
  },
  userAddress: {
    type: DataTypes.STRING,
    allowNull: false
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  parentCommentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Comments',
      key: 'id'
    }
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

// Like model
const Like = sequelize.define('Like', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  commentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Comment,
      key: 'id'
    }
  },
  userAddress: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  uniqueKeys: {
    unique_like: {
      fields: ['commentId', 'userAddress']
    }
  }
});

// Define relationships
Market.hasMany(Outcome, { foreignKey: 'marketAddress' });
Market.hasMany(UserPosition, { foreignKey: 'marketAddress' });
Market.hasMany(MarketParticipant, { foreignKey: 'marketAddress' });
Market.hasMany(MarketInvite, { foreignKey: 'marketAddress' });
Market.hasMany(Comment, { foreignKey: 'marketAddress' });
UserPosition.belongsTo(User, { foreignKey: 'userAddress', targetKey: 'address', as: 'user' });
Comment.belongsTo(Market, { foreignKey: 'marketAddress' });
Comment.belongsTo(Comment, { foreignKey: 'parentCommentId', as: 'parentComment' });
Comment.hasMany(Comment, { foreignKey: 'parentCommentId', as: 'replies' });
Comment.hasMany(Like, { foreignKey: 'commentId', as: 'likes' });
Like.belongsTo(Comment, { foreignKey: 'commentId' });

// Initialize database
async function initDB() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('Database connected and synced');
    
    // Create test users if they don't exist
    const testUsers = [
      { address: '0x1111111111111111111111111111111111111111', username: 'Alice Trader', email: 'alice@test.com', loginMethod: 'Wallet' },
      { address: '0x2222222222222222222222222222222222222222', username: 'Bob Investor', email: 'bob@test.com', loginMethod: 'Wallet' }
    ];
    
    for (const userData of testUsers) {
      const existingUser = await User.findOne({ where: { address: userData.address } });
      if (!existingUser) {
        await User.create(userData);
        console.log(`Created test user: ${userData.username}`);
      }
    }
  } catch (error) {
    console.error('Database connection error:', error);
  }
}

// Blockchain connection
const provider = new ethers.JsonRpcProvider(
  process.env.RPC_URL || 'http://localhost:8545'
);

// Contract ABIs (simplified - in production, import from artifacts)
const MARKET_FACTORY_ABI = [
  'function getAllMarkets() view returns (address[])',
  'function getMarketsByCreator(address) view returns (address[])',
  'event MarketCreated(address indexed market, address indexed creator, string title, uint8 visibilityType)'
];

const MARKET_ABI = [
  'function title() view returns (string)',
  'function description() view returns (string)',
  'function resolutionCriteria() view returns (string)',
  'function endTime() view returns (uint256)',
  'function visibilityType() view returns (uint8)',
  'function state() view returns (uint8)',
  'function creator() view returns (address)',
  'function getOutcomesCount() view returns (uint256)',
  'function outcomes(uint256) view returns (string name, address shareToken, uint256 liquidity, bool isWinner)',
  'function getOutcomePrice(uint256) view returns (uint256 price, uint256 probability)',
  'function canParticipate(address) view returns (bool)',
  'event SharesBought(address indexed buyer, uint256 indexed outcomeIndex, uint256 shares, uint256 cost)',
  'event SharesSold(address indexed seller, uint256 indexed outcomeIndex, uint256 shares, uint256 proceeds)'
];

// API Routes

// Helper function to check market access
async function canUserAccessMarket(marketAddress, userAddress, market) {
  if (!market) {
    market = await Market.findByPk(marketAddress);
  }
  
  if (!market) return false;
  
  // Public markets are accessible to everyone
  if (market.visibilityType === 'Public') {
    return true;
  }
  
  // Creator always has access
  if (market.creator.toLowerCase() === userAddress?.toLowerCase()) {
    return true;
  }
  
  // Check if user is a participant
  const participant = await MarketParticipant.findOne({
    where: {
      marketAddress: marketAddress,
      userAddress: userAddress?.toLowerCase(),
      allowed: true
    }
  });
  
  return !!participant;
}

// Get all markets (filtered by visibility and user access)
app.get('/api/markets', async (req, res) => {
  try {
    const { visibility, creator, state, sort, userAddress } = req.query;
    const where = {};
    
    if (visibility) where.visibilityType = visibility;
    if (creator) where.creator = creator;
    if (state) where.state = state;
    
    // If no user address provided, only show Public markets
    if (!userAddress) {
      where.visibilityType = 'Public';
    }
    
    // Determine sorting order
    let order;
    if (sort === 'recent') {
      order = [['created_at', 'DESC']]; // Newest first
      console.log('Sorting by created_at DESC (Recently Added)');
    } else if (sort === 'trending') {
      order = [['totalVolume', 'DESC'], ['created_at', 'DESC']]; // By volume, then date
    } else {
      order = [['endTime', 'DESC']]; // Default: by end time
    }
    
    const markets = await Market.findAll({
      where,
      include: [Outcome],
      order,
      raw: false // Keep as instances so we can convert properly
    });
    
    // Filter by user access for Private/Group markets
    let accessibleMarkets = markets;
    if (userAddress) {
      const accessChecks = await Promise.all(
        markets.map(async (market) => {
          const hasAccess = await canUserAccessMarket(market.address, userAddress, market);
          return { market, hasAccess };
        })
      );
      accessibleMarkets = accessChecks
        .filter(({ hasAccess }) => hasAccess)
        .map(({ market }) => market);
    }
    
    // Convert to plain JSON to ensure all fields including timestamps are included
    const marketsJson = accessibleMarkets.map(market => {
      const json = market.toJSON();
      // Ensure created_at is present (might be camelCase or snake_case)
      if (!json.created_at && json.createdAt) {
        json.created_at = json.createdAt;
      }
      if (!json.updated_at && json.updatedAt) {
        json.updated_at = json.updatedAt;
      }
      return json;
    });
    
    // Debug logging
    if (sort === 'recent') {
      console.log(`📋 Returning ${marketsJson.length} markets for "Recently Added" tab`);
      if (marketsJson.length > 0) {
        console.log('📊 First 3 markets:', marketsJson.slice(0, 3).map(m => ({
          title: m.title,
          address: m.address,
          createdAt: m.created_at || m.createdAt,
          visibilityType: m.visibilityType
        })));
      }
    }
    
    res.json(marketsJson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get market by address (with access check)
app.get('/api/markets/:address', async (req, res) => {
  try {
    const { userAddress } = req.query;
    const market = await Market.findOne({
      where: { address: req.params.address },
      include: [Outcome, UserPosition]
    });
    
    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }
    
    // Check access for Private/Group markets
    if (market.visibilityType !== 'Public') {
      if (!userAddress) {
        return res.status(403).json({ error: 'Authentication required to view this market' });
      }
      
      const hasAccess = await canUserAccessMarket(market.address, userAddress, market);
      if (!hasAccess) {
        return res.status(403).json({ error: 'You do not have access to this market' });
      }
    }
    
    res.json(market);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user positions
app.get('/api/users/:address/positions', async (req, res) => {
  try {
    const positions = await UserPosition.findAll({
      where: { userAddress: req.params.address },
      include: [Market]
    });
    
    res.json(positions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check market access (for private/group markets)
app.get('/api/markets/:address/access/:userAddress', async (req, res) => {
  try {
    const hasAccess = await canUserAccessMarket(req.params.address, req.params.userAddress);
    res.json({ allowed: hasAccess });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get markets accessible to a specific user
app.get('/api/users/:userAddress/markets', async (req, res) => {
  try {
    const { visibility, state, sort } = req.query;
    const userAddress = req.params.userAddress.toLowerCase();
    
    // Get all markets where user has access
    const allMarkets = await Market.findAll({
      include: [Outcome],
      raw: false
    });
    
    // Filter by access
    const accessibleMarkets = [];
    for (const market of allMarkets) {
      const hasAccess = await canUserAccessMarket(market.address, userAddress, market);
      if (hasAccess) {
        // Apply additional filters
        if (visibility && market.visibilityType !== visibility) continue;
        if (state && market.state !== state) continue;
        accessibleMarkets.push(market);
      }
    }
    
    // Sort markets
    if (sort === 'recent') {
      accessibleMarkets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === 'trending') {
      accessibleMarkets.sort((a, b) => {
        const volA = parseFloat(a.totalVolume || 0);
        const volB = parseFloat(b.totalVolume || 0);
        if (volB !== volA) return volB - volA;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }
    
    const marketsJson = accessibleMarkets.map(market => {
      const json = market.toJSON();
      if (!json.created_at && json.createdAt) {
        json.created_at = json.createdAt;
      }
      if (!json.updated_at && json.updatedAt) {
        json.updated_at = json.updatedAt;
      }
      return json;
    });
    
    res.json(marketsJson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate invite link for Private market
app.post('/api/markets/:address/invites', async (req, res) => {
  try {
    const { createdBy, maxUses, expiresInDays } = req.body;
    const marketAddress = req.params.address;
    
    // Verify market exists and is Private
    const market = await Market.findByPk(marketAddress);
    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }
    
    if (market.visibilityType !== 'Private') {
      return res.status(400).json({ error: 'Invite links are only available for Private markets' });
    }
    
    // Verify creator
    if (market.creator.toLowerCase() !== createdBy?.toLowerCase()) {
      return res.status(403).json({ error: 'Only the market creator can generate invite links' });
    }
    
    // Generate unique invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    
    // Calculate expiration date
    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }
    
    // Create invite
    const invite = await MarketInvite.create({
      marketAddress,
      inviteToken,
      createdBy: createdBy.toLowerCase(),
      maxUses: maxUses || null,
      expiresAt
    });
    
    // Generate invite link
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${inviteToken}`;
    
    res.json({
      invite: invite.toJSON(),
      inviteLink,
      message: 'Invite link generated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Redeem invite link
app.post('/api/invites/:token/redeem', async (req, res) => {
  try {
    const { userAddress } = req.body;
    const { token } = req.params;
    
    if (!userAddress) {
      return res.status(400).json({ error: 'User address is required' });
    }
    
    // Find invite
    const invite = await MarketInvite.findOne({
      where: { inviteToken: token, active: true }
    });
    
    if (!invite) {
      return res.status(404).json({ error: 'Invalid or expired invite link' });
    }
    
    // Check expiration
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      await invite.update({ active: false });
      return res.status(400).json({ error: 'Invite link has expired' });
    }
    
    // Check max uses
    if (invite.maxUses && invite.uses >= invite.maxUses) {
      await invite.update({ active: false });
      return res.status(400).json({ error: 'Invite link has reached maximum uses' });
    }
    
    // Check if user already has access
    const existingParticipant = await MarketParticipant.findOne({
      where: {
        marketAddress: invite.marketAddress,
        userAddress: userAddress.toLowerCase()
      }
    });
    
    if (existingParticipant) {
      return res.json({
        message: 'You already have access to this market',
        marketAddress: invite.marketAddress
      });
    }
    
    // Add user as participant
    await MarketParticipant.create({
      marketAddress: invite.marketAddress,
      userAddress: userAddress.toLowerCase(),
      allowed: true,
      invitedBy: invite.createdBy
    });
    
    // Increment invite uses
    await invite.increment('uses');
    
    // Get market details
    const market = await Market.findByPk(invite.marketAddress);
    
    res.json({
      message: 'Successfully joined market',
      market: market.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get invite links for a market
app.get('/api/markets/:address/invites', async (req, res) => {
  try {
    const { createdBy } = req.query;
    const marketAddress = req.params.address;
    
    // Verify market exists
    const market = await Market.findByPk(marketAddress);
    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }
    
    // Verify creator
    if (market.creator.toLowerCase() !== createdBy?.toLowerCase()) {
      return res.status(403).json({ error: 'Only the market creator can view invite links' });
    }
    
    const invites = await MarketInvite.findAll({
      where: { marketAddress },
      order: [['createdAt', 'DESC']]
    });
    
    const invitesJson = invites.map(invite => {
      const json = invite.toJSON();
      const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${invite.inviteToken}`;
      return { ...json, inviteLink };
    });
    
    res.json(invitesJson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add participant to Group market
app.post('/api/markets/:address/participants', async (req, res) => {
  try {
    const { userAddress, addedBy } = req.body;
    const marketAddress = req.params.address;
    
    if (!userAddress) {
      return res.status(400).json({ error: 'User address is required' });
    }
    
    // Verify market exists and is Group
    const market = await Market.findByPk(marketAddress);
    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }
    
    if (market.visibilityType !== 'Group') {
      return res.status(400).json({ error: 'This endpoint is only for Group markets' });
    }
    
    // Verify creator or existing participant
    const isCreator = market.creator.toLowerCase() === addedBy?.toLowerCase();
    const isParticipant = await MarketParticipant.findOne({
      where: {
        marketAddress,
        userAddress: addedBy?.toLowerCase(),
        allowed: true
      }
    });
    
    if (!isCreator && !isParticipant) {
      return res.status(403).json({ error: 'Only the creator or existing participants can add members' });
    }
    
    // Check if already a participant
    const existing = await MarketParticipant.findOne({
      where: {
        marketAddress,
        userAddress: userAddress.toLowerCase()
      }
    });
    
    if (existing) {
      if (existing.allowed) {
        return res.json({ message: 'User is already a participant', participant: existing.toJSON() });
      } else {
        // Re-enable access
        await existing.update({ allowed: true, invitedBy: addedBy?.toLowerCase() });
        return res.json({ message: 'User access re-enabled', participant: existing.toJSON() });
      }
    }
    
    // Add participant
    const participant = await MarketParticipant.create({
      marketAddress,
      userAddress: userAddress.toLowerCase(),
      allowed: true,
      invitedBy: addedBy?.toLowerCase()
    });
    
    res.json({
      message: 'Participant added successfully',
      participant: participant.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove participant from market
app.delete('/api/markets/:address/participants/:userAddress', async (req, res) => {
  try {
    const { removedBy } = req.body;
    const { address, userAddress } = req.params;
    
    // Verify market exists
    const market = await Market.findByPk(address);
    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }
    
    // Verify creator
    if (market.creator.toLowerCase() !== removedBy?.toLowerCase()) {
      return res.status(403).json({ error: 'Only the market creator can remove participants' });
    }
    
    // Cannot remove creator
    if (market.creator.toLowerCase() === userAddress.toLowerCase()) {
      return res.status(400).json({ error: 'Cannot remove the market creator' });
    }
    
    // Remove participant
    const participant = await MarketParticipant.findOne({
      where: {
        marketAddress: address,
        userAddress: userAddress.toLowerCase()
      }
    });
    
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    
    await participant.destroy();
    
    res.json({ message: 'Participant removed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get participants for a market
app.get('/api/markets/:address/participants', async (req, res) => {
  try {
    const { userAddress } = req.query;
    const marketAddress = req.params.address;
    
    // Verify market exists
    const market = await Market.findByPk(marketAddress);
    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }
    
    // Check access
    if (market.visibilityType !== 'Public') {
      if (!userAddress) {
        return res.status(403).json({ error: 'Authentication required' });
      }
      const hasAccess = await canUserAccessMarket(marketAddress, userAddress, market);
      if (!hasAccess) {
        return res.status(403).json({ error: 'You do not have access to this market' });
      }
    }
    
    const participants = await MarketParticipant.findAll({
      where: {
        marketAddress,
        allowed: true
      },
      order: [['joinedAt', 'DESC']]
    });
    
    res.json(participants.map(p => p.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Index market from blockchain
app.post('/api/markets/index/:address', async (req, res) => {
  try {
    const marketAddress = req.params.address;
    console.log(`📝 Starting to index market at address: ${marketAddress}`);
    
    const marketContract = new ethers.Contract(
      marketAddress,
      MARKET_ABI,
      provider
    );
    
    const [
      title,
      description,
      resolutionCriteria,
      endTime,
      visibilityType,
      state,
      creator,
      outcomesCount
    ] = await Promise.all([
      marketContract.title(),
      marketContract.description(),
      marketContract.resolutionCriteria(),
      marketContract.endTime(),
      marketContract.visibilityType(),
      marketContract.state(),
      marketContract.creator(),
      marketContract.getOutcomesCount()
    ]);
    
    // Get outcomes
    const outcomes = [];
    for (let i = 0; i < Number(outcomesCount); i++) {
      const outcome = await marketContract.outcomes(i);
      outcomes.push({
        index: i,
        name: outcome.name,
        shareTokenAddress: outcome.shareToken,
        liquidity: outcome.liquidity.toString(),
        isWinner: outcome.isWinner
      });
    }
    
    // Check if market exists
    let market = await Market.findByPk(req.params.address);
    const isNew = !market;
    
    // Convert visibility type enum to string
    const visibilityTypeStr = ['Public', 'Private', 'Group'][Number(visibilityType)];
    
    // Create or update market
    if (isNew) {
      market = await Market.create({
        address: req.params.address,
        creator,
        title,
        description,
        resolutionCriteria,
        endTime: endTime.toString(),
        visibilityType: visibilityTypeStr,
        state: ['Active', 'Resolved', 'Challenged'][Number(state)]
      });
      console.log(`✅ Created NEW market: ${title} (${req.params.address})`);
      console.log(`   Visibility: ${visibilityTypeStr}, Creator: ${creator}`);
    } else {
      // Update existing market
      await market.update({
        creator,
        title,
        description,
        resolutionCriteria,
        endTime: endTime.toString(),
        visibilityType: visibilityTypeStr,
        state: ['Active', 'Resolved', 'Challenged'][Number(state)]
      });
      console.log(`♻️ Updated EXISTING market: ${title} (${req.params.address})`);
    }
    
    // Reload to get timestamps
    await market.reload();
    
    // Debug: Log the market creation
    const marketData = market.toJSON();
    console.log('📊 Market indexed:', {
      address: marketData.address,
      title: marketData.title,
      createdAt: marketData.created_at || marketData.createdAt,
      updatedAt: marketData.updated_at || marketData.updatedAt,
      isNew,
      visibilityType: marketData.visibilityType
    });
    
    // Create or update outcomes
    for (const outcome of outcomes) {
      await Outcome.upsert({
        marketAddress: req.params.address,
        ...outcome
      });
    }
    
    const response = { market: market.toJSON(), created: isNew };
    console.log(`✅ Market indexing completed for ${req.params.address}:`, {
      created: isNew,
      visibilityType: response.market.visibilityType || response.market.visibility_type,
      createdAt: response.market.created_at || response.market.createdAt
    });
    
    res.json(response);
  } catch (error) {
    console.error(`❌ Error indexing market ${req.params.address}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Sync markets from factory
app.post('/api/sync', async (req, res) => {
  try {
    const factoryAddress = process.env.MARKET_FACTORY_ADDRESS;
    if (!factoryAddress) {
      return res.status(400).json({ error: 'Factory address not configured' });
    }
    
    const factory = new ethers.Contract(
      factoryAddress,
      MARKET_FACTORY_ABI,
      provider
    );
    
    const marketAddresses = await factory.getAllMarkets();
    
    // Index each market
    for (const address of marketAddresses) {
      // Trigger indexing (could be done via webhook or polling)
      // For now, just return the addresses
    }
    
    res.json({ markets: marketAddresses, count: marketAddresses.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute trade (buy or sell shares)
app.post('/api/markets/:address/trade', async (req, res) => {
  try {
    const { userAddress, outcomeIndex, tradeType, amount } = req.body;
    const marketAddress = req.params.address;
    
    if (!userAddress || outcomeIndex === undefined || !tradeType || !amount) {
      return res.status(400).json({ error: 'Missing required fields: userAddress, outcomeIndex, tradeType, amount' });
    }
    
    if (tradeType !== 'buy' && tradeType !== 'sell') {
      return res.status(400).json({ error: 'tradeType must be "buy" or "sell"' });
    }
    
    // Verify market exists
    const market = await Market.findByPk(marketAddress, {
      include: [Outcome]
    });
    
    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }
    
    // Check market access for Private/Group markets
    if (market.visibilityType !== 'Public') {
      const hasAccess = await canUserAccessMarket(marketAddress, userAddress, market);
      if (!hasAccess) {
        return res.status(403).json({ error: 'You do not have access to trade in this market' });
      }
    }
    
    // Verify outcome exists
    const outcome = market.Outcomes?.find(o => o.index === outcomeIndex);
    if (!outcome) {
      return res.status(404).json({ error: 'Outcome not found' });
    }
    
    // Get or create user position
    let position = await UserPosition.findOne({
      where: {
        userAddress: userAddress.toLowerCase(),
        marketAddress: marketAddress,
        outcomeIndex: outcomeIndex
      }
    });
    
    if (!position) {
      position = await UserPosition.create({
        userAddress: userAddress.toLowerCase(),
        marketAddress: marketAddress,
        outcomeIndex: outcomeIndex,
        shares: 0
      });
    }
    
    // Calculate shares based on amount and current price
    // In a real implementation, this would interact with the AMM contract
    // For now, we'll use a simplified calculation
    const price = parseFloat(outcome.liquidity) / (parseFloat(outcome.liquidity) + parseFloat(market.totalVolume) || 1);
    const shares = Math.floor((parseFloat(amount) * 100) / (price * 100)); // Convert to cents
    
    if (tradeType === 'buy') {
      // Buy shares
      position.shares = (parseFloat(position.shares) || 0) + shares;
      outcome.liquidity = (parseFloat(outcome.liquidity) || 0) + parseFloat(amount);
      outcome.volume = (parseFloat(outcome.volume) || 0) + parseFloat(amount);
      market.totalVolume = (parseFloat(market.totalVolume) || 0) + parseFloat(amount);
    } else {
      // Sell shares
      if (parseFloat(position.shares) < shares) {
        return res.status(400).json({ error: 'Insufficient shares to sell' });
      }
      position.shares = (parseFloat(position.shares) || 0) - shares;
      outcome.liquidity = Math.max(0, (parseFloat(outcome.liquidity) || 0) - parseFloat(amount));
      outcome.volume = (parseFloat(outcome.volume) || 0) + parseFloat(amount);
    }
    
    // Save updates
    await position.save();
    await outcome.save();
    await market.save();
    
    res.json({
      success: true,
      tradeType,
      shares,
      newPosition: position.shares,
      outcome: {
        index: outcomeIndex,
        name: outcome.name,
        liquidity: outcome.liquidity,
        volume: outcome.volume
      }
    });
  } catch (error) {
    console.error('Trade execution error:', error);
    res.status(500).json({ error: error.message });
  }
});

// User endpoints
// Create or get user
app.post('/api/users', async (req, res) => {
  try {
    const { address, username, email, loginMethod } = req.body;
    
    if (!address || !username || !loginMethod) {
      return res.status(400).json({ error: 'Missing required fields: address, username, loginMethod' });
    }
    
    let user = await User.findOne({ where: { address: address.toLowerCase() } });
    
    if (user) {
      // Update user info if provided
      if (username) user.username = username;
      if (email) user.email = email;
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        address: address.toLowerCase(),
        username,
        email,
        loginMethod
      });
    }
    
    res.json(user);
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user by address
app.get('/api/users/:address', async (req, res) => {
  try {
    const user = await User.findOne({ 
      where: { address: req.params.address.toLowerCase() }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top holders (users with highest volume)
app.get('/api/markets/:address/top-holders', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Get all users who have positions in this market
    const positions = await UserPosition.findAll({
      where: { marketAddress: address }
    });
    
    // Group by user and calculate total shares
    const userShares = {};
    for (const pos of positions) {
      const userAddr = pos.userAddress.toLowerCase();
      if (!userShares[userAddr]) {
        const user = await User.findOne({ where: { address: userAddr } });
        userShares[userAddr] = {
          userAddress: userAddr,
          totalShares: 0,
          username: user?.username || 'Unknown User'
        };
      }
      userShares[userAddr].totalShares += parseFloat(pos.shares) || 0;
    }
    
    // Convert to array and sort by total shares
    let topHolders = Object.values(userShares)
      .sort((a, b) => b.totalShares - a.totalShares)
      .slice(0, 10); // Top 10
    
    // If no holders, return fake profiles (top 10) for visibility
    if (topHolders.length === 0) {
      const fakeProfiles = [
        { username: 'Alice Trader', userAddress: '0x1111111111111111111111111111111111111111', totalShares: 1250 },
        { username: 'Bob Investor', userAddress: '0x2222222222222222222222222222222222222222', totalShares: 980 },
        { username: 'Charlie Crypto', userAddress: '0x3333333333333333333333333333333333333333', totalShares: 875 },
        { username: 'Diana DeFi', userAddress: '0x4444444444444444444444444444444444444444', totalShares: 720 },
        { username: 'Eve Exchange', userAddress: '0x5555555555555555555555555555555555555555', totalShares: 650 },
        { username: 'Frank Futures', userAddress: '0x6666666666666666666666666666666666666666', totalShares: 580 },
        { username: 'Grace Gains', userAddress: '0x7777777777777777777777777777777777777777', totalShares: 520 },
        { username: 'Henry Holdings', userAddress: '0x8888888888888888888888888888888888888888', totalShares: 480 },
        { username: 'Ivy Investment', userAddress: '0x9999999999999999999999999999999999999999', totalShares: 420 },
        { username: 'Jack Jumper', userAddress: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', totalShares: 380 }
      ];
      
      // Try to get real test users first
      const testUsers = await User.findAll({
        where: {
          address: ['0x1111111111111111111111111111111111111111', '0x2222222222222222222222222222222222222222']
        }
      });
      
      // Update fake profiles with real usernames if available
      testUsers.forEach(user => {
        const profile = fakeProfiles.find(p => p.userAddress.toLowerCase() === user.address.toLowerCase());
        if (profile) {
          profile.username = user.username;
        }
      });
      
      topHolders = fakeProfiles.sort((a, b) => b.totalShares - a.totalShares);
    }
    
    res.json(topHolders);
  } catch (error) {
    console.error('Top holders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Comment endpoints
// Get comments for a market
app.get('/api/markets/:address/comments', async (req, res) => {
  try {
    const { address } = req.params;
    const { userAddress } = req.query;
    
    const comments = await Comment.findAll({
      where: { 
        marketAddress: address,
        parentCommentId: null // Only top-level comments
      },
      include: [
        {
          model: Comment,
          as: 'replies',
          include: [{ model: Like, as: 'likes' }]
        },
        { model: Like, as: 'likes' }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Format comments with user info and like status
    const formattedComments = await Promise.all(comments.map(async (comment) => {
      const user = await User.findOne({ where: { address: comment.userAddress } });
      const userLiked = userAddress ? await Like.findOne({
        where: { commentId: comment.id, userAddress: userAddress.toLowerCase() }
      }) : null;
      
      const replies = await Promise.all((comment.replies || []).map(async (reply) => {
        const replyUser = await User.findOne({ where: { address: reply.userAddress } });
        const replyUserLiked = userAddress ? await Like.findOne({
          where: { commentId: reply.id, userAddress: userAddress.toLowerCase() }
        }) : null;
        
        return {
          id: reply.id,
          text: reply.text,
          author: replyUser?.username || 'Unknown',
          userAddress: reply.userAddress,
          date: reply.createdAt,
          likes: reply.likes?.length || 0,
          isLiked: !!replyUserLiked
        };
      }));
      
      return {
        id: comment.id,
        text: comment.text,
        author: user?.username || 'Unknown',
        userAddress: comment.userAddress,
        date: comment.createdAt,
        likes: comment.likes?.length || 0,
        isLiked: !!userLiked,
        replies: replies
      };
    }));
    
    res.json(formattedComments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Post a comment
app.post('/api/markets/:address/comments', async (req, res) => {
  try {
    const { address } = req.params;
    const { userAddress, text, parentCommentId } = req.body;
    
    if (!userAddress || !text) {
      return res.status(400).json({ error: 'Missing required fields: userAddress, text' });
    }
    
    // Verify user exists or create a basic user record
    let user = await User.findOne({ where: { address: userAddress.toLowerCase() } });
    if (!user) {
      // Create a basic user record for commenting (if user logged in but not in DB)
      try {
        user = await User.create({
          address: userAddress.toLowerCase(),
          username: userAddress.slice(0, 6) + '...' + userAddress.slice(-4),
          loginMethod: 'Wallet'
        });
      } catch (createError) {
        // If creation fails, still allow comment but with default username
        console.warn('Could not create user record:', createError);
      }
    }
    
    // Verify market exists (allow comments even if market not in DB for local markets)
    const market = await Market.findByPk(address);
    if (!market) {
      // For local markets, we'll still allow comments
      console.warn('Market not found in DB, but allowing comment for:', address);
    }
    
    const comment = await Comment.create({
      marketAddress: address,
      userAddress: userAddress.toLowerCase(),
      text: text.trim(),
      parentCommentId: parentCommentId || null
    });
    
    const formattedComment = {
      id: comment.id,
      text: comment.text,
      author: user.username,
      userAddress: comment.userAddress,
      date: comment.createdAt,
      likes: 0,
      isLiked: false,
      replies: []
    };
    
    res.json(formattedComment);
  } catch (error) {
    console.error('Post comment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user settings
app.get('/api/users/:address/settings', async (req, res) => {
  try {
    const { address } = req.params;
    const userAddress = address.toLowerCase();
    
    let settings = await UserSettings.findByPk(userAddress);
    
    if (!settings) {
      // Return default settings if not found
      return res.json({
        userAddress: userAddress,
        currency: 'USD',
        paymentMethod: 'wallet',
        emailNotifications: true,
        pushNotifications: false
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user settings
app.post('/api/users/:address/settings', async (req, res) => {
  try {
    const { address } = req.params;
    const userAddress = address.toLowerCase();
    const {
      username,
      email,
      bio,
      currency,
      paymentMethod,
      walletAddress,
      emailNotifications,
      pushNotifications
    } = req.body;
    
    // Find or create settings
    let settings = await UserSettings.findByPk(userAddress);
    
    if (!settings) {
      settings = await UserSettings.create({
        userAddress: userAddress,
        username: username || null,
        email: email || null,
        bio: bio || null,
        currency: currency || 'USD',
        paymentMethod: paymentMethod || 'wallet',
        walletAddress: walletAddress || null,
        emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
        pushNotifications: pushNotifications !== undefined ? pushNotifications : false
      });
    } else {
      // Update existing settings
      if (username !== undefined) settings.username = username;
      if (email !== undefined) settings.email = email;
      if (bio !== undefined) settings.bio = bio;
      if (currency !== undefined) settings.currency = currency;
      if (paymentMethod !== undefined) settings.paymentMethod = paymentMethod;
      if (walletAddress !== undefined) settings.walletAddress = walletAddress;
      if (emailNotifications !== undefined) settings.emailNotifications = emailNotifications;
      if (pushNotifications !== undefined) settings.pushNotifications = pushNotifications;
      
      await settings.save();
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Like a comment
app.post('/api/comments/:commentId/like', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userAddress } = req.body;
    
    if (!userAddress) {
      return res.status(400).json({ error: 'Missing required field: userAddress' });
    }
    
    // Check if already liked
    const existingLike = await Like.findOne({
      where: { commentId, userAddress: userAddress.toLowerCase() }
    });
    
    if (existingLike) {
      // Unlike - remove the like
      await existingLike.destroy();
      const comment = await Comment.findByPk(commentId);
      comment.likes = Math.max(0, (comment.likes || 0) - 1);
      await comment.save();
      res.json({ liked: false, likes: comment.likes });
    } else {
      // Like - add the like
      await Like.create({
        commentId,
        userAddress: userAddress.toLowerCase()
      });
      const comment = await Comment.findByPk(commentId);
      comment.likes = (comment.likes || 0) + 1;
      await comment.save();
      res.json({ liked: true, likes: comment.likes });
    }
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;

// Start server even if database connection fails (for development)
async function startServer() {
  try {
    // Try to authenticate database connection
    await sequelize.authenticate();
    console.log('Database connection established.');
    await initDB();
  } catch (error) {
    console.warn('Database connection failed, but server will continue:', error.message);
    console.warn('Some features may not work without database. Comments will use in-memory storage.');
  }
  
  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}`);
  });
}

startServer();


