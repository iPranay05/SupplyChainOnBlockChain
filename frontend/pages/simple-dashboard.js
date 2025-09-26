import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { 
  User, 
  Package, 
  Plus, 
  QrCode,
  MapPin, 
  Calendar,
  Award,
  DollarSign,
  Phone,
  LogOut,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function SimpleDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    variety: '',
    quantity: '',
    qualityGrade: '',
    isOrganic: false,
    price: '',
    farmLocation: '',
    password: ''
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const token = localStorage.getItem('agriTrace_token');
    const userData = localStorage.getItem('agriTrace_user');

    if (!token || !userData) {
      router.push('/simple-login');
      return;
    }

    try {
      setUser(JSON.parse(userData));
      
      // Load user's products
      const response = await fetch('http://localhost:3002/api/products/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const productsData = await response.json();
        setProducts(productsData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('agriTrace_token');
    localStorage.removeItem('agriTrace_user');
    router.push('/simple-login');
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('agriTrace_token');
      const response = await fetch('http://localhost:3002/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productForm),
      });

      const data = await response.json();

      if (response.ok) {
        setProducts(prev => [data.product, ...prev]);
        setProductForm({
          name: '',
          variety: '',
          quantity: '',
          qualityGrade: '',
          isOrganic: false,
          price: '',
          farmLocation: '',
          password: ''
        });
        setShowAddProduct(false);
        alert('Product registered successfully! 🎉');
      } else {
        alert('Error: ' + (data.error || 'Product registration failed'));
      }
    } catch (error) {
      console.error('Error registering product:', error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getRoleLabel = (role) => {
    const roles = ['Farmer', 'Distributor', 'Retailer', 'Consumer'];
    return roles[role] || 'Unknown';
  };

  const getStatusColor = (status) => {
    const colors = {
      0: 'bg-green-100 text-green-800', // Harvested
      1: 'bg-yellow-100 text-yellow-800', // InTransit
      2: 'bg-blue-100 text-blue-800', // AtDistributor
      3: 'bg-purple-100 text-purple-800', // AtRetailer
      4: 'bg-gray-100 text-gray-800', // Sold
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = ['Harvested', 'In Transit', 'At Distributor', 'At Retailer', 'Sold'];
    return labels[status] || 'Unknown';
  };

  if (loading && !user) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
            <p className="text-gray-600">Manage your agricultural products</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>

        {/* User Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <User className="w-8 h-8 text-primary-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="font-semibold">{getRoleLabel(user?.role)}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <Phone className="w-8 h-8 text-primary-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-semibold">{user?.phone}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <MapPin className="w-8 h-8 text-primary-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-semibold">{user?.location}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              {user?.isVerified ? (
                <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              ) : (
                <Clock className="w-8 h-8 text-yellow-600 mr-3" />
              )}
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={`font-semibold ${user?.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                  {user?.isVerified ? 'Verified' : 'Pending'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Notice */}
        {!user?.isVerified && (
          <div className="card bg-yellow-50 border-yellow-200 mb-8">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <h3 className="font-semibold text-yellow-800">Account Verification Pending</h3>
                <p className="text-yellow-700">
                  Your account is being verified by our team. Once verified, you can start adding products to the blockchain.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Farmer-specific content */}
        {user?.role === 0 && (
          <div>
            {/* Products Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Products</h2>
              <button
                onClick={() => setShowAddProduct(true)}
                className="btn-primary flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </button>
            </div>

            {/* Add Product Modal */}
            {showAddProduct && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-4">Add New Product</h3>
                    
                    <form onSubmit={handleProductSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Product Name</label>
                          <input
                            type="text"
                            name="name"
                            value={productForm.name}
                            onChange={handleInputChange}
                            required
                            className="input-field"
                            placeholder="e.g., Organic Tomatoes"
                          />
                        </div>
                        
                        <div>
                          <label className="label">Variety</label>
                          <input
                            type="text"
                            name="variety"
                            value={productForm.variety}
                            onChange={handleInputChange}
                            required
                            className="input-field"
                            placeholder="e.g., Cherry Tomatoes"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="label">Farm Location</label>
                        <input
                          type="text"
                          name="farmLocation"
                          value={productForm.farmLocation}
                          onChange={handleInputChange}
                          required
                          className="input-field"
                          placeholder="Village, District, State"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="label">Quantity (kg)</label>
                          <input
                            type="number"
                            name="quantity"
                            value={productForm.quantity}
                            onChange={handleInputChange}
                            required
                            min="1"
                            className="input-field"
                            placeholder="100"
                          />
                        </div>
                        
                        <div>
                          <label className="label">Quality Grade</label>
                          <select
                            name="qualityGrade"
                            value={productForm.qualityGrade}
                            onChange={handleInputChange}
                            required
                            className="input-field"
                          >
                            <option value="">Select Grade</option>
                            <option value="Premium">Premium</option>
                            <option value="Grade A">Grade A</option>
                            <option value="Grade B">Grade B</option>
                            <option value="Standard">Standard</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="label">Price per kg (₹)</label>
                          <input
                            type="number"
                            name="price"
                            value={productForm.price}
                            onChange={handleInputChange}
                            required
                            min="0"
                            step="0.01"
                            className="input-field"
                            placeholder="50.00"
                          />
                        </div>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="isOrganic"
                          checked={productForm.isOrganic}
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        <label className="text-sm text-gray-700">
                          This product is organically certified
                        </label>
                      </div>

                      <div>
                        <label className="label">Password (for blockchain security)</label>
                        <input
                          type="password"
                          name="password"
                          value={productForm.password}
                          onChange={handleInputChange}
                          required
                          className="input-field"
                          placeholder="Enter your account password"
                        />
                      </div>

                      <div className="flex justify-end space-x-4 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowAddProduct(false)}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="btn-primary disabled:opacity-50"
                        >
                          {loading ? 'Adding Product...' : 'Add Product'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Products Grid */}
            {products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="card hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-600">{product.variety}</p>
                      </div>
                      {product.qr_code && (
                        <QrCode className="w-5 h-5 text-primary-600" />
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{product.farm_location}</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Added: {new Date(product.created_at).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Award className="w-4 h-4 mr-2" />
                        <span>Grade: {product.quality_grade}</span>
                        {product.is_organic && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Organic
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="w-4 h-4 mr-1" />
                          <span className="font-semibold text-gray-900">
                            ₹{product.price}/kg
                          </span>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(product.status)}`}>
                          {getStatusLabel(product.status)}
                        </span>
                      </div>

                      <div className="text-xs text-gray-500">
                        Quantity: {product.quantity} kg
                      </div>

                      {product.blockchain_id && (
                        <div className="text-xs text-green-600">
                          ✅ Registered on blockchain (ID: {product.blockchain_id})
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                <p className="text-gray-600 mb-6">
                  Start by adding your first agricultural product.
                </p>
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="btn-primary"
                >
                  Add First Product
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}