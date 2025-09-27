import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { getApiUrl } from '../utils/api';
import { 
  Store, 
  Search, 
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  DollarSign,
  Calendar,
  MapPin,
  User,
  Star,
  TrendingUp,
  ShoppingCart
} from 'lucide-react';

export default function RetailerProducts() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

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
    loadProducts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, filterCategory, sortBy]);

  const loadProducts = async () => {
    try {
      const token = localStorage.getItem('agriTrace_token');
      const response = await fetch(getApiUrl('/api/retailer/products'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = products;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.farmer_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(product => {
        switch (filterCategory) {
          case 'vegetables':
            return ['Potato', 'Tomato', 'Onion', 'Carrot'].includes(product.name);
          case 'fruits':
            return ['Apple', 'Banana', 'Orange', 'Mango'].includes(product.name);
          case 'grains':
            return ['Rice', 'Wheat', 'Corn', 'Barley'].includes(product.name);
          case 'organic':
            return product.is_organic;
          default:
            return true;
        }
      });
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return parseFloat(a.price) - parseFloat(b.price);
        case 'quantity':
          return parseFloat(b.quantity) - parseFloat(a.quantity);
        case 'date':
          return new Date(b.created_at) - new Date(a.created_at);
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  };

  const handleUpdatePrice = async (productId, newPrice) => {
    try {
      const token = localStorage.getItem('agriTrace_token');
      const response = await fetch(getApiUrl('/api/retailer/update-price'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, price: newPrice })
      });

      if (response.ok) {
        loadProducts();
        setShowPricingModal(false);
        setSelectedProduct(null);
      }
    } catch (error) {
      console.error('Error updating price:', error);
    }
  };

  const getQualityColor = (grade) => {
    switch (grade.toLowerCase()) {
      case 'premium': return 'bg-green-100 text-green-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'basic': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600 mt-2">Manage your store products and pricing</p>
          </div>
          <div className="flex space-x-3">
            <button className="btn-secondary flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products, varieties, or farmers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center">
                <Filter className="w-5 h-5 text-gray-400 mr-2" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="vegetables">Vegetables</option>
                  <option value="fruits">Fruits</option>
                  <option value="grains">Grains</option>
                  <option value="organic">Organic Only</option>
                </select>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="quantity">Quantity</option>
                  <option value="date">Date Added</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Product Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <Store className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.quantity > 0).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <Star className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Organic Products</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.is_organic).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Avg. Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{products.length > 0 ? Math.round(products.reduce((sum, p) => sum + parseFloat(p.price), 0) / products.length) : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="card hover:shadow-lg transition-shadow">
              {/* Product Image Placeholder */}
              <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 rounded-lg mb-4 flex items-center justify-center">
                <Package className="w-16 h-16 text-green-600" />
              </div>
              
              {/* Product Info */}
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.variety}</p>
                  </div>
                  {product.is_organic && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Organic
                    </span>
                  )}
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <User className="w-4 h-4 mr-1" />
                  <span>{product.farmer_name}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{product.farm_location}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">₹{product.price}</span>
                    <span className="text-sm text-gray-600">/kg</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityColor(product.quality_grade)}`}>
                    {product.quality_grade}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Stock: {product.quantity} kg</span>
                  <span className="text-gray-600">
                    Added: {new Date(product.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2 pt-3 border-t">
                  <button
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowProductModal(true);
                    }}
                    className="flex-1 btn-secondary text-sm"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowPricingModal(true);
                    }}
                    className="flex-1 btn-primary text-sm"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit Price
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">
              {searchTerm || filterCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Start by purchasing products from distributors.'}
            </p>
          </div>
        )}

        {/* Product Detail Modal */}
        {showProductModal && selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            onClose={() => {
              setShowProductModal(false);
              setSelectedProduct(null);
            }}
          />
        )}

        {/* Pricing Modal */}
        {showPricingModal && selectedProduct && (
          <PricingModal
            product={selectedProduct}
            onUpdate={handleUpdatePrice}
            onClose={() => {
              setShowPricingModal(false);
              setSelectedProduct(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
}

// Product Detail Modal Component
function ProductDetailModal({ product, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Product Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Product Name</label>
              <p className="text-gray-900">{product.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Variety</label>
              <p className="text-gray-900">{product.variety}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Farmer</label>
              <p className="text-gray-900">{product.farmer_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Farm Location</label>
              <p className="text-gray-900">{product.farm_location}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <p className="text-gray-900">{product.quantity} kg</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Price</label>
              <p className="text-gray-900">₹{product.price}/kg</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quality</label>
              <p className="text-gray-900">{product.quality_grade}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Organic</label>
              <p className="text-gray-900">{product.is_organic ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Harvest Date</label>
              <p className="text-gray-900">{new Date(product.harvest_date).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Pricing Modal Component
function PricingModal({ product, onUpdate, onClose }) {
  const [newPrice, setNewPrice] = useState(product.price);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(product.id, parseFloat(newPrice));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Update Price: {product.name}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Price: ₹{product.price}/kg
            </label>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Price (₹/kg)
            </label>
            <input
              type="number"
              step="0.01"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              min="0"
              required
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              Update Price
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
