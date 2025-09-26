import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { Search, MapPin, Calendar, User, Truck, Eye, QrCode } from 'lucide-react';
import { apiCall } from '../utils/api';

export default function TraceProducts() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('agriTrace_user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 3) {
        router.push('/universal-dashboard');
        return;
      }
      setUser(parsedUser);
    } else {
      router.push('/simple-login');
    }
  }, [router]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await apiCall(`/api/products?search=${encodeURIComponent(searchQuery)}`);
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewSupplyChain = async (productId) => {
    try {
      const response = await apiCall(`/api/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedProduct(data);
      }
    } catch (error) {
      console.error('Error loading product details:', error);
    }
  };

  const getSupplyChainSteps = (product) => {
    const steps = [
      {
        step: 1,
        title: 'Farm Stage',
        icon: '🌾',
        location: product.farm_location,
        date: product.created_at,
        actor: 'Farmer',
        details: `Harvested ${product.quantity}kg of ${product.name} (${product.variety})`
      }
    ];

    if (product.transactions) {
      product.transactions.forEach((tx, index) => {
        steps.push({
          step: index + 2,
          title: tx.to_user_role === 1 ? 'Distributor Pickup' : 
                 tx.to_user_role === 2 ? 'Retailer Delivery' : 'Consumer Purchase',
          icon: tx.to_user_role === 1 ? '🚛' : tx.to_user_role === 2 ? '🏪' : '👤',
          location: tx.location,
          date: tx.created_at,
          actor: tx.to_user_name,
          details: `Transferred ${tx.quantity}kg at ₹${tx.price}/kg`
        });
      });
    }

    return steps;
  };

  if (!user) {
    return <Layout><div>Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trace Products</h1>
          <p className="text-gray-600">
            Search and trace the complete journey of products from farm to your table
          </p>
        </div>

        {/* Supply Chain Step */}
        <div className="card bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 mb-8">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
            <h3 className="font-semibold text-orange-900">Step 4: Consumer Trace - Full Transparency</h3>
          </div>
          <p className="text-orange-700 text-sm">
            View complete farm-to-table journey, verify fair pricing, and see quality reports.
          </p>
        </div>

        {/* Search Form */}
        <div className="card mb-8">
          <form onSubmit={handleSearch} className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product name, batch ID, or QR code..."
                className="input-field"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Searching...' : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </>
              )}
            </button>
          </form>

          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
            <button
              onClick={() => router.push('/qr-purchase')}
              className="flex items-center space-x-1 text-primary-600 hover:text-primary-700"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan QR Code instead</span>
            </button>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="card mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Search Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((product) => (
                <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {product.name} - {product.variety}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600 mb-4">
                    <p><strong>Farmer:</strong> {product.farmer_name}</p>
                    <p><strong>Location:</strong> {product.farm_location}</p>
                    <p><strong>Quantity:</strong> {product.quantity}kg</p>
                    <p><strong>Price:</strong> ₹{product.price}/kg</p>
                  </div>
                  <button
                    onClick={() => viewSupplyChain(product.id)}
                    className="w-full btn-primary text-sm py-2"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Supply Chain
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Supply Chain Details */}
        {selectedProduct && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Supply Chain Journey: {selectedProduct.name} - {selectedProduct.variety}
            </h2>

            {/* Product Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-green-600">Total Journey</p>
                  <p className="text-lg font-semibold text-green-900">
                    Farm → Distributor → Retailer → You
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-600">Price Markup</p>
                  <p className="text-lg font-semibold text-green-900">
                    Only ₹{((selectedProduct.final_price || selectedProduct.price) - selectedProduct.price).toFixed(2)}/kg markup
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-600">Quality Assurance</p>
                  <p className="text-lg font-semibold text-green-900">
                    Grade {selectedProduct.quality_grade} • {selectedProduct.is_organic ? 'Organic' : 'Conventional'}
                  </p>
                </div>
              </div>
            </div>

            {/* Supply Chain Steps */}
            <div className="space-y-6">
              {getSupplyChainSteps(selectedProduct).map((step, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-100 text-primary-800 rounded-full flex items-center justify-center font-bold">
                      {step.step}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">{step.icon}</span>
                      <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        <span>{step.actor}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{step.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{new Date(step.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 mt-2">{step.details}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Verification Badge */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center">
                  ✓
                </div>
                <h3 className="font-semibold text-blue-900">Blockchain Verified</h3>
              </div>
              <p className="text-blue-700 text-sm mt-2">
                This supply chain journey is recorded on blockchain and cannot be tampered with. 
                All handoffs, prices, and quality data are immutable and transparent.
              </p>
            </div>
          </div>
        )}

        {/* Sample Products for Demo */}
        {!searchResults.length && !selectedProduct && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Products</h2>
            <p className="text-gray-600 mb-4">
              Try searching for "potato" or "tomato" to see sample supply chain journeys.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setSearchQuery('potato');
                  handleSearch({ preventDefault: () => {} });
                }}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-semibold">🥔 Potato Supply Chain</h3>
                <p className="text-sm text-gray-600">From Nashik farms to your table</p>
              </button>
              <button
                onClick={() => {
                  setSearchQuery('tomato');
                  handleSearch({ preventDefault: () => {} });
                }}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-semibold">🍅 Tomato Supply Chain</h3>
                <p className="text-sm text-gray-600">Fresh from farm with quality assurance</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
