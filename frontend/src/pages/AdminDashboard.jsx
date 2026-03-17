import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UsersIcon,
  HomeIcon,
  CheckCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  ChartBarIcon,
  CreditCardIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import adminService from '../services/adminService';
import AdminLayout from '../components/admin/AdminLayout';
import { DEFAULT_PROPERTY_IMAGE } from '../utils/defaultImages';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [advancedReport, setAdvancedReport] = useState(null);
  const [reportFilters, setReportFilters] = useState({
    start_date: '',
    end_date: '',
    group_by: 'day',
  });
  const [loadingReport, setLoadingReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 29);

    const defaultFilters = {
      start_date: start.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0],
      group_by: 'day',
    };

    setReportFilters(defaultFilters);
    fetchDashboard(defaultFilters);
  }, []);

  const fetchDashboard = async (filters = reportFilters) => {
    try {
      setLoading(true);
      const [dashboard, report] = await Promise.all([
        adminService.getDashboard(),
        adminService.getAdvancedReport(filters),
      ]);
      setDashboardData(dashboard);
      setAdvancedReport(report);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.statistics || {};
  const reportKpis = advancedReport?.kpis || {};

  const combinedTrendData = (() => {
    const map = new Map();

    (advancedReport?.trends?.users || []).forEach((item) => {
      map.set(item.bucket, { bucket: item.bucket, users: Number(item.count || 0), properties: 0, messages: 0 });
    });

    (advancedReport?.trends?.properties || []).forEach((item) => {
      const existing = map.get(item.bucket) || { bucket: item.bucket, users: 0, properties: 0, messages: 0 };
      existing.properties = Number(item.count || 0);
      map.set(item.bucket, existing);
    });

    (advancedReport?.trends?.messages || []).forEach((item) => {
      const existing = map.get(item.bucket) || { bucket: item.bucket, users: 0, properties: 0, messages: 0 };
      existing.messages = Number(item.count || 0);
      map.set(item.bucket, existing);
    });

    return Array.from(map.values()).sort((a, b) => a.bucket.localeCompare(b.bucket));
  })();

  const applyReportFilters = async () => {
    try {
      setLoadingReport(true);
      const report = await adminService.getAdvancedReport(reportFilters);
      setAdvancedReport(report);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load advanced report');
    } finally {
      setLoadingReport(false);
    }
  };

  const growthClass = (value) => {
    if ((value || 0) > 0) return 'text-green-600';
    if ((value || 0) < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.total_users || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
      link: '/admin/users',
    },
    {
      title: 'Total Properties',
      value: stats.total_properties || 0,
      icon: HomeIcon,
      color: 'bg-green-500',
      link: '/admin/properties',
    },
    {
      title: 'Active Subscriptions',
      value: stats.active_subscriptions || 0,
      icon: CreditCardIcon,
      color: 'bg-indigo-500',
    },
    {
      title: 'Active Listings',
      value: stats.active_listings || 0,
      icon: CheckCircleIcon,
      color: 'bg-purple-500',
    },
    {
      title: 'Pending Approvals',
      value: stats.pending_approvals || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      link: '/admin/properties?is_approved=false',
    },
    {
      title: 'Pending Reviews',
      value: stats.pending_reviews || 0,
      icon: ClockIcon,
      color: 'bg-orange-500',
      link: '/admin/reviews',
    },
    {
      title: 'Total Messages',
      value: stats.total_messages || 0,
      icon: EnvelopeIcon,
      color: 'bg-pink-500',
    },
  ];

  return (
    <AdminLayout>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Overview of your platform</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 flex gap-4">
          <Link
            to="/admin/analytics"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <ChartBarIcon className="h-5 w-5" />
            View Analytics
          </Link>
        </div>

        {/* Advanced Report */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Advanced Report</h2>
              <p className="text-sm text-gray-600">Filter performance by date range and trend grouping.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 w-full md:w-auto">
              <input
                type="date"
                value={reportFilters.start_date}
                onChange={(e) => setReportFilters((prev) => ({ ...prev, start_date: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <input
                type="date"
                value={reportFilters.end_date}
                onChange={(e) => setReportFilters((prev) => ({ ...prev, end_date: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <select
                value={reportFilters.group_by}
                onChange={(e) => setReportFilters((prev) => ({ ...prev, group_by: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
              <button
                onClick={applyReportFilters}
                disabled={loadingReport}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm"
              >
                {loadingReport ? 'Applying...' : 'Apply'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">New Users</p>
              <p className="text-2xl font-bold text-gray-900">{reportKpis.current?.new_users || 0}</p>
              <p className={`text-xs mt-1 ${growthClass(reportKpis.growth?.new_users)}`}>
                {reportKpis.growth?.new_users ?? 0}% vs previous period
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">New Properties</p>
              <p className="text-2xl font-bold text-gray-900">{reportKpis.current?.new_properties || 0}</p>
              <p className={`text-xs mt-1 ${growthClass(reportKpis.growth?.new_properties)}`}>
                {reportKpis.growth?.new_properties ?? 0}% vs previous period
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Revenue (Completed Payments)</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(reportKpis.current?.revenue || 0).toLocaleString()}
              </p>
              <p className={`text-xs mt-1 ${growthClass(reportKpis.growth?.revenue)}`}>
                {reportKpis.growth?.revenue ?? 0}% vs previous period
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Trend Overview</h3>
              {combinedTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={combinedTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bucket" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="users" stroke="#2563EB" name="Users" />
                    <Line type="monotone" dataKey="properties" stroke="#10B981" name="Properties" />
                    <Line type="monotone" dataKey="messages" stroke="#F59E0B" name="Messages" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500 py-16 text-center">No trend data in selected period.</p>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Locations</h3>
              {(advancedReport?.top_locations || []).length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {advancedReport.top_locations.map((location, index) => (
                    <div key={`${location.city}-${location.state}-${index}`} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{location.city}, {location.state}</span>
                      <span className="font-semibold text-gray-900">{location.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-16 text-center">No location data in selected period.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Agents by Properties Added</h3>
              {(advancedReport?.top_agents || []).length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {advancedReport.top_agents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{agent.name}</span>
                      <span className="font-semibold text-gray-900">{agent.properties_count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-16 text-center">No agent activity in selected period.</p>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Properties by Type</h3>
              {(advancedReport?.properties_by_type || []).length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={advancedReport.properties_by_type}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="property_type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4F46E5" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500 py-16 text-center">No property type data in selected period.</p>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            const content = (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            );

            if (stat.link) {
              return (
                <Link key={index} to={stat.link}>
                  {content}
                </Link>
              );
            }

            return <div key={index}>{content}</div>;
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Recent Properties */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Properties</h2>
                <Link
                  to="/admin/properties"
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  View All
                </Link>
              </div>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto">
              {dashboardData?.recent_properties?.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm">No properties yet</p>
              ) : (
                <div className="space-y-3">
                  {dashboardData?.recent_properties?.map((property) => (
                    <Link
                      key={property.id}
                      to={`/properties/${property.uuid || property.id}`}
                      className="block p-3 border border-gray-100 rounded-lg hover:border-indigo-200 hover:bg-indigo-50/50 transition"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={
                            property.primary_image?.image_url ||
                            property.primary_image?.thumbnail_url ||
                            DEFAULT_PROPERTY_IMAGE
                          }
                          alt={property.title}
                          className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = DEFAULT_PROPERTY_IMAGE;
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm truncate">{property.title}</h3>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {property.city}, {property.state}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-indigo-600">
                              ${property.price?.toLocaleString()}
                            </span>
                            {!property.is_approved && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
                <Link
                  to="/admin/users"
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  View All
                </Link>
              </div>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto">
              {dashboardData?.recent_users?.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm">No users yet</p>
              ) : (
                <div className="space-y-3">
                  {dashboardData?.recent_users?.map((user) => (
                    <Link
                      key={user.id}
                      to="/admin/users"
                      className="block p-3 border border-gray-100 rounded-lg hover:border-indigo-200 hover:bg-indigo-50/50 transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <UserCircleIcon className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded ${
                                user.role === 'admin'
                                  ? 'bg-red-100 text-red-700'
                                  : user.role === 'agent'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {user.role}
                            </span>
                            {user.has_active_subscription && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                                <CreditCardIcon className="h-3 w-3" />
                                {user.subscription_plan || 'Subscribed'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Subscriptions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Active Subscriptions</h2>
              </div>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto">
              {dashboardData?.recent_subscriptions?.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm">No active subscriptions</p>
              ) : (
                <div className="space-y-3">
                  {dashboardData?.recent_subscriptions?.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 border border-gray-100 rounded-lg hover:border-indigo-200 hover:bg-indigo-50/30 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-sm truncate">{sub.user_name}</p>
                          <p className="text-xs text-gray-500 truncate">{sub.user_email}</p>
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                              {sub.plan}
                            </span>
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded ${
                                sub.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : sub.status === 'trialing'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {sub.status}
                            </span>
                            {sub.cancel_at_period_end && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                Cancelling
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Users by Role Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Users by Role</h2>
            {dashboardData?.users_by_role && Object.keys(dashboardData.users_by_role).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(dashboardData.users_by_role).map(([role, count]) => ({
                    name: role.charAt(0).toUpperCase() + role.slice(1),
                    count,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4F46E5" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-12">No data available</p>
            )}
          </div>

          {/* Properties by Status Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Properties by Status</h2>
            {dashboardData?.properties_by_status && Object.keys(dashboardData.properties_by_status).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(dashboardData.properties_by_status).map(([status, count]) => ({
                    name: status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                    count,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-12">No data available</p>
            )}
          </div>
        </div>

        {/* Popular Locations */}
        {dashboardData?.popular_locations && dashboardData.popular_locations.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Locations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {dashboardData.popular_locations.slice(0, 10).map((location, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <p className="font-medium text-gray-900">
                    {location.city}, {location.state}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{location.count} properties</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
