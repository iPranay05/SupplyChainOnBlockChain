import { useState, useEffect } from 'react';
import { 
  Store, 
  Package, 
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3
} from 'lucide-react';
import ProductCard from './ProductCard';
import TransferModal from './TransferModal';

export default function RetailerDashboard({ user, onUserUpdate }) {
  const [availableProducts, setAvailableProducts] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalSales: 0,
    activeProducts: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('agriTrace_token');
      
      // Load available products from distributors
      const availableResponse = await fetch('http://localhost:3002/api/products/available', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (availableResponse.ok) {
        const availableData = await availableResponse.json();
        setAvailableProducts(availableData.filter(p => p.status === 2)); // AtDistributor
      }

      // Load my products (products I've received)
      const myResponse = await fetch('http://localhost:3002/api/products/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (myResponse.ok) {
        const myData = await myResponse.json();
        setMyProducts(myData);
        calculateStats(myData);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (productsData) => {
    const totalPurchases = productsData.length;
    const activeProducts = productsData.filter(p => {
      const quantity = typeof p.quantity === 'object' ? parseFloat(p.quantity.toString()) : parseFloat(p.quantity) || 0;
      const status = typeof p.status === 'object' ? parseInt(p.status.toString()) : parseInt(p.status) || 0;
      return quantity > 0 && status < 4;
    }).length;
    
    const totalRevenue = productsData.reduce((sum, p) => {
      const price = typeof p.price === 'object' ? parseFloat(p.price.toString()) : parseFloat(p.price) || 0;
      const quantity = typeof p.quantity === 'object' ? parseFloat(p.quantity.toString()) : parseFloat(p.quantity) || 0;
      return sum + (price * quantity);
    }, 0);

    const totalSales = productsData.filter(p => {
      const status = typeof p.status === 'object' ? parseInt(p.status.toString()) : parseInt(p.status) || 0;
      return status === 4;
    }).length;

    setStats({
      totalPurchases,
      totalSales,
      activeProducts,
      totalRevenue: Number(totalRevenue.toFixed(2))
    });
  };

  const handlePurchase = (product) => {
    setSelectedProduct(product);
    setShowTransferModal(true);
  };

  const handleSellToConsumer = (product) => {
    setSelectedProduct(product);
    setShowTransferModal(true);
  };

  const handleTransferComplete = () => {
    setShowTransferModal(false);
    setSelectedProduct(null);
    loadData(); // Refresh data
  };

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <ShoppingCart className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Purchases</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPurchases}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <Store className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Products in Store</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeProducts}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Store Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toFixed(0)}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Products Sold</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Products from Distributors */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available from Distributors</h2>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading available products...</p>
          </div>
        ) : availableProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableProducts.map((product) => (
              <div key={product.id} className="card hover:shadow-lg transition-shadow">
                <ProductCard product={product} showActions={false} />
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={() => handlePurchase(product)}
                    className="w-full btn-primary"
                    disabled={!user.isVerified}
                  >
                    Purchase for Store
                  </button>
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

      {/* My Store Inventory */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Store Inventory</h2>
        
        {myProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myProducts.map((product) => (
              <div key={product.id} className="card hover:shadow-lg transition-shadow">
                <ProductCard product={product} showActions={false} />
                <div className="mt-4 pt-4 border-t space-y-2">
                  <button
                    onClick={() => handleSellToConsumer(product)}
                    className="w-full btn-primary"
                    disabled={!user.isVerified || product.quantity === 0}
                  >
                    Sell to Consumer
                  </button>
                  <div className="text-center">
                    <span className="text-sm text-gray-600">
                      Available: {product.quantity} kg
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory yet</h3>
            <p className="text-gray-600">
              Purchase products from distributors to stock your store.
            </p>
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {showTransferModal && selectedProduct && (
        <TransferModal
          product={selectedProduct}
          userRole={user.role}
          onClose={() => setShowTransferModal(false)}
          onTransferComplete={handleTransferComplete}
        />
      )}
    </div>
  );
}