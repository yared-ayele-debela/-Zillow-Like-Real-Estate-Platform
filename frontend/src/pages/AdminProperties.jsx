import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon, XMarkIcon, StarIcon } from '@heroicons/react/24/outline';
import adminService from '../services/adminService';
import AdminLayout from '../components/admin/AdminLayout';

const AdminProperties = () => {
  const [properties, setProperties] = useState([]);
  const [agents, setAgents] = useState([]);
  const [filters, setFilters] = useState({ status: '', is_approved: '', is_featured: '', search: '', user_id: '' });

  const fetchProperties = useCallback(async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.is_approved !== '') params.is_approved = filters.is_approved;
      if (filters.is_featured !== '') params.is_featured = filters.is_featured;
      if (filters.search) params.search = filters.search;
      if (filters.user_id) params.user_id = filters.user_id;

      const data = await adminService.getProperties(params);
      setProperties(data.data || []);
    } catch (err) {
      console.error('Properties error:', err);
    }
  }, [filters]);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const data = await adminService.getUsers({ role: 'agent', per_page: 200 });
        const list = data.data ?? data;
        setAgents(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Agents load error:', err);
      }
    };
    loadAgents();
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);


  const handleApprove = async (id) => {
    try {
      await adminService.approveProperty(id);
      fetchProperties();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve property');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason (optional):');
    try {
      await adminService.rejectProperty(id, reason);
      fetchProperties();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject property');
    }
  };

  const handleFeature = async (id) => {
    try {
      await adminService.featureProperty(id);
      fetchProperties();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update featured status');
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Property Management</h1>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
              <select
                value={filters.user_id}
                onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All agents</option>
                {agents.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} {u.email ? `(${u.email})` : ''}</option>
                ))}
              </select>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Approval</label>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Featured</label>
              <select
                value={filters.is_featured}
                onChange={(e) => setFilters({ ...filters, is_featured: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All</option>
                <option value="true">Featured</option>
                <option value="false">Not Featured</option>
              </select>
            </div>
          </div>
        </div>

        {/* Properties Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {properties.map((property) => (
                <tr key={property.id}>
                  <td className="px-6 py-4">
                    <Link to={`/properties/${property.id}`} className="text-indigo-600 hover:text-indigo-700">
                      {property.title}
                    </Link>
                    <p className="text-sm text-gray-500">{property.address}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{property.user?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded ${
                          property.status === 'for_sale'
                            ? 'bg-green-100 text-green-800'
                            : property.status === 'for_rent'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {property.status?.replace('_', ' ')}
                      </span>
                      {!property.is_approved && (
                        <span className="inline-flex px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                      {property.is_featured && (
                        <span className="inline-flex px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">${property.price?.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      {!property.is_approved && (
                        <>
                          <button
                            onClick={() => handleApprove(property.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Approve"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleReject(property.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Reject"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleFeature(property.id)}
                        className={`${property.is_featured ? 'text-yellow-600' : 'text-gray-400'} hover:text-yellow-900`}
                        title="Feature"
                      >
                        <StarIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProperties;
