import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MagnifyingGlassIcon, ShieldCheckIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { agentService } from '../services/agentService';

const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith('http')) return avatar;
  return `${process.env.REACT_APP_API_URL?.replace('/api', '')}/storage/${avatar}`;
};

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
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error?.response?.data?.message || 'Failed to load agents'}
        </div>
        <Link to="/" className="inline-block mt-4 text-indigo-600 hover:underline">
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find an Agent</h1>
          <p className="mt-1 text-gray-600">
            Browse verified agents and view their listings.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or company"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-lg"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
              Search
            </button>
          </div>
        </form>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          </div>
        ) : agents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-600">
            <BuildingOffice2Icon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p>No agents found.</p>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearchParams({});
                }}
                className="mt-2 text-indigo-600 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {agents.map((agent) => {
                const avatarUrl = getAvatarUrl(agent.avatar);
                return (
                  <Link
                    key={agent.id}
                    to={`/agents/${agent.id}`}
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 flex flex-col items-center text-center group"
                  >
                    <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center text-2xl font-bold text-gray-700 mb-4 ring-2 ring-white shadow">
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
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
                        {agent.name}
                      </h2>
                      {agent.is_verified && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                          <ShieldCheckIcon className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      )}
                    </div>
                    {agent.company_name && (
                      <p className="mt-1 text-sm text-indigo-600 font-medium">
                        {agent.company_name}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-gray-500">
                      {agent.approved_properties_count ?? 0} listing
                      {(agent.approved_properties_count ?? 0) !== 1 ? 's' : ''}
                    </p>
                    <span className="mt-3 text-sm font-medium text-indigo-600 group-hover:underline">
                      View profile →
                    </span>
                  </Link>
                );
              })}
            </div>

            {pagination.last_page > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(pagination.current_page - 1)}
                  disabled={pagination.current_page <= 1}
                  className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-sm text-gray-600">
                  Page {pagination.current_page} of {pagination.last_page}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(pagination.current_page + 1)}
                  disabled={pagination.current_page >= pagination.last_page}
                  className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Agents;
