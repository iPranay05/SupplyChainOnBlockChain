import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import QRCode from 'react-qr-code';
import {
    ArrowLeft,
    MapPin,
    Calendar,
    Award,
    DollarSign,
    User,
    Package,
    QrCode,
    Phone,
    Truck
} from 'lucide-react';

export default function SimpleProductDetail() {
    const router = useRouter();
    const { id } = router.query;

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showQR, setShowQR] = useState(false);

    useEffect(() => {
        if (id) {
            loadProductData();
        }
    }, [id]);

    const loadProductData = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`http://localhost:3002/api/products/${id}`);
            const data = await response.json();

            if (response.ok) {
                setProduct(data);
            } else {
                setError(data.error || 'Product not found');
            }
        } catch (error) {
            console.error('Error loading product data:', error);
            setError('Failed to load product data');
        } finally {
            setLoading(false);
        }
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

    const getTransactionTypeLabel = (txType) => {
        const types = ['Harvest', 'Transfer', 'Sale'];
        return types[txType] || 'Unknown';
    };

    if (loading) {
        return (
            <Layout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading product details...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error || !product) {
        return (
            <Layout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center py-12">
                        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
                        <p className="text-gray-600 mb-6">{error || 'The requested product could not be found.'}</p>
                        <button
                            onClick={() => router.push('/scan')}
                            className="btn-primary"
                        >
                            Scan Another Product
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    const qrData = JSON.stringify({
        productId: product.id,
        name: product.name,
        farmer: product.farmer_name,
        location: product.farm_location,
        harvestDate: product.created_at,
        url: `${window.location.origin}/simple-product/${product.id}`
    });

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </button>

                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                            <p className="text-lg text-gray-600">{product.variety}</p>
                        </div>
                        <button
                            onClick={() => setShowQR(!showQR)}
                            className="btn-secondary flex items-center"
                        >
                            <QrCode className="w-4 h-4 mr-2" />
                            {showQR ? 'Hide QR' : 'Show QR'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Product Information */}
                        <div className="card">
                            <h2 className="text-xl font-semibold mb-4">Product Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <User className="w-5 h-5 text-gray-400 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-600">Farmer</p>
                                            <p className="font-medium">{product.farmer_name}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-600">Farm Location</p>
                                            <p className="font-medium">{product.farm_location}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-600">Harvest Date</p>
                                            <p className="font-medium">{new Date(product.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <Award className="w-5 h-5 text-gray-400 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-600">Quality Grade</p>
                                            <p className="font-medium">{product.quality_grade}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-600">Price</p>
                                            <p className="font-medium text-lg">₹{product.price}/kg</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        <Package className="w-5 h-5 text-gray-400 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-600">Status</p>
                                            <span className={`inline-block px-3 py-1 text-sm rounded-full ${getStatusColor(product.status)}`}>
                                                {getStatusLabel(product.status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center space-x-4">
                                <div className="flex items-center">
                                    <span className="text-sm text-gray-600">Quantity:</span>
                                    <span className="ml-2 font-medium">{product.quantity} kg</span>
                                </div>
                                {product.is_organic && (
                                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                                        Organic Certified
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Transaction History */}
                        {product.transactions && product.transactions.length > 0 && (
                            <div className="card">
                                <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
                                <div className="space-y-4">
                                    {product.transactions.map((transaction, index) => (
                                        <div key={index} className="border-l-4 border-primary-500 pl-4 py-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium">
                                                        {getTransactionTypeLabel(transaction.tx_type)}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {new Date(transaction.created_at).toLocaleDateString()} • {transaction.location}
                                                    </p>
                                                    {transaction.from_user_name && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            From: {transaction.from_user_name}
                                                        </p>
                                                    )}
                                                    {transaction.to_user_name && (
                                                        <p className="text-xs text-gray-500">
                                                            To: {transaction.to_user_name}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">{transaction.quantity} kg</p>
                                                    {transaction.price > 0 && (
                                                        <p className="text-sm text-gray-600">
                                                            ₹{transaction.price}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* QR Code */}
                        {showQR && (
                            <div className="card text-center">
                                <h3 className="text-lg font-semibold mb-4">Product QR Code</h3>
                                <QRCode value={qrData} size={200} className="mx-auto mb-4" />
                                <p className="text-sm text-gray-600">
                                    Scan this QR code to quickly access product information
                                </p>
                            </div>
                        )}

                        {/* Farmer Contact */}
                        <div className="card">
                            <h3 className="text-lg font-semibold mb-4">Farmer Information</h3>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                    <User className="w-5 h-5 text-primary-600" />
                                    <div>
                                        <p className="font-medium">{product.farmer_name}</p>
                                        <p className="text-sm text-gray-600">{product.farmer_location}</p>
                                    </div>
                                </div>
                                {product.farmer_phone && (
                                    <div className="flex items-center space-x-3">
                                        <Phone className="w-5 h-5 text-primary-600" />
                                        <div>
                                            <p className="font-medium">{product.farmer_phone}</p>
                                            <p className="text-sm text-gray-600">Contact Farmer</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Blockchain Verification */}
                        {product.blockchain_id ? (
                            <div className="card bg-green-50 border-green-200">
                                <h3 className="text-lg font-semibold mb-4 text-green-800">Blockchain Verified</h3>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-green-600">✅ Registered on blockchain</span>
                                    </div>
                                    <div>
                                        <span className="text-green-600">Blockchain ID:</span>
                                        <span className="ml-2 font-mono">{product.blockchain_id}</span>
                                    </div>
                                    <p className="text-green-700 text-xs mt-2">
                                        This product's information is permanently recorded on the blockchain, ensuring authenticity and traceability.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="card bg-yellow-50 border-yellow-200">
                                <h3 className="text-lg font-semibold mb-4 text-yellow-800">Pending Blockchain Registration</h3>
                                <p className="text-yellow-700 text-sm">
                                    This product is being processed for blockchain registration to ensure complete traceability.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}