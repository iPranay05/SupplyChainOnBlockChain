import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getApiUrl } from '../utils/api';
import Layout from '../components/Layout';
import { User, Phone, MapPin, Briefcase } from 'lucide-react';

export default function SimpleRegister() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    location: '',
    role: 0,
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const roles = [
    { value: 0, label: 'Farmer', description: 'I grow and harvest crops' },
    { value: 1, label: 'Distributor', description: 'I transport and distribute products' },
    { value: 2, label: 'Retailer', description: 'I sell products to consumers' },
    { value: 3, label: 'Consumer', description: 'I buy and consume products' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(getApiUrl('/api/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('agriTrace_token', data.token);
        localStorage.setItem('agriTrace_user', JSON.stringify(data.user));
        
        setSuccess(true);
        setTimeout(() => {
          router.push('/universal-dashboard');
        }, 2000);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'role' ? parseInt(value) : value
    }));
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <User className="w-16 h-16 text-primary-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">Join AgriTrace</h1>
            <p className="text-gray-600 mt-2">
              Simple registration - No wallet needed!
            </p>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
              🎉 Registration successful! Your blockchain wallet has been created automatically. 
              Redirecting to dashboard...
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="+91 9876543210"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be your login username
              </p>
            </div>

            <div>
              <label className="label">
                <User className="w-4 h-4 inline mr-2" />
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="label">
                <MapPin className="w-4 h-4 inline mr-2" />
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Village, District, State"
              />
            </div>

            <div>
              <label className="label">
                <Briefcase className="w-4 h-4 inline mr-2" />
                I am a...
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map((role) => (
                  <label
                    key={role.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.role === role.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={formData.role === role.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="font-medium text-gray-900">{role.label}</div>
                    <div className="text-sm text-gray-600">{role.description}</div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Create a secure password"
              />
              <p className="text-xs text-gray-500 mt-1">
                This secures your blockchain wallet
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>✅ We create a secure blockchain wallet for you</li>
                <li>✅ No need to install MetaMask or manage crypto</li>
                <li>✅ Start adding your products immediately</li>
                <li>✅ Generate QR codes for your products</li>
                <li>✅ Track your products through the supply chain</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Your Account...' : 'Join AgriTrace'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/simple-login')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Login here
              </button>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}