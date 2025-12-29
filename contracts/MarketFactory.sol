// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Market.sol";
import "./MarketToken.sol";
import "./AMM.sol";

/**
 * @title MarketFactory
 * @notice Factory contract for creating new prediction markets
 */
contract MarketFactory {
    MarketToken public immutable marketToken;
    AMM public immutable amm;

    Market[] public markets;
    mapping(address => Market[]) public creatorMarkets;
    mapping(address => bool) public isMarket;

    event MarketCreated(
        address indexed market,
        address indexed creator,
        string title,
        Market.VisibilityType visibilityType
    );

    constructor(address _marketToken, address _amm) {
        marketToken = MarketToken(_marketToken);
        amm = AMM(_amm);
    }

    /**
     * @notice Create a new prediction market
     * @param _title Market title
     * @param _description Market description
     * @param _resolutionCriteria Explicit resolution criteria
     * @param _endTime Fixed end time (timestamp)
     * @param _visibilityType Public, Private, or Group
     * @param _outcomeNames Array of outcome names (2-N outcomes)
     * @param _allowedParticipants Array of allowed participant addresses (for Private/Group)
     */
    function createMarket(
        string memory _title,
        string memory _description,
        string memory _resolutionCriteria,
        uint256 _endTime,
        Market.VisibilityType _visibilityType,
        string[] memory _outcomeNames,
        address[] memory _allowedParticipants
    ) external returns (address) {
        require(_outcomeNames.length >= 2, "Need at least 2 outcomes");
        require(_endTime > block.timestamp, "End time must be in future");
        require(
            _visibilityType == Market.VisibilityType.Public ||
                _allowedParticipants.length > 0,
            "Private/Group markets need participants"
        );

        Market newMarket = new Market(
            address(marketToken),
            address(amm),
            msg.sender,
            _title,
            _description,
            _resolutionCriteria,
            _endTime,
            _visibilityType,
            _outcomeNames,
            _allowedParticipants
        );

        markets.push(newMarket);
        creatorMarkets[msg.sender].push(newMarket);
        isMarket[address(newMarket)] = true;

        emit MarketCreated(
            address(newMarket),
            msg.sender,
            _title,
            _visibilityType
        );

        return address(newMarket);
    }

    /**
     * @notice Get all markets (for indexing)
     */
    function getAllMarkets() external view returns (address[] memory) {
        address[] memory marketAddresses = new address[](markets.length);
        for (uint256 i = 0; i < markets.length; i++) {
            marketAddresses[i] = address(markets[i]);
        }
        return marketAddresses;
    }

    /**
     * @notice Get markets created by a specific user
     */
    function getMarketsByCreator(address creator)
        external
        view
        returns (address[] memory)
    {
        Market[] memory userMarkets = creatorMarkets[creator];
        address[] memory marketAddresses = new address[](userMarkets.length);
        for (uint256 i = 0; i < userMarkets.length; i++) {
            marketAddresses[i] = address(userMarkets[i]);
        }
        return marketAddresses;
    }

    /**
     * @notice Get total number of markets
     */
    function getMarketCount() external view returns (uint256) {
        return markets.length;
    }
}

