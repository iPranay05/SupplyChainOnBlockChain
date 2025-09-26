import { useState, useEffect } from 'react';
import { useWeb3 } from './_app';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { getAllProducts } from '../utils/contract';
import { Leaf, Users, ShoppingCart, TrendingUp } from 'lucide-react';

export default function Home() {
  const { account, contract } = useWeb3();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalFarmers: 0,
    totalTransactions: 0,
    avgPrice: 0
  });

  useEffect(() => {
    if (contract) {
      loadProducts();
    }
  }, [contract]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const allProducts = await getAllProducts();
      setProducts(allProducts);
      
      // Calculate stats
      const totalProducts = allProducts.length;
      const uniqueFarmers = new Set(allProducts.map(p => p.farmer)).size;
      const avgPrice = allProducts.reduce((sum, p) => sum + parseFloat(p.currentPrice), 0) / totalProducts;
      
      setStats({
        totalProducts,
        totalFarmers: uniqueFarmers,
        totalTransactions: totalProducts * 2, // Rough estimate
        avgPrice: avgPrice || 0
      });
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                AgriTrace
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-primary-100">
                Transparent Agricultural Supply Chain on Blockchain
              </p>
              <p className="text-lg mb-8 max-w-3xl mx-auto">
                Track your produce from farm to table. Ensure quality, verify origin, 
                and support fair pricing for farmers through blockchain technology.
              </p>
              {!account && (
                <button 
                  onClick={() => window.location.href = '/register'}
                  className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="card text-center">
              <Leaf className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.totalProducts}</div>
              <div className="text-gray-600">Products Tracked</div>
            </div>
            <div className="card text-center">
              <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.totalFarmers}</div>
              <div className="text-gray-600">Verified Farmers</div>
            </div>
            <div className="card text-center">
              <ShoppingCart className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</div>
              <div className="text-gray-600">Transactions</div>
            </div>
            <div className="card text-center">
              <TrendingUp className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">${stats.avgPrice.toFixed(2)}</div>
              <div className="text-gray-600">Avg Price</div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8">Why Choose AgriTrace?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="card text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Full Traceability</h3>
                <p className="text-gray-600">
                  Track every step from seed to shelf with immutable blockchain records.
                </p>
              </div>
              <div className="card text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Fair Trade</h3>
                <p className="text-gray-600">
                  Ensure farmers get fair prices and reduce middleman exploitation.
                </p>
              </div>
              <div className="card text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Consumer Trust</h3>
                <p className="text-gray-600">
                  Verify product authenticity and quality with QR code scanning.
                </p>
              </div>
            </div>
          </div>

          {/* Recent Products */}
          {products.length > 0 && (
            <div>
              <h2 className="text-3xl font-bold mb-8">Recent Products</h2>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading products...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.slice(0, 6).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}