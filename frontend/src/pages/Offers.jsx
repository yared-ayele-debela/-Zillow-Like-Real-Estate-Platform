import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BanknotesIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { offerService } from '../services/offerService';
import { propertyService } from '../services/propertyService';
import leadService from '../services/leadService';
import AgentLayout from '../components/agent/AgentLayout';

const STATUS_LABELS = {
  submitted: 'Submitted',
  counter: 'Counter',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

const STATUS_CLASS = {
  submitted: 'bg-amber-100 text-amber-800',
  counter: 'bg-blue-100 text-blue-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
};

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ property_id: '', status: '' });
  const [showForm, setShowForm] = useState(false);
  const [properties, setProperties] = useState([]);
  const [leads, setLeads] = useState([]);
  const [form, setForm] = useState({
    property_id: '',
    message_id: '',
    amount: '',
    status: 'submitted',
    notes: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ status: '', notes: '' });

  const fetchOffers = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page };
      if (filters.property_id) params.property_id = filters.property_id;
      if (filters.status) params.status = filters.status;
      const data = await offerService.getOffers(params);
      setOffers(Array.isArray(data.data) ? data.data : data.data?.data ?? []);
      setPagination({
        current_page: data.current_page ?? 1,
        last_page: data.last_page ?? 1,
        total: data.total ?? 0,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [filters.property_id, filters.status]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await propertyService.getMyProperties({ per_page: 200 });
        const d = res.data ?? res;
        setProperties(Array.isArray(d) ? d : d.data ?? []);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const loadFormOptions = async () => {
    try {
      const [propRes, leadRes] = await Promise.all([
        propertyService.getMyProperties({ per_page: 200 }),
        leadService.getLeads({ per_page: 100 }),
      ]);
      const propData = propRes.data ?? propRes;
      setProperties(Array.isArray(propData) ? propData : propData.data ?? []);
      const msgs = leadRes.messages?.data ?? leadRes.messages;
      setLeads(Array.isArray(msgs) ? msgs : []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (showForm) loadFormOptions();
  }, [showForm]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await offerService.createOffer({
        ...form,
        property_id: form.property_id || undefined,
        message_id: form.message_id || undefined,
        amount: form.amount ? Number(form.amount) : undefined,
      });
      setShowForm(false);
      setForm({ property_id: '', message_id: '', amount: '', status: 'submitted', notes: '' });
      fetchOffers();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.errors?.amount?.[0] || 'Failed to create offer');
    }
  };

  const handleUpdate = async (id) => {
    try {
      await offerService.updateOffer(id, {
        status: editForm.status || undefined,
        notes: editForm.notes !== undefined ? editForm.notes : undefined,
      });
      setEditingId(null);
      fetchOffers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update offer');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this offer?')) return;
    try {
      await offerService.deleteOffer(id);
      fetchOffers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete offer');
    }
  };

  const startEdit = (offer) => {
    setEditingId(offer.id);
    setEditForm({ status: offer.status, notes: offer.notes ?? '' });
  };

  const byStatus = offers.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <AgentLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Offers</h1>
              <p className="mt-2 text-gray-600">Track offers and negotiations by property</p>
            </div>
            <button
              type="button"
              onClick={() => { setShowForm(true); loadFormOptions(); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <PlusIcon className="h-5 w-5" />
              Add offer
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {(['submitted', 'counter', 'accepted', 'rejected']).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilters((f) => ({ ...f, status: f.status === status ? '' : status }))}
                className={`rounded-lg border p-3 text-left ${filters.status === status ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-gray-200 bg-white'}`}
              >
                <p className="text-xs font-medium text-gray-500 uppercase">{STATUS_LABELS[status]}</p>
                <p className="text-2xl font-bold text-gray-900">{byStatus[status] ?? 0}</p>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
              <select
                value={filters.property_id}
                onChange={(e) => setFilters((f) => ({ ...f, property_id: e.target.value }))}
                className="w-full min-w-[200px] px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All properties</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                className="w-full min-w-[140px] px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All statuses</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Create form */}
          {showForm && (
            <div className="bg-white rounded-lg shadow p-6 mb-6 border border-indigo-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">New offer</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
                    <select
                      required
                      value={form.property_id}
                      onChange={(e) => setForm((f) => ({ ...f, property_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select property</option>
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>{p.title} — ${Number(p.price || 0).toLocaleString()}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Linked lead (optional)</label>
                    <select
                      value={form.message_id}
                      onChange={(e) => setForm((f) => ({ ...f, message_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">None</option>
                      {leads.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.sender?.name || 'Unknown'} – {m.property?.title || 'No property'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Contingencies, terms..."
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    Save offer
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto" />
              <p className="mt-4 text-gray-500">Loading offers...</p>
            </div>
          ) : offers.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No offers yet</p>
              <p className="text-sm text-gray-400 mt-1">Add an offer to track negotiations.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property / Lead</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {offers.map((offer) => (
                      <tr key={offer.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            {offer.property && (
                              <Link to={`/properties/${offer.property.uuid || offer.property.id}`} className="font-medium text-indigo-600 hover:underline">
                                {offer.property.title}
                              </Link>
                            )}
                            {offer.message?.sender && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                Lead: {offer.message.sender.name}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          ${Number(offer.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          {editingId === offer.id ? (
                            <select
                              value={editForm.status}
                              onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${STATUS_CLASS[offer.status] || 'bg-gray-100 text-gray-800'}`}>
                              {STATUS_LABELS[offer.status] || offer.status}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {offer.submitted_at && new Date(offer.submitted_at).toLocaleDateString()}
                          {offer.responded_at && ` → ${new Date(offer.responded_at).toLocaleDateString()}`}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {editingId === offer.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <input
                                type="text"
                                value={editForm.notes}
                                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                                placeholder="Notes"
                                className="text-sm border border-gray-300 rounded px-2 py-1 w-32"
                              />
                              <button type="button" onClick={() => handleUpdate(offer.id)} className="text-indigo-600 hover:underline text-sm">Save</button>
                              <button type="button" onClick={() => setEditingId(null)} className="text-gray-500 hover:underline text-sm">Cancel</button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button type="button" onClick={() => startEdit(offer)} className="text-gray-600 hover:text-gray-900" title="Edit">
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button type="button" onClick={() => handleDelete(offer.id)} className="text-red-600 hover:text-red-900" title="Delete">
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination.last_page > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 flex justify-center gap-2">
                  {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => fetchOffers(page)}
                      className={`px-3 py-1 rounded text-sm ${pagination.current_page === page ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {offers.length > 0 && (
            <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <DocumentTextIcon className="h-4 w-4" />
                Summary
              </h3>
              <p className="text-sm text-gray-600">
                Total offers: {pagination.total}. Submitted: {byStatus.submitted ?? 0} · Counter: {byStatus.counter ?? 0} · Accepted: {byStatus.accepted ?? 0} · Rejected: {byStatus.rejected ?? 0}
              </p>
            </div>
          )}
        </div>
      </div>
    </AgentLayout>
  );
};

export default Offers;
