import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HomeIcon,
  EyeIcon,
  HeartIcon,
  EnvelopeIcon,
  PlusIcon,
  ChartBarIcon,
  InboxIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import dashboardService from '../services/dashboardService';
import AgentLayout from '../components/agent/AgentLayout';
import { DEFAULT_PROPERTY_IMAGE } from '../utils/defaultImages';

const AgentDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getDashboard();
      setDashboardData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AgentLayout>
        <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </AgentLayout>
    );
  }

  if (error) {
    return (
      <AgentLayout>
        <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchDashboard}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-600"
            >
              Retry
            </button>
          </div>
        </div>
      </AgentLayout>
    );
  }

  const stats = dashboardData?.statistics || {};
  const recentProperties = dashboardData?.recent_properties || [];
  const recentMessages = dashboardData?.recent_messages || [];
  const performanceData = dashboardData?.performance_data || [];
  const limits = dashboardData?.limits || {};
  const canAddListing = limits.can_add_listing !== false;

  const totalViews = stats.total_properties ? stats.total_views || 0 : 0;
  const avgViewsPerListing =
    stats.total_properties && stats.total_properties > 0
      ? totalViews / stats.total_properties
      : 0;

  const statCards = [
    {
      title: 'Total Properties',
      value: stats.total_properties || 0,
      icon: HomeIcon,
      color: 'bg-white',
      link: '/agent/properties',
    },
    {
      title: 'Active Listings',
      value: stats.active_listings || 0,
      icon: HomeIcon,
      color: 'bg-emerald-600',
      link: '/agent/properties?status=for_sale',
    },
    {
      title: 'Total Views',
      value: stats.total_views || 0,
      icon: EyeIcon,
      color: 'bg-white',
    },
    {
      title: 'Total Saves',
      value: stats.total_saves || 0,
      icon: HeartIcon,
      color: 'bg-white',
    },
    {
      title: 'Inquiries',
      value: stats.total_inquiries || 0,
      icon: EnvelopeIcon,
      color: 'bg-indigo-600',
      link: '/agent/leads',
    },
    {
      title: 'Unread Messages',
      value: stats.unread_messages || 0,
      icon: InboxIcon,
      color: 'bg-white',
      link: '/agent/leads?is_read=false',
    },
  ];

  return (
    <AgentLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back! Here's an overview of your properties.</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 flex flex-wrap gap-4">
          <Link
            to="/properties/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Add New Property
          </Link>
          <Link
            to="/agent/analytics"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChartBarIcon className="h-5 w-5" />
            View Analytics
          </Link>
          <Link
            to="/subscription"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CreditCardIcon className="h-5 w-5" />
            Manage Subscription
          </Link>
        </div>

        {/* Subscription Card */}
        {dashboardData?.subscription && (
          <div className="mb-8 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <CreditCardIcon className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Your Subscription</h2>
                  <p className="text-indigo-100 mt-1">
                    {dashboardData.subscription.plan_name} Plan
                    {dashboardData.subscription.plan_price != null && (
                      <span className="ml-1">— ${dashboardData.subscription.plan_price}/month</span>
                    )}
                  </p>
                  {limits.max_listings != null && limits.max_listings > 0 && (
                    <p className="text-indigo-100 text-sm mt-2">
                      Listings: {limits.current_listings} / {limits.max_listings}
                      {limits.max_featured_listings > 0 && (
                        <span className="ml-3">
                          Featured: {limits.current_featured_listings} / {limits.max_featured_listings}
                        </span>
                      )}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        dashboardData.subscription.is_active
                          ? dashboardData.subscription.cancel_at_period_end
                            ? 'bg-amber-400/30 text-amber-100'
                            : 'bg-emerald-400/30 text-emerald-100'
                          : 'bg-white/20'
                      }`}
                    >
                      {dashboardData.subscription.cancel_at_period_end ? (
                        <>
                          <ClockIcon className="h-3.5 w-3.5" />
                          Cancelling at period end
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-3.5 w-3.5" />
                          {dashboardData.subscription.status || 'Active'}
                        </>
                      )}
                    </span>
                    {dashboardData.subscription.days_remaining != null && dashboardData.subscription.days_remaining > 0 && (
                      <span className="text-sm text-indigo-100">
                        {dashboardData.subscription.days_remaining} days remaining
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Link
                to="/subscription"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors self-start"
              >
                Manage
              </Link>
            </div>
          </div>
        )}

        {!dashboardData?.subscription && (
          <div className="mb-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <CreditCardIcon className="h-8 w-8 text-gray-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">No active subscription</h2>
                  <p className="text-gray-600 mt-1">
                    Subscribe to unlock more features and reach more buyers.
                  </p>
                </div>
              </div>
              <Link
                to="/subscription"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                View Plans
              </Link>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            const content = (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value.toLocaleString()}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="h-8 w-8 text-gray-900" />
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Properties */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Recent Properties</h2>
                <Link
                  to="/agent/properties"
                  className="text-indigo-600 hover:text-indigo-600 text-sm font-medium"
                >
                  View All
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentProperties.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No properties yet</p>
              ) : (
                <div className="space-y-4">
                  {recentProperties.map((property) => (
                    <Link
                      key={property.id}
                      to={`/properties/${property.uuid || property.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-600/10 transition"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={property.primary_image?.image_url || property.primary_image?.thumbnail_url || DEFAULT_PROPERTY_IMAGE}
                          alt={property.title}
                          className="w-20 h-20 object-cover rounded"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = DEFAULT_PROPERTY_IMAGE;
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{property.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {property.address}, {property.city}, {property.state}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm font-semibold text-indigo-600">
                              ${property.price?.toLocaleString()}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                property.status === 'for_sale'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : property.status === 'for_rent'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-white text-gray-900'
                              }`}
                            >
                              {property.status?.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Messages */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Recent Messages</h2>
                <Link
                  to="/agent/leads"
                  className="text-indigo-600 hover:text-indigo-600 text-sm font-medium"
                >
                  View All
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentMessages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No messages yet</p>
              ) : (
                <div className="space-y-4">
                  {recentMessages.map((message) => (
                    <Link
                      key={message.id}
                      to={`/agent/leads/${message.id}`}
                      className={`block p-4 border rounded-lg hover:border-indigo-300 transition ${
                        !message.is_read ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {message.sender?.name || 'Unknown'}
                            </p>
                            {!message.is_read && (
                              <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                            )}
                          </div>
                          {message.property && (
                            <p className="text-sm text-gray-600 mt-1">
                              Re: {message.property.title}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                            {message.message}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 ml-4">
                          {new Date(message.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Listing performance */}
        <div className="mt-8 bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Listing performance</h2>
              <p className="mt-1 text-sm text-gray-600">
                Views and saves by listing, compared to your average.
              </p>
            </div>
            {avgViewsPerListing > 0 && (
              <p className="text-xs text-gray-500">
                Avg views per listing:{' '}
                <span className="font-semibold text-gray-800">
                  {Math.round(avgViewsPerListing).toLocaleString()}
                </span>
              </p>
            )}
          </div>

          <div className="p-6">
            {performanceData.length === 0 ? (
              <p className="text-sm text-gray-500">
                Once you have active listings with activity, you&apos;ll see per‑listing
                performance here.
              </p>
            ) : (
              <div className="space-y-4">
                {performanceData
                  .slice(0, 7)
                  .sort((a, b) => (b.views || 0) - (a.views || 0))
                  .map((item) => {
                    const views = item.views || 0;
                    const saves = item.saves || 0;
                    const maxViews =
                      performanceData.reduce(
                        (max, p) => (p.views && p.views > max ? p.views : max),
                        0,
                      ) || 1;
                    const viewsPercent = Math.min((views / maxViews) * 100, 100);
                    const savesPercent = Math.min((saves / maxViews) * 100, 100);
                    const deltaFromAvg =
                      avgViewsPerListing > 0
                        ? ((views - avgViewsPerListing) / avgViewsPerListing) * 100
                        : 0;
                    const deltaLabel =
                      avgViewsPerListing > 0
                        ? `${deltaFromAvg >= 0 ? '+' : ''}${Math.round(deltaFromAvg)}% vs your avg`
                        : 'No average yet';

                    return (
                      <div
                        key={item.id}
                        className="border border-gray-200 rounded-lg p-3 hover:border-indigo-300 hover:bg-indigo-50/40 transition"
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-500 whitespace-nowrap">
                            {deltaLabel}
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>Views</span>
                            <span className="font-medium text-gray-900">
                              {views.toLocaleString()}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-2 bg-indigo-600 rounded-full"
                              style={{ width: `${viewsPercent}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                            <span>Saves</span>
                            <span className="font-medium text-gray-900">
                              {saves.toLocaleString()}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-1.5 bg-emerald-500 rounded-full"
                              style={{ width: `${savesPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </AgentLayout>
  );
};

export default AgentDashboard;
