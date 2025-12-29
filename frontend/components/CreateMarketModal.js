import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const MARKET_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS;

export default function CreateMarketModal({ onClose, onSuccess }) {
  const { address } = useAccount();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resolutionCriteria: ['', ''],
    endTime: '',
    visibilityType: 'Public',
    outcomes: ['', ''],
    allowedParticipants: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addOutcome = () => {
    setFormData({
      ...formData,
      outcomes: [...formData.outcomes, '']
    });
  };

  const removeOutcome = (index) => {
    if (formData.outcomes.length > 2) {
      setFormData({
        ...formData,
        outcomes: formData.outcomes.filter((_, i) => i !== index)
      });
    }
  };

  const updateOutcome = (index, value) => {
    const newOutcomes = [...formData.outcomes];
    newOutcomes[index] = value;
    setFormData({ ...formData, outcomes: newOutcomes });
  };

  const addResolutionCriteria = () => {
    if (formData.resolutionCriteria.length >= 99) {
      alert('Maximum of 99 resolution options allowed.');
      return;
    }
    setFormData({
      ...formData,
      resolutionCriteria: [...formData.resolutionCriteria, '']
    });
  };

  const removeResolutionCriteria = (index) => {
    if (formData.resolutionCriteria.length > 2) {
      setFormData({
        ...formData,
        resolutionCriteria: formData.resolutionCriteria.filter((_, i) => i !== index)
      });
    }
  };

  const updateResolutionCriteria = (index, value) => {
    const newCriteria = [...formData.resolutionCriteria];
    newCriteria[index] = value;
    setFormData({ ...formData, resolutionCriteria: newCriteria });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // In production, import ABI from contract artifacts
      const factoryABI = [
        'function createMarket(string, string, string, uint256, uint8, string[], address[]) returns (address)',
        'event MarketCreated(address indexed market, address indexed creator, string title, uint8 visibilityType)'
      ];
      
      const factory = new ethers.Contract(
        MARKET_FACTORY_ADDRESS,
        factoryABI,
        signer
      );

      const endTime = Math.floor(new Date(formData.endTime).getTime() / 1000);
      const visibilityType = ['Public', 'Private', 'Group'].indexOf(formData.visibilityType);
      
      // Use resolution criteria as outcomes (each criterion is an outcome you can bet on)
      const validResolutionCriteria = formData.resolutionCriteria.filter(c => c.trim() !== '');
      if (validResolutionCriteria.length < 2) {
        throw new Error('Need at least 2 resolution criteria options');
      }

      // Use resolution criteria as outcomes
      const validOutcomes = validResolutionCriteria;

      // Combine resolution criteria into a single string for the contract
      const resolutionCriteriaString = validResolutionCriteria.join(' | ');
      
      console.log('📝 Creating market with:', {
        title: formData.title,
        resolutionCriteria: resolutionCriteriaString,
        outcomes: validOutcomes,
        visibilityType: formData.visibilityType
      });

      const tx = await factory.createMarket(
        formData.title,
        formData.description,
        resolutionCriteriaString,
        endTime,
        visibilityType,
        validOutcomes,
        formData.allowedParticipants
      );

      const receipt = await tx.wait();
      console.log('Transaction receipt:', receipt);
      
      // Extract market address from event
      let marketAddress = null;
      
      // Try to find MarketCreated event - check multiple parsing methods
      for (const log of receipt.logs) {
        try {
          const parsed = factory.interface.parseLog(log);
          if (parsed && parsed.name === 'MarketCreated') {
            // Try different possible argument names/indices
            marketAddress = parsed.args.market || parsed.args[0] || parsed.args.marketAddress;
            if (marketAddress) {
              marketAddress = ethers.getAddress(marketAddress); // Normalize address
              console.log('✅ Found MarketCreated event via parseLog, market address:', marketAddress);
              break;
            }
          }
        } catch (e) {
          // Try parsing with different methods - event might not match ABI exactly
        }
      }
      
      // If not found via parseLog, try topic-based extraction
      if (!marketAddress) {
        try {
          const MarketCreatedEvent = factory.interface.getEvent('MarketCreated');
          const eventTopic = MarketCreatedEvent.topicHash;
          
          for (const log of receipt.logs) {
            if (log.topics && log.topics.length > 0 && log.topics[0] === eventTopic) {
              // First indexed parameter is market address (topics[1])
              if (log.topics[1]) {
                marketAddress = ethers.getAddress('0x' + log.topics[1].slice(-40));
                console.log('✅ Found MarketCreated event via topics, market address:', marketAddress);
                break;
              }
            }
          }
        } catch (e) {
          console.warn('Could not parse event via topics:', e);
        }
      }

      if (!marketAddress) {
        console.error('Could not find market address in transaction logs. Logs:', receipt.logs);
        throw new Error('Market created but address could not be extracted from transaction logs');
      }

      if (marketAddress) {
        console.log('📝 Indexing market at address:', marketAddress);
        
        // Index market in backend
        try {
          const indexResponse = await axios.post(`${API_URL}/api/markets/index/${marketAddress}`);
          console.log('✅ Market indexed successfully:', indexResponse.data);
          
          // Verify the market was indexed correctly
          if (indexResponse.data && indexResponse.data.market) {
            const indexedMarket = indexResponse.data.market;
            console.log('📊 Indexed market details:', {
              address: indexedMarket.address,
              title: indexedMarket.title,
              visibilityType: indexedMarket.visibilityType || indexedMarket.visibility_type,
              createdAt: indexedMarket.created_at || indexedMarket.createdAt
            });
          }
        } catch (indexError) {
          console.error('❌ Error indexing market:', indexError.response?.data || indexError.message);
          // Don't throw - market is created on chain, we can still proceed
        }
        
        // Wait longer to ensure database is fully updated
        console.log('⏳ Waiting for database to update...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('✅ Market creation and indexing completed successfully!');
        // Close modal and trigger success callback
        onSuccess();
      } else {
        throw new Error('Market created but address not found in transaction logs');
      }
    } catch (err) {
      console.error('❌ Error creating market:', err);
      setError(err.message || 'Failed to create market. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Create Market</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Who will win the match?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resolution Criteria * (up to 99 options)
                  </label>
                  <div className="space-y-2">
                    {formData.resolutionCriteria.map((criteria, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={criteria}
                          onChange={(e) => updateResolutionCriteria(index, e.target.value)}
                          className="flex-1 px-3 py-2 border rounded-lg"
                          placeholder={`Resolution option ${index + 1}`}
                        />
                        {formData.resolutionCriteria.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeResolutionCriteria(index)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addResolutionCriteria}
                    disabled={formData.resolutionCriteria.length >= 99}
                    className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + Add Resolution Option
                  </button>
                  <p className="mt-2 text-sm text-gray-500">
                    {formData.resolutionCriteria.length} resolution option{formData.resolutionCriteria.length !== 1 ? 's' : ''} added
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Short description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="2"
                    placeholder="Describe the market..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      required
                      value={formData.endTime}
                      onChange={(e) => {
                        console.log('End time changed:', e.target.value);
                        setFormData({ ...formData, endTime: e.target.value });
                      }}
                      onFocus={(e) => {
                        // Try to open picker on focus (modern browsers)
                        if (e.target.showPicker) {
                          try {
                            e.target.showPicker();
                          } catch (err) {
                            console.log('showPicker not supported or failed');
                          }
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      min={new Date().toISOString().slice(0, 16)}
                      step="60"
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                  {formData.endTime && (
                    <p className="mt-1 text-sm text-gray-500">
                      Selected: {new Date(formData.endTime).toLocaleString()}
                    </p>
                  )}
                  {!formData.endTime && (
                    <p className="mt-1 text-xs text-gray-400">
                      Click the input field or calendar icon to select date and time
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Next: Visibility
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visibility Type *
                  </label>
                  <select
                    value={formData.visibilityType}
                    onChange={(e) => setFormData({ ...formData, visibilityType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Public">Public - Discoverable by all</option>
                    <option value="Private">Private - Invite link only</option>
                    <option value="Group">Group - Friends/Group only</option>
                  </select>
                  <p className="mt-2 text-sm text-gray-500">
                    {formData.visibilityType === 'Public' && 'Anyone can discover and participate'}
                    {formData.visibilityType === 'Private' && 'Only invited participants can access'}
                    {formData.visibilityType === 'Group' && 'Only group members can participate'}
                  </p>
                </div>

                {(formData.visibilityType === 'Private' || formData.visibilityType === 'Group') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Allowed Participants (comma-separated addresses)
                    </label>
                    <textarea
                      value={formData.allowedParticipants.join(', ')}
                      onChange={(e) => {
                        const addresses = e.target.value
                          .split(',')
                          .map(a => a.trim())
                          .filter(a => a.length > 0);
                        setFormData({ ...formData, allowedParticipants: addresses });
                      }}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows="3"
                      placeholder="0x1234..., 0x5678..."
                    />
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Market'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}


