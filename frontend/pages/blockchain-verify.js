import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Search, ExternalLink, CheckCircle, XCircle, Clock, Shield, Eye, Copy } from 'lucide-react';
import { getApiUrl } from '../utils/api';

export default function BlockchainVerify() {
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('product'); // product, transaction, address
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setVerificationData(null);

    try {
      let endpoint = '';
      switch (searchType) {
        case 'product':
          endpoint = `/api/blockchain/verify-product/${searchQuery}`;
          break;
        case 'transaction':
          endpoint = `/api/blockchain/verify-transaction/${searchQuery}`;
          break;
        case 'address':
          endpoint = `/api/blockchain/verify-address/${searchQuery}`;
          break;
      }

      const response = await fetch(getApiUrl(endpoint));
      const data = await response.json();

      if (response.ok) {
        setVerificationData(data);
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Network error during verification');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const openInExplorer = (txHash) => {
    const explorerUrl = `https://testnet.snowtrace.io/tx/${txHash}`;
    window.open(explorerUrl, '_blank');
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-12 h-12 text-blue-600 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">Blockchain Verification</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Verify the authenticity of any product, transaction, or address on the Avalanche blockchain. 
              Get real-time proof that your supply chain data is immutable and transparent.
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Query
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter Product ID, Transaction Hash, or Wallet Address"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Type
                  </label>
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="product">Product ID</option>
                    <option value="transaction">Transaction Hash</option>
                    <option value="address">Wallet Address</option>
                  </select>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Verifying on Blockchain...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Verify on Blockchain
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <div className="flex items-center">
                <XCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800 font-medium">Verification Failed</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Verification Results */}
          {verificationData && (
            <div className="space-y-6">
              {/* Verification Status */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  {verificationData.verified ? (
                    <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600 mr-3" />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {verificationData.verified ? 'Blockchain Verified ✅' : 'Not Verified ❌'}
                    </h2>
                    <p className="text-gray-600">
                      {verificationData.verified 
                        ? 'This data exists on the Avalanche blockchain and is immutable'
                        : 'This data could not be verified on the blockchain'
                      }
                    </p>
                  </div>
                </div>

                {verificationData.verified && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-900 mb-2">🔗 Blockchain Network</h3>
                      <p className="text-green-800">Avalanche Fuji Testnet</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2">📅 Verification Time</h3>
                      <p className="text-blue-800">{new Date().toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Information */}
              {verificationData.product && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">📦 Product Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-gray-700">Product Name:</span>
                        <p className="text-gray-900">{verificationData.product.name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Variety:</span>
                        <p className="text-gray-900">{verificationData.product.variety}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Farmer:</span>
                        <p className="text-gray-900">{verificationData.product.farmer_name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Farm Location:</span>
                        <p className="text-gray-900">{verificationData.product.farm_location}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-gray-700">Quantity:</span>
                        <p className="text-gray-900">{verificationData.product.quantity} kg</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Quality Grade:</span>
                        <p className="text-gray-900">{verificationData.product.quality_grade}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Organic:</span>
                        <p className="text-gray-900">{verificationData.product.is_organic ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Blockchain ID:</span>
                        <div className="flex items-center">
                          <p className="font-mono text-gray-900 mr-2">{verificationData.product.blockchain_id}</p>
                          <button
                            onClick={() => copyToClipboard(verificationData.product.blockchain_id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction History */}
              {verificationData.transactions && verificationData.transactions.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Blockchain Transaction History</h3>
                  <div className="space-y-4">
                    {verificationData.transactions.map((tx, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{tx.type || 'Transfer'}</h4>
                            <p className="text-sm text-gray-600">
                              {tx.from_user_name} → {tx.to_user_name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              {new Date(tx.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm font-medium text-gray-900">₹{tx.price}</p>
                          </div>
                        </div>
                        
                        {tx.tx_hash && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-sm font-medium text-gray-700">Transaction Hash:</span>
                                <p className="font-mono text-xs text-gray-900 break-all">{tx.tx_hash}</p>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => copyToClipboard(tx.tx_hash)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Copy hash"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openInExplorer(tx.tx_hash)}
                                  className="text-green-600 hover:text-green-800"
                                  title="View on Snowtrace"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Smart Contract Information */}
              {verificationData.contract && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">📜 Smart Contract Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-900 mb-2">Contract Address</h4>
                      <div className="flex items-center">
                        <p className="font-mono text-sm text-purple-800 mr-2 break-all">
                          {verificationData.contract.address}
                        </p>
                        <button
                          onClick={() => copyToClipboard(verificationData.contract.address)}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-indigo-900 mb-2">Network</h4>
                      <p className="text-indigo-800">Avalanche Fuji Testnet</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Information Panel */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mt-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">🔍 How Blockchain Verification Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">✅ What Gets Verified</h4>
                <ul className="space-y-1">
                  <li>• Product registration on blockchain</li>
                  <li>• Transaction authenticity</li>
                  <li>• Wallet address ownership</li>
                  <li>• Smart contract interactions</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">🔗 Verification Sources</h4>
                <ul className="space-y-1">
                  <li>• Direct smart contract queries</li>
                  <li>• Avalanche blockchain explorer</li>
                  <li>• Transaction hash validation</li>
                  <li>• Real-time blockchain data</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
