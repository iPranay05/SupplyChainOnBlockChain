import { useState, useEffect } from 'react';
import { X, User, Phone, MapPin } from 'lucide-react';

export default function TransferModal({ product, userRole, onClose, onTransferComplete }) {
  const [formData, setFormData] = useState({
    toPhone: '',
    quantity: '',
    price: product.price || product.currentPrice || 0,
    location: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);

  useEffect(() => {
    loadAvailableUsers();
  }, []);

  const loadAvailableUsers = async () => {
    try {
      const token = localStorage.getItem('agriTrace_token');
      let targetRole;
      
      // Determine target role based on current user role
      if (userRole === 0) targetRole = 1; // Farmer -> Distributor
      else if (userRole === 1) targetRole = 2; // Distributor -> Retailer
      else if (userRole === 2) targetRole = 3; // Retailer -> Consumer
      else return;

      const response = await fetch(`http://localhost:3002/api/users/role/${targetRole}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const users = await response.json();
        setAvailableUsers(users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('agriTrace_token');
      const response = await fetch(`http://localhost:3002/api/products/${product.id}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Transfer successful! ${data.txHash ? 'Blockchain transaction: ' + data.txHash : ''}`);
        onTransferComplete();
      } else {
        setError(data.error || 'Transfer failed');
      }
    } catch (error) {
      console.error('Transfer error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const selectUser = (user) => {
    setFormData(prev => ({
      ...prev,
      toPhone: user.phone
    }));
  };

  const getTargetRoleLabel = () => {
    if (userRole === 0) return 'Distributor';
    if (userRole === 1) return 'Retailer';
    if (userRole === 2) return 'Consumer';
    return 'User';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Transfer Product</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Product Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">{product.name}</h4>
            <p className="text-gray-600 mb-2">{product.variety}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Available:</span>
                <span className="ml-2 font-medium">{product.quantity} kg</span>
              </div>
              <div>
                <span className="text-gray-500">Current Price:</span>
                <span className="ml-2 font-medium">₹{product.price || product.currentPrice || 0}/kg</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Available Users */}
            {availableUsers.length > 0 && (
              <div>
                <label className="label">Select {getTargetRoleLabel()}</label>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                  {availableUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => selectUser(user)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.toPhone === user.phone
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <User className="w-4 h-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {user.phone}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {user.location}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Phone Entry */}
            <div>
              <label className="label">
                {getTargetRoleLabel()} Phone Number
              </label>
              <input
                type="tel"
                name="toPhone"
                value={formData.toPhone}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="+91 9876543210"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Quantity (kg)</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  min="1"
                  max={Number(product.quantity) || 0}
                  className="input-field"
                  placeholder="Enter quantity"
                />
              </div>
              
              <div>
                <label className="label">Price per kg (₹)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="input-field"
                  placeholder="Enter price"
                />
              </div>
            </div>

            <div>
              <label className="label">Transfer Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="City, State where transfer takes place"
              />
            </div>

            <div>
              <label className="label">Your Password (for blockchain security)</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Enter your account password"
              />
            </div>

            {/* Transfer Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Transfer Summary</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span>{formData.quantity || 0} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Price per kg:</span>
                  <span>₹{formData.price || 0}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total Value:</span>
                  <span>₹{((formData.quantity || 0) * (formData.price || 0)).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50"
              >
                {loading ? 'Processing Transfer...' : 'Transfer Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}