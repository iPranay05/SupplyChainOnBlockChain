import { useState, useEffect } from 'react';
import { useWeb3 } from './_app';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { getAllProducts } from '../utils/contract';
import { Search, Filter, Package } from 'lucide-react';

export default function Products() {
  const { contract } = useWeb3();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    isOrganic: '',
    qualityGrade: ''
  });

  useEffect(() => {
    if (contract) {
      loadProducts();
    }
  }, [contract]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, filters]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const allProducts = await getAllProducts();
      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.farmLocation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== '') {
      filtered = filtered.filter(product => product.status === parseInt(filters.status));
    }

    // Organic filter
    if (filters.isOrganic !== '') {
      filtered = filtered.filter(product => product.isOrganic === (filters.isOrganic === 'true'));
    }

    // Quality grade filter
    if (filters.qualityGrade) {
      filtered = filtered.filter(product => 
        product.qualityGrade.toLowerCase().includes(filters.qualityGrade.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      status: '',
      isOrganic: '',
      qualityGrade: ''
    });
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: '0', label: 'Harvested' },
    { value: '1', label: 'In Transit' },
    { value: '2', label: 'At Distributor' },
    { value: '3', label: 'At Retailer' },
    { value: '4', label: 'Sold' }
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">All Products</h1>
          <p className="text-gray-600">
            Browse and track agricultural products in the AgriTrace network
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="label">
                <Search className="w-4 h-4 inline mr-2" />
                Search Products
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, variety, or location..."
                className="input-field"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="label">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input-field"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Organic Filter */}
            <div>
              <label className="label">Organic</label>
              <select
                value={filters.isOrganic}
                onChange={(e) => handleFilterChange('isOrganic', e.target.value)}
                className="input-field"
              >
                <option value="">All Products</option>
                <option value="true">Organic Only</option>
                <option value="false">Non-Organic</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full btn-secondary"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
          </p>
          <button
            onClick={loadProducts}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">
              {products.length === 0 
                ? 'No products have been registered yet.' 
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}