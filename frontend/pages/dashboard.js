import { useState, useEffect } from 'react';
import { useWeb3 } from './_app';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { 
  getStakeholder, 
  getProductsByFarmer, 
  registerProduct,
  getStakeholderRole 
} from '../utils/contract';
import { 
  User, 
  Package, 
  Plus, 
  MapPin, 
  Calendar,
  Award,
  DollarSign,
  Upload
} from 'lucide-react';

export default function Dashboard() {
  const { account, contract } = useWeb3();
  const [stakeholder, setStakeholder] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    variety: '',
    farmLocation: '',
    quantity: '',
    qualityGrade: '',
    isOrganic: false,
    price: '',
    ipfsHash: ''
  });

  useEffect(() => {
    if (account && contract) {
      loadDashboardData();
    }
  }, [account, contract]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const stakeholderData = await getStakeholder(account.address);
      setStakeholder(stakeholderData);
      
      // If user is a farmer, load their products
      if (stakeholderData.role === 0) { // Farmer
        const farmerProducts = await getProductsByFarmer(account.address);
        setProducts(farmerProducts);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await registerProduct({
        ...productForm,
        quantity: parseInt(productForm.quantity),
        price: parseFloat(productForm.price)
      });
      
      // Reset form and reload products
      setProductForm({
        name: '',
        variety: '',
        farmLocation: '',
        quantity: '',
        qualityGrade: '',
        isOrganic: false,
        price: '',
        ipfsHash: ''
      });
      setShowAddProduct(false);
      await loadDashboardData();
    } catch (error) {
      console.error('Error registering product:', error);
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

  if (!account) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Wallet</h2>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to access your dashboard.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!stakeholder || stakeholder.wallet === '0x0000000000000000000000000000000000000000') {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Not Registered</h2>
            <p className="text-gray-600 mb-6">
              You need to register as a stakeholder before accessing the dashboard.
            </p>
            <button
              onClick={() => window.location.href = '/register'}
              className="btn-primary"
            >
              Register Now
            </button>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {stakeholder.name}
          </p>
        </div>

        {/* Stakeholder Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <User className="w-8 h-8 text-primary-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="font-semibold">{getStakeholderRole(stakeholder.role)}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <MapPin className="w-8 h-8 text-primary-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-semibold">{stakeholder.location}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-primary-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={`font-semibold ${stakeholder.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                  {stakeholder.isVerified ? 'Verified' : 'Pending Verification'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Farmer-specific content */}
        {stakeholder.role === 0 && stakeholder.isVerified && (
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
                    <h3 className="text-xl font-bold mb-4">Register New Product</h3>
                    
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
                          placeholder="City, State/Province, Country"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="label">Quantity</label>
                          <input
                            type="number"
                            name="quantity"
                            value={productForm.quantity}
                            onChange={handleInputChange}
                            required
                            min="1"
                            className="input-field"
                            placeholder="Units"
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
                          <label className="label">Price (USD)</label>
                          <input
                            type="number"
                            name="price"
                            value={productForm.price}
                            onChange={handleInputChange}
                            required
                            min="0"
                            step="0.01"
                            className="input-field"
                            placeholder="0.00"
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
                        <label className="label">IPFS Hash (Optional)</label>
                        <input
                          type="text"
                          name="ipfsHash"
                          value={productForm.ipfsHash}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="Additional data stored on IPFS"
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
                          {loading ? 'Registering...' : 'Register Product'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Products Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading products...</p>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                <p className="text-gray-600 mb-6">
                  Start by registering your first agricultural product.
                </p>
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="btn-primary"
                >
                  Register First Product
                </button>
              </div>
            )}
          </div>
        )}

        {/* Verification pending message */}
        {!stakeholder.isVerified && (
          <div className="card bg-yellow-50 border-yellow-200">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <h3 className="font-semibold text-yellow-800">Account Verification Pending</h3>
                <p className="text-yellow-700">
                  Your account is pending verification by the network administrator. 
                  Once verified, you'll be able to access all features.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}