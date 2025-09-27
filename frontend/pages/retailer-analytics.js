import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { getApiUrl } from '../utils/api';
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  Download,
  Filter,
  Eye,
  Package,
  Star,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function RetailerAnalytics() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState({
    salesOverview: {
      totalRevenue: 0,
      totalSales: 0,
      avgOrderValue: 0,
      growthRate: 0
    },
    salesTrends: [],
    topProducts: [],
    customerInsights: {
      totalCustomers: 0,
      returningCustomers: 0,
      newCustomers: 0
    },
    monthlyData: [],
    categoryBreakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  useEffect(() => {
    const token = localStorage.getItem('agriTrace_token');
    const userData = localStorage.getItem('agriTrace_user');
    
    if (!token || !userData) {
      router.push('/simple-login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 2) {
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('agriTrace_token');
      const response = await fetch(getApiUrl(`/api/retailer/analytics?range=${timeRange}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTimeRangeLabel = (range) => {
    switch (range) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 3 Months';
      case '1y': return 'Last Year';
      default: return 'Last 30 Days';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Analytics</h1>
            <p className="text-gray-600 mt-2">Track your store performance and insights</p>
          </div>
          <div className="flex space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 3 Months</option>
              <option value="1y">Last Year</option>
            </select>
            <button className="btn-primary flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.salesOverview.totalRevenue)}
                </p>
                <div className="flex items-center mt-1">
                  {analytics.salesOverview.growthRate >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${analytics.salesOverview.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(analytics.salesOverview.growthRate)}% vs last period
                  </span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.salesOverview.totalSales}</p>
                <p className="text-sm text-gray-600 mt-1">transactions</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Order Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.salesOverview.avgOrderValue)}
                </p>
                <p className="text-sm text-gray-600 mt-1">per transaction</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.customerInsights.totalCustomers}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {analytics.customerInsights.newCustomers} new this period
                </p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Sales Trend Chart */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="revenue">Revenue</option>
                <option value="sales">Sales Count</option>
                <option value="customers">Customers</option>
              </select>
            </div>
            
            {/* Simple Chart Visualization */}
            <div className="space-y-3">
              {analytics.salesTrends.slice(0, 7).map((trend, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{trend.date}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${(trend[selectedMetric] / Math.max(...analytics.salesTrends.map(t => t[selectedMetric]))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-16 text-right">
                      {selectedMetric === 'revenue' ? formatCurrency(trend[selectedMetric]) : trend[selectedMetric]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Top Selling Products</h3>
              <span className="text-sm text-gray-600">{getTimeRangeLabel(timeRange)}</span>
            </div>
            
            <div className="space-y-4">
              {analytics.topProducts.slice(0, 5).map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-bold text-purple-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.variety}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{product.totalSold} kg</p>
                    <p className="text-sm text-gray-600">{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Category Breakdown */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Sales by Category</h3>
            
            <div className="space-y-4">
              {analytics.categoryBreakdown.map((category, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    <span className="text-sm text-gray-600">{category.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">{category.quantity} kg sold</span>
                    <span className="text-xs text-gray-500">{formatCurrency(category.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Insights */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Customer Insights</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">Returning Customers</p>
                    <p className="text-2xl font-bold text-blue-900">{analytics.customerInsights.returningCustomers}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  {((analytics.customerInsights.returningCustomers / analytics.customerInsights.totalCustomers) * 100).toFixed(1)}% of total
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">New Customers</p>
                    <p className="text-2xl font-bold text-green-900">{analytics.customerInsights.newCustomers}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-xs text-green-600 mt-2">
                  {((analytics.customerInsights.newCustomers / analytics.customerInsights.totalCustomers) * 100).toFixed(1)}% of total
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600">Customer Retention</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {((analytics.customerInsights.returningCustomers / analytics.customerInsights.totalCustomers) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-xs text-purple-600 mt-2">
                  Customer loyalty rate
                </p>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Summary</h3>
            
            <div className="space-y-4">
              <div className="border-l-4 border-green-500 pl-4">
                <p className="text-sm text-gray-600">Best Selling Day</p>
                <p className="font-medium text-gray-900">
                  {analytics.monthlyData.length > 0 ? 
                    analytics.monthlyData.reduce((max, day) => day.sales > max.sales ? day : max).date : 'N/A'}
                </p>
              </div>
              
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="text-sm text-gray-600">Peak Sales Hour</p>
                <p className="font-medium text-gray-900">2:00 PM - 4:00 PM</p>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="text-sm text-gray-600">Most Popular Product</p>
                <p className="font-medium text-gray-900">
                  {analytics.topProducts.length > 0 ? analytics.topProducts[0].name : 'N/A'}
                </p>
              </div>
              
              <div className="border-l-4 border-orange-500 pl-4">
                <p className="text-sm text-gray-600">Average Transaction</p>
                <p className="font-medium text-gray-900">
                  {formatCurrency(analytics.salesOverview.avgOrderValue)}
                </p>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <button className="w-full btn-secondary text-sm">
                <Eye className="w-4 h-4 mr-2" />
                View Detailed Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
