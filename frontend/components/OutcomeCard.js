import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function OutcomeCard({ outcome, index, marketAddress, isEnded, onBuy }) {
  const [price, setPrice] = useState(null);
  // Initialize probability to 0 if liquidity is 0 (new polls start at 0%)
  const initialLiquidity = Number(outcome.liquidity || 0);
  const [probability, setProbability] = useState(initialLiquidity === 0 ? 0 : null);

  useEffect(() => {
    fetchPrice();
  }, [outcome.liquidity]);

  const fetchPrice = async () => {
    try {
      if (!window.ethereum) return;
      
      // If liquidity is 0, probability is 0% (new polls start at 0%)
      const outcomeLiquidity = Number(outcome.liquidity || 0);
      if (outcomeLiquidity === 0) {
        setPrice(null);
        setProbability(0);
        return;
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const marketABI = [
        'function getOutcomePrice(uint256) view returns (uint256 price, uint256 probability)'
      ];
      const marketContract = new ethers.Contract(marketAddress, marketABI, provider);
      
      const [priceResult, probabilityResult] = await marketContract.getOutcomePrice(index);
      setPrice(ethers.formatEther(priceResult));
      // If probability is 0 from contract, show 0%
      const probValue = Number(probabilityResult) / 1e18 * 100;
      setProbability(probValue);
    } catch (error) {
      console.error('Error fetching price:', error);
      // On error, if liquidity is 0, show 0%
      const outcomeLiquidity = Number(outcome.liquidity || 0);
      if (outcomeLiquidity === 0) {
        setProbability(0);
      }
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:border-indigo-500 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{outcome.name}</h3>
          {outcome.isWinner && (
            <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
              Winner
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-indigo-600">
            {probability !== null ? `${probability.toFixed(1)}%` : '0%'}
          </div>
          <div className="text-sm text-gray-600">Probability</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-600">Liquidity:</span>
          <span className="ml-2 font-medium">
            {formatTokenAmount(outcome.liquidity)}
          </span>
        </div>
        {price !== null && (
          <div>
            <span className="text-gray-600">Price:</span>
            <span className="ml-2 font-medium">
              {Number(price).toFixed(4)} MKT
            </span>
          </div>
        )}
      </div>

      {!isEnded && (
        <button
          onClick={onBuy}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Buy Shares
        </button>
      )}
    </div>
  );
}

function formatTokenAmount(amount) {
  const num = Number(amount) / 1e18;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(2);
}

