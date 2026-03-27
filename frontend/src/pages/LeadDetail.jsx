import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import leadService from '../services/leadService';
import AgentLayout from '../components/agent/AgentLayout';
import { propertySlug } from '../utils/propertyRoute';
import useAuthStore from '../store/authStore';

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [lead, setLead] = useState(null);
  const [thread, setThread] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await leadService.getLead(id);
        const msg = data.message;
        const threadList = data.thread || [];
        if (!cancelled && msg) {
          setLead(msg);
          setThread(Array.isArray(threadList) ? threadList : []);
          setReplySubject(msg.subject ? `Re: ${msg.subject}` : 'Re: Your inquiry');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load lead');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  /** Reply attaches to the latest message in the thread so threading stays correct. */
  const replyParentId = useMemo(() => {
    if (thread.length > 0) return thread[thread.length - 1].id;
    return id ? Number(id) : null;
  }, [thread, id]);

  const handleReply = async (e) => {
    e.preventDefault();
    const text = replyBody.trim();
    if (!text || !replyParentId) return;
    setSending(true);
    setSendError(null);
    try {
      await leadService.reply(replyParentId, {
        message: text,
        ...(replySubject.trim() ? { subject: replySubject.trim() } : {}),
      });
      navigate('/agent/leads');
    } catch (err) {
      setSendError(err.response?.data?.message || err.response?.data?.errors?.message?.[0] || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <AgentLayout>
        <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-600 border-t-transparent" />
        </div>
      </AgentLayout>
    );
  }

  if (error || !lead) {
    return (
      <AgentLayout>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Lead not found'}
          </div>
          <Link to="/agent/leads" className="inline-flex items-center gap-2 mt-4 text-indigo-600 font-medium">
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Leads
          </Link>
        </div>
      </AgentLayout>
    );
  }

  const property = lead.property;

  return (
    <AgentLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            to="/agent/leads"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 mb-6"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Leads
          </Link>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4 bg-gray-50">
              <h1 className="text-xl font-semibold text-gray-900">Reply to inquiry</h1>
              <p className="text-sm text-gray-500 mt-1">
                From <span className="font-medium text-gray-700">{lead.sender?.name || 'Unknown'}</span>
                {lead.sender?.email && (
                  <span className="text-gray-500"> · {lead.sender.email}</span>
                )}
              </p>
            </div>

            {property && (
              <div className="px-6 py-4 border-b border-gray-100">
                <Link
                  to={`/properties/${propertySlug(property)}`}
                  className="inline-flex items-start gap-2 text-indigo-600 hover:text-indigo-700 text-sm"
                >
                  <MapPinIcon className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>
                    <span className="font-medium block">{property.title}</span>
                    {[property.address, property.city, property.state].filter(Boolean).join(', ')}
                  </span>
                </Link>
              </div>
            )}

            <div className="px-6 py-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Conversation</h2>
                <div className="space-y-3">
                  {(thread.length > 0 ? thread : [lead]).map((m) => {
                    const isAgent = user?.id && Number(m.sender_id) === Number(user.id);
                    return (
                      <div
                        key={m.id}
                        className={`rounded-lg border p-4 text-sm ${
                          isAgent
                            ? 'bg-indigo-50 border-indigo-100 ml-4'
                            : 'bg-gray-50 border-gray-100 mr-4'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <span className="font-medium text-gray-900">
                            {isAgent ? 'You' : m.sender?.name || 'Contact'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(m.created_at).toLocaleString()}
                          </span>
                        </div>
                        {m.subject && (
                          <p className="text-xs font-medium text-gray-600 mb-1">{m.subject}</p>
                        )}
                        <p className="text-gray-800 whitespace-pre-wrap">{m.message}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {lead.tour_request_data && (
                <div className="mt-4 rounded-lg bg-amber-50 border border-amber-100 p-4 text-sm">
                  <p className="font-medium text-amber-900 mb-2">Tour request details</p>
                  <ul className="text-amber-800 space-y-1">
                    {lead.tour_request_data.preferred_dates && (
                      <li>
                        <strong>Dates:</strong>{' '}
                        {Array.isArray(lead.tour_request_data.preferred_dates)
                          ? lead.tour_request_data.preferred_dates.join(', ')
                          : lead.tour_request_data.preferred_dates}
                      </li>
                    )}
                    {lead.tour_request_data.preferred_times && (
                      <li>
                        <strong>Times:</strong>{' '}
                        {Array.isArray(lead.tour_request_data.preferred_times)
                          ? lead.tour_request_data.preferred_times.join(', ')
                          : lead.tour_request_data.preferred_times}
                      </li>
                    )}
                    {lead.tour_request_data.notes && (
                      <li>
                        <strong>Notes:</strong> {lead.tour_request_data.notes}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <form onSubmit={handleReply} className="border-t border-gray-100 px-6 py-5 bg-gray-50/50">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Your reply</h2>
              <label className="block text-xs font-medium text-gray-500 mb-1">Subject (optional)</label>
              <input
                type="text"
                value={replySubject}
                onChange={(e) => setReplySubject(e.target.value)}
                className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <label className="block text-xs font-medium text-gray-500 mb-1">Message</label>
              <textarea
                required
                rows={6}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Write your reply to the prospect..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {sendError && (
                <p className="mt-2 text-sm text-red-600">{sendError}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={sending || !replyBody.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                  {sending ? 'Sending…' : 'Send reply'}
                </button>
                <Link
                  to="/agent/leads"
                  className="inline-flex items-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Your reply is saved as a new message to the prospect. They can read it in their account messages if that flow is enabled.
              </p>
            </form>
          </div>
        </div>
      </div>
    </AgentLayout>
  );
};

export default LeadDetail;
