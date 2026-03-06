import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import useAuthStore from '../store/authStore';
import AdminLayout from '../components/admin/AdminLayout';
import AgentLayout from '../components/agent/AgentLayout';
import notificationService from '../services/notificationService';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterRead, setFilterRead] = useState('');
  const [filterType, setFilterType] = useState('');
  const [pagination, setPagination] = useState({});
  const { user } = useAuthStore();

  const Wrapper = useMemo(() => {
    if (user?.role === 'admin') return AdminLayout;
    if (user?.role === 'agent') return AgentLayout;
    return null;
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterRead !== '') params.is_read = filterRead;
      if (filterType !== '') params.type = filterType;

      const data = await notificationService.getNotifications(params);
      setNotifications(data?.data || []);
      setPagination(data || {});
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [filterRead, filterType]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    await notificationService.markAsRead(id);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    await notificationService.markAllAsRead();
    fetchNotifications();
  };

  const deleteNotification = async (id) => {
    await notificationService.deleteNotification(id);
    fetchNotifications();
  };

  const pageContent = (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <button
            onClick={markAllAsRead}
            className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Mark all as read
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <select
            value={filterRead}
            onChange={(e) => setFilterRead(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
          <input
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            placeholder="Filter by type (e.g. new_message)"
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {loading && <div className="p-4 text-gray-500">Loading...</div>}
          {!loading && notifications.length === 0 && (
            <div className="p-4 text-gray-500">No notifications found.</div>
          )}
          {!loading &&
            notifications.map((item) => (
              <div key={item.id} className={`p-4 border-b border-gray-100 ${item.is_read ? 'bg-white' : 'bg-indigo-50'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{item.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {item.type} - {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!item.is_read && (
                      <button
                        onClick={() => markAsRead(item.id)}
                        className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(item.id)}
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {pagination?.total ? (
          <p className="mt-4 text-sm text-gray-500">Total: {pagination.total}</p>
        ) : null}
      </div>
    </div>
  );

  if (!Wrapper) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-indigo-600"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to site
          </Link>
        </div>
        {pageContent}
      </div>
    );
  }

  return <Wrapper>{pageContent}</Wrapper>;
};

export default Notifications;
