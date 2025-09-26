import { useState } from 'react';
import { X } from 'lucide-react';

export default function AddProductModal({ onClose, onProductAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    variety: '',
    quantity: '',
    qualityGrade: '',
    isOrganic: false,
    price: '',
    farmLocation: '',
    password: '',
    photo: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('agriTrace_token');
      
      // Create FormData for file upload
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'photo' && formData[key]) {
          submitData.append('photo', formData[key]);
        } else if (key !== 'photo') {
          submitData.append(key, formData[key]);
        }
      });

      const response = await fetch('http://localhost:3002/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData,
      });

      const data = await response.json();

      if (response.ok) {
        onProductAdded(data.product);
        setFormData({
          name: '',
          variety: '',
          quantity: '',
          qualityGrade: '',
          isOrganic: false,
          price: '',
          farmLocation: '',
          password: ''
        });
      } else {
        setError(data.error || 'Product registration failed');
      }
    } catch (error) {
      console.error('Error registering product:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : files ? files[0] : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Register New Product</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
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
                  value={formData.variety}
                  onChange={handleChange}
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
                value={formData.farmLocation}
                onChange={handleChange}
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
                  value={formData.quantity}
                  onChange={handleChange}
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
                  value={formData.qualityGrade}
                  onChange={handleChange}
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
                  value={formData.price}
                  onChange={handleChange}
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
                checked={formData.isOrganic}
                onChange={handleChange}
                className="mr-2"
              />
              <label className="text-sm text-gray-700">
                This product is organically certified
              </label>
            </div>

            <div>
              <label className="label">Product Photo</label>
              <input
                type="file"
                name="photo"
                onChange={handleChange}
                accept="image/*"
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload a photo of your product (optional)
              </p>
            </div>

            <div>
              <label className="label">Password (for blockchain security)</label>
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

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">What happens next?</h4>
              <ul className="text-green-800 text-sm space-y-1">
                <li>✅ Product registered in database</li>
                <li>✅ QR code generated automatically</li>
                <li>✅ Blockchain registration (if verified)</li>
                <li>✅ Available for transfer to distributors</li>
              </ul>
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
                {loading ? 'Registering Product...' : 'Register Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}