import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { getApiUrl } from '../utils/api';
import { 
  Store, 
  Package, 
  BarChart3,
  QrCode,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Eye
} from 'lucide-react';

export default function RetailerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    inventoryValue: 0,
    lowStockItems: 0,
    todaysSales: 0,
    weeklyGrowth: 0,
    monthlyGrowth: 0,
    topSellingProduct: null
  });
  const [recentSales, setRecentSales] = useState([]);
  const [inventorySummary, setInventorySummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('agriTrace_token');
    const userData = localStorage.getItem('agriTrace_user');
    
    if (!token || !userData) {
      router.push('/simple-login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 2) { // Not a retailer
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('agriTrace_token');
      
      // Load retailer stats
      const statsResponse = await fetch(getApiUrl('/api/retailer/stats'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Load recent sales
      const salesResponse = await fetch(getApiUrl('/api/retailer/recent-sales'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (salesResponse.ok) {
        const salesData = await salesResponse.json();
        setRecentSales(salesData);
      }

      // Load inventory summary
      const inventoryResponse = await fetch(getApiUrl('/api/retailer/inventory-summary'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json();
        setInventorySummary(inventoryData);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (path) => {
    router.push(path);
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading retailer dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Retailer Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.name}! Here's your store overview.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => navigateTo('/retailer-inventory')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
          >
            <Package className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-purple-900">Inventory</span>
          </button>
          
          <button
            onClick={() => navigateTo('/retailer-products')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
          >
            <Store className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-blue-900">Products</span>
          </button>
          
          <button
            onClick={() => navigateTo('/retailer-analytics')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
          >
            <BarChart3 className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-green-900">Analytics</span>
          </button>
          
          <button
            onClick={() => navigateTo('/qr-purchase')}
            className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
          >
            <QrCode className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-orange-900">QR Scanner</span>
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+{stats.monthlyGrowth}% this month</span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
                <div className="flex items-center mt-1">
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+{stats.weeklyGrowth}% this week</span>
                </div>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inventory Value</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.inventoryValue.toLocaleString()}</p>
                <p className="text-sm text-gray-600 mt-1">{inventorySummary.length} products</p>
              </div>
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lowStockItems}</p>
                <p className="text-sm text-orange-600 mt-1">Need restocking</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Sales */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
              <button 
                onClick={() => navigateTo('/retailer-analytics')}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center"
              >
                View all <Eye className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            {recentSales.length > 0 ? (
              <div className="space-y-4">
                {recentSales.slice(0, 5).map((sale, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                        <Package className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{sale.productName}</p>
                        <p className="text-sm text-gray-600">{sale.quantity}kg sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">₹{sale.amount}</p>
                      <p className="text-sm text-gray-600">{sale.timeAgo}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No recent sales</p>
              </div>
            )}
          </div>

          {/* Inventory Summary */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Inventory Summary</h3>
              <button 
                onClick={() => navigateTo('/retailer-inventory')}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center"
              >
                Manage <Package className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            {inventorySummary.length > 0 ? (
              <div className="space-y-4">
                {inventorySummary.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <Store className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">{item.variety}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{item.quantity}kg</p>
                      <p className={`text-sm ${item.isLowStock ? 'text-orange-600' : 'text-green-600'}`}>
                        {item.isLowStock ? 'Low Stock' : 'In Stock'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No inventory items</p>
              </div>
            )}
          </div>
        </div>

        {/* Today's Performance */}
        <div className="mt-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-900">₹{stats.todaysSales}</p>
                <p className="text-sm text-purple-600">Today's Sales</p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-900">{recentSales.filter(s => s.isToday).length}</p>
                <p className="text-sm text-blue-600">Customers Served</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-900">{stats.topSellingProduct?.name || 'N/A'}</p>
                <p className="text-sm text-green-600">Top Selling Product</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
