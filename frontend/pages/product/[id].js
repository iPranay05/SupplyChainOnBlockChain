import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useWeb3 } from '../_app';
import Layout from '../../components/Layout';
import QRCode from 'react-qr-code';
import { 
  getProduct, 
  getProductTransactions, 
  getProductOwnershipHistory,
  formatPrice, 
  formatDate, 
  getProductStatus,
  getStakeholderRole 
} from '../../utils/contract';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Award, 
  DollarSign, 
  User, 
  Truck, 
  QrCode,
  ExternalLink 
} from 'lucide-react';

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { contract } = useWeb3();
  
  const [product, setProduct] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [ownershipHistory, setOwnershipHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (id && contract) {
      loadProductData();
    }
  }, [id, contract]);

  const loadProductData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [productData, transactionData, ownershipData] = await Promise.all([
        getProduct(id),
        getProductTransactions(id),
        getProductOwnershipHistory(id)
      ]);
      
      setProduct(productData);
      setTransactions(transactionData);
      setOwnershipHistory(ownershipData);
    } catch (error) {
      console.error('Error loading product data:', error);
      setError('Failed to load product data');
    } finally {
      setLoading(false);
    }
  };

  const getQrData = () => {
    if (typeof window === 'undefined') return '';
    
    return JSON.stringify({
      productId: id,
      name: product?.name,
      farmer: product?.farmer,
      harvestDate: product?.harvestDate?.toString(),
      url: `${window.location.origin}/product/${id}`
    });
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The requested product could not be found.'}</p>
            <button
              onClick={() => router.push('/products')}
              className="btn-primary"
            >
              Back to Products
            </button>
          </div>
        </div>
      </Layout>
    );
  }

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
                    <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Farm Location</p>
                      <p className="font-medium">{product.farmLocation}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Harvest Date</p>
                      <p className="font-medium">{formatDate(product.harvestDate)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Award className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Quality Grade</p>
                      <p className="font-medium">{product.qualityGrade}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Current Price</p>
                      <p className="font-medium text-lg">${formatPrice(product.currentPrice)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Farmer</p>
                      <p className="font-medium font-mono text-sm">
                        {product.farmer.slice(0, 6)}...{product.farmer.slice(-4)}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-block px-3 py-1 text-sm rounded-full ${getStatusColor(product.status)}`}>
                      {getProductStatus(product.status)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">Quantity:</span>
                  <span className="ml-2 font-medium">{product.quantity.toString()} units</span>
                </div>
                {product.isOrganic && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                    Organic Certified
                  </span>
                )}
              </div>
            </div>

            {/* Transaction History */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
              <div className="space-y-4">
                {transactions.map((transaction, index) => (
                  <div key={index} className="border-l-4 border-primary-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {getTransactionType(transaction.txType)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(transaction.timestamp)} • {transaction.location}
                        </p>
                        {transaction.from !== '0x0000000000000000000000000000000000000000' && (
                          <p className="text-xs text-gray-500 mt-1">
                            From: {transaction.from.slice(0, 6)}...{transaction.from.slice(-4)}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          To: {transaction.to.slice(0, 6)}...{transaction.to.slice(-4)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{transaction.quantity.toString()} units</p>
                        {transaction.price > 0 && (
                          <p className="text-sm text-gray-600">
                            ${formatPrice(transaction.price)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Code */}
            {showQR && (
              <div className="card text-center">
                <h3 className="text-lg font-semibold mb-4">Product QR Code</h3>
                <QRCode value={getQrData()} size={200} className="mx-auto mb-4" />
                <p className="text-sm text-gray-600">
                  Scan this QR code to quickly access product information
                </p>
              </div>
            )}

            {/* Ownership History */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Ownership Chain</h3>
              <div className="space-y-3">
                {ownershipHistory.map((owner, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-mono text-sm">
                        {owner.slice(0, 6)}...{owner.slice(-4)}
                      </p>
                      {index === 0 && (
                        <p className="text-xs text-gray-500">Original Farmer</p>
                      )}
                      {index === ownershipHistory.length - 1 && index > 0 && (
                        <p className="text-xs text-gray-500">Current Owner</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Blockchain Info */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Blockchain Info</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Product ID:</span>
                  <span className="ml-2 font-mono">{product.id.toString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">IPFS Hash:</span>
                  <span className="ml-2 font-mono text-xs break-all">
                    {product.ipfsHash || 'Not available'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function getStatusColor(status) {
  const colors = {
    0: 'bg-green-100 text-green-800', // Harvested
    1: 'bg-yellow-100 text-yellow-800', // InTransit
    2: 'bg-blue-100 text-blue-800', // AtDistributor
    3: 'bg-purple-100 text-purple-800', // AtRetailer
    4: 'bg-gray-100 text-gray-800', // Sold
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function getTransactionType(txType) {
  const types = {
    0: 'Harvest',
    1: 'Transfer',
    2: 'Sale'
  };
  return types[txType] || 'Unknown';
}