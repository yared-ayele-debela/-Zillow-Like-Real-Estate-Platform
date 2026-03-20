import { useEffect, useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import adminService from '../services/adminService';

const AdminRoles = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    guard_name: 'web',
    permission_ids: [],
  });

  useEffect(() => {
    fetchRbacData();
  }, []);

  const fetchRbacData = async () => {
    try {
      setLoading(true);
      const [rolesData, permissionsData] = await Promise.all([
        adminService.getRoles(),
        adminService.getPermissions(),
      ]);
      setRoles(rolesData || []);
      setPermissions(permissionsData || []);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to load roles and permissions');
    } finally {
      setLoading(false);
    }
  };

  const resetRoleForm = () => {
    setEditingRoleId(null);
    setRoleForm({
      name: '',
      guard_name: 'web',
      permission_ids: [],
    });
  };

  const saveRole = async () => {
    if (!roleForm.name.trim()) {
      alert('Role name is required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: roleForm.name.trim(),
        guard_name: roleForm.guard_name || 'web',
        permissions: roleForm.permission_ids,
      };

      if (editingRoleId) {
        await adminService.updateRole(editingRoleId, payload);
      } else {
        await adminService.createRole(payload);
      }

      resetRoleForm();
      fetchRbacData();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.name?.[0] ||
        'Failed to save role';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const editRole = (role) => {
    setEditingRoleId(role.id);
    setRoleForm({
      name: role.name || '',
      guard_name: role.guard_name || 'web',
      permission_ids: (role.permissions || []).map((p) => p.id),
    });
  };

  const deleteRole = async (roleId) => {
    if (!window.confirm('Delete this role?')) return;
    try {
      await adminService.deleteRole(roleId);
      fetchRbacData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete role');
    }
  };

  const toggleRolePermission = (permissionId) => {
    setRoleForm((prev) => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(permissionId)
        ? prev.permission_ids.filter((id) => id !== permissionId)
        : [...prev.permission_ids, permissionId],
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500">Loading roles...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Roles</h1>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Create/Edit Role Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingRoleId ? 'Edit Role' : 'Create Role'}
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Role name (e.g. manager)"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                placeholder="Guard name (web/api)"
                value={roleForm.guard_name}
                onChange={(e) => setRoleForm({ ...roleForm, guard_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Assign Permissions</p>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md bg-gray-50 p-3 space-y-2">
                {permissions.length === 0 && (
                  <p className="text-sm text-gray-500">No permissions available.</p>
                )}
                {permissions.map((permission) => (
                  <label
                    key={permission.id}
                    className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={roleForm.permission_ids.includes(permission.id)}
                      onChange={() => toggleRolePermission(permission.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {permission.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={saveRole}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingRoleId ? 'Update Role' : 'Create Role'}
              </button>
              {editingRoleId && (
                <button
                  onClick={resetRoleForm}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Roles List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">All Roles</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
              {roles.length === 0 && (
                <div className="px-4 py-6 text-sm text-gray-500">No roles found.</div>
              )}
              {roles.map((role) => (
                <div key={role.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{role.name}</p>
                      <p className="text-xs text-gray-500">Guard: {role.guard_name}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(role.permissions || []).map((permission) => (
                          <span
                            key={permission.id}
                            className="px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700"
                          >
                            {permission.name}
                          </span>
                        ))}
                        {(role.permissions || []).length === 0 && (
                          <span className="text-xs text-gray-400">No permissions assigned</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => editRole(role)}
                        className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteRole(role.id)}
                        className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
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

export default AdminRoles;
