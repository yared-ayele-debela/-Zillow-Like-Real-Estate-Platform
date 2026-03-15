import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  EnvelopeIcon,
  PaperAirplaneIcon,
  InboxIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import messageService from '../services/messageService';
import useAuthStore from '../store/authStore';

const Messages = () => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [thread, setThread] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    folder: 'received', // 'sent', 'received', or 'all'
    type: '',
    is_read: '',
    property_id: '',
  });
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchMessages();
  }, [filters]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.folder) params.folder = filters.folder;
      if (filters.type) params.type = filters.type;
      if (filters.is_read !== '') params.is_read = filters.is_read;
      if (filters.property_id) params.property_id = filters.property_id;

      const data = await messageService.getMessages(params);
      setMessages(data.messages?.data || []);
      setUnreadCount(data.unread_count || 0);
      setPagination(data.messages || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load messages');
      console.error('Messages error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMessage = async (messageId) => {
    try {
      const data = await messageService.getMessage(messageId);
      setSelectedMessage(data.message);
      setThread(data.thread || []);
      fetchMessages(); // Refresh to update read status
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load message');
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedMessage) return;

    setReplying(true);
    try {
      await messageService.reply(selectedMessage.id, {
        message: replyText,
      });
      setReplyText('');
      // Refresh thread
      const data = await messageService.getMessage(selectedMessage.id);
      setThread(data.thread || []);
      fetchMessages();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="mt-2 text-gray-600">Manage your conversations</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Folder</label>
              <select
                value={filters.folder}
                onChange={(e) => setFilters({ ...filters, folder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="received">Inbox ({unreadCount} unread)</option>
                <option value="sent">Sent</option>
                <option value="all">All Messages</option>
              </select>
            </div>
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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">
                  {filters.folder === 'sent' ? 'Sent Messages' : 'Inbox'}
                </h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="p-8 text-center">
                    <InboxIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No messages found</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const otherUser =
                      message.sender_id === user?.id ? message.receiver : message.sender;
                    return (
                      <button
                        key={message.id}
                        onClick={() => handleSelectMessage(message.id)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                          selectedMessage?.id === message.id ? 'bg-indigo-50' : ''
                        } ${!message.is_read && message.receiver_id === user?.id ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {otherUser?.name || 'Unknown'}
                            </p>
                            {message.property && (
                              <p className="text-sm text-gray-600 truncate mt-1">
                                Re: {message.property.title}
                              </p>
                            )}
                            {message.subject && (
                              <p className="text-sm font-medium text-gray-900 truncate mt-1">
                                {message.subject}
                              </p>
                            )}
                            <p className="text-sm text-gray-500 truncate mt-1">
                              {message.message.substring(0, 60)}...
                            </p>
                          </div>
                          <div className="ml-2 flex-shrink-0">
                            {!message.is_read && message.receiver_id === user?.id && (
                              <span className="w-2 h-2 bg-indigo-600 rounded-full block"></span>
                            )}
                            <span className="text-xs text-gray-400 block mt-2">
                              {new Date(message.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Message Thread */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {selectedMessage.subject || 'No Subject'}
                      </h2>
                      {selectedMessage.property && (
                        <Link
                          to={`/properties/${selectedMessage.property.uuid || selectedMessage.property.id}`}
                          className="text-sm text-indigo-600 hover:text-indigo-700 mt-1 inline-block"
                        >
                          View Property: {selectedMessage.property.title}
                        </Link>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(selectedMessage.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-6 max-h-[400px] overflow-y-auto">
                  {thread.map((msg) => {
                    const isSent = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`mb-4 ${isSent ? 'ml-auto' : 'mr-auto'} max-w-[80%]`}
                      >
                        <div
                          className={`p-4 rounded-lg ${
                            isSent
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">
                              {isSent ? 'You' : msg.sender?.name || 'Unknown'}
                            </p>
                            <span
                              className={`text-xs ${
                                isSent ? 'text-indigo-200' : 'text-gray-500'
                              }`}
                            >
                              {new Date(msg.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Form */}
                <div className="p-6 border-t border-gray-200">
                  <form onSubmit={handleReply}>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 mb-3"
                      required
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={replying || !replyText.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PaperAirplaneIcon className="h-5 w-5" />
                        {replying ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <EnvelopeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a message to view</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
