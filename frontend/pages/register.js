import { useState } from 'react';
import { useWeb3 } from './_app';
import Layout from '../components/Layout';
import { registerStakeholder } from '../utils/contract';
import { User, MapPin, Briefcase } from 'lucide-react';

export default function Register() {
  const { account, contract } = useWeb3();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    role: 0 // 0: Farmer, 1: Distributor, 2: Retailer, 3: Consumer
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const roles = [
    { value: 0, label: 'Farmer', description: 'Grow and harvest agricultural products' },
    { value: 1, label: 'Distributor', description: 'Transport and distribute products' },
    { value: 2, label: 'Retailer', description: 'Sell products to consumers' },
    { value: 3, label: 'Consumer', description: 'Purchase and consume products' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account || !contract) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await registerStakeholder(formData.name, formData.location, formData.role);
      setSuccess(true);
      setFormData({ name: '', location: '', role: 0 });
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed');
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

  if (!account) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Wallet</h2>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to register as a stakeholder in the AgriTrace network.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <User className="w-16 h-16 text-primary-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">Register as Stakeholder</h1>
            <p className="text-gray-600 mt-2">
              Join the AgriTrace network and start tracking agricultural products
            </p>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
              Registration successful! Your account is pending verification by the network administrator.
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
                placeholder="City, State/Province, Country"
              />
            </div>

            <div>
              <label className="label">
                <Briefcase className="w-4 h-4 inline mr-2" />
                Role in Supply Chain
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

            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">Connected Wallet</h3>
              <p className="text-sm text-gray-600">
                {account.address}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Network: {account.network} (Chain ID: {account.chainId})
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register Stakeholder'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              After registration, your account will need to be verified by the network administrator 
              before you can start using AgriTrace features.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}