import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  EyeIcon,
  HeartIcon,
  EnvelopeIcon,
  StarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { propertyService } from '../services/propertyService';
import AgentLayout from '../components/agent/AgentLayout';

const PropertyStats = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    propertyService
      .getPropertyStats(id)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load property stats');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <AgentLayout>
        <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
            <p className="mt-4 text-gray-600">Loading stats...</p>
          </div>
        </div>
      </AgentLayout>
    );
  }

  if (error) {
    return (
      <AgentLayout>
        <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Go back
              </button>
              <Link
                to="/agent/properties"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                My Properties
              </Link>
            </div>
          </div>
        </div>
      </AgentLayout>
    );
  }

  const views = data?.views || {};
  const saves = data?.saves || {};
  const rating = data?.rating || {};
  const inquiries = data?.inquiries ?? 0;

  const statCards = [
    {
      label: 'Total views',
      value: views.total ?? 0,
      icon: EyeIcon,
      sub: views.last_30_days != null ? `~${views.last_30_days} in last 30 days` : null,
    },
    {
      label: 'Saves (favorites)',
      value: saves.total ?? 0,
      icon: HeartIcon,
    },
    {
      label: 'Inquiries',
      value: inquiries,
      icon: EnvelopeIcon,
    },
    {
      label: 'Rating',
      value: rating.count > 0 ? `${Number(rating.average || 0).toFixed(1)} / 5` : '—',
      icon: StarIcon,
      sub: rating.count > 0 ? `${rating.count} reviews` : 'No reviews yet',
    },
  ];

  return (
    <AgentLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex items-center gap-4">
            <Link
              to="/agent/properties"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              My Properties
            </Link>
            <span className="text-gray-400">/</span>
            <Link
              to={`/properties/${id}`}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              View listing
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50">
                <ChartBarIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Listing performance
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  {data?.property_title || 'Property'}
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.label}
                      className="rounded-xl border border-gray-200 p-4 hover:border-indigo-200 hover:bg-indigo-50/30 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          {card.label}
                        </span>
                        <Icon className="h-5 w-5 text-gray-400" />
                      </div>
                      <p className="mt-2 text-2xl font-bold text-gray-900">
                        {typeof card.value === 'number'
                          ? card.value.toLocaleString()
                          : card.value}
                      </p>
                      {card.sub && (
                        <p className="mt-1 text-xs text-gray-500">{card.sub}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Views and saves reflect total engagement. Inquiries are messages
                  received for this listing. For detailed lead history, go to{' '}
                  <Link to="/agent/leads" className="text-indigo-600 hover:underline">
                    Leads
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AgentLayout>
  );
};

export default PropertyStats;
