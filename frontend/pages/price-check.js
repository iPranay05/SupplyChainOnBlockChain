import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Search, TrendingUp, TrendingDown, Minus, MapPin, Calendar, Filter, RefreshCw } from 'lucide-react';

export default function PriceCheck() {
  const [prices, setPrices] = useState([]);
  const [filteredPrices, setFilteredPrices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedState, setSelectedState] = useState('all');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Government price data (MSP and market rates)
  const governmentPrices = [
    // Vegetables
    { id: 1, name: 'Tomato', category: 'vegetables', unit: 'kg', minPrice: 15, maxPrice: 35, avgPrice: 25, msp: 20, state: 'Maharashtra', market: 'Mumbai', trend: 'up', change: 5.2 },
    { id: 2, name: 'Onion', category: 'vegetables', unit: 'kg', minPrice: 20, maxPrice: 45, avgPrice: 32, msp: 25, state: 'Maharashtra', market: 'Pune', trend: 'down', change: -3.1 },
    { id: 3, name: 'Potato', category: 'vegetables', unit: 'kg', minPrice: 18, maxPrice: 28, avgPrice: 23, msp: 20, state: 'Uttar Pradesh', market: 'Agra', trend: 'stable', change: 0.5 },
    { id: 4, name: 'Cabbage', category: 'vegetables', unit: 'kg', minPrice: 12, maxPrice: 22, avgPrice: 17, msp: 15, state: 'Karnataka', market: 'Bangalore', trend: 'up', change: 2.8 },
    { id: 5, name: 'Cauliflower', category: 'vegetables', unit: 'kg', minPrice: 16, maxPrice: 30, avgPrice: 23, msp: 18, state: 'Punjab', market: 'Ludhiana', trend: 'up', change: 4.2 },
    { id: 6, name: 'Carrot', category: 'vegetables', unit: 'kg', minPrice: 25, maxPrice: 40, avgPrice: 32, msp: 28, state: 'Haryana', market: 'Karnal', trend: 'stable', change: 1.1 },
    { id: 7, name: 'Brinjal', category: 'vegetables', unit: 'kg', minPrice: 20, maxPrice: 35, avgPrice: 27, msp: 22, state: 'Andhra Pradesh', market: 'Hyderabad', trend: 'down', change: -2.5 },
    { id: 8, name: 'Okra (Bhindi)', category: 'vegetables', unit: 'kg', minPrice: 30, maxPrice: 50, avgPrice: 40, msp: 35, state: 'Gujarat', market: 'Ahmedabad', trend: 'up', change: 6.7 },
    { id: 9, name: 'Green Peas', category: 'vegetables', unit: 'kg', minPrice: 40, maxPrice: 70, avgPrice: 55, msp: 45, state: 'Uttar Pradesh', market: 'Kanpur', trend: 'up', change: 8.3 },
    { id: 10, name: 'Spinach', category: 'vegetables', unit: 'kg', minPrice: 15, maxPrice: 25, avgPrice: 20, msp: 18, state: 'West Bengal', market: 'Kolkata', trend: 'stable', change: 0.8 },
    
    // Fruits
    { id: 11, name: 'Apple', category: 'fruits', unit: 'kg', minPrice: 80, maxPrice: 150, avgPrice: 115, msp: 90, state: 'Himachal Pradesh', market: 'Shimla', trend: 'up', change: 3.5 },
    { id: 12, name: 'Banana', category: 'fruits', unit: 'dozen', minPrice: 30, maxPrice: 50, avgPrice: 40, msp: 35, state: 'Tamil Nadu', market: 'Chennai', trend: 'stable', change: 1.2 },
    { id: 13, name: 'Orange', category: 'fruits', unit: 'kg', minPrice: 40, maxPrice: 70, avgPrice: 55, msp: 45, state: 'Maharashtra', market: 'Nagpur', trend: 'down', change: -2.8 },
    { id: 14, name: 'Mango', category: 'fruits', unit: 'kg', minPrice: 60, maxPrice: 120, avgPrice: 90, msp: 70, state: 'Uttar Pradesh', market: 'Lucknow', trend: 'up', change: 5.1 },
    { id: 15, name: 'Grapes', category: 'fruits', unit: 'kg', minPrice: 50, maxPrice: 90, avgPrice: 70, msp: 55, state: 'Maharashtra', market: 'Nashik', trend: 'stable', change: 0.9 },
    { id: 16, name: 'Pomegranate', category: 'fruits', unit: 'kg', minPrice: 80, maxPrice: 150, avgPrice: 115, msp: 90, state: 'Karnataka', market: 'Bangalore', trend: 'up', change: 4.7 },
    { id: 17, name: 'Papaya', category: 'fruits', unit: 'kg', minPrice: 25, maxPrice: 45, avgPrice: 35, msp: 30, state: 'Andhra Pradesh', market: 'Vijayawada', trend: 'down', change: -1.8 },
    { id: 18, name: 'Watermelon', category: 'fruits', unit: 'kg', minPrice: 15, maxPrice: 30, avgPrice: 22, msp: 18, state: 'Rajasthan', market: 'Jaipur', trend: 'up', change: 3.2 },
    
    // Grains
    { id: 19, name: 'Rice (Basmati)', category: 'grains', unit: 'kg', minPrice: 45, maxPrice: 80, avgPrice: 62, msp: 50, state: 'Punjab', market: 'Amritsar', trend: 'stable', change: 1.5 },
    { id: 20, name: 'Wheat', category: 'grains', unit: 'kg', minPrice: 25, maxPrice: 35, avgPrice: 30, msp: 27, state: 'Madhya Pradesh', market: 'Indore', trend: 'up', change: 2.1 },
    { id: 21, name: 'Maize (Corn)', category: 'grains', unit: 'kg', minPrice: 18, maxPrice: 28, avgPrice: 23, msp: 20, state: 'Karnataka', market: 'Mysore', trend: 'stable', change: 0.7 },
    { id: 22, name: 'Bajra (Pearl Millet)', category: 'grains', unit: 'kg', minPrice: 22, maxPrice: 32, avgPrice: 27, msp: 24, state: 'Rajasthan', market: 'Jodhpur', trend: 'up', change: 3.8 },
    
    // Pulses
    { id: 23, name: 'Arhar (Tur Dal)', category: 'pulses', unit: 'kg', minPrice: 80, maxPrice: 120, avgPrice: 100, msp: 85, state: 'Maharashtra', market: 'Latur', trend: 'down', change: -2.3 },
    { id: 24, name: 'Moong Dal', category: 'pulses', unit: 'kg', minPrice: 70, maxPrice: 110, avgPrice: 90, msp: 75, state: 'Rajasthan', market: 'Kota', trend: 'stable', change: 1.4 },
    { id: 25, name: 'Chana (Chickpea)', category: 'pulses', unit: 'kg', minPrice: 50, maxPrice: 80, avgPrice: 65, msp: 55, state: 'Madhya Pradesh', market: 'Bhopal', trend: 'up', change: 4.1 },
    { id: 26, name: 'Masoor (Lentil)', category: 'pulses', unit: 'kg', minPrice: 60, maxPrice: 90, avgPrice: 75, msp: 65, state: 'Uttar Pradesh', market: 'Varanasi', trend: 'stable', change: 0.6 }
  ];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'vegetables', label: 'Vegetables' },
    { value: 'fruits', label: 'Fruits' },
    { value: 'grains', label: 'Grains' },
    { value: 'pulses', label: 'Pulses' }
  ];

  const states = [
    { value: 'all', label: 'All States' },
    { value: 'Maharashtra', label: 'Maharashtra' },
    { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
    { value: 'Karnataka', label: 'Karnataka' },
    { value: 'Punjab', label: 'Punjab' },
    { value: 'Haryana', label: 'Haryana' },
    { value: 'Gujarat', label: 'Gujarat' },
    { value: 'Rajasthan', label: 'Rajasthan' },
    { value: 'Tamil Nadu', label: 'Tamil Nadu' },
    { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
    { value: 'West Bengal', label: 'West Bengal' },
    { value: 'Himachal Pradesh', label: 'Himachal Pradesh' },
    { value: 'Madhya Pradesh', label: 'Madhya Pradesh' }
  ];

  useEffect(() => {
    // Simulate loading government data
    setLoading(true);
    setTimeout(() => {
      setPrices(governmentPrices);
      setFilteredPrices(governmentPrices);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = prices;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(price =>
        price.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(price => price.category === selectedCategory);
    }

    // Filter by state
    if (selectedState !== 'all') {
      filtered = filtered.filter(price => price.state === selectedState);
    }

    setFilteredPrices(filtered);
  }, [searchTerm, selectedCategory, selectedState, prices]);

  const refreshPrices = () => {
    setLoading(true);
    setLastUpdated(new Date());
    setTimeout(() => {
      // Simulate price updates with small random changes
      const updatedPrices = governmentPrices.map(price => ({
        ...price,
        avgPrice: price.avgPrice + (Math.random() - 0.5) * 2,
        change: (Math.random() - 0.5) * 10
      }));
      setPrices(updatedPrices);
      setLoading(false);
    }, 1000);
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      vegetables: 'bg-green-100 text-green-800',
      fruits: 'bg-orange-100 text-orange-800',
      grains: 'bg-yellow-100 text-yellow-800',
      pulses: 'bg-purple-100 text-purple-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Government Price Check
            </h1>
            <p className="text-gray-600">
              Check current market prices and MSP (Minimum Support Price) for agricultural products
            </p>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4 mr-1" />
              Last updated: {lastUpdated.toLocaleString()}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search crops..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 input-field"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-10 input-field"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* State Filter */}
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="pl-10 input-field"
                >
                  {states.map(state => (
                    <option key={state.value} value={state.value}>
                      {state.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Refresh Button */}
              <button
                onClick={refreshPrices}
                disabled={loading}
                className="btn-primary flex items-center justify-center"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Price Cards */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading government price data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrices.map((price) => (
                <div key={price.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {price.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(price.category)}`}>
                        {price.category.charAt(0).toUpperCase() + price.category.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      {getTrendIcon(price.trend)}
                      <span className={`ml-1 text-sm font-medium ${getTrendColor(price.trend)}`}>
                        {price.change > 0 ? '+' : ''}{price.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Current Market Price */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm text-blue-600 font-medium mb-1">Current Market Price</div>
                      <div className="text-2xl font-bold text-blue-900">
                        ₹{price.avgPrice.toFixed(0)} <span className="text-sm font-normal">/{price.unit}</span>
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Range: ₹{price.minPrice} - ₹{price.maxPrice}
                      </div>
                    </div>

                    {/* MSP */}
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-sm text-green-600 font-medium mb-1">MSP (Govt. Support Price)</div>
                      <div className="text-xl font-bold text-green-900">
                        ₹{price.msp} <span className="text-sm font-normal">/{price.unit}</span>
                      </div>
                    </div>

                    {/* Market Info */}
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{price.market}, {price.state}</span>
                    </div>

                    {/* Price Comparison */}
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">vs MSP:</span>
                        <span className={price.avgPrice > price.msp ? 'text-green-600' : 'text-red-600'}>
                          {price.avgPrice > price.msp ? '+' : ''}
                          ₹{(price.avgPrice - price.msp).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredPrices.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-600">No crops found matching your criteria.</p>
            </div>
          )}

          {/* Information Panel */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">About Government Prices</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">MSP (Minimum Support Price)</h4>
                <p>Government guaranteed minimum price to protect farmers from price fluctuations.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Market Price</h4>
                <p>Current trading price in major agricultural markets (mandis) across India.</p>
              </div>
            </div>
            <div className="mt-4 text-xs text-blue-600">
              * Prices are indicative and may vary by location and quality. Always verify with local markets.
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
