import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import FarmerDashboard from '../components/FarmerDashboard';
import DistributorDashboard from '../components/DistributorDashboard';
import RetailerDashboard from '../components/RetailerDashboard';
import ConsumerDashboard from '../components/ConsumerDashboard';
import { 
  User, 
  LogOut,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function UniversalDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      // Refresh user data from server
      const response = await fetch('http://localhost:3002/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const freshUserData = await response.json();
        setUser(freshUserData);
        localStorage.setItem('agriTrace_user', JSON.stringify(freshUserData));
      } else {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setUser(JSON.parse(userData));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('agriTrace_token');
    localStorage.removeItem('agriTrace_user');
    router.push('/simple-login');
  };

  const getRoleLabel = (role) => {
    const roles = ['Farmer', 'Distributor', 'Retailer', 'Consumer'];
    return roles[role] || 'Unknown';
  };

  const getRoleEmoji = (role) => {
    const emojis = ['🌾', '🚛', '🏪', '🛒'];
    return emojis[role] || '👤';
  };

  if (loading) {
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

  if (!user) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h2>
            <button
              onClick={() => router.push('/simple-login')}
              className="btn-primary"
            >
              Go to Login
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const renderRoleSpecificDashboard = () => {
    switch (user.role) {
      case 0: // Farmer
        return <FarmerDashboard user={user} onUserUpdate={setUser} />;
      case 1: // Distributor
        return <DistributorDashboard user={user} onUserUpdate={setUser} />;
      case 2: // Retailer
        return <RetailerDashboard user={user} onUserUpdate={setUser} />;
      case 3: // Consumer
        return <ConsumerDashboard user={user} onUserUpdate={setUser} />;
      default:
        return <div>Unknown role</div>;
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">{getRoleEmoji(user.role)}</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {user.name}!
              </h1>
              <div className="flex items-center space-x-4">
                <p className="text-gray-600">{getRoleLabel(user.role)} Dashboard</p>
                <div className="flex items-center">
                  {user.isVerified ? (
                    <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                  ) : (
                    <Clock className="w-4 h-4 text-yellow-600 mr-1" />
                  )}
                  <span className={`text-sm ${user.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                    {user.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>

        {/* Verification Notice */}
        {!user.isVerified && (
          <div className="card bg-yellow-50 border-yellow-200 mb-8">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <h3 className="font-semibold text-yellow-800">Account Verification Pending</h3>
                <p className="text-yellow-700">
                  Your account is being verified. Once verified, you'll have access to all features including blockchain transactions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Role-specific Dashboard */}
        {renderRoleSpecificDashboard()}
      </div>
    </Layout>
  );
}