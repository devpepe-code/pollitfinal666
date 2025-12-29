// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MarketToken.sol";
import "./AMM.sol";

/**
 * @title Market
 * @notice Represents a single prediction market with 2-N outcomes
 */
contract Market is Ownable {
    enum VisibilityType {
        Public,
        Private,
        Group
    }

    enum MarketState {
        Active,
        Resolved,
        Challenged
    }

    struct Outcome {
        string name;
        ERC20 shareToken;
        uint256 liquidity;
        bool isWinner;
    }

    MarketToken public immutable marketToken;
    AMM public immutable amm;

    string public title;
    string public description;
    string public resolutionCriteria;
    uint256 public endTime;
    VisibilityType public visibilityType;
    MarketState public state;

    Outcome[] public outcomes;
    mapping(address => bool) public allowedParticipants; // For Private/Group markets
    mapping(address => bool) public hasParticipated; // Track participants for resolution voting

    address public creator;
    uint256 public proposedOutcomeIndex;
    uint256 public challengeDeadline;
    mapping(address => bool) public resolutionVotes;
    uint256 public voteCount;

    uint256 public constant TRADING_FEE_BPS = 30; // 0.3% trading fee
    uint256 public constant CREATOR_FEE_BPS = 10; // 0.1% to creator
    uint256 public constant PROTOCOL_FEE_BPS = 20; // 0.2% to protocol

    event MarketCreated(
        address indexed market,
        address indexed creator,
        string title,
        VisibilityType visibilityType
    );
    event SharesBought(
        address indexed buyer,
        uint256 indexed outcomeIndex,
        uint256 shares,
        uint256 cost
    );
    event SharesSold(
        address indexed seller,
        uint256 indexed outcomeIndex,
        uint256 shares,
        uint256 proceeds
    );
    event OutcomeProposed(uint256 indexed outcomeIndex, address indexed proposer);
    event OutcomeChallenged(address indexed challenger);
    event OutcomeResolved(uint256 indexed winningOutcomeIndex);
    event SharesRedeemed(
        address indexed redeemer,
        uint256 indexed outcomeIndex,
        uint256 shares,
        uint256 payout
    );

    constructor(
        address _marketToken,
        address _amm,
        address _creator,
        string memory _title,
        string memory _description,
        string memory _resolutionCriteria,
        uint256 _endTime,
        VisibilityType _visibilityType,
        string[] memory _outcomeNames,
        address[] memory _allowedParticipants
    ) Ownable(_creator) {
        marketToken = MarketToken(_marketToken);
        amm = AMM(_amm);
        creator = _creator;
        title = _title;
        description = _description;
        resolutionCriteria = _resolutionCriteria;
        endTime = _endTime;
        visibilityType = _visibilityType;
        state = MarketState.Active;

        // Create outcome share tokens
        for (uint256 i = 0; i < _outcomeNames.length; i++) {
            OutcomeShareToken shareToken = new OutcomeShareToken(
                string(abi.encodePacked(_title, " - ", _outcomeNames[i])),
                string(abi.encodePacked(_title, "-", _outcomeNames[i]))
            );
            outcomes.push(
                Outcome({
                    name: _outcomeNames[i],
                    shareToken: ERC20(address(shareToken)),
                    liquidity: 0,
                    isWinner: false
                })
            );
        }

        // Set allowed participants for Private/Group markets
        if (_visibilityType != VisibilityType.Public) {
            for (uint256 i = 0; i < _allowedParticipants.length; i++) {
                allowedParticipants[_allowedParticipants[i]] = true;
            }
        }

        emit MarketCreated(address(this), _creator, _title, _visibilityType);
    }

    /**
     * @notice Check if user can participate in this market
     */
    function canParticipate(address user) public view returns (bool) {
        if (visibilityType == VisibilityType.Public) {
            return true;
        }
        return allowedParticipants[user];
    }

    /**
     * @notice Buy shares of an outcome
     * @param outcomeIndex Index of the outcome to buy shares for
     * @param tokenAmount Amount of market tokens to spend
     */
    function buyShares(uint256 outcomeIndex, uint256 tokenAmount) external {
        require(state == MarketState.Active, "Market not active");
        require(block.timestamp < endTime, "Market ended");
        require(canParticipate(msg.sender), "Not allowed to participate");
        require(outcomeIndex < outcomes.length, "Invalid outcome");

        // Transfer tokens from user
        marketToken.transferFrom(msg.sender, address(this), tokenAmount);

        // Calculate shares using AMM
        (uint256 shares, uint256 fee) = amm.calculateBuy(
            outcomes[outcomeIndex].liquidity,
            tokenAmount,
            TRADING_FEE_BPS
        );

        // Mint share tokens
        OutcomeShareToken(address(outcomes[outcomeIndex].shareToken)).mint(
            msg.sender,
            shares
        );

        // Update liquidity
        outcomes[outcomeIndex].liquidity += tokenAmount - fee;

        // Distribute fees
        uint256 creatorFee = (fee * CREATOR_FEE_BPS) / TRADING_FEE_BPS;
        uint256 protocolFee = fee - creatorFee;
        marketToken.transfer(creator, creatorFee);
        // Protocol fee stays in contract (treasury)

        hasParticipated[msg.sender] = true;

        emit SharesBought(msg.sender, outcomeIndex, shares, tokenAmount);
    }

    /**
     * @notice Sell shares of an outcome
     * @param outcomeIndex Index of the outcome to sell shares for
     * @param shareAmount Amount of shares to sell
     */
    function sellShares(uint256 outcomeIndex, uint256 shareAmount) external {
        require(state == MarketState.Active, "Market not active");
        require(block.timestamp < endTime, "Market ended");
        require(outcomeIndex < outcomes.length, "Invalid outcome");

        // Burn share tokens
        OutcomeShareToken(address(outcomes[outcomeIndex].shareToken)).burnFrom(
            msg.sender,
            shareAmount
        );

        // Calculate proceeds using AMM
        (uint256 proceeds, uint256 fee) = amm.calculateSell(
            outcomes[outcomeIndex].liquidity,
            shareAmount,
            TRADING_FEE_BPS
        );

        // Update liquidity
        require(
            outcomes[outcomeIndex].liquidity >= proceeds + fee,
            "Insufficient liquidity"
        );
        outcomes[outcomeIndex].liquidity -= (proceeds + fee);

        // Distribute fees
        uint256 creatorFee = (fee * CREATOR_FEE_BPS) / TRADING_FEE_BPS;
        uint256 protocolFee = fee - creatorFee;
        marketToken.transfer(creator, creatorFee);
        // Protocol fee stays in contract

        // Transfer proceeds to user
        marketToken.transfer(msg.sender, proceeds);

        emit SharesSold(msg.sender, outcomeIndex, shareAmount, proceeds);
    }

    /**
     * @notice Get current price and probability for an outcome
     */
    function getOutcomePrice(uint256 outcomeIndex)
        external
        view
        returns (uint256 price, uint256 probability)
    {
        require(outcomeIndex < outcomes.length, "Invalid outcome");
        return amm.getPrice(outcomes[outcomeIndex].liquidity);
    }

    /**
     * @notice Propose winning outcome (only creator, after end time)
     */
    function proposeOutcome(uint256 outcomeIndex) external {
        require(msg.sender == creator, "Only creator");
        require(state == MarketState.Active, "Market not active");
        require(block.timestamp >= endTime, "Market not ended");
        require(outcomeIndex < outcomes.length, "Invalid outcome");

        proposedOutcomeIndex = outcomeIndex;
        state = MarketState.Challenged;
        challengeDeadline = block.timestamp + 7 days; // 7 day challenge window

        emit OutcomeProposed(outcomeIndex, msg.sender);
    }

    /**
     * @notice Challenge proposed outcome
     */
    function challengeOutcome() external {
        require(state == MarketState.Challenged, "Not in challenge");
        require(block.timestamp < challengeDeadline, "Challenge period ended");
        require(hasParticipated[msg.sender], "Must have participated");
        require(!resolutionVotes[msg.sender], "Already voted");

        resolutionVotes[msg.sender] = true;
        voteCount++;

        emit OutcomeChallenged(msg.sender);
    }

    /**
     * @notice Finalize resolution (after challenge period or if no challenge)
     */
    function finalizeResolution() external {
        require(state == MarketState.Challenged, "Not in challenge state");
        require(
            block.timestamp >= challengeDeadline,
            "Challenge period active"
        );

        // If challenged, use majority vote of participants
        // For MVP: if >50% of participants challenge, resolution goes to vote
        // Simplified: if any challenge, creator's proposal stands (can be enhanced)

        outcomes[proposedOutcomeIndex].isWinner = true;
        state = MarketState.Resolved;

        emit OutcomeResolved(proposedOutcomeIndex);
    }

    /**
     * @notice Redeem winning shares 1:1, losing shares 0
     */
    function redeemShares(uint256 outcomeIndex) external {
        require(state == MarketState.Resolved, "Market not resolved");
        require(outcomeIndex < outcomes.length, "Invalid outcome");

        uint256 balance = outcomes[outcomeIndex].shareToken.balanceOf(
            msg.sender
        );
        require(balance > 0, "No shares to redeem");

        // Burn shares
        OutcomeShareToken(address(outcomes[outcomeIndex].shareToken)).burnFrom(
            msg.sender,
            balance
        );

        uint256 payout = 0;
        if (outcomes[outcomeIndex].isWinner) {
            // Winning shares redeem 1:1
            payout = balance;
            marketToken.transfer(msg.sender, payout);
        }
        // Losing shares redeem 0 (already burned)

        emit SharesRedeemed(msg.sender, outcomeIndex, balance, payout);
    }

    /**
     * @notice Seed initial liquidity for market (only creator)
     */
    function seedLiquidity(
        uint256[] memory tokenAmounts,
        uint256[] memory shareAmounts
    ) external {
        require(msg.sender == creator, "Only creator");
        require(state == MarketState.Active, "Market not active");
        require(
            tokenAmounts.length == outcomes.length &&
                shareAmounts.length == outcomes.length,
            "Invalid arrays"
        );

        for (uint256 i = 0; i < outcomes.length; i++) {
            marketToken.transferFrom(msg.sender, address(this), tokenAmounts[i]);
            OutcomeShareToken(address(outcomes[i].shareToken)).mint(
                msg.sender,
                shareAmounts[i]
            );
            outcomes[i].liquidity += tokenAmounts[i];
        }
    }

    function getOutcomesCount() external view returns (uint256) {
        return outcomes.length;
    }
}

/**
 * @title OutcomeShareToken
 * @notice ERC-20 token representing shares in a specific outcome
 */
contract OutcomeShareToken is ERC20, Ownable {
    constructor(string memory name, string memory symbol)
        ERC20(name, symbol)
        Ownable(msg.sender)
    {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burnFrom(address from, uint256 amount) external {
        _burn(from, amount);
    }
}

