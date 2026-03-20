import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { agentService } from '../services/agentService';
import PageHero from '../components/common/PageHero';

const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith('http')) return avatar;
  return `${process.env.REACT_APP_API_URL?.replace('/api', '')}/storage/${avatar}`;
};

const AgentCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
    <div className="p-6 flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full bg-gray-200 mb-4" />
      <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-24 bg-gray-100 rounded mb-3" />
      <div className="h-4 w-16 bg-gray-100 rounded" />
    </div>
  </div>
);

const Agents = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const page = Number(searchParams.get('page') || 1);
  const search = searchParams.get('search') || '';

  const { data, isLoading, error } = useQuery({
    queryKey: ['agents', page, search],
    queryFn: () =>
      agentService.getAgents({
        page,
        per_page: 12,
        ...(search ? { search } : {}),
      }),
  });

  const agents = data?.data || [];
  const pagination = {
    current_page: data?.current_page ?? 1,
    last_page: data?.last_page ?? 1,
    per_page: data?.per_page ?? 12,
    total: data?.total ?? 0,
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    next.set('search', searchInput.trim());
    next.delete('page');
    setSearchParams(next);
  };

  const setPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
            <p className="text-red-600 font-medium">{error?.response?.data?.message || 'Failed to load agents'}</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHero
        title="Find Your Perfect Agent"
        subtitle="Connect with verified real estate professionals. Browse profiles, view listings, and start your journey."
        centered
      >
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or company..."
                className="w-full pl-12 pr-4 py-3.5 sm:py-3 bg-white/95 backdrop-blur border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-white/50 focus:outline-none shadow-lg"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 bg-white text-indigo-600 font-semibold px-6 py-3.5 sm:py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
              Search
            </button>
          </div>
        </form>
      </PageHero>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Results header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <p className="text-gray-600 text-sm sm:text-base">
            {isLoading ? (
              'Loading agents...'
            ) : (
              <>
                <span className="font-semibold text-gray-900">{pagination.total}</span>
                {' '}agent{pagination.total !== 1 ? 's' : ''} found
              </>
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <AgentCardSkeleton key={i} />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 sm:p-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <UserGroupIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">No agents found</h2>
            <p className="mt-2 text-gray-500 max-w-sm mx-auto">
              {search
                ? 'Try adjusting your search terms or clear the filter to see all agents.'
                : 'There are no agents available at the moment.'}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearchParams({});
                }}
                className="mt-6 inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {agents.map((agent) => {
                const avatarUrl = getAvatarUrl(agent.avatar);
                return (
                  <Link
                    key={agent.id}
                    to={`/agents/${agent.id}`}
                    className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-200 overflow-hidden"
                  >
                    <div className="p-6 sm:p-8 flex flex-col items-center text-center">
                      <div className="relative">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 overflow-hidden flex items-center justify-center text-2xl sm:text-3xl font-bold text-indigo-600 ring-4 ring-white shadow-lg group-hover:ring-indigo-100 transition-all">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={agent.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            (agent.name || 'A').charAt(0).toUpperCase()
                          )}
                        </div>
                        {agent.is_verified && (
                          <span className="absolute -bottom-1 -right-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white">
                            <ShieldCheckIcon className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <h2 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {agent.name}
                      </h2>
                      {agent.company_name && (
                        <p className="mt-1 text-sm text-indigo-600 font-medium line-clamp-1">
                          {agent.company_name}
                        </p>
                      )}
                      <p className="mt-3 text-sm text-gray-500">
                        {(agent.approved_properties_count ?? 0).toLocaleString()} active listing
                        {(agent.approved_properties_count ?? 0) !== 1 ? 's' : ''}
                      </p>
                      <span className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
                        View profile
                        <ChevronRightIcon className="w-4 h-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage(pagination.current_page - 1)}
                    disabled={pagination.current_page <= 1}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>
                  <span className="px-4 py-2.5 text-sm text-gray-600 font-medium">
                    Page {pagination.current_page} of {pagination.last_page}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage(pagination.current_page + 1)}
                    disabled={pagination.current_page >= pagination.last_page}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  Showing {(pagination.current_page - 1) * pagination.per_page + 1}–
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                  {pagination.total}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Agents;
