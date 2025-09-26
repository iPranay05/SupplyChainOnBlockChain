import { useState, useEffect } from 'react';
import {
    ShoppingBag,
    QrCode,
    Search,
    Star,
    MapPin,
    Calendar,
    Award,
    Leaf
} from 'lucide-react';
import { useRouter } from 'next/router';

export default function ConsumerDashboard({ user, onUserUpdate }) {
    const router = useRouter();
    const [availableProducts, setAvailableProducts] = useState([]);
    const [myPurchases, setMyPurchases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [availableProducts, searchTerm]);

    const loadData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('agriTrace_token');

            // Load available products from retailers
            const availableResponse = await fetch('http://localhost:3002/api/products/available', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (availableResponse.ok) {
                const availableData = await availableResponse.json();
                setAvailableProducts(availableData.filter(p => p.status === 3)); // AtRetailer
            }

            // Load my purchases
            const myResponse = await fetch('http://localhost:3002/api/products/my', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (myResponse.ok) {
                const myData = await myResponse.json();
                setMyPurchases(myData);
            }

        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterProducts = () => {
        if (!searchTerm) {
            setFilteredProducts(availableProducts);
            return;
        }

        const filtered = availableProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.farm_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.farmer_name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        setFilteredProducts(filtered);
    };

    const handleViewProduct = (productId) => {
        router.push(`/simple-product/${productId}`);
    };

    const handleScanQR = () => {
        router.push('/qr-purchase');
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
        const labels = ['Harvested', 'In Transit', 'At Distributor', 'Available in Store', 'Sold'];
        return labels[status] || 'Unknown';
    };

    return (
        <div>
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={handleScanQR}>
                    <div className="text-center py-6">
                        <QrCode className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Scan QR Code</h3>
                        <p className="text-gray-600">Scan product QR codes to view complete traceability</p>
                    </div>
                </div>

                <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/products')}>
                    <div className="text-center py-6">
                        <Search className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Browse Products</h3>
                        <p className="text-gray-600">Explore all available products in the marketplace</p>
                    </div>
                </div>

                <div className="card hover:shadow-lg transition-shadow">
                    <div className="text-center py-6">
                        <ShoppingBag className="w-12 h-12 text-green-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">My Purchases</h3>
                        <p className="text-gray-600">{myPurchases.length} products purchased</p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
                <div className="max-w-md mx-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search products, farmers, or locations..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Available Products for Viewing */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Products to Explore</h2>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading available products...</p>
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className="card hover:shadow-lg transition-shadow">
                                <div className="mb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                                        {product.is_organic && (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                                                <Leaf className="w-3 h-3 mr-1" />
                                                Organic
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-600 mb-3">{product.variety}</p>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center text-gray-600">
                                            <MapPin className="w-4 h-4 mr-2" />
                                            <span>{product.farm_location}</span>
                                        </div>

                                        <div className="flex items-center text-gray-600">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            <span>Harvested: {new Date(product.created_at).toLocaleDateString()}</span>
                                        </div>

                                        <div className="flex items-center text-gray-600">
                                            <Award className="w-4 h-4 mr-2" />
                                            <span>Grade: {product.quality_grade}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mb-4">
                                    <div className="text-lg font-bold text-gray-900">
                                        ₹{product.price}/kg
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(product.status)}`}>
                                        {getStatusLabel(product.status)}
                                    </span>
                                </div>

                                <div className="text-sm text-gray-600 mb-4">
                                    <p>Farmer: <span className="font-medium">{product.farmer_name}</span></p>
                                    <p>Available: <span className="font-medium">{product.quantity} kg</span></p>
                                </div>

                                <div className="space-y-2">
                                    <button
                                        onClick={() => handleViewProduct(product.id)}
                                        className="w-full btn-primary"
                                    >
                                        View Full Traceability
                                    </button>

                                    {product.blockchain_id && (
                                        <div className="text-center">
                                            <span className="text-xs text-green-600">✅ Blockchain Verified</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {searchTerm ? 'No products found' : 'No products available'}
                        </h3>
                        <p className="text-gray-600">
                            {searchTerm
                                ? 'Try adjusting your search terms'
                                : 'Check back later for new products from local retailers'
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* My Purchases */}
            {myPurchases.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">My Purchases</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myPurchases.map((product) => (
                            <div key={product.id} className="card">
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                                    <p className="text-gray-600">{product.variety}</p>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600 mb-4">
                                    <div className="flex justify-between">
                                        <span>Purchase Date:</span>
                                        <span>{new Date(product.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Quantity:</span>
                                        <span>{product.quantity} kg</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Price:</span>
                                        <span>₹{product.price}/kg</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleViewProduct(product.id)}
                                    className="w-full btn-secondary"
                                >
                                    View Details
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}