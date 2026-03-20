import { useEffect, useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import adminService from '../services/adminService';

const AdminPermissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPermissionId, setEditingPermissionId] = useState(null);
  const [permissionForm, setPermissionForm] = useState({
    name: '',
    guard_name: 'web',
  });

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const data = await adminService.getPermissions();
      setPermissions(data || []);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const resetPermissionForm = () => {
    setEditingPermissionId(null);
    setPermissionForm({
      name: '',
      guard_name: 'web',
    });
  };

  const savePermission = async () => {
    if (!permissionForm.name.trim()) {
      alert('Permission name is required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: permissionForm.name.trim(),
        guard_name: permissionForm.guard_name || 'web',
      };

      if (editingPermissionId) {
        await adminService.updatePermission(editingPermissionId, payload);
      } else {
        await adminService.createPermission(payload);
      }

      resetPermissionForm();
      fetchPermissions();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.name?.[0] ||
        'Failed to save permission';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const editPermission = (permission) => {
    setEditingPermissionId(permission.id);
    setPermissionForm({
      name: permission.name || '',
      guard_name: permission.guard_name || 'web',
    });
  };

  const deletePermission = async (permissionId) => {
    if (!window.confirm('Delete this permission?')) return;
    try {
      await adminService.deletePermission(permissionId);
      fetchPermissions();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete permission');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500">Loading permissions...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Permissions</h1>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Create/Edit Permission Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingPermissionId ? 'Edit Permission' : 'Create Permission'}
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Permission name (e.g. manage users)"
                value={permissionForm.name}
                onChange={(e) => setPermissionForm({ ...permissionForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                placeholder="Guard name (web/api)"
                value={permissionForm.guard_name}
                onChange={(e) =>
                  setPermissionForm({ ...permissionForm, guard_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={savePermission}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving
                  ? 'Saving...'
                  : editingPermissionId
                    ? 'Update Permission'
                    : 'Create Permission'}
              </button>
              {editingPermissionId && (
                <button
                  onClick={resetPermissionForm}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Permissions List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">All Permissions</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
              {permissions.length === 0 && (
                <div className="px-4 py-6 text-sm text-gray-500">No permissions found.</div>
              )}
              {permissions.map((permission) => (
                <div
                  key={permission.id}
                  className="px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                    <p className="text-xs text-gray-500">Guard: {permission.guard_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => editPermission(permission)}
                      className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePermission(permission.id)}
                      className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPermissions;
