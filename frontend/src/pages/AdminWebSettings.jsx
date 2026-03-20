import { useEffect, useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import adminService from '../services/adminService';

const AdminWebSettings = () => {
  const [settings, setSettings] = useState({
    site_name: 'Zillow Clone',
    site_description: 'Real Estate Platform',
    maintenance_mode: false,
    allow_registration: true,
    require_email_verification: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSettings();
      setSettings((prev) => ({
        ...prev,
        ...(data?.site || {}),
      }));
    } catch (error) {
      console.error('Failed to load web settings:', error);
      alert(error.response?.data?.message || 'Failed to load web settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminService.updateSiteSettings(settings);
      alert('Web settings saved successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save web settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500">Loading web settings...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Web Settings</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
            <input
              type="text"
              value={settings.site_name}
              onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Description</label>
            <textarea
              value={settings.site_description}
              onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.maintenance_mode}
                onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                className="mr-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Maintenance Mode
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.allow_registration}
                onChange={(e) => setSettings({ ...settings, allow_registration: e.target.checked })}
                className="mr-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Allow Registration
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.require_email_verification}
                onChange={(e) =>
                  setSettings({ ...settings, require_email_verification: e.target.checked })
                }
                className="mr-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Require Email Verification
            </label>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Web Settings'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminWebSettings;
