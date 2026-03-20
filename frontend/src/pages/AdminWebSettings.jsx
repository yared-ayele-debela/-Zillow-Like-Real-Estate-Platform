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
    logo: null,
    favicon: null,
  });
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
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
      await adminService.updateSiteSettings(settings, logoFile, faviconFile);
      setLogoFile(null);
      setFaviconFile(null);
      fetchSettings();
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
              <div className="flex items-center gap-4">
                {(settings.logo || logoFile) && (
                  <img
                    src={logoFile ? URL.createObjectURL(logoFile) : settings.logo}
                    alt="Logo preview"
                    className="h-16 object-contain border rounded"
                  />
                )}
                <div>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/svg+xml,image/webp"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF, SVG, WebP. Max 2MB.</p>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Favicon</label>
              <div className="flex items-center gap-4">
                {(settings.favicon || faviconFile) && (
                  <img
                    src={faviconFile ? URL.createObjectURL(faviconFile) : settings.favicon}
                    alt="Favicon preview"
                    className="h-8 w-8 object-contain border rounded"
                  />
                )}
                <div>
                  <input
                    type="file"
                    accept="image/png,image/gif,image/jpeg,image/jpg,image/x-icon"
                    onChange={(e) => setFaviconFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">PNG, GIF, ICO. Max 512KB.</p>
                </div>
              </div>
            </div>
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
