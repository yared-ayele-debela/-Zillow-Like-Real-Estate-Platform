import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  EnvelopeIcon,
  CheckIcon,
  ArrowDownTrayIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import leadService from '../services/leadService';
import useAuthStore from '../store/authStore';
import AgentLayout from '../components/agent/AgentLayout';

const Leads = () => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    property_id: '',
    type: '',
    is_read: '',
    lead_status: '',
  });
  const [pagination, setPagination] = useState({});
  const [selectedMessages, setSelectedMessages] = useState([]);

  useEffect(() => {
    fetchLeads();
  }, [filters]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.property_id) params.property_id = filters.property_id;
      if (filters.type) params.type = filters.type;
      if (filters.is_read !== '') params.is_read = filters.is_read;
      if (filters.lead_status) params.lead_status = filters.lead_status;

      const data = await leadService.getLeads(params);
      setMessages(data.messages?.data || []);
      setPagination(data.messages || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leads');
      console.error('Leads error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await leadService.markAsRead(id);
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark as read');
    }
  };

  const handleMarkMultipleAsRead = async () => {
    if (selectedMessages.length === 0) return;

    try {
      await leadService.markMultipleAsRead(selectedMessages);
      setSelectedMessages([]);
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark as read');
    }
  };

  const handleExport = async () => {
    try {
      await leadService.exportLeads();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to export leads');
    }
  };

  const handleUpdateLead = async (id, payload) => {
    try {
      await leadService.updateLead(id, payload);
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update lead');
    }
  };

  const toggleSelectMessage = (id) => {
    setSelectedMessages((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  if (loading && messages.length === 0) {
    return (
      <AgentLayout>
        <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading leads...</p>
          </div>
        </div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leads & Inquiries</h1>
            <p className="mt-2 text-gray-600">Manage your property inquiries and messages</p>
          </div>
          <div className="flex gap-2">
            {selectedMessages.length > 0 && (
              <button
                onClick={handleMarkMultipleAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <CheckIcon className="h-5 w-5" />
                Mark Selected as Read
              </button>
            )}
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Types</option>
                <option value="inquiry">Inquiry</option>
                <option value="general">General</option>
                <option value="tour_request">Tour Request</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Read Status</label>
              <select
                value={filters.is_read}
                onChange={(e) => setFilters({ ...filters, is_read: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All</option>
                <option value="false">Unread</option>
                <option value="true">Read</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lead status</label>
              <select
                value={filters.lead_status}
                onChange={(e) => setFilters({ ...filters, lead_status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All stages</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="viewed">Viewed</option>
                <option value="offer">Offer</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property ID</label>
              <input
                type="number"
                value={filters.property_id}
                onChange={(e) => setFilters({ ...filters, property_id: e.target.value })}
                placeholder="Filter by property..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Messages List */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {messages.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <EnvelopeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No leads found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-6 hover:bg-gray-50 ${
                    !message.is_read ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedMessages.includes(message.id)}
                      onChange={() => toggleSelectMessage(message.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {message.sender?.name || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-500">{message.sender?.email}</p>
                            {message.sender?.phone && (
                              <p className="text-sm text-gray-500">{message.sender.phone}</p>
                            )}
                          </div>
                          {!message.is_read && (
                            <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(message.created_at).toLocaleString()}
                        </span>
                      </div>

                      {message.property && (
                        <Link
                          to={`/properties/${message.property.uuid || message.property.id}`}
                          className="text-sm text-indigo-600 hover:text-indigo-700 mb-2 inline-block"
                        >
                          Re: {message.property.title} - {message.property.address}
                        </Link>
                      )}

                      {message.subject && (
                        <p className="font-medium text-gray-900 mb-2">{message.subject}</p>
                      )}

                      <p className="text-gray-700 mb-4 whitespace-pre-wrap">{message.message}</p>

                      {message.thread_messages && message.thread_messages.length > 1 && (
                        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50/80 p-3">
                          <p className="text-xs font-semibold text-gray-600 mb-2">
                            Thread · {message.thread_messages.length} messages
                          </p>
                          <ul className="space-y-2 max-h-48 overflow-y-auto">
                            {message.thread_messages.slice(1).map((m) => {
                              const outbound =
                                user?.id && Number(m.sender_id) === Number(user.id);
                              return (
                                <li
                                  key={m.id}
                                  className={`text-xs rounded-md px-2 py-1.5 border ${
                                    outbound
                                      ? 'border-indigo-200 bg-indigo-50 text-indigo-900'
                                      : 'border-gray-200 bg-white text-gray-800'
                                  }`}
                                >
                                  <span className="font-medium">
                                    {outbound ? 'You' : m.sender?.name || 'Contact'}
                                  </span>
                                  <span className="text-gray-500 mx-1">·</span>
                                  <span className="text-gray-600 line-clamp-2 whitespace-pre-wrap">
                                    {m.message}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {message.tour_request_data && (
                        <div className="bg-gray-50 p-3 rounded mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Tour Request Details:</p>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {message.tour_request_data.preferred_dates && (
                              <li>
                                <strong>Dates:</strong>{' '}
                                {Array.isArray(message.tour_request_data.preferred_dates)
                                  ? message.tour_request_data.preferred_dates.join(', ')
                                  : message.tour_request_data.preferred_dates}
                              </li>
                            )}
                            {message.tour_request_data.preferred_times && (
                              <li>
                                <strong>Times:</strong>{' '}
                                {Array.isArray(message.tour_request_data.preferred_times)
                                  ? message.tour_request_data.preferred_times.join(', ')
                                  : message.tour_request_data.preferred_times}
                              </li>
                            )}
                            {message.tour_request_data.notes && (
                              <li>
                                <strong>Notes:</strong> {message.tour_request_data.notes}
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      <div className="mt-3 grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3 items-start">
                        <div className="flex flex-wrap gap-2">
                          {!message.is_read && (
                            <button
                              onClick={() => handleMarkAsRead(message.id)}
                              className="flex items-center gap-1 px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                            >
                              <CheckIcon className="h-4 w-4" />
                              Mark as Read
                            </button>
                          )}
                          <Link
                            to={`/agent/leads/${message.id}`}
                            className="flex items-center gap-1 px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                          >
                            <PaperAirplaneIcon className="h-4 w-4" />
                            Reply
                          </Link>
                        </div>

                        <div className="flex flex-wrap gap-3 justify-start lg:justify-end text-xs">
                          <div className="space-y-1">
                            <p className="text-[11px] font-medium text-gray-500 uppercase">
                              Stage
                            </p>
                            <select
                              value={message.lead_status || 'new'}
                              onChange={(e) =>
                                handleUpdateLead(message.id, { lead_status: e.target.value })
                              }
                              className="px-2 py-1 border border-gray-300 rounded-md text-xs bg-white"
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="viewed">Viewed</option>
                              <option value="offer">Offer</option>
                              <option value="closed">Closed</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <p className="text-[11px] font-medium text-gray-500 uppercase">
                              Next follow‑up
                            </p>
                            <input
                              type="date"
                              value={
                                message.next_follow_up_at
                                  ? String(message.next_follow_up_at).slice(0, 10)
                                  : ''
                              }
                              onChange={(e) =>
                                handleUpdateLead(message.id, {
                                  next_follow_up_at: e.target.value || null,
                                })
                              }
                              className="px-2 py-1 border border-gray-300 rounded-md text-xs bg-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <p className="text-[11px] font-medium text-gray-500 uppercase">
                              Score
                            </p>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={message.lead_score ?? ''}
                              onChange={(e) =>
                                handleUpdateLead(message.id, {
                                  lead_score: e.target.value === '' ? null : Number(e.target.value),
                                })
                              }
                              className="w-20 px-2 py-1 border border-gray-300 rounded-md text-xs bg-white"
                              placeholder="0-100"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => {
                  // Would need to add page parameter to filters
                  console.log('Page:', page);
                }}
                className={`px-4 py-2 border rounded ${
                  pagination.current_page === page
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
        </div>
      </div>
    </AgentLayout>
  );
};

export default Leads;
