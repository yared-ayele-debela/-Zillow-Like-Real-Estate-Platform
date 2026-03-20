import { useEffect, useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import adminService from '../services/adminService';

const AdminLocations = () => {
  const [locations, setLocations] = useState([]);
  const [locationForm, setLocationForm] = useState({
    state: '',
    city: '',
    sort_order: 0,
    is_active: true,
  });
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const data = await adminService.getLocations();
      setLocations(data?.locations || []);
    } catch (error) {
      console.error('Failed to load locations:', error);
      alert(error.response?.data?.message || 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const resetLocationForm = () => {
    setLocationForm({
      state: '',
      city: '',
      sort_order: 0,
      is_active: true,
    });
    setEditingLocationId(null);
  };

  const saveLocation = async () => {
    const payload = {
      state: locationForm.state.trim(),
      city: locationForm.city.trim(),
      sort_order: Number(locationForm.sort_order) || 0,
      is_active: Boolean(locationForm.is_active),
    };

    if (!payload.state || !payload.city) {
      alert('State and city are required');
      return;
    }

    try {
      setSaving(true);
      if (editingLocationId) {
        await adminService.updateLocation(editingLocationId, payload);
      } else {
        await adminService.createLocation(payload);
      }
      resetLocationForm();
      fetchLocations();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const editLocation = (location) => {
    setEditingLocationId(location.id);
    setLocationForm({
      state: location.state || '',
      city: location.city || '',
      sort_order: location.sort_order ?? 0,
      is_active: Boolean(location.is_active),
    });
  };

  const deleteLocation = async (locationId) => {
    if (!window.confirm('Delete this location?')) return;
    try {
      await adminService.deleteLocation(locationId);
      fetchLocations();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete location');
    }
  };

  const toggleLocationActive = async (location) => {
    try {
      await adminService.updateLocation(location.id, { is_active: !location.is_active });
      fetchLocations();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update location');
    }
  };

  const syncLocationsFromProperties = async () => {
    try {
      const result = await adminService.syncLocations();
      fetchLocations();
      alert(`${result.created_count || 0} new locations synced from properties`);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to sync locations');
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Locations</h1>
          <button
            onClick={syncLocationsFromProperties}
            className="px-3 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 text-sm"
          >
            Sync From Properties
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingLocationId ? 'Edit Location' : 'Add New Location'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="State (e.g. CA)"
                value={locationForm.state}
                onChange={(e) =>
                  setLocationForm({ ...locationForm, state: e.target.value.toUpperCase() })
                }
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                placeholder="City (e.g. Los Angeles)"
                value={locationForm.city}
                onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="number"
                min="0"
                placeholder="Sort Order"
                value={locationForm.sort_order}
                onChange={(e) =>
                  setLocationForm({ ...locationForm, sort_order: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={locationForm.is_active}
                  onChange={(e) =>
                    setLocationForm({ ...locationForm, is_active: e.target.checked })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Active
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={saveLocation}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingLocationId ? 'Update Location' : 'Add Location'}
              </button>
              {editingLocationId && (
                <button
                  onClick={resetLocationForm}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    State
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    City
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sort
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                      Loading locations...
                    </td>
                  </tr>
                )}
                {!loading && locations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                      No locations found. Add one or sync from properties.
                    </td>
                  </tr>
                )}
                {!loading &&
                  locations.map((location) => (
                    <tr key={location.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{location.state}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{location.city}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{location.sort_order}</td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => toggleLocationActive(location)}
                          className={`px-2 py-1 rounded text-xs ${
                            location.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {location.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => editLocation(location)}
                            className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteLocation(location.id)}
                            className="px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminLocations;
