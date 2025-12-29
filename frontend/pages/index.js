import { useState, useEffect } from 'react';
import { useAccount, useConnect } from 'wagmi';
import axios from 'axios';
import Link from 'next/link';
import MarketCard from '../components/MarketCard';
import CreateMarketModal from '../components/CreateMarketModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [markets, setMarkets] = useState([]);
  const [allMarkets, setAllMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('Trending');
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMarkets(); // This will use the current activeTab value
  }, [activeTab]);

  useEffect(() => {
    filterAndSortMarkets();
  }, [activeTab, activeCategory, searchQuery, allMarkets]);

  const fetchMarkets = async (tab = null) => {
    try {
      setLoading(true);
      const currentTab = tab || activeTab;
      let sortParam = '';
      if (currentTab === 'Trending') {
        sortParam = '&sort=trending';
      }
      
      const response = await axios.get(`${API_URL}/api/markets?visibility=Public${sortParam}`);
      console.log(`📥 Fetched ${response.data.length} markets for tab: "${currentTab}"`, {
        sortParam,
        url: `${API_URL}/api/markets?visibility=Public${sortParam}`,
        markets: response.data.map(m => ({
          title: m.title,
          createdAt: m.created_at || m.createdAt,
          visibilityType: m.visibilityType,
          address: m.address
        })).slice(0, 5) // Show first 5 for debugging
      });
      setAllMarkets(response.data);
      setMarkets(response.data);
    } catch (error) {
      console.error('Error fetching markets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortMarkets = () => {
    let filtered = [...allMarkets];

    // Filter by category if selected
    if (activeCategory) {
      // This would need category data from the backend
      // For now, we'll skip category filtering
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        market =>
          market.title?.toLowerCase().includes(query) ||
          market.description?.toLowerCase().includes(query)
      );
    }

    // Sort by tab selection (already handled by backend, but client-side as backup)
    if (activeTab === 'Trending') {
      // Sort by volume or engagement (trending)
      filtered.sort((a, b) => {
        const volumeA = Number(a.totalVolume || 0);
        const volumeB = Number(b.totalVolume || 0);
        if (volumeB !== volumeA) {
          return volumeB - volumeA; // Highest volume first
        }
        // If volumes are equal, sort by date
        const dateA = new Date(a.createdAt || a.created_at || 0);
        const dateB = new Date(b.createdAt || b.created_at || 0);
        return dateB - dateA;
      });
    } else if (activeTab === 'New') {
      // Similar to Recently Added
      filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || 0);
        const dateB = new Date(b.createdAt || b.created_at || 0);
        return dateB - dateA;
      });
    }

    setMarkets(filtered);
  };

  const categories = [
    { name: 'Weather', emoji: '🌧️' },
    { name: 'Work', emoji: '💼' },
    { name: 'Social', emoji: '🎉' },
    { name: 'Food', emoji: '🍔' },
    { name: 'Transport', emoji: '🚇' },
    { name: 'Roommates', emoji: '🏠' },
    { name: 'Events', emoji: '🎉' },
    { name: 'Habits', emoji: '💪' },
    { name: 'Shopping', emoji: '🛒' },
    { name: 'Entertainment', emoji: '🎬' },
    { name: 'Health', emoji: '💪' },
    { name: 'Plans', emoji: '✈️' }
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Header */}
      <header className="bg-[#161b22] border-b border-[#30363d] sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <h1 className="text-xl font-bold">
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
                    P<span className="font-semibold">oll</span><span className="font-bold">i</span>T
                  </span>
                </h1>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-[#8b949e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="search polls"
                  className="block w-full pl-10 pr-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white placeholder-[#8b949e] focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <div className="h-6 w-px bg-[#30363d]"></div>
              <a href="#" className="text-sm text-purple-400 hover:text-purple-300">How it works</a>
              {isConnected && (
                <span className="text-sm text-[#8b949e]">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              )}
              <button
                onClick={() => {
                  if (!isConnected) {
                    connect({ connector: connectors[0] });
                  } else {
                    setShowCreateModal(true);
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Create Market
              </button>
              <button className="p-2 hover:bg-[#21262d] rounded-lg">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Navigation */}
      <nav className="bg-[#161b22] border-b border-[#30363d] sticky top-16 z-40">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-12 overflow-x-auto scrollbar-hide">
            {/* Tab Navigation */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setActiveTab('Trending')}
                className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'Trending' 
                    ? 'text-white border-b-2 border-purple-500' 
                    : 'text-[#8b949e] hover:text-white'
                }`}
              >
                <span>📈</span>
                <span>Trending</span>
              </button>
              <button
                onClick={() => setActiveTab('New')}
                className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'New' 
                    ? 'text-white border-b-2 border-purple-500' 
                    : 'text-[#8b949e] hover:text-white'
                }`}
              >
                <span>🔥</span>
                <span>New</span>
              </button>
            </div>
            
            {/* Subtle Divider */}
            <div className="h-6 w-px bg-[#21262d] flex-shrink-0"></div>
            
            {/* Category Filters */}
            <div className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-hide flex-nowrap">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(isActive ? null : cat.name)}
                    className={`px-3 py-1.5 text-sm flex items-center gap-1.5 rounded-md transition-all flex-shrink-0 ${
                      isActive
                        ? 'text-white bg-[#21262d] border border-[#30363d]' 
                        : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
                    }`}
                    style={{ 
                      display: 'flex',
                      flexWrap: 'nowrap',
                      whiteSpace: 'nowrap',
                      wordBreak: 'keep-all',
                      overflow: 'visible'
                    }}
                  >
                    <span className="text-base leading-none flex-shrink-0" style={{ display: 'inline-block' }}>{cat.emoji}</span>
                    <span className="whitespace-nowrap" style={{ display: 'inline-block', wordBreak: 'keep-all' }}>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-[#8b949e]">Loading markets...</p>
          </div>
        ) : markets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#8b949e]">No markets found. Create the first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {markets.map((market) => (
              <Link key={market.address} href={`/market/${market.address}`}>
                <MarketCard market={market} />
              </Link>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <CreateMarketModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={async () => {
            console.log('🎉 Market created successfully! Switching to New tab...');
            setShowCreateModal(false);
            
            // Switch to New tab first to show the new market
            setActiveTab('New');
            
            // Wait a bit for backend indexing to complete and state to update
            console.log('⏳ Waiting for market to be indexed and appear...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Force refetch with the correct tab to ensure we get the latest markets
            console.log('📥 Refetching markets for New tab...');
            await fetchMarkets('New');
            
            console.log('✅ Done! Your new poll should now appear in the New section.');
          }}
        />
      )}
    </div>
  );
}


