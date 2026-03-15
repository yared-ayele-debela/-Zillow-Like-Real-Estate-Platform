import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { propertyService } from '../services/propertyService';
import AgentLayout from '../components/agent/AgentLayout';
import { DEFAULT_PROPERTY_IMAGE } from '../utils/defaultImages';
import { propertySlug } from '../utils/propertyRoute';

const MyProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    is_approved: '',
    search: '',
  });
  const [pagination, setPagination] = useState({});

  const fetchProperties = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = { page };
      if (filters.status) params.status = filters.status;
      if (filters.is_approved !== '') params.is_approved = filters.is_approved;
      if (filters.search) params.search = filters.search;

      const data = await propertyService.getMyProperties(params);
      setProperties(data.data || []);
      setPagination({
        current_page: data.current_page,
        last_page: data.last_page,
        per_page: data.per_page,
        total: data.total,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load properties');
      console.error('Properties error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProperties(1);
  }, [fetchProperties]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this property?')) {
      return;
    }

    try {
      await propertyService.deleteProperty(id);
      fetchProperties();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete property');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await propertyService.updateAvailability(id, status);
      fetchProperties();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading && properties.length === 0) {
    return (
      <AgentLayout>
        <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading properties...</p>
          </div>
        </div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Properties</h1>
            <p className="mt-2 text-gray-600">Manage your property listings</p>
          </div>
          <Link
            to="/properties/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-600"
          >
            <PlusIcon className="h-5 w-5" />
            Add New Property
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search properties..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Statuses</option>
                <option value="for_sale">For Sale</option>
                <option value="for_rent">For Rent</option>
                <option value="sold">Sold</option>
                <option value="off_market">Off Market</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Approval Status</label>
              <select
                value={filters.is_approved}
                onChange={(e) => setFilters({ ...filters, is_approved: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All</option>
                <option value="true">Approved</option>
                <option value="false">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Properties List */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {properties.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No properties found</p>
            <Link
              to="/properties/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-600"
            >
              <PlusIcon className="h-5 w-5" />
              Add Your First Property
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saves
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {properties.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={property.primary_image?.image_url || property.primary_image?.thumbnail_url || DEFAULT_PROPERTY_IMAGE}
                          alt={property.title}
                          className="h-12 w-12 object-cover rounded mr-4"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = DEFAULT_PROPERTY_IMAGE;
                          }}
                        />
                        <div>
                          <Link
                            to={`/properties/${propertySlug(property)}`}
                            className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                          >
                            {property.title}
                          </Link>
                          <p className="text-sm text-gray-500">
                            {property.address}, {property.city}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            property.status === 'for_sale'
                              ? 'bg-emerald-100 text-emerald-700'
                              : property.status === 'for_rent'
                              ? 'bg-blue-100 text-blue-800'
                              : property.status === 'sold'
                              ? 'bg-white text-gray-900'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {property.status?.replace('_', ' ')}
                        </span>
                        {!property.is_approved && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending Approval
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${property.price?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {property.views || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {property.saves || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/properties/${propertySlug(property)}`}
                          className="text-indigo-600 hover:text-indigo-600"
                          title="View"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <Link
                          to={`/properties/${property.id}/edit`}
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Link>
                        <Link
                          to={`/properties/${propertySlug(property)}/stats`}
                          className="text-purple-600 hover:text-purple-900"
                          title="Stats"
                        >
                          <ChartBarIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(property.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                        <select
                          value={property.status}
                          onChange={(e) => handleStatusChange(property.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="for_sale">For Sale</option>
                          <option value="for_rent">For Rent</option>
                          <option value="sold">Sold</option>
                          <option value="off_market">Off Market</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="mt-6 flex justify-center gap-2 flex-wrap">
            <button
              onClick={() => fetchProperties(pagination.current_page - 1)}
              disabled={pagination.current_page <= 1}
              className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => fetchProperties(page)}
                className={`px-4 py-2 border rounded ${
                  pagination.current_page === page
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => fetchProperties(pagination.current_page + 1)}
              disabled={pagination.current_page >= pagination.last_page}
              className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
        </div>
      </div>
    </AgentLayout>
  );
};

export default MyProperties;
