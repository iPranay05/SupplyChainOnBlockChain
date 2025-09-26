import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { Package, Truck, MapPin, Calendar, Thermometer } from 'lucide-react';
import { apiCall } from '../utils/api';

export default function MyInventory() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('agriTrace_user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 1) {
        router.push('/universal-dashboard');
        return;
      }
      setUser(parsedUser);
      loadInventory();
    } else {
      router.push('/simple-login');
    }
  }, [router]);

  const loadInventory = async () => {
    try {
      const response = await apiCall('/api/products/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('agriTrace_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 1: return 'bg-blue-100 text-blue-800'; // InTransit
      case 2: return 'bg-green-100 text-green-800'; // AtDistributor
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 1: return 'In Transit';
      case 2: return 'In Warehouse';
      default: return 'Unknown';
    }
  };

  if (!user) {
    return <Layout><div>Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Inventory</h1>
          <p className="text-gray-600">
            Manage your current inventory and track products in transit
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-blue-50 border-blue-200">
            <div className="flex items-center">
              <Truck className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-600">In Transit</p>
                <p className="text-2xl font-bold text-blue-900">
                  {inventory.filter(item => item.status === 1).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card bg-green-50 border-green-200">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-600">In Warehouse</p>
                <p className="text-2xl font-bold text-green-900">
                  {inventory.filter(item => item.status === 2).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card bg-purple-50 border-purple-200">
            <div className="flex items-center">
              <Thermometer className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-purple-600">Avg Temperature</p>
                <p className="text-2xl font-bold text-purple-900">18°C</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading inventory...</p>
          </div>
        ) : inventory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inventory.map((item) => (
              <div key={item.id} className="card hover:shadow-lg transition-shadow">
                {item.photo_url && (
                  <img
                    src={item.photo_url}
                    alt={item.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}

                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.name} - {item.variety}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Quantity:</strong> {item.quantity} kg</p>
                      <p><strong>Purchase Price:</strong> ₹{item.price}/kg</p>
                    </div>
                    <div>
                      <p><strong>Grade:</strong> {item.quality_grade}</p>
                      <p><strong>Temperature:</strong> 18°C</p>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{item.current_location || 'Warehouse'}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Received: {new Date(item.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-700">
                      <strong>Potential Value:</strong> ₹{(item.quantity * item.price * 1.15).toFixed(2)}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      15% markup to retailers
                    </p>
                  </div>

                  <div className="flex space-x-2 pt-4 border-t">
                    <button
                      onClick={() => router.push(`/product/${item.id}`)}
                      className="flex-1 btn-secondary text-sm py-2"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => router.push(`/product/${item.id}?action=transfer`)}
                      className="flex-1 btn-primary text-sm py-2"
                      disabled={item.status !== 2}
                    >
                      <Truck className="w-4 h-4 mr-1" />
                      Transfer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory yet</h3>
            <p className="text-gray-600">
              Purchase products from farmers to start building your inventory.
            </p>
            <button
              onClick={() => router.push('/available-products')}
              className="btn-primary mt-4"
            >
              Browse Available Products
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
