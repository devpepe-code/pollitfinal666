import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import axios from 'axios';
import OutcomeCard from '../../components/OutcomeCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function MarketPage() {
  const router = useRouter();
  const { address: userAddress, isConnected } = useAccount();
  const { address: marketAddress } = router.query;
  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buyAmount, setBuyAmount] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState(null);

  useEffect(() => {
    if (marketAddress) {
      fetchMarket();
    }
  }, [marketAddress]);

  const fetchMarket = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/markets/${marketAddress}`);
      setMarket(response.data);
    } catch (error) {
      console.error('Error fetching market:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyShares = async (outcomeIndex) => {
    if (!isConnected || !buyAmount) return;

    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const marketABI = [
        'function buyShares(uint256, uint256)',
        'function marketToken() view returns (address)',
        'function approve(address, uint256)'
      ];
      
      const marketContract = new ethers.Contract(marketAddress, marketABI, signer);
      const tokenAddress = await marketContract.marketToken();
      
      const tokenABI = ['function approve(address, uint256)'];
      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
      
      const amount = ethers.parseEther(buyAmount);
      await tokenContract.approve(marketAddress, amount);
      await marketContract.buyShares(outcomeIndex, amount);
      
      setBuyAmount('');
      fetchMarket();
    } catch (error) {
      console.error('Error buying shares:', error);
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading market...</p>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Market not found</p>
      </div>
    );
  }

  const endTime = new Date(Number(market.endTime) * 1000);
  const isEnded = Date.now() > endTime.getTime();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="mb-6 text-indigo-600 hover:text-indigo-700"
        >
          ← Back
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{market.title}</h1>
          <p className="text-gray-700 mb-4">{market.description}</p>
          
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-2">Resolution Criteria</h3>
            <p className="text-gray-600">{market.resolutionCriteria}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <span className="text-sm text-gray-600">End Time</span>
              <p className="font-medium">{endTime.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Status</span>
              <p className={`font-medium ${
                market.state === 'Active' ? 'text-green-600' :
                market.state === 'Resolved' ? 'text-blue-600' :
                'text-yellow-600'
              }`}>
                {market.state}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Outcomes</h2>
          
          {market.Outcomes && market.Outcomes.length > 0 ? (
            <div className="space-y-4">
              {market.Outcomes.map((outcome, index) => (
                <OutcomeCard
                  key={index}
                  outcome={outcome}
                  index={index}
                  marketAddress={marketAddress}
                  isEnded={isEnded}
                  onBuy={() => setSelectedOutcome(index)}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No outcomes found</p>
          )}

          {selectedOutcome !== null && isConnected && !isEnded && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Buy Shares</h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  placeholder="Amount (MKT)"
                  className="flex-1 px-3 py-2 border rounded-lg"
                  step="0.01"
                  min="0"
                />
                <button
                  onClick={() => handleBuyShares(selectedOutcome)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Buy
                </button>
                <button
                  onClick={() => {
                    setSelectedOutcome(null);
                    setBuyAmount('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!isConnected && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">Connect your wallet to participate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

