import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import MobileQRScanner from '../components/MobileQRScanner';
import {
    QrCode,
    Camera,
    Upload,
    Search,
    Package,
    User,
    MapPin,
    Calendar,
    DollarSign,
    ShoppingCart,
    Smartphone
} from 'lucide-react';

export default function QRPurchase() {
    const router = useRouter();
    const { productId } = router.query;
    
    const [user, setUser] = useState(null);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [manualId, setManualId] = useState(productId || '');
    const [showMobileScanner, setShowMobileScanner] = useState(false);
    const [purchaseData, setPurchaseData] = useState({
        price: '',
        location: '',
        notes: '',
        scanLocation: '',
        photo: null
    });
    const fileInputRef = useRef(null);

    useEffect(() => {
        loadUser();
        if (productId) {
            fetchProductData(productId);
        }
    }, [productId]);

    const loadUser = () => {
        const userData = localStorage.getItem('agriTrace_user');
        if (userData) {
            setUser(JSON.parse(userData));
        } else {
            router.push('/simple-login');
        }
    };

    const fetchProductData = async (id) => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`http://localhost:3002/api/products/${id}`);
            const data = await response.json();

            if (response.ok) {
                setProduct(data);
                setPurchaseData(prev => ({
                    ...prev,
                    price: data.price || 0
                }));
            } else {
                setError(data.error || 'Product not found');
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            setError('Failed to fetch product data');
        } finally {
            setLoading(false);
        }
    };

    const handleScan = (result) => {
        if (result) {
            try {
                const data = JSON.parse(result);
                if (data.productId) {
                    fetchProductData(data.productId);
                } else {
                    setError('Invalid QR code format');
                }
            } catch (error) {
                // If not JSON, treat as product ID
                if (/^\d+$/.test(result)) {
                    fetchProductData(result);
                } else {
                    setError('Invalid QR code data');
                }
            }
        }
    };


    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (file) {
            setError('');
            setLoading(true);

            try {
                // Import jsQR dynamically
                const jsQR = (await import('jsqr')).default;
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        
                        canvas.width = img.width;
                        canvas.height = img.height;
                        context.drawImage(img, 0, 0);
                        
                        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                        const code = jsQR(imageData.data, imageData.width, imageData.height);
                        
                        if (code) {
                            console.log('QR Code detected from file:', code.data);
                            handleScan(code.data);
                        } else {
                            setError('No QR code found in the uploaded image.');
                        }
                        setLoading(false);
                    };
                    img.onerror = () => {
                        setError('Error loading image file.');
                        setLoading(false);
                    };
                    img.src = e.target.result;
                };
                reader.onerror = () => {
                    setError('Error reading file.');
                    setLoading(false);
                };
                reader.readAsDataURL(file);
            } catch (error) {
                setError('Error processing QR code from file');
                setLoading(false);
            }
        }
    };

    const handleManualSearch = async (e) => {
        e.preventDefault();
        if (manualId && /^\d+$/.test(manualId)) {
            await fetchProductData(manualId);
        } else {
            setError('Please enter a valid product ID');
        }
    };

    const handlePurchase = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('agriTrace_token');
            const formData = new FormData();

            formData.append('price', purchaseData.price);
            formData.append('location', purchaseData.location);
            formData.append('notes', purchaseData.notes);
            formData.append('scanLocation', purchaseData.scanLocation);

            if (purchaseData.photo) {
                formData.append('photo', purchaseData.photo);
            }

            const response = await fetch(`http://localhost:3002/api/products/${product.id}/qr-purchase`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                alert('🎉 Product purchased successfully! Transaction recorded on blockchain.');
                router.push('/universal-dashboard');
            } else {
                setError(data.error || 'Purchase failed');
            }
        } catch (error) {
            console.error('Purchase error:', error);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        setPurchaseData(prev => ({
            ...prev,
            [name]: files ? files[0] : value
        }));
    };

    const canPurchase = () => {
        if (!user || !product) return false;

        // Check if user role matches product status
        return (
            (user.role === 1 && product.status === 0) || // Distributor can buy from Farmer
            (user.role === 2 && product.status === 2) || // Retailer can buy from Distributor
            (user.role === 3 && product.status === 3)    // Consumer can buy from Retailer
        );
    };

    const getRoleLabel = (role) => {
        const roles = ['Farmer', 'Distributor', 'Retailer', 'Consumer'];
        return roles[role] || 'Unknown';
    };

    const getStatusLabel = (status) => {
        const labels = ['Available from Farmer', 'In Transit', 'Available from Distributor', 'Available from Retailer', 'Sold'];
        return labels[status] || 'Unknown';
    };

    const getStatusColor = (status) => {
        const colors = {
            0: 'bg-green-100 text-green-800',
            1: 'bg-yellow-100 text-yellow-800',
            2: 'bg-blue-100 text-blue-800',
            3: 'bg-purple-100 text-purple-800',
            4: 'bg-gray-100 text-gray-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center mb-8">
                    <QrCode className="w-16 h-16 text-primary-600 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {user && user.role === 3 ? 'QR Product Scanner' : 'QR Purchase System'}
                    </h1>
                    <p className="text-gray-600">
                        {user && user.role === 3
                            ? 'Scan QR codes to view complete supply chain history'
                            : 'Scan QR codes to purchase products and add to blockchain'
                        }
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                {/* QR Scanning Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Camera Scanner */}
                    <div className="card">
                        <h2 className="text-lg font-semibold mb-4 flex items-center">
                            <Camera className="w-5 h-5 mr-2" />
                            Mobile Camera Scanner
                        </h2>

                        <div className="text-center py-6">
                            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <button
                                onClick={() => setShowMobileScanner(true)}
                                className="btn-primary text-sm w-full"
                            >
                                Start Camera Scanner
                            </button>
                        </div>
                    </div>

                    {/* File Upload */}
                    <div className="card">
                        <h2 className="text-lg font-semibold mb-4 flex items-center">
                            <Upload className="w-5 h-5 mr-2" />
                            Upload QR Image
                        </h2>

                        <div className="text-center py-6">
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                ref={fileInputRef}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="btn-secondary text-sm w-full"
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Choose Image'}
                            </button>
                        </div>
                    </div>

                    {/* Manual Search */}
                    <div className="card">
                        <h2 className="text-lg font-semibold mb-4 flex items-center">
                            <Search className="w-5 h-5 mr-2" />
                            Manual Search
                        </h2>

                        <form onSubmit={handleManualSearch} className="space-y-3">
                            <input
                                type="text"
                                value={manualId}
                                onChange={(e) => setManualId(e.target.value)}
                                placeholder="Product ID"
                                className="input-field text-sm"
                            />
                            <button
                                type="submit"
                                className="btn-primary text-sm w-full"
                                disabled={loading}
                            >
                                {loading ? 'Searching...' : 'Search'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Product Information */}
                {product && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Product Details */}
                        <div className="card">
                            <h2 className="text-xl font-semibold mb-4 flex items-center">
                                <Package className="w-5 h-5 mr-2" />
                                Product Information
                            </h2>

                            {product.photo_url && (
                                <div className="mb-4">
                                    <img
                                        src={`http://localhost:3002${product.photo_url}`}
                                        alt={product.name}
                                        className="w-full h-48 object-cover rounded-lg"
                                    />
                                </div>
                            )}

                            <div className="space-y-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                                    <p className="text-gray-600">{product.variety}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center text-gray-600">
                                        <User className="w-4 h-4 mr-2" />
                                        <div>
                                            <p className="text-xs text-gray-500">Farmer</p>
                                            <p className="font-medium">{product.farmer_name}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center text-gray-600">
                                        <MapPin className="w-4 h-4 mr-2" />
                                        <div>
                                            <p className="text-xs text-gray-500">Location</p>
                                            <p className="font-medium">{product.farm_location}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center text-gray-600">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        <div>
                                            <p className="text-xs text-gray-500">Harvest Date</p>
                                            <p className="font-medium">{new Date(product.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center text-gray-600">
                                        <DollarSign className="w-4 h-4 mr-2" />
                                        <div>
                                            <p className="text-xs text-gray-500">Price</p>
                                            <p className="font-medium">₹{product.price}/kg</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t">
                                    <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(product.status)}`}>
                                        {getStatusLabel(product.status)}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                        Quantity: {product.quantity} kg
                                    </span>
                                </div>

                                {/* Transaction History */}
                                {product.transactions && product.transactions.length > 0 && (
                                    <div className="pt-4 border-t">
                                        <h4 className="font-semibold text-gray-900 mb-2">Supply Chain History</h4>
                                        <div className="space-y-2">
                                            {product.transactions.map((tx, index) => (
                                                <div key={index} className="text-sm bg-gray-50 p-3 rounded">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium">{tx.to_user_name}</p>
                                                            <p className="text-gray-600">{tx.location}</p>
                                                            {tx.notes && <p className="text-gray-500 italic">"{tx.notes}"</p>}
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(tx.created_at).toLocaleDateString()}
                                                            </p>
                                                            {tx.photo_url && (
                                                                <img
                                                                    src={`http://localhost:3002${tx.photo_url}`}
                                                                    alt="Transaction"
                                                                    className="w-12 h-12 object-cover rounded mt-1"
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Purchase Form */}
                        <div className="card">
                            <h2 className="text-xl font-semibold mb-4 flex items-center">
                                <ShoppingCart className="w-5 h-5 mr-2" />
                                Purchase Product
                            </h2>

                            {user && (
                                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-blue-800">
                                        <strong>Your Role:</strong> {getRoleLabel(user.role)}
                                    </p>
                                </div>
                            )}

                            {user && user.role === 3 ? (
                                // Consumer View - Scan Only
                                <div className="text-center py-8">
                                    <QrCode className="w-16 h-16 text-primary-600 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Product Information
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        As a consumer, you can view the complete supply chain history of this product.
                                    </p>

                                    <div className="bg-green-50 p-4 rounded-lg mb-4">
                                        <h4 className="font-semibold text-green-900 mb-2">✅ Verified Supply Chain</h4>
                                        <p className="text-green-800 text-sm">
                                            This product has been tracked through the complete supply chain with blockchain verification.
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => router.push(`/simple-product/${product.id}`)}
                                        className="w-full btn-primary"
                                    >
                                        View Complete Supply Chain History
                                    </button>
                                </div>
                            ) : canPurchase() ? (
                                <form onSubmit={handlePurchase} className="space-y-4">
                                    <div>
                                        <label className="label">Purchase Price (₹/kg)</label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={purchaseData.price}
                                            onChange={handleInputChange}
                                            required
                                            min="0"
                                            step="0.01"
                                            className="input-field"
                                            placeholder="Enter your purchase price"
                                        />
                                    </div>

                                    <div>
                                        <label className="label">Your Location</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={purchaseData.location}
                                            onChange={handleInputChange}
                                            required
                                            className="input-field"
                                            placeholder="Your business/warehouse location"
                                        />
                                    </div>

                                    <div>
                                        <label className="label">Scan Location</label>
                                        <input
                                            type="text"
                                            name="scanLocation"
                                            value={purchaseData.scanLocation}
                                            onChange={handleInputChange}
                                            required
                                            className="input-field"
                                            placeholder="Where did you scan this QR code?"
                                        />
                                    </div>

                                    <div>
                                        <label className="label">Notes (Optional)</label>
                                        <textarea
                                            name="notes"
                                            value={purchaseData.notes}
                                            onChange={handleInputChange}
                                            className="input-field"
                                            rows="3"
                                            placeholder="Any additional notes about this purchase..."
                                        />
                                    </div>

                                    <div>
                                        <label className="label">Upload Photo</label>
                                        <input
                                            type="file"
                                            name="photo"
                                            onChange={handleInputChange}
                                            accept="image/*"
                                            className="input-field"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Upload a photo of the product or transaction
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full btn-primary disabled:opacity-50"
                                    >
                                        {loading ? 'Processing Purchase...' : 'Purchase & Add to Blockchain'}
                                    </button>
                                </form>
                            ) : (
                                <div className="text-center py-8">
                                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Cannot Purchase
                                    </h3>
                                    <p className="text-gray-600">
                                        {!user
                                            ? 'Please login to view products'
                                            : product.status === 4
                                                ? 'This product has already been sold'
                                                : `This product is not available for ${getRoleLabel(user.role)}s at this stage`
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Instructions */}
                <div className="card bg-blue-50 border-blue-200 mt-8">
                    <h3 className="font-semibold text-blue-900 mb-2">How QR System Works</h3>
                    <ul className="text-blue-800 text-sm space-y-1">
                        <li>🌾 <strong>Farmers</strong> upload products with photos and generate QR codes</li>
                        <li>🚛 <strong>Distributors</strong> scan QR codes to purchase from farmers (adds their details + photo)</li>
                        <li>🏪 <strong>Retailers</strong> scan QR codes to purchase from distributors (adds their details + photo)</li>
                        <li>🛒 <strong>Consumers</strong> scan QR codes to view complete farm-to-table journey</li>
                        <li>📱 Each purchase scan adds details, photos, and timestamps to the blockchain</li>
                        <li>🔍 Consumers get complete transparency without purchasing</li>
                    </ul>
                </div>
            </div>

            {/* Mobile QR Scanner */}
            {showMobileScanner && (
                <MobileQRScanner
                    onScan={handleScan}
                    onClose={() => setShowMobileScanner(false)}
                />
            )}
        </Layout>
    );
}