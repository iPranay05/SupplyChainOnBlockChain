import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { ShoppingCart, MapPin, Package, Store, Eye } from 'lucide-react';
import { apiCall } from '../utils/api';

export default function PurchaseProducts() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('agriTrace_user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 2) {
        router.push('/universal-dashboard');
        return;
      }
      setUser(parsedUser);
      loadAvailableProducts();
    } else {
      router.push('/simple-login');
    }
  }, [router]);

  const loadAvailableProducts = async () => {
    try {
      const response = await apiCall('/api/products/available', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('agriTrace_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.filter(p => p.status === 2)); // At distributor
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (product) => {
    router.push(`/product/${product.id}?action=purchase`);
  };

  if (!user) {
    return <Layout><div>Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase Products</h1>
          <p className="text-gray-600">
            Browse and purchase products from distributors for your store
          </p>
        </div>

        {/* Supply Chain Step */}
        <div className="card bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 mb-8">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
            <h3 className="font-semibold text-purple-900">Step 3: Retailer Delivery - Store Receive</h3>
          </div>
          <p className="text-purple-700 text-sm">
            Scan QR codes on arrival, set shelf price, and upload shelf photos for consumer transparency.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading available products...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="card hover:shadow-lg transition-shadow">
                {product.photo_url && (
                  <img
                    src={product.photo_url}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}

                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {product.name} - {product.variety}
                    </h3>
                    <p className="text-sm text-gray-600">from {product.distributor_name || 'Distributor'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Quantity:</strong> {product.quantity} kg</p>
                      <p><strong>Wholesale:</strong> ₹{product.price}/kg</p>
                    </div>
                    <div>
                      <p><strong>Grade:</strong> {product.quality_grade}</p>
                      <p><strong>Organic:</strong> {product.is_organic ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>Available for pickup</span>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-sm text-purple-700">
                      <strong>Suggested Retail:</strong> ₹{(product.price * 1.2).toFixed(2)}/kg
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      20% markup for fair pricing
                    </p>
                  </div>

                  <div className="flex space-x-2 pt-4 border-t">
                    <button
                      onClick={() => router.push(`/product/${product.id}`)}
                      className="flex-1 btn-secondary text-sm py-2"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </button>
                    <button
                      onClick={() => handlePurchase(product)}
                      className="flex-1 btn-primary text-sm py-2"
                    >
                      <Store className="w-4 h-4 mr-1" />
                      Purchase
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products available</h3>
            <p className="text-gray-600">
              Check back later for new products from distributors.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
