import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import MobileQRScanner from '../components/MobileQRScanner';
import { getApiUrl } from '../utils/api';
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
    Smartphone,
    Navigation,
    Copy,
    ExternalLink
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
        photo: null,
        password: ''
    });
    const [locationLoading, setLocationLoading] = useState(false);
    const [coordinates, setCoordinates] = useState(null);
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
            const response = await fetch(getApiUrl(`/api/products/${id}`));
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

    const getCurrentLocation = async () => {
        setLocationLoading(true);
        
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by this browser');
            setLocationLoading(false);
            return;
        }

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                });
            });

            const { latitude, longitude } = position.coords;
            setCoordinates({ latitude, longitude });

            // Reverse geocoding using free OpenStreetMap Nominatim API
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                    {
                        headers: {
                            'User-Agent': 'AgriTrace-App/1.0'
                        }
                    }
                );
                
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.display_name) {
                        const address = data.display_name;
                        setPurchaseData(prev => ({
                            ...prev,
                            location: address,
                            scanLocation: `${latitude.toFixed(6)}, ${longitude.toFixed(6)} (${data.address?.city || data.address?.town || data.address?.village || 'Unknown City'})`
                        }));
                    } else {
                        // Fallback to coordinates only
                        const locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                        setPurchaseData(prev => ({
                            ...prev,
                            location: locationString,
                            scanLocation: locationString
                        }));
                    }
                } else {
                    // Fallback to coordinates only
                    const locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                    setPurchaseData(prev => ({
                        ...prev,
                        location: locationString,
                        scanLocation: locationString
                    }));
                }
            } catch (geocodeError) {
                console.error('Geocoding failed:', geocodeError);
                // Use coordinates as fallback
                const locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                setPurchaseData(prev => ({
                    ...prev,
                    location: locationString,
                    scanLocation: locationString
                }));
            }

        } catch (error) {
            console.error('Error getting location:', error);
            let errorMessage = 'Unable to get location. ';
            
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += 'Location access denied by user.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += 'Location information unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMessage += 'Location request timed out.';
                    break;
                default:
                    errorMessage += 'Unknown error occurred.';
                    break;
            }
            
            alert(errorMessage + ' Please enter location manually.');
        } finally {
            setLocationLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('Copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Copied to clipboard!');
        });
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

            const response = await fetch(getApiUrl(`/api/products/${product.id}/qr-purchase`), {
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
                                        src={getApiUrl(product.photo_url)}
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

                                {/* Blockchain Status Banner */}
                                {product.blockchain_id ? (
                                    <div className="mt-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                                <span className="text-green-800 font-medium text-sm">🔗 Blockchain Verified Product</span>
                                            </div>
                                            <button
                                                onClick={() => window.open(`https://testnet.snowtrace.io/address/0x93556773D23B86D60A2468B4db203BFd06107635`, '_blank')}
                                                className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                                            >
                                                <ExternalLink className="w-3 h-3 mr-1" />
                                                Verify Independently
                                            </button>
                                        </div>
                                        <p className="text-green-700 text-xs mt-1">
                                            This product exists on Avalanche blockchain with immutable proof of authenticity
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                                            <span className="text-yellow-800 font-medium text-sm">⏳ Blockchain Registration Pending</span>
                                        </div>
                                        <p className="text-yellow-700 text-xs mt-1">
                                            Product saved to database - blockchain registration in progress
                                        </p>
                                    </div>
                                )}

                                {/* Blockchain & Supply Chain Report */}
                                <div className="pt-4 border-t">
                                    <div className="flex items-center mb-4">
                                        <h4 className="font-semibold text-gray-900 mr-2">📊 Blockchain Supply Chain Report</h4>
                                        {product.blockchain_id && (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                ⛓️ Verified
                                            </span>
                                        )}
                                    </div>

                                    {/* Blockchain Information */}
                                    {product.blockchain_id ? (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h5 className="font-medium text-green-900">🔗 Blockchain Verification</h5>
                                                <button
                                                    onClick={() => window.open(`https://testnet.snowtrace.io/address/0x93556773D23B86D60A2468B4db203BFd06107635`, '_blank')}
                                                    className="text-green-600 hover:text-green-800 text-xs flex items-center"
                                                >
                                                    <ExternalLink className="w-3 h-3 mr-1" />
                                                    View on Snowtrace
                                                </button>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                {/* Blockchain ID */}
                                                <div className="bg-white p-3 rounded-lg border">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <span className="text-green-700 font-medium text-sm">Blockchain Product ID:</span>
                                                            <p className="font-mono text-green-900 text-lg">{product.blockchain_id}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => copyToClipboard(product.blockchain_id)}
                                                            className="text-green-600 hover:text-green-800"
                                                            title="Copy Blockchain ID"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Smart Contract */}
                                                <div className="bg-white p-3 rounded-lg border">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <span className="text-green-700 font-medium text-sm">Smart Contract:</span>
                                                            <p className="font-mono text-green-900 text-xs break-all">0x93556773D23B86D60A2468B4db203BFd06107635</p>
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => copyToClipboard('0x93556773D23B86D60A2468B4db203BFd06107635')}
                                                                className="text-green-600 hover:text-green-800"
                                                                title="Copy Contract Address"
                                                            >
                                                                <Copy className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => window.open('https://testnet.snowtrace.io/address/0x93556773D23B86D60A2468B4db203BFd06107635', '_blank')}
                                                                className="text-blue-600 hover:text-blue-800"
                                                                title="View Contract on Snowtrace"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Registration Transaction */}
                                                {product.registration_tx_hash && (
                                                    <div className="bg-white p-3 rounded-lg border">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-green-700 font-medium text-sm">Registration TX Hash:</span>
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={() => copyToClipboard(product.registration_tx_hash)}
                                                                    className="text-green-600 hover:text-green-800"
                                                                    title="Copy Transaction Hash"
                                                                >
                                                                    <Copy className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => window.open(`https://testnet.snowtrace.io/tx/${product.registration_tx_hash}`, '_blank')}
                                                                    className="text-blue-600 hover:text-blue-800"
                                                                    title="View Transaction on Snowtrace"
                                                                >
                                                                    <ExternalLink className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <p className="font-mono text-green-900 text-xs break-all">{product.registration_tx_hash}</p>
                                                        <p className="text-green-600 text-xs mt-1">✅ Product registration confirmed on blockchain</p>
                                                    </div>
                                                )}

                                                {/* Network Info */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-blue-50 p-2 rounded text-center">
                                                        <p className="text-blue-700 font-medium text-sm">Network</p>
                                                        <p className="text-blue-900 text-xs">Avalanche Fuji</p>
                                                    </div>
                                                    <div className="bg-purple-50 p-2 rounded text-center">
                                                        <p className="text-purple-700 font-medium text-sm">Status</p>
                                                        <p className="text-purple-900 text-xs">✅ Verified</p>
                                                    </div>
                                                </div>

                                                {/* Verification Instructions */}
                                                <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                                                    <h6 className="font-medium text-blue-900 text-sm mb-1">🔍 Independent Verification:</h6>
                                                    <p className="text-blue-800 text-xs">
                                                        Copy any hash above and verify independently on Snowtrace explorer. 
                                                        No trust needed - pure blockchain proof!
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                            <h5 className="font-medium text-yellow-900 mb-2">⏳ Blockchain Registration Pending</h5>
                                            <p className="text-yellow-800 text-sm">This product is being processed for blockchain registration.</p>
                                        </div>
                                    )}

                                    {/* Supply Chain Journey */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                        <h5 className="font-medium text-blue-900 mb-3">🌾 Supply Chain Journey</h5>
                                        <div className="space-y-3">
                                            {/* Origin */}
                                            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">🌱 Farm Origin</p>
                                                    <p className="text-sm text-gray-600">{product.farmer_name} • {product.farm_location}</p>
                                                    <p className="text-xs text-gray-500">Harvested: {new Date(product.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Completed</span>
                                                </div>
                                            </div>

                                            {/* Current Status */}
                                            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">📦 Current Status</p>
                                                    <p className="text-sm text-gray-600">{getStatusLabel(product.status)}</p>
                                                    <p className="text-xs text-gray-500">Available for: {user?.role === 1 ? 'Distributor Purchase' : user?.role === 2 ? 'Retailer Purchase' : 'Consumer Purchase'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(product.status)}`}>
                                                        {getStatusLabel(product.status)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Transaction History */}
                                    {product.transactions && product.transactions.length > 0 && (
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                            <h5 className="font-medium text-gray-900 mb-3">📋 Transaction History</h5>
                                            <div className="space-y-3">
                                                {product.transactions.map((tx, index) => (
                                                    <div key={index} className="bg-white p-3 rounded-lg border">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <p className="font-medium text-gray-900">{tx.to_user_name}</p>
                                                                <p className="text-sm text-gray-600">📍 {tx.location}</p>
                                                                {tx.notes && <p className="text-sm text-gray-500 italic mt-1">💬 "{tx.notes}"</p>}
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs text-gray-500">
                                                                    📅 {new Date(tx.created_at).toLocaleDateString()}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    🕒 {new Date(tx.created_at).toLocaleTimeString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                                            <div className="flex items-center space-x-4 text-xs text-gray-600">
                                                                <span>💰 ₹{tx.price}</span>
                                                                <span>📦 {tx.quantity}kg</span>
                                                                {tx.tx_hash && (
                                                                    <span className="text-green-600">⛓️ Blockchain</span>
                                                                )}
                                                            </div>
                                                            {tx.photo_url && (
                                                                <img
                                                                    src={getApiUrl(tx.photo_url)}
                                                                    alt="Transaction"
                                                                    className="w-12 h-12 object-cover rounded border"
                                                                />
                                                            )}
                                                        </div>
                                                        
                                                        {tx.tx_hash && (
                                                            <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="text-green-700 font-medium text-sm">⛓️ Blockchain Transaction:</span>
                                                                    <div className="flex space-x-2">
                                                                        <button
                                                                            onClick={() => copyToClipboard(tx.tx_hash)}
                                                                            className="text-green-600 hover:text-green-800"
                                                                            title="Copy Transaction Hash"
                                                                        >
                                                                            <Copy className="w-3 h-3" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => window.open(`https://testnet.snowtrace.io/tx/${tx.tx_hash}`, '_blank')}
                                                                            className="text-blue-600 hover:text-blue-800"
                                                                            title="View on Snowtrace"
                                                                        >
                                                                            <ExternalLink className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <p className="font-mono text-green-800 text-xs break-all bg-white p-2 rounded border">{tx.tx_hash}</p>
                                                                <p className="text-green-600 text-xs mt-1">✅ Verified on Avalanche blockchain</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quality & Certification */}
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
                                        <h5 className="font-medium text-purple-900 mb-3">🏆 Quality & Certification</h5>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-purple-700 font-medium">Quality Grade:</span>
                                                <p className="text-purple-800">{product.quality_grade || 'A'}</p>
                                            </div>
                                            <div>
                                                <span className="text-purple-700 font-medium">Organic Status:</span>
                                                <p className="text-purple-800">{product.is_organic ? '✅ Certified Organic' : '❌ Conventional'}</p>
                                            </div>
                                            <div>
                                                <span className="text-purple-700 font-medium">Total Quantity:</span>
                                                <p className="text-purple-800">{product.quantity} kg</p>
                                            </div>
                                            <div>
                                                <span className="text-purple-700 font-medium">Current Price:</span>
                                                <p className="text-purple-800">₹{product.price}/kg</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
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

                            {canPurchase() ? (
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
                                        <div className="flex space-x-2">
                                            <input
                                                type="text"
                                                name="location"
                                                value={purchaseData.location}
                                                onChange={handleInputChange}
                                                required
                                                className="input-field flex-1"
                                                placeholder="Your business/warehouse location"
                                            />
                                            <button
                                                type="button"
                                                onClick={getCurrentLocation}
                                                disabled={locationLoading}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors flex items-center"
                                                title="Get current location automatically"
                                            >
                                                {locationLoading ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                ) : (
                                                    <Navigation className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                        {coordinates && (
                                            <p className="text-xs text-green-600 mt-1">
                                                📍 Location detected: {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="label">Scan Location</label>
                                        <div className="flex space-x-2">
                                            <input
                                                type="text"
                                                name="scanLocation"
                                                value={purchaseData.scanLocation}
                                                onChange={handleInputChange}
                                                required
                                                className="input-field flex-1"
                                                placeholder="Where did you scan this QR code?"
                                            />
                                            <button
                                                type="button"
                                                onClick={getCurrentLocation}
                                                disabled={locationLoading}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-md transition-colors flex items-center"
                                                title="Use current location as scan location"
                                            >
                                                {locationLoading ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                ) : (
                                                    <Navigation className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
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
                                        <label className="label">Password (for blockchain transaction) *</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={purchaseData.password}
                                            onChange={handleInputChange}
                                            required
                                            className="input-field"
                                            placeholder="Enter your registration password"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Required for blockchain transaction verification
                                        </p>
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
                            ) : user && user.role === 3 ? (
                                // Consumer View - Information Only
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

                                    {product.status === 3 ? (
                                        <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                            <h4 className="font-semibold text-blue-900 mb-2">🛒 Available for Purchase</h4>
                                            <p className="text-blue-800 text-sm">
                                                This product is available from retailers. Contact the retailer directly to make a purchase.
                                            </p>
                                        </div>
                                    ) : product.status === 4 ? (
                                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                            <h4 className="font-semibold text-gray-900 mb-2">✅ Product Sold</h4>
                                            <p className="text-gray-800 text-sm">
                                                This product has been sold to a consumer.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                                            <h4 className="font-semibold text-yellow-900 mb-2">⏳ Not Yet Available</h4>
                                            <p className="text-yellow-800 text-sm">
                                                This product is still moving through the supply chain and not yet available for consumer purchase.
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => router.push(`/simple-product/${product.id}`)}
                                        className="w-full btn-primary"
                                    >
                                        View Complete Supply Chain History
                                    </button>
                                </div>
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