import { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  TrendingUp,
  DollarSign,
  BarChart3,
  QrCode,
  MapPin,
  Truck,
  Eye,
  Thermometer
} from 'lucide-react';
import ProductCard from './ProductCard';
import AddProductModal from './AddProductModal';

export default function FarmerDashboard({ user, onUserUpdate }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalRevenue: 0,
    avgPrice: 0,
    totalQuantity: 0,
    inTransit: 0,
    sold: 0
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('agriTrace_token');
      const response = await fetch('http://localhost:3002/api/products/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const productsData = await response.json();
        setProducts(productsData);
        calculateStats(productsData);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (productsData) => {
    const totalProducts = productsData.length;
    const totalRevenue = productsData.reduce((sum, p) => {
      const price = typeof p.price === 'object' ? parseFloat(p.price.toString()) : parseFloat(p.price) || 0;
      const quantity = typeof p.quantity === 'object' ? parseFloat(p.quantity.toString()) : parseFloat(p.quantity) || 0;
      return sum + (price * quantity);
    }, 0);
    
    const totalQuantity = productsData.reduce((sum, p) => {
      const quantity = typeof p.quantity === 'object' ? parseFloat(p.quantity.toString()) : parseFloat(p.quantity) || 0;
      return sum + quantity;
    }, 0);
    
    const avgPrice = totalQuantity > 0 ? totalRevenue / totalQuantity : 0;
    
    const inTransit = productsData.filter(p => p.status === 1).length;
    const sold = productsData.filter(p => p.status === 4).length;

    setStats({
      totalProducts,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      avgPrice: Number(avgPrice.toFixed(2)),
      totalQuantity: Number(totalQuantity.toFixed(0)),
      inTransit,
      sold
    });
  };

  const handleProductAdded = (newProduct) => {
    setProducts(prev => [newProduct, ...prev]);
    calculateStats([newProduct, ...products]);
    setShowAddProduct(false);
  };

  return (
    <div>
      {/* Header with Location */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Farmer Dashboard</h1>
        <p className="text-gray-600 mb-1">Welcome back, {user.name}! 🌾</p>
        <p className="text-sm text-gray-500 flex items-center">
          <MapPin className="w-4 h-4 mr-1" />
          {user.location}
        </p>
      </div>

      {/* Supply Chain Workflow Guide */}
      <div className="card bg-gradient-to-r from-green-50 to-blue-50 border-green-200 mb-8">
        <h3 className="font-semibold text-green-900 mb-3">🥔 Potato Supply Chain Workflow</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <p className="font-medium text-green-800">Create Batch</p>
              <p className="text-green-600">Harvest & upload with GPS</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <p className="font-medium text-blue-800">Distributor Pickup</p>
              <p className="text-blue-600">QR scan + temp logging</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
            <div>
              <p className="font-medium text-purple-800">Retailer Delivery</p>
              <p className="text-purple-600">QR scan + shelf photo</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
            <div>
              <p className="font-medium text-orange-800">Consumer Trace</p>
              <p className="text-orange-600">Full farm-to-table history</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-blue-600">Total Batches</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalProducts}</p>
            </div>
          </div>
        </div>
        
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-green-600">Total Value</p>
              <p className="text-2xl font-bold text-green-900">₹{stats.totalRevenue.toFixed(0)}</p>
            </div>
          </div>
        </div>
        
        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-purple-600">Avg Price/kg</p>
              <p className="text-2xl font-bold text-purple-900">₹{stats.avgPrice.toFixed(0)}</p>
            </div>
          </div>
        </div>
        
        <div className="card bg-indigo-50 border-indigo-200">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-indigo-600 mr-3" />
            <div>
              <p className="text-sm text-indigo-600">Total Quantity</p>
              <p className="text-2xl font-bold text-indigo-900">{stats.totalQuantity} kg</p>
            </div>
          </div>
        </div>

        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center">
            <Truck className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-yellow-600">In Transit</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.inTransit}</p>
            </div>
          </div>
        </div>

        <div className="card bg-orange-50 border-orange-200">
          <div className="flex items-center">
            <Eye className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-orange-600">Sold</p>
              <p className="text-2xl font-bold text-orange-900">{stats.sold}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Produce Batches</h2>
        <button
          onClick={() => setShowAddProduct(true)}
          className="btn-primary flex items-center"
          disabled={!user.isVerified}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Batch
        </button>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <AddProductModal
          onClose={() => setShowAddProduct(false)}
          onProductAdded={handleProductAdded}
        />
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading batches...</p>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} showActions={true} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No batches created yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first produce batch with GPS tracking and quality reports.
          </p>
          {user.isVerified ? (
            <button
              onClick={() => setShowAddProduct(true)}
              className="btn-primary"
            >
              Create Your First Batch
            </button>
          ) : (
            <p className="text-yellow-600">
              Please wait for account verification to create batches.
            </p>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gray-50 text-center py-6">
          <QrCode className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">QR Code Generation</h3>
          <p className="text-sm text-gray-600">Each batch gets a unique QR code for supply chain tracking</p>
        </div>
        
        <div className="card bg-gray-50 text-center py-6">
          <Thermometer className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Temperature Logging</h3>
          <p className="text-sm text-gray-600">Track temperature during transport for quality assurance</p>
        </div>
        
        <div className="card bg-gray-50 text-center py-6">
          <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">GPS Tracking</h3>
          <p className="text-sm text-gray-600">Real-time location tracking throughout the supply chain</p>
        </div>
      </div>
    </div>
  );
}