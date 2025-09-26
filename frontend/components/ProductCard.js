import { useState } from 'react';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { MapPin, Calendar, Award, DollarSign, QrCode, Eye, Leaf } from 'lucide-react';

export default function ProductCard({ product, showActions = false }) {
    const [showQR, setShowQR] = useState(false);

    // Handle both database and blockchain product formats and convert BigNumbers
    const safeConvert = (value) => {
        if (value && typeof value === 'object' && value._hex !== undefined) {
            // This is a BigNumber object
            return parseFloat(value.toString());
        }
        return value;
    };

    const productData = {
        id: safeConvert(product.id),
        name: product.name || '',
        variety: product.variety || '',
        farmLocation: product.farm_location || product.farmLocation || '',
        harvestDate: product.created_at || product.harvestDate,
        qualityGrade: product.quality_grade || product.qualityGrade || '',
        isOrganic: product.is_organic !== undefined ? product.is_organic : product.isOrganic,
        price: safeConvert(product.price || product.currentPrice) || 0,
        quantity: safeConvert(product.quantity) || 0,
        status: safeConvert(product.status) || 0,
        farmer: product.farmer_name || product.farmer || '',
        blockchainId: safeConvert(product.blockchain_id)
    };

    const qrData = JSON.stringify({
        productId: productData.id,
        name: productData.name,
        farmer: productData.farmer,
        harvestDate: productData.harvestDate,
        url: `${typeof window !== 'undefined' ? window.location.origin : ''}/simple-product/${productData.id}`
    });

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return 'Unknown';
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
        <div className="card hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {productData.name}
                    </h3>
                    <p className="text-sm text-gray-600">{productData.variety}</p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setShowQR(!showQR)}
                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                        title="Show QR Code"
                    >
                        <QrCode className="w-4 h-4" />
                    </button>
                    <Link
                        href={`/simple-product/${productData.id}`}
                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                        title="View Details"
                    >
                        <Eye className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {showQR && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg text-center">
                    <QRCode value={qrData} size={128} className="mx-auto" />
                    <p className="text-xs text-gray-600 mt-2">Scan to view product details</p>
                </div>
            )}

            <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{productData.farmLocation}</span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Harvested: {formatDate(productData.harvestDate)}</span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                    <Award className="w-4 h-4 mr-2" />
                    <span>Grade: {productData.qualityGrade}</span>
                    {productData.isOrganic && (
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                            <Leaf className="w-3 h-3 mr-1" />
                            Organic
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span className="font-semibold text-gray-900">
                            ₹{Number(productData.price).toFixed(2)}/kg
                        </span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(productData.status)}`}>
                        {getStatusLabel(productData.status)}
                    </span>
                </div>

                <div className="text-xs text-gray-500">
                    Quantity: {Number(productData.quantity).toFixed(0)} kg
                </div>

                {productData.blockchainId && (
                    <div className="text-xs text-green-600">
                        ✅ Blockchain ID: {String(productData.blockchainId)}
                    </div>
                )}
            </div>

            {!showActions && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <Link
                        href={`/simple-product/${productData.id}`}
                        className="block w-full text-center btn-primary"
                    >
                        View Full Trace
                    </Link>
                </div>
            )}
        </div>
    );
}