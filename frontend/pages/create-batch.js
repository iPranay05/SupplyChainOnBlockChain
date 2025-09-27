import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { getApiUrl } from '../utils/api';
import { 
  Upload, 
  MapPin, 
  Calendar, 
  Package, 
  Star,
  Camera,
  Loader,
  CheckCircle,
  Plus
} from 'lucide-react';
import { apiCall } from '../utils/api';

export default function CreateBatch() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    produce: '',
    variety: '',
    quantity: '',
    price: '',
    farmLocation: '',
    gpsCoordinates: '',
    qualityGrade: 'A',
    isOrganic: false,
    password: ''
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    // Check if user is logged in and is a farmer
    const userData = localStorage.getItem('agriTrace_user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 0) {
        router.push('/universal-dashboard');
        return;
      }
      setUser(parsedUser);
      setFormData(prev => ({
        ...prev,
        farmLocation: parsedUser.location || ''
      }));
    } else {
      router.push('/simple-login');
    }

    // Get GPS coordinates
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
          setFormData(prev => ({
            ...prev,
            gpsCoordinates: coords
          }));
        },
        (error) => {
          console.log('GPS error:', error);
        }
      );
    }
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Map form fields to backend expected fields
      formDataToSend.append('name', formData.produce);
      formDataToSend.append('variety', formData.variety);
      formDataToSend.append('quantity', formData.quantity);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('farmLocation', formData.farmLocation);
      formDataToSend.append('qualityGrade', formData.qualityGrade);
      formDataToSend.append('isOrganic', formData.isOrganic);
      formDataToSend.append('password', formData.password); // Use user's password for blockchain

      // Add photo if selected
      if (photo) {
        formDataToSend.append('photo', photo);
      }

      const response = await fetch(getApiUrl('/api/products'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('agriTrace_token')}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        alert('Batch created successfully!');
        router.push('/farmer-dashboard');
      } else {
        alert(data.error || 'Failed to create batch');
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Layout><div>Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Batch</h1>
          <p className="text-gray-600">
            Create a new produce batch with GPS tracking and quality documentation
          </p>
        </div>

        {/* Supply Chain Step Indicator */}
        <div className="card bg-gradient-to-r from-green-50 to-blue-50 border-green-200 mb-8">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <h3 className="font-semibold text-green-900">Step 1: Farm Stage - Batch Creation</h3>
          </div>
          <p className="text-green-700 text-sm">
            This batch will get a unique QR code for complete supply chain tracking from farm to consumer.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">
                  Produce Type *
                </label>
                <select
                  name="produce"
                  value={formData.produce}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                >
                  <option value="">Select produce</option>
                  <option value="Potato">Potato</option>
                  <option value="Tomato">Tomato</option>
                  <option value="Onion">Onion</option>
                  <option value="Rice">Rice</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Corn">Corn</option>
                </select>
              </div>

              <div>
                <label className="label">
                  Variety *
                </label>
                <input
                  type="text"
                  name="variety"
                  value={formData.variety}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="e.g., Russet, Red, Yukon"
                />
              </div>

              <div>
                <label className="label">
                  Quantity (kg) *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  min="1"
                  step="0.1"
                  className="input-field"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="label">
                  Price per kg (₹) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="input-field"
                  placeholder="25.00"
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Location Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Farm Location *
                </label>
                <input
                  type="text"
                  name="farmLocation"
                  value={formData.farmLocation}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="Nashik, Maharashtra"
                />
              </div>

              <div>
                <label className="label">
                  GPS Coordinates
                </label>
                <input
                  type="text"
                  name="gpsCoordinates"
                  value={formData.gpsCoordinates}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Auto-detected via GPS"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  GPS coordinates are automatically detected for supply chain tracking
                </p>
              </div>
            </div>
          </div>

          {/* Quality Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Quality Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">
                  Quality Grade *
                </label>
                <select
                  name="qualityGrade"
                  value={formData.qualityGrade}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                >
                  <option value="A">Grade A - Premium</option>
                  <option value="B">Grade B - Standard</option>
                  <option value="C">Grade C - Basic</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isOrganic"
                  checked={formData.isOrganic}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Organic Certified
                </label>
              </div>

              {/* Password for Blockchain */}
              <div>
                <label className="label">Password (for blockchain registration) *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter your registration password"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is the same password you used when registering your account
                </p>
              </div>
            </div>
          </div>

          {/* Photo Upload */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Batch Photo</h2>
            <div className="space-y-4">
              <div>
                <label className="label">
                  <Camera className="w-4 h-4 inline mr-2" />
                  Upload Batch Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="input-field"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a photo of your produce batch for quality verification
                </p>
              </div>

              {photoPreview && (
                <div className="mt-4">
                  <img
                    src={photoPreview}
                    alt="Batch preview"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Batch...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Batch
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
