import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { QrCode, Camera, Upload, Search, Package, User, MapPin, Calendar } from 'lucide-react';

export default function Scan() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [manualId, setManualId] = useState('');
  const [error, setError] = useState('');
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

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

  const fetchProductData = async (productId) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`http://localhost:3002/api/products/${productId}`);
      const data = await response.json();
      
      if (response.ok) {
        setProductData(data);
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

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setError('');
      setLoading(true);
      
      try {
        // For demo purposes, let's simulate QR code reading from file
        // In production, you'd use a library like jsQR
        setTimeout(() => {
          setError('File upload QR scanning: Please use manual search for now');
          setLoading(false);
        }, 1000);
      } catch (error) {
        setError('Error reading QR code from file');
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

  const startCamera = async () => {
    setScanning(true);
    setError('');
    
    try {
      // For demo purposes, simulate camera scanning
      // In production, you'd use react-qr-reader or similar
      setTimeout(() => {
        setError('Camera QR scanning: Please use manual search for demo');
        setScanning(false);
      }, 2000);
    } catch (error) {
      setError('Camera access denied or not available');
      setScanning(false);
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

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <QrCode className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Scan Product QR Code</h1>
          <p className="text-gray-600">
            Scan a QR code to instantly access product traceability information
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Scanning Options */}
          <div className="space-y-6">
            {/* Camera Scanner */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Camera className="w-5 h-5 mr-2" />
                Camera Scanner
              </h2>
              
              {scanning ? (
                <div className="text-center py-8">
                  <div className="w-64 h-64 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <div className="animate-pulse">
                      <Camera className="w-16 h-16 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">Simulating camera scan...</p>
                  <button
                    onClick={() => setScanning(false)}
                    className="btn-secondary"
                  >
                    Stop Scanning
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Scan QR codes from product packaging
                  </p>
                  <button
                    onClick={startCamera}
                    className="btn-primary"
                  >
                    Start Camera
                  </button>
                </div>
              )}
            </div>

            {/* File Upload */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload QR Code Image
              </h2>
              
              <div className="text-center py-8">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Upload a photo containing a QR code
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Choose Image'}
                </button>
              </div>
            </div>

            {/* Manual Search */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Manual Product Search
              </h2>
              
              <form onSubmit={handleManualSearch} className="space-y-4">
                <div>
                  <label className="label">Product ID</label>
                  <input
                    type="text"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    placeholder="Enter product ID (e.g., 1, 2, 3...)"
                    className="input-field"
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Searching...' : 'Search Product'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Product Information */}
          <div className="space-y-6">
            {productData ? (
              <div className="card">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Product Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{productData.name}</h3>
                    <p className="text-gray-600">{productData.variety}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 mr-2" />
                      <div>
                        <p className="text-xs text-gray-500">Farmer</p>
                        <p className="font-medium">{productData.farmer_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <div>
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="font-medium">{productData.farm_location}</p>
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <div>
                        <p className="text-xs text-gray-500">Harvest Date</p>
                        <p className="font-medium">{new Date(productData.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Package className="w-4 h-4 mr-2" />
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(productData.status)}`}>
                          {getStatusLabel(productData.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Quality Grade</p>
                        <p className="font-medium">{productData.quality_grade}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Price</p>
                        <p className="font-medium">₹{productData.price}/kg</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Quantity</p>
                        <p className="font-medium">{productData.quantity} kg</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Organic</p>
                        <p className="font-medium">{productData.is_organic ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>

                  {productData.blockchain_id && (
                    <div className="bg-green-50 p-3 rounded-md">
                      <p className="text-green-800 text-sm">
                        ✅ Verified on blockchain (ID: {productData.blockchain_id})
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => router.push(`/product/${productData.id}`)}
                    className="w-full btn-primary"
                  >
                    View Full Traceability
                  </button>
                </div>
              </div>
            ) : (
              <div className="card bg-gray-50">
                <div className="text-center py-12">
                  <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Scan a QR Code</h3>
                  <p className="text-gray-600">
                    Product information will appear here after scanning
                  </p>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="card bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">How to Use</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Use camera to scan QR codes on product packaging</li>
                <li>• Upload a photo containing a QR code</li>
                <li>• Enter product ID manually for quick lookup</li>
                <li>• View complete farm-to-consumer traceability</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}