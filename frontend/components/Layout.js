import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Home, 
  Leaf,
  Package, 
  Scan, 
  User, 
  LogOut, 
  BarChart3, 
  ShoppingCart, 
  Store, 
  Truck,
  DollarSign,
  Menu,
  X,
  Shield,
  MapPin,
  TrendingUp
} from 'lucide-react';

export default function Layout({ children }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('agriTrace_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Check if mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Role-based navigation based on supply chain workflow
  const getRoleBasedNavigation = (userRole) => {
    const baseNavigation = [
      { name: 'Home', href: '/', icon: Home },
    ];

    if (!user) {
      return [
        ...baseNavigation,
        { name: 'Products', href: '/products', icon: Package },
        { name: 'QR Scanner', href: '/qr-purchase', icon: Scan },
      ];
    }

    switch (userRole) {
      case 0: // Farmer - Creates batches, manages harvest
        return [
          { name: 'Dashboard', href: '/farmer-dashboard', icon: BarChart3 },
          { name: 'Harvest Log', href: '/harvest-log', icon: Package },
          { name: 'Price Check', href: '/price-check', icon: DollarSign },
          { name: 'Blockchain Verify', href: '/blockchain-verify', icon: Shield },
        ];
      
      case 1: // Distributor - Picks up from farmers, delivers to retailers
        return [
          ...baseNavigation,
          { name: 'My Dashboard', href: '/universal-dashboard', icon: BarChart3 },
          { name: 'Available Products', href: '/available-products', icon: ShoppingCart },
          { name: 'My Inventory', href: '/my-inventory', icon: Package },
          { name: 'QR Scanner', href: '/qr-purchase', icon: Scan },
          { name: 'Transport', href: '/transport', icon: Truck },
          { name: 'Blockchain Verify', href: '/blockchain-verify', icon: Shield },
        ];
      
      case 2: // Retailer - Receives from distributors, sells to consumers
        return [
          { name: 'Dashboard', href: '/retailer-dashboard', icon: BarChart3 },
          { name: 'Inventory', href: '/retailer-inventory', icon: Package },
          { name: 'Products', href: '/retailer-products', icon: Store },
          { name: 'QR Scanner', href: '/qr-purchase', icon: Scan },
          { name: 'Blockchain Verify', href: '/blockchain-verify', icon: Shield },
        ];
      
      case 3: // Consumer - Traces products, views supply chain
        return [
          { name: 'Dashboard', href: '/consumer-dashboard', icon: BarChart3 },
          { name: 'QR Scanner', href: '/consumer-scanner', icon: Scan },
          { name: 'Product History', href: '/product-history', icon: Package },
          { name: 'Blockchain Verify', href: '/blockchain-verify', icon: Shield },
        ];
      
      default:
        return baseNavigation;
    }
  };

  const navigation = getRoleBasedNavigation(user?.role);

  const handleLogout = () => {
    localStorage.removeItem('agriTrace_token');
    localStorage.removeItem('agriTrace_user');
    setUser(null);
    router.push('/simple-login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Leaf className="w-8 h-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">AgriTrace</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>

            {/* User Info & Mobile Menu */}
            <div className="flex items-center space-x-2">
              {user && !isMobile && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    {user.name}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    user.role === 0 ? 'bg-green-100 text-green-800' :
                    user.role === 1 ? 'bg-blue-100 text-blue-800' :
                    user.role === 2 ? 'bg-purple-100 text-purple-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {['🌾 Farmer', '🚛 Distributor', '🏪 Retailer', '👤 Consumer'][user.role]}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
              {user && (
                <div className={`px-3 py-2 mb-2 rounded-md ${
                  user.role === 0 ? 'bg-green-50 border border-green-200' :
                  user.role === 1 ? 'bg-blue-50 border border-blue-200' :
                  user.role === 2 ? 'bg-purple-50 border border-purple-200' :
                  'bg-orange-50 border border-orange-200'
                }`}>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-600">
                    {['🌾 Farmer', '🚛 Distributor', '🏪 Retailer', '👤 Consumer'][user.role]} • {user.location}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {user.role === 0 && 'Create batches, manage harvest'}
                    {user.role === 1 && 'Transport products, manage logistics'}
                    {user.role === 2 && 'Sell products, manage store'}
                    {user.role === 3 && 'Trace products, view supply chain'}
                  </p>
                </div>
              )}
              
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                    router.pathname === item.href
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
              
              {user && (
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors mt-4"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Leaf className="w-8 h-8 text-primary-500" />
                <span className="text-xl font-bold">AgriTrace</span>
              </div>
              <p className="text-gray-400 mb-4">
                Revolutionizing agricultural supply chains through blockchain technology. 
                Ensuring transparency, fairness, and quality from farm to consumer.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
                <li><Link href="/how-it-works" className="text-gray-400 hover:text-white">How It Works</Link></li>
                <li><Link href="/register" className="text-gray-400 hover:text-white">Register</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-gray-400 hover:text-white">Help Center</Link></li>
                <li><Link href="/docs" className="text-gray-400 hover:text-white">Documentation</Link></li>
                <li><Link href="/api" className="text-gray-400 hover:text-white">API</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AgriTrace. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}