import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { Package, QrCode, Eye, MapPin, Calendar, Truck } from 'lucide-react';
import { apiCall } from '../utils/api';

export default function MyBatches() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in and is a farmer
    const userData = localStorage.getItem('agriTrace_user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 0) {
        router.push('/universal-dashboard');
        return;
      }
      setUser(parsedUser);
      loadBatches();
    } else {
      router.push('/simple-login');
    }
  }, [router]);

  const loadBatches = async () => {
    try {
      const response = await apiCall('/api/products/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('agriTrace_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBatches(data);
      } else {
        console.error('Failed to load batches');
      }
    } catch (error) {
      console.error('Error loading batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 0: return 'bg-green-100 text-green-800'; // Harvested
      case 1: return 'bg-blue-100 text-blue-800'; // InTransit
      case 2: return 'bg-purple-100 text-purple-800'; // AtDistributor
      case 3: return 'bg-orange-100 text-orange-800'; // AtRetailer
      case 4: return 'bg-gray-100 text-gray-800'; // Sold
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0: return 'Ready for Pickup';
      case 1: return 'In Transit';
      case 2: return 'At Distributor';
      case 3: return 'At Retailer';
      case 4: return 'Sold to Consumer';
      default: return 'Unknown';
    }
  };

  const viewBatchDetails = (batchId) => {
    router.push(`/product/${batchId}`);
  };

  if (!user) {
    return <Layout><div>Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Produce Batches</h1>
          <p className="text-gray-600">
            Track all your produce batches through the supply chain
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card bg-green-50 border-green-200">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-600">Total Batches</p>
                <p className="text-2xl font-bold text-green-900">{batches.length}</p>
              </div>
            </div>
          </div>
          
          <div className="card bg-blue-50 border-blue-200">
            <div className="flex items-center">
              <Truck className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-600">In Transit</p>
                <p className="text-2xl font-bold text-blue-900">
                  {batches.filter(b => b.status === 1).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card bg-purple-50 border-purple-200">
            <div className="flex items-center">
              <Eye className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-purple-600">At Retailers</p>
                <p className="text-2xl font-bold text-purple-900">
                  {batches.filter(b => b.status === 3).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card bg-orange-50 border-orange-200">
            <div className="flex items-center">
              <QrCode className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-orange-600">Sold</p>
                <p className="text-2xl font-bold text-orange-900">
                  {batches.filter(b => b.status === 4).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Batches List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your batches...</p>
          </div>
        ) : batches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map((batch) => (
              <div key={batch.id} className="card hover:shadow-lg transition-shadow">
                {/* Batch Image */}
                {batch.photo_url && (
                  <div className="mb-4">
                    <img
                      src={batch.photo_url}
                      alt={batch.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Batch Info */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {batch.name} - {batch.variety}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                      {getStatusText(batch.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p><strong>Quantity:</strong> {batch.quantity} kg</p>
                      <p><strong>Price:</strong> ₹{batch.price}/kg</p>
                    </div>
                    <div>
                      <p><strong>Grade:</strong> {batch.quality_grade}</p>
                      <p><strong>Organic:</strong> {batch.is_organic ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{batch.farm_location}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Created: {new Date(batch.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* QR Code Preview */}
                  {batch.qr_code && (
                    <div className="text-center py-2">
                      <img
                        src={batch.qr_code}
                        alt="QR Code"
                        className="w-20 h-20 mx-auto border rounded"
                      />
                      <p className="text-xs text-gray-500 mt-1">QR Code for tracking</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2 pt-4 border-t">
                    <button
                      onClick={() => viewBatchDetails(batch.id)}
                      className="flex-1 btn-primary text-sm py-2"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </button>
                    {batch.qr_code && (
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = batch.qr_code;
                          link.download = `batch-${batch.id}-qr.png`;
                          link.click();
                        }}
                        className="btn-secondary text-sm py-2 px-3"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No batches created yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first produce batch to start tracking through the supply chain.
            </p>
            <button
              onClick={() => router.push('/create-batch')}
              className="btn-primary"
            >
              Create Your First Batch
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
