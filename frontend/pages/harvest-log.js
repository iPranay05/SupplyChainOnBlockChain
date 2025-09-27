import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Plus, Calendar, Package, MapPin, Leaf, TrendingUp, Download, Filter, Search, Edit, Trash2, Eye, QrCode } from 'lucide-react';
import { getApiUrl } from '../utils/api';
import QRCode from 'react-qr-code';

export default function HarvestLog() {
  const [harvests, setHarvests] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHarvest, setEditingHarvest] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showQRs, setShowQRs] = useState({});
  const [stats, setStats] = useState({
    totalHarvests: 0,
    totalQuantity: 0,
    totalValue: 0,
    avgYield: 0
  });

  const [formData, setFormData] = useState({
    cropName: '',
    variety: '',
    plantingDate: '',
    harvestDate: '',
    fieldLocation: '',
    fieldSize: '',
    quantityHarvested: '',
    unit: 'kg',
    qualityGrade: 'A',
    isOrganic: false,
    pricePerUnit: '',
    totalValue: '',
    weatherConditions: '',
    soilType: '',
    fertilizersUsed: '',
    pesticideUsed: '',
    irrigationMethod: '',
    notes: ''
  });

  // Mock harvest data
  const mockHarvests = [
    {
      id: 1,
      cropName: 'Tomato',
      variety: 'Hybrid',
      plantingDate: '2024-06-15',
      harvestDate: '2024-09-20',
      fieldLocation: 'Field A-1',
      fieldSize: 2.5,
      quantityHarvested: 1500,
      unit: 'kg',
      qualityGrade: 'A',
      isOrganic: true,
      pricePerUnit: 25,
      totalValue: 37500,
      weatherConditions: 'Good rainfall',
      soilType: 'Loamy',
      fertilizersUsed: 'Organic compost',
      pesticideUsed: 'None',
      irrigationMethod: 'Drip irrigation',
      notes: 'Excellent yield this season',
      createdAt: '2024-09-20'
    },
    {
      id: 2,
      cropName: 'Wheat',
      variety: 'HD-2967',
      plantingDate: '2024-11-15',
      harvestDate: '2024-04-10',
      fieldLocation: 'Field B-2',
      fieldSize: 5.0,
      quantityHarvested: 2800,
      unit: 'kg',
      qualityGrade: 'A+',
      isOrganic: false,
      pricePerUnit: 30,
      totalValue: 84000,
      weatherConditions: 'Optimal temperature',
      soilType: 'Clay loam',
      fertilizersUsed: 'NPK, Urea',
      pesticideUsed: 'Fungicide spray',
      irrigationMethod: 'Flood irrigation',
      notes: 'Good market price achieved',
      createdAt: '2024-04-10'
    }
  ];

  useEffect(() => {
    loadHarvestData();
  }, []);

  const loadHarvestData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('agriTrace_token');
      if (!token) {
        // If no token, show empty state
        setHarvests([]);
        calculateStats([]);
        setLoading(false);
        return;
      }

      // Fetch real data from API
      const response = await fetch(getApiUrl('/api/products/my'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const products = await response.json();
        
        // Convert products to harvest format
        const harvestData = products.map(product => ({
          id: product.id,
          cropName: product.name,
          variety: product.variety || 'Unknown',
          plantingDate: product.planting_date || product.created_at,
          harvestDate: product.created_at,
          fieldLocation: product.farm_location || product.farmLocation || 'Unknown',
          fieldSize: product.field_size || 1.0,
          quantityHarvested: product.quantity || 0,
          unit: 'kg',
          qualityGrade: product.quality_grade || product.qualityGrade || 'A',
          isOrganic: product.is_organic || product.isOrganic || false,
          pricePerUnit: product.price || 0,
          totalValue: (product.quantity || 0) * (product.price || 0),
          weatherConditions: product.weather_conditions || 'Good conditions',
          soilType: product.soil_type || 'Loamy',
          fertilizersUsed: product.fertilizers_used || 'Standard fertilizers',
          pesticideUsed: product.pesticide_used || 'Minimal use',
          irrigationMethod: product.irrigation_method || 'Drip irrigation',
          notes: product.notes || 'Good harvest',
          createdAt: product.created_at,
          // Blockchain status
          blockchainId: product.blockchain_id,
          isOnBlockchain: Boolean(product.blockchain_id),
          txHash: product.tx_hash
        }));

        // Only show real data from database/blockchain
        setHarvests(harvestData);
        calculateStats(harvestData);
      } else {
        // No data available
        setHarvests([]);
        calculateStats([]);
      }
    } catch (error) {
      console.error('Error loading harvest data:', error);
      // No data on error
      setHarvests([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (harvestData) => {
    const totalHarvests = harvestData.length;
    const totalQuantity = harvestData.reduce((sum, h) => sum + h.quantityHarvested, 0);
    const totalValue = harvestData.reduce((sum, h) => sum + h.totalValue, 0);
    const totalArea = harvestData.reduce((sum, h) => sum + h.fieldSize, 0);
    const avgYield = totalArea > 0 ? totalQuantity / totalArea : 0;

    setStats({
      totalHarvests,
      totalQuantity,
      totalValue,
      avgYield
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Auto-calculate total value
    if (name === 'quantityHarvested' || name === 'pricePerUnit') {
      const quantity = name === 'quantityHarvested' ? parseFloat(value) || 0 : parseFloat(formData.quantityHarvested) || 0;
      const price = name === 'pricePerUnit' ? parseFloat(value) || 0 : parseFloat(formData.pricePerUnit) || 0;
      setFormData(prev => ({
        ...prev,
        totalValue: (quantity * price).toFixed(2)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newHarvest = {
        id: editingHarvest ? editingHarvest.id : Date.now(),
        ...formData,
        quantityHarvested: parseFloat(formData.quantityHarvested),
        fieldSize: parseFloat(formData.fieldSize),
        pricePerUnit: parseFloat(formData.pricePerUnit),
        totalValue: parseFloat(formData.totalValue),
        createdAt: new Date().toISOString().split('T')[0]
      };

      // For now, just update local state (you can add API call later)
      if (editingHarvest) {
        setHarvests(prev => prev.map(h => h.id === editingHarvest.id ? newHarvest : h));
      } else {
        setHarvests(prev => [...prev, newHarvest]);
      }

      calculateStats(editingHarvest ? 
        harvests.map(h => h.id === editingHarvest.id ? newHarvest : h) : 
        [...harvests, newHarvest]
      );

      resetForm();
    } catch (error) {
      console.error('Error saving harvest record:', error);
      alert('Failed to save harvest record');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      cropName: '', variety: '', plantingDate: '', harvestDate: '',
      fieldLocation: '', fieldSize: '', quantityHarvested: '', unit: 'kg',
      qualityGrade: 'A', isOrganic: false, pricePerUnit: '', totalValue: '',
      weatherConditions: '', soilType: '', fertilizersUsed: '', pesticideUsed: '',
      irrigationMethod: '', notes: ''
    });
    setShowAddForm(false);
    setEditingHarvest(null);
  };

  const editHarvest = (harvest) => {
    if (harvest.isOnBlockchain) {
      alert('⛓️ This record is stored on the blockchain and cannot be edited.\n\nBlockchain records are immutable to ensure data integrity and trust in the supply chain.');
      return;
    }
    setFormData(harvest);
    setEditingHarvest(harvest);
    setShowAddForm(true);
  };

  const deleteHarvest = (harvest) => {
    if (harvest.isOnBlockchain) {
      alert('⛓️ This record is stored on the blockchain and cannot be deleted.\n\nBlockchain records are immutable to ensure data integrity and trust in the supply chain.');
      return;
    }
    
    if (confirm('Are you sure you want to delete this harvest record?')) {
      const updated = harvests.filter(h => h.id !== harvest.id);
      setHarvests(updated);
      calculateStats(updated);
    }
  };

  const toggleQR = (harvestId) => {
    setShowQRs(prev => ({
      ...prev,
      [harvestId]: !prev[harvestId]
    }));
  };

  const filteredHarvests = harvests.filter(harvest => {
    const matchesSearch = harvest.cropName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         harvest.variety.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterPeriod === 'all') return matchesSearch;
    
    const harvestDate = new Date(harvest.harvestDate);
    const now = new Date();
    const monthsAgo = filterPeriod === 'month' ? 1 : filterPeriod === 'quarter' ? 3 : 12;
    const cutoff = new Date(now.getFullYear(), now.getMonth() - monthsAgo, now.getDate());
    
    return matchesSearch && harvestDate >= cutoff;
  });

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Harvest Log</h1>
              <p className="text-gray-600">Track and manage your harvest records</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Harvest Record
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card text-center">
              <Package className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.totalHarvests}</div>
              <div className="text-gray-600">Total Harvests</div>
            </div>
            <div className="card text-center">
              <Leaf className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.totalQuantity.toLocaleString()}</div>
              <div className="text-gray-600">Total Quantity (kg)</div>
            </div>
            <div className="card text-center">
              <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">₹{stats.totalValue.toLocaleString()}</div>
              <div className="text-gray-600">Total Value</div>
            </div>
            <div className="card text-center">
              <MapPin className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.avgYield.toFixed(1)}</div>
              <div className="text-gray-600">Avg Yield (kg/acre)</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search crops..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 input-field"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="pl-10 input-field"
                >
                  <option value="all">All Time</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last 3 Months</option>
                  <option value="year">Last Year</option>
                </select>
              </div>
              <button className="btn-secondary flex items-center justify-center">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>

          {/* Harvest Records */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading harvest records...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredHarvests.map((harvest) => (
                <div key={harvest.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{harvest.cropName}</h3>
                      <p className="text-sm text-gray-600">{harvest.variety}</p>
                    </div>
                    <div className="flex space-x-2">
                      {harvest.isOnBlockchain && (
                        <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                          ⛓️ On Blockchain
                        </div>
                      )}
                      <button
                        onClick={() => toggleQR(harvest.id)}
                        className={`p-2 rounded-md transition-all duration-200 ${
                          showQRs[harvest.id] 
                            ? 'bg-blue-100 text-blue-600 shadow-sm' 
                            : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                        title={showQRs[harvest.id] ? "Hide QR Code" : "Show QR Code"}
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => editHarvest(harvest)}
                        className={`p-2 ${harvest.isOnBlockchain ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-blue-600'}`}
                        title={harvest.isOnBlockchain ? 'Cannot edit blockchain records' : 'Edit record'}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteHarvest(harvest)}
                        className={`p-2 ${harvest.isOnBlockchain ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-600'}`}
                        title={harvest.isOnBlockchain ? 'Cannot delete blockchain records' : 'Delete record'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Harvest Date</div>
                      <div className="font-medium">{new Date(harvest.harvestDate).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Field Location</div>
                      <div className="font-medium">{harvest.fieldLocation}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Quantity</div>
                      <div className="font-medium">{harvest.quantityHarvested} {harvest.unit}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Total Value</div>
                      <div className="font-medium text-green-600">₹{harvest.totalValue.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        harvest.qualityGrade === 'A+' ? 'bg-green-100 text-green-800' :
                        harvest.qualityGrade === 'A' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        Grade {harvest.qualityGrade}
                      </span>
                      {harvest.isOrganic && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center">
                          <Leaf className="w-3 h-3 mr-1" />
                          Organic
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      Yield: {(harvest.quantityHarvested / harvest.fieldSize).toFixed(1)} kg/acre
                    </div>
                  </div>

                  {/* Blockchain Information */}
                  {harvest.isOnBlockchain && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center mb-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-sm font-medium text-green-800">Blockchain Verified</span>
                        </div>
                        <div className="text-xs text-green-700 space-y-1">
                          <div>Blockchain ID: {harvest.blockchainId}</div>
                          {harvest.txHash && <div>TX Hash: {harvest.txHash.substring(0, 20)}...</div>}
                          <div className="text-green-600">🔒 This record is immutable and cannot be modified</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* QR Code Display */}
                  {showQRs[harvest.id] && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-sm">
                        <div className="flex items-center justify-center mb-4">
                          <div className="bg-blue-600 p-2 rounded-full mr-3">
                            <QrCode className="w-5 h-5 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-blue-900">Product QR Code</h4>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg shadow-inner mb-4">
                          <QRCode 
                            value={JSON.stringify({
                              productId: harvest.id,
                              name: harvest.cropName,
                              variety: harvest.variety,
                              farmer: harvest.farmer || 'Unknown',
                              location: harvest.fieldLocation,
                              harvestDate: harvest.harvestDate,
                              blockchainId: harvest.blockchainId,
                              url: `${typeof window !== 'undefined' ? window.location.origin : ''}/simple-product/${harvest.id}`
                            })}
                            size={180}
                            className="mx-auto"
                            style={{
                              height: "auto",
                              maxWidth: "100%",
                              width: "180px",
                            }}
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="bg-blue-100 p-3 rounded-lg">
                            <p className="text-sm font-medium text-blue-900 mb-1">📱 How to Scan:</p>
                            <p className="text-xs text-blue-700">
                              Open your phone camera or QR scanner app and point it at the code above
                            </p>
                          </div>

                          {harvest.isOnBlockchain ? (
                            <div className="bg-green-100 p-3 rounded-lg border border-green-200">
                              <div className="flex items-center mb-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                <span className="text-sm font-medium text-green-800">⛓️ Blockchain Verified</span>
                              </div>
                              <p className="text-xs text-green-700">
                                This QR code links to immutable blockchain data ensuring complete traceability
                              </p>
                            </div>
                          ) : (
                            <div className="bg-yellow-100 p-3 rounded-lg border border-yellow-200">
                              <div className="flex items-center mb-1">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                                <span className="text-sm font-medium text-yellow-800">⏳ Database Record</span>
                              </div>
                              <p className="text-xs text-yellow-700">
                                Product information stored in database - blockchain registration pending
                              </p>
                            </div>
                          )}

                          <div className="bg-gray-100 p-3 rounded-lg">
                            <p className="text-xs text-gray-600 text-center">
                              <span className="font-medium">Product ID:</span> {harvest.id} • 
                              <span className="font-medium"> Generated:</span> {new Date().toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleQR(harvest.id)}
                          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          Hide QR Code
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add/Edit Form Modal */}
          {showAddForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-6">
                    {editingHarvest ? 'Edit Harvest Record' : 'Add New Harvest Record'}
                  </h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="label">Crop Name *</label>
                        <input
                          type="text"
                          name="cropName"
                          value={formData.cropName}
                          onChange={handleInputChange}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Variety</label>
                        <input
                          type="text"
                          name="variety"
                          value={formData.variety}
                          onChange={handleInputChange}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="label">Planting Date</label>
                        <input
                          type="date"
                          name="plantingDate"
                          value={formData.plantingDate}
                          onChange={handleInputChange}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="label">Harvest Date *</label>
                        <input
                          type="date"
                          name="harvestDate"
                          value={formData.harvestDate}
                          onChange={handleInputChange}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Field Location *</label>
                        <input
                          type="text"
                          name="fieldLocation"
                          value={formData.fieldLocation}
                          onChange={handleInputChange}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Field Size (acres) *</label>
                        <input
                          type="number"
                          step="0.1"
                          name="fieldSize"
                          value={formData.fieldSize}
                          onChange={handleInputChange}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Quantity Harvested *</label>
                        <input
                          type="number"
                          name="quantityHarvested"
                          value={formData.quantityHarvested}
                          onChange={handleInputChange}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Unit</label>
                        <select
                          name="unit"
                          value={formData.unit}
                          onChange={handleInputChange}
                          className="input-field"
                        >
                          <option value="kg">Kilograms</option>
                          <option value="tons">Tons</option>
                          <option value="quintals">Quintals</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Quality Grade</label>
                        <select
                          name="qualityGrade"
                          value={formData.qualityGrade}
                          onChange={handleInputChange}
                          className="input-field"
                        >
                          <option value="A+">A+ (Premium)</option>
                          <option value="A">A (Good)</option>
                          <option value="B">B (Average)</option>
                          <option value="C">C (Below Average)</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Price per Unit (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          name="pricePerUnit"
                          value={formData.pricePerUnit}
                          onChange={handleInputChange}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="label">Total Value (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          name="totalValue"
                          value={formData.totalValue}
                          onChange={handleInputChange}
                          className="input-field"
                          readOnly
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="isOrganic"
                          checked={formData.isOrganic}
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        <label className="text-sm font-medium text-gray-700">Organic Certified</label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="label">Weather Conditions</label>
                        <input
                          type="text"
                          name="weatherConditions"
                          value={formData.weatherConditions}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="e.g., Good rainfall, Drought conditions"
                        />
                      </div>
                      <div>
                        <label className="label">Soil Type</label>
                        <input
                          type="text"
                          name="soilType"
                          value={formData.soilType}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="e.g., Loamy, Clay, Sandy"
                        />
                      </div>
                      <div>
                        <label className="label">Fertilizers Used</label>
                        <input
                          type="text"
                          name="fertilizersUsed"
                          value={formData.fertilizersUsed}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="e.g., NPK, Organic compost"
                        />
                      </div>
                      <div>
                        <label className="label">Irrigation Method</label>
                        <select
                          name="irrigationMethod"
                          value={formData.irrigationMethod}
                          onChange={handleInputChange}
                          className="input-field"
                        >
                          <option value="">Select method</option>
                          <option value="Drip irrigation">Drip irrigation</option>
                          <option value="Sprinkler">Sprinkler</option>
                          <option value="Flood irrigation">Flood irrigation</option>
                          <option value="Rain-fed">Rain-fed</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="label">Notes</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows={3}
                        className="input-field"
                        placeholder="Additional notes about this harvest..."
                      />
                    </div>

                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">
                        {editingHarvest ? 'Update Record' : 'Save Record'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
