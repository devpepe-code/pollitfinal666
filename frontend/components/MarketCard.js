export default function MarketCard({ market }) {
  const endTime = new Date(Number(market.endTime) * 1000);
  const isEnded = Date.now() > endTime.getTime();
  const isLive = market.state === 'Active' && !isEnded;
  const outcomes = market.Outcomes || [];
  const firstTwoOutcomes = outcomes.slice(0, 2);

  // Calculate probabilities if we have liquidity data
  // Returns 0 if no liquidity (new polls start at 0%)
  const calculateProbability = (outcome) => {
    const outcomeLiquidity = Number(outcome.liquidity || 0);
    const totalLiquidity = outcomes.reduce((sum, o) => sum + Number(o.liquidity || 0), 0);
    
    // If no liquidity at all, return 0 (not null)
    if (totalLiquidity === 0) return 0;
    
    // If this outcome has no liquidity, return 0
    if (outcomeLiquidity === 0) return 0;
    
    // Calculate percentage based on liquidity
    return Math.round((outcomeLiquidity / totalLiquidity) * 100);
  };

  // Get emoji based on market title
  const getMarketEmoji = (title) => {
    if (!title) return '📊';
    const lowerTitle = title.toLowerCase();
    
    // Weather
    if (lowerTitle.includes('rain') || lowerTitle.includes('weather') || lowerTitle.includes('sun') || lowerTitle.includes('cloud')) return '🌧️';
    
    // Time/Meeting/Late
    if (lowerTitle.includes('late') || lowerTitle.includes('meeting') || lowerTitle.includes('time') || lowerTitle.includes('on time')) return '⏰';
    
    // Coffee
    if (lowerTitle.includes('coffee') || lowerTitle.includes('cafe')) return '☕';
    
    // Dishes/Food
    if (lowerTitle.includes('dish') || lowerTitle.includes('dishes') || lowerTitle.includes('cook') || lowerTitle.includes('meal')) return '🍽️';
    
    // Work/Office
    if (lowerTitle.includes('work') || lowerTitle.includes('office') || lowerTitle.includes('job')) return '💼';
    
    // Transport
    if (lowerTitle.includes('train') || lowerTitle.includes('bus') || lowerTitle.includes('traffic') || lowerTitle.includes('commute')) return '🚇';
    
    // Shopping
    if (lowerTitle.includes('shop') || lowerTitle.includes('buy') || lowerTitle.includes('store')) return '🛒';
    
    // Social/Party/Event
    if (lowerTitle.includes('party') || lowerTitle.includes('event') || lowerTitle.includes('social')) return '🎉';
    
    // Exercise/Fitness
    if (lowerTitle.includes('gym') || lowerTitle.includes('workout') || lowerTitle.includes('exercise')) return '💪';
    
    // Sleep
    if (lowerTitle.includes('sleep') || lowerTitle.includes('wake') || lowerTitle.includes('bed')) return '😴';
    
    // Default
    return '📊';
  };

  const marketEmoji = getMarketEmoji(market.title);

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 hover:border-[#484f58] transition-colors cursor-pointer relative">
      {/* Header with avatar and bookmark */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg">
            {marketEmoji}
          </div>
          <h3 className="text-sm font-medium text-white line-clamp-2 leading-snug">
            {market.title}
          </h3>
        </div>
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="p-1 hover:bg-[#21262d] rounded-lg flex-shrink-0"
        >
          <svg className="h-4 w-4 text-[#8b949e] hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {/* Outcomes */}
      {firstTwoOutcomes.length > 0 && (
        <div className="space-y-2 mb-3">
          {firstTwoOutcomes.map((outcome, idx) => {
            const probability = calculateProbability(outcome);
            return (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-xs text-[#8b949e] flex-1 truncate mr-2">
                  {outcome.name}
                </span>
                <span className="text-xs font-medium text-white min-w-[2.5rem] text-right">
                  {probability}%
                </span>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="px-2 py-0.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded font-medium"
                  >
                    Yes
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-medium"
                  >
                    No
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Volume and Status */}
      <div className="flex items-center justify-between pt-3 border-t border-[#30363d]">
        <div className="flex items-center gap-2">
          {isLive && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-red-500 font-medium">LIVE</span>
            </div>
          )}
          {market.totalVolume > 0 && (
            <span className="text-xs text-[#8b949e]">
              ${formatVolume(market.totalVolume)} Vol.
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="p-1 hover:bg-[#21262d] rounded"
        >
          <svg className="h-4 w-4 text-[#8b949e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function formatVolume(amount) {
  const num = Number(amount) / 1e18;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}m`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toFixed(0);
}


