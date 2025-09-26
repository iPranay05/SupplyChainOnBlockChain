import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { ShoppingBag, Eye, MapPin, Calendar, Star } from 'lucide-react';
import { apiCall } from '../utils/api';

export default function MyPurchases() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('agriTrace_user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 3) {
        router.push('/universal-dashboard');
        return;
      }
      setUser(parsedUser);
      loadPurchases();
    } else {
      router.push('/simple-login');
    }
  }, [router]);

  const loadPurchases = async () => {
    try {
      const response = await apiCall('/api/products/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('agriTrace_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPurchases(data);
      }
    } catch (error) {
      console.error('Error loading purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewSupplyChain = (productId) => {
    router.push(`/product/${productId}`);
  };

  if (!user) {
    return <Layout><div>Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Purchases</h1>
          <p className="text-gray-600">
            Track your purchased products and view their complete supply chain journey
          </p>
        </div>

        {/* Purchase Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-orange-50 border-orange-200">
            <div className="flex items-center">
              <ShoppingBag className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-orange-600">Total Purchases</p>
                <p className="text-2xl font-bold text-orange-900">{purchases.length}</p>
              </div>
            </div>
          </div>
          
          <div className="card bg-green-50 border-green-200">
            <div className="flex items-center">
              <Star className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-600">Organic Products</p>
                <p className="text-2xl font-bold text-green-900">
                  {purchases.filter(p => p.is_organic).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card bg-blue-50 border-blue-200">
            <div className="flex items-center">
              <Eye className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-600">Traced Products</p>
                <p className="text-2xl font-bold text-blue-900">{purchases.length}</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your purchases...</p>
          </div>
        ) : purchases.length > 0 ? (
          <div className="space-y-6">
            {purchases.map((purchase) => (
              <div key={purchase.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
                  {/* Product Image */}
                  {purchase.photo_url && (
                    <div className="flex-shrink-0">
                      <img
                        src={purchase.photo_url}
                        alt={purchase.name}
                        className="w-full md:w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {/* Product Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {purchase.name} - {purchase.variety}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Grade {purchase.quality_grade} • {purchase.is_organic ? '🌱 Organic' : 'Conventional'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          ₹{(purchase.quantity * purchase.final_price || purchase.price).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {purchase.quantity}kg × ₹{purchase.final_price || purchase.price}/kg
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>From: {purchase.farm_location}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>Purchased: {new Date(purchase.purchase_date || purchase.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Supply Chain Summary */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <h4 className="font-semibold text-green-900 mb-2">Supply Chain Journey</h4>
                      <div className="flex items-center space-x-2 text-sm text-green-700">
                        <span>🌾 Farm</span>
                        <span>→</span>
                        <span>🚛 Distributor</span>
                        <span>→</span>
                        <span>🏪 Retailer</span>
                        <span>→</span>
                        <span>👤 You</span>
                      </div>
                      <p className="text-xs text-green-600 mt-2">
                        Complete transparency from farm to your table
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3 pt-4 border-t">
                      <button
                        onClick={() => viewSupplyChain(purchase.id)}
                        className="btn-primary text-sm py-2 px-4"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Supply Chain
                      </button>
                      <button
                        onClick={() => router.push(`/trace-products?product=${purchase.id}`)}
                        className="btn-secondary text-sm py-2 px-4"
                      >
                        Trace Journey
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No purchases yet</h3>
            <p className="text-gray-600 mb-6">
              Start purchasing products to see their complete supply chain journey.
            </p>
            <div className="space-x-4">
              <button
                onClick={() => router.push('/qr-purchase')}
                className="btn-primary"
              >
                Scan QR Code
              </button>
              <button
                onClick={() => router.push('/trace-products')}
                className="btn-secondary"
              >
                Browse Products
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
