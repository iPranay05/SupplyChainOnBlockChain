import { useState, useEffect } from 'react';
import { 
  Truck, 
  Package, 
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Users
} from 'lucide-react';
import ProductCard from './ProductCard';
import TransferModal from './TransferModal';

export default function DistributorDashboard({ user, onUserUpdate }) {
  const [availableProducts, setAvailableProducts] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalSales: 0,
    activeProducts: 0,
    totalValue: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('agriTrace_token');
      
      // Load available products for purchase
      const availableResponse = await fetch('http://localhost:3002/api/products/available', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (availableResponse.ok) {
        const availableData = await availableResponse.json();
        setAvailableProducts(availableData.filter(p => p.status <= 1)); // Harvested or InTransit
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
      return quantity > 0;
    }).length;
    
    const totalValue = productsData.reduce((sum, p) => {
      const price = typeof p.price === 'object' ? parseFloat(p.price.toString()) : parseFloat(p.price) || 0;
      const quantity = typeof p.quantity === 'object' ? parseFloat(p.quantity.toString()) : parseFloat(p.quantity) || 0;
      return sum + (price * quantity);
    }, 0);

    setStats({
      totalPurchases,
      totalSales: 0, // TODO: Calculate from transactions
      activeProducts,
      totalValue: Number(totalValue.toFixed(2))
    });
  };

  const handlePurchase = (product) => {
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
            <Truck className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Active Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeProducts}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Inventory Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalValue.toFixed(0)}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Products for Purchase */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Products</h2>
        
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
                    Purchase Product
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
              Check back later for new products from farmers.
            </p>
          </div>
        )}
      </div>

      {/* My Inventory */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Inventory</h2>
        
        {myProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myProducts.map((product) => (
              <div key={product.id} className="card hover:shadow-lg transition-shadow">
                <ProductCard product={product} showActions={false} />
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={() => handlePurchase(product)}
                    className="w-full btn-secondary"
                    disabled={!user.isVerified || product.quantity === 0}
                  >
                    Transfer to Retailer
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory yet</h3>
            <p className="text-gray-600">
              Purchase products from farmers to start building your inventory.
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