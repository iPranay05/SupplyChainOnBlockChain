import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { getApiUrl } from '../utils/api';
import { 
  Sprout, 
  Package, 
  DollarSign,
  TrendingUp,
  Calendar,
  MapPin,
  Thermometer,
  Droplets,
  Sun,
  Eye,
  Plus,
  BarChart3
} from 'lucide-react';

export default function FarmerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalBatches: 0,
    activeBatches: 0,
    totalRevenue: 0,
    avgPrice: 0,
    thisMonthHarvest: 0,
    weatherCondition: 'Sunny',
    soilMoisture: 65,
    temperature: 28
  });
  const [recentBatches, setRecentBatches] = useState([]);
  const [weatherData, setWeatherData] = useState({
    temperature: 28,
    humidity: 65,
    rainfall: 12,
    condition: 'Partly Cloudy'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('agriTrace_token');
    const userData = localStorage.getItem('agriTrace_user');
    
    if (!token || !userData) {
      router.push('/simple-login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 0) { // Not a farmer
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('agriTrace_token');
      
      // Load farmer stats
      const statsResponse = await fetch(getApiUrl('/api/farmer/stats'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Load recent batches (products)
      const batchesResponse = await fetch(getApiUrl('/api/products/my'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (batchesResponse.ok) {
        const batchesData = await batchesResponse.json();
        console.log('Fetched batches data:', batchesData); // Debug log
        setRecentBatches(batchesData.slice(0, 5)); // Show only recent 5
      } else {
        console.error('Failed to fetch batches:', batchesResponse.status);
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading farmer dashboard...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Farmer Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.name}! Here's your farm overview.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => navigateTo('/harvest-log')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
          >
            <Package className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-green-900">Harvest Log</span>
          </button>
          
          <button
            onClick={() => navigateTo('/price-check')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
          >
            <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-blue-900">Price Check</span>
          </button>
          
          <button
            onClick={() => navigateTo('/create-batch')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
          >
            <Plus className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-purple-900">New Batch</span>
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Batches</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBatches}</p>
                <p className="text-sm text-green-600 mt-1">{stats.activeBatches} active</p>
              </div>
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-gray-600 mt-1">this season</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Price</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.avgPrice}/kg</p>
                <p className="text-sm text-gray-600 mt-1">per kilogram</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisMonthHarvest}kg</p>
                <p className="text-sm text-gray-600 mt-1">harvested</p>
              </div>
              <Sprout className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Weather Information */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Farm Weather</h3>
              <MapPin className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Thermometer className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-900">{weatherData.temperature}°C</p>
                <p className="text-sm text-blue-600">Temperature</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Droplets className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-900">{weatherData.humidity}%</p>
                <p className="text-sm text-green-600">Humidity</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Sun className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-purple-900">{weatherData.condition}</p>
                <p className="text-sm text-purple-600">Condition</p>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Droplets className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-900">{weatherData.rainfall}mm</p>
                <p className="text-sm text-orange-600">Rainfall</p>
              </div>
            </div>
          </div>

          {/* Recent Batches */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Batches</h3>
              <button 
                onClick={() => navigateTo('/harvest-log')}
                className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
              >
                View all <Eye className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            {recentBatches.length > 0 ? (
              <div className="space-y-4">
                {recentBatches.slice(0, 5).map((batch, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <Sprout className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{batch.name || batch.produce}</p>
                        <p className="text-sm text-gray-600">{batch.variety}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{batch.quantity}kg</p>
                      <p className="text-sm text-gray-600">{new Date(batch.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No recent batches</p>
              </div>
            )}
          </div>
        </div>

        {/* Farm Insights */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Farm Insights</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-lg font-bold text-green-900">Next Harvest</p>
              <p className="text-sm text-green-600">Estimated in 15 days</p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-lg font-bold text-blue-900">Best Season</p>
              <p className="text-sm text-blue-600">Kharif (Jun-Oct)</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-lg font-bold text-purple-900">Growth Rate</p>
              <p className="text-sm text-purple-600">+12% vs last season</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
