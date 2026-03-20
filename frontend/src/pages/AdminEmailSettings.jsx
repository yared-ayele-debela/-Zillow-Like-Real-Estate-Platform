import { useEffect, useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import adminService from '../services/adminService';

const AdminEmailSettings = () => {
  const [settings, setSettings] = useState({
    mail_driver: 'smtp',
    mail_host: 'smtp.mailtrap.io',
    mail_port: '2525',
    mail_username: '',
    mail_password: '',
    mail_from_address: 'noreply@example.com',
    mail_from_name: 'Zillow Clone',
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
        ...(data?.email || {}),
      }));
    } catch (error) {
      console.error('Failed to load email settings:', error);
      alert(error.response?.data?.message || 'Failed to load email settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminService.updateEmailSettings(settings);
      alert('Email settings saved successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save email settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500">Loading email settings...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Email Settings</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mail Driver</label>
            <select
              value={settings.mail_driver}
              onChange={(e) => setSettings({ ...settings, mail_driver: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="smtp">SMTP</option>
              <option value="mailgun">Mailgun</option>
              <option value="ses">Amazon SES</option>
              <option value="postmark">Postmark</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mail Host</label>
              <input
                type="text"
                value={settings.mail_host}
                onChange={(e) => setSettings({ ...settings, mail_host: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mail Port</label>
              <input
                type="text"
                value={settings.mail_port}
                onChange={(e) => setSettings({ ...settings, mail_port: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mail Username</label>
            <input
              type="text"
              value={settings.mail_username}
              onChange={(e) => setSettings({ ...settings, mail_username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mail Password</label>
            <input
              type="password"
              value={settings.mail_password}
              onChange={(e) => setSettings({ ...settings, mail_password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Address</label>
              <input
                type="email"
                value={settings.mail_from_address}
                onChange={(e) =>
                  setSettings({ ...settings, mail_from_address: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
              <input
                type="text"
                value={settings.mail_from_name}
                onChange={(e) => setSettings({ ...settings, mail_from_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Email Settings'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminEmailSettings;
