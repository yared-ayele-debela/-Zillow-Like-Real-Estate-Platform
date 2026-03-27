import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FunnelIcon,
  MapIcon,
  Squares2X2Icon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import PageHero from '../common/PageHero';
import usePropertyStore from '../../store/propertyStore';
import PropertyCard from './PropertyCard';
import SaveSearchModal from '../search/SaveSearchModal';
import MapSearch from '../search/MapSearch';
import useAuthStore from '../../store/authStore';
import { propertySlug } from '../../utils/propertyRoute';

const PROPERTY_TYPES = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
];
const STATUS_OPTIONS = [
  { value: 'for_sale', label: 'For Sale' },
  { value: 'for_rent', label: 'For Rent' },
  { value: 'sold', label: 'Sold' },
  { value: 'pending', label: 'Pending' },
];
const BED_BATH_OPTIONS = ['1', '2', '3', '4', '5'];

/** Count filter params (exclude sort, page, per_page). */
function countActiveFilters(searchParams) {
  let n = 0;
  searchParams.forEach((value, key) => {
    if (!['page', 'per_page', 'sort_by', 'sort_order', 'search'].includes(key) && value) n++;
  });
  return n;
}

/** Human-readable label for active filter chip. */
function filterLabel(key, value) {
  if (key === 'property_type') return PROPERTY_TYPES.find((t) => t.value === value)?.label || value;
  if (key === 'status') return STATUS_OPTIONS.find((s) => s.value === value)?.label || value;
  if (key === 'bedrooms') return `${value}+ Beds`;
  if (key === 'bathrooms') return `${value}+ Baths`;
  if (key === 'featured') return 'Featured only';
  if (key === 'min_price') return `Min $${Number(value).toLocaleString()}`;
  if (key === 'max_price') return `Max $${Number(value).toLocaleString()}`;
  if (key === 'min_square_feet') return `Min ${value} sq ft`;
  if (key === 'max_square_feet') return `Max ${value} sq ft`;
  if (key === 'min_year_built') return `From ${value}`;
  if (key === 'max_year_built') return `To ${value}`;
  if (key === 'city' || key === 'state') return `${key === 'city' ? 'City' : 'State'}: ${value}`;
  return `${key}: ${value}`;
}

const PropertyList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    properties,
    isLoading,
    error,
    pagination,
    fetchProperties,
    setFilters,
  } = usePropertyStore();
  const { isAuthenticated } = useAuthStore();
  const [viewMode, setViewMode] = useState('split'); // 'split' or 'list'
  const [showSaveSearch, setShowSaveSearch] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterBodyExpanded, setFilterBodyExpanded] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [areaFilterIds, setAreaFilterIds] = useState(null);
  const [selectedAreaName, setSelectedAreaName] = useState('');
  const [compareIds, setCompareIds] = useState([]);

  const activeFilterCount = countActiveFilters(searchParams);

  useEffect(() => {
    // Sync URL params with filters
    const urlFilters = {
      search: searchParams.get('search') || '',
      property_type: searchParams.get('property_type') || '',
      status: searchParams.get('status') || '',
      min_price: searchParams.get('min_price') || '',
      max_price: searchParams.get('max_price') || '',
      bedrooms: searchParams.get('bedrooms') || '',
      bathrooms: searchParams.get('bathrooms') || '',
      min_square_feet: searchParams.get('min_square_feet') || '',
      max_square_feet: searchParams.get('max_square_feet') || '',
      min_year_built: searchParams.get('min_year_built') || '',
      max_year_built: searchParams.get('max_year_built') || '',
      city: searchParams.get('city') || '',
      state: searchParams.get('state') || '',
      amenities: searchParams.get('amenities')?.split(',') || [],
      featured: searchParams.get('featured') === 'true',
    };

    setFilters(urlFilters);
  }, [searchParams, setFilters]);

  useEffect(() => {
    const page = parseInt(searchParams.get('page')) || 1;
    // Build params from URL for API call
    const params = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    params.page = page;
    params.per_page = params.per_page || (viewMode === 'split' ? 100 : 15);

    // Fetch properties with current filters from URL
    fetchProperties(page, params);
  }, [searchParams, fetchProperties, viewMode]);

  const handleFavoriteToggle = (propertyId) => {
    // TODO: Implement favorite toggle
    console.log('Toggle favorite for property:', propertyId);
  };

  const handleCompareToggle = (propertyId) => {
    setCompareIds((prev) => {
      if (prev.includes(propertyId)) {
        return prev.filter((id) => id !== propertyId);
      }

      if (prev.length >= 4) {
        return prev;
      }

      return [...prev, propertyId];
    });
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage);
    setSearchParams(params);
  };

  const updateFilterParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value === '' || value === null || value === undefined) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams);
    [
      'property_type',
      'status',
      'min_price',
      'max_price',
      'bedrooms',
      'bathrooms',
      'min_square_feet',
      'max_square_feet',
      'min_year_built',
      'max_year_built',
      'city',
      'state',
      'amenities',
      'featured',
    ].forEach((key) => params.delete(key));
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleMapPropertyClick = (property) => {
    setSelectedPropertyId(property.id);
  };

  const areaFilteredProperties = areaFilterIds
    ? properties.filter((p) => areaFilterIds.includes(p.id))
    : properties;

  const displayedProperties = selectedPropertyId
    ? [
        ...areaFilteredProperties.filter((p) => p.id === selectedPropertyId),
        ...areaFilteredProperties.filter((p) => p.id !== selectedPropertyId),
      ]
    : areaFilteredProperties;

  if (isLoading && properties.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const labelClass = 'block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <PageHero
        title="Browse Properties"
        subtitle="Find your perfect home. Search listings, filter by criteria, and explore on the map."
        badge={pagination.total !== undefined ? `${pagination.total} listings` : null}
      /> */}

      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8 -mt-4">
        {/* Toolbar */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
              Results
              <span className="ml-2 text-gray-500 font-normal">
                {pagination.total !== undefined ? `(${pagination.total})` : ''}
              </span>
            </h2>
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 lg:hidden"
            >
              <FunnelIcon className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-100 px-1.5 text-xs font-semibold text-indigo-700">
                  {activeFilterCount}
                </span>
              )}
              {filtersOpen ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={`${searchParams.get('sort_by') || 'created_at'}_${searchParams.get('sort_order') || 'desc'}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('_');
                const params = new URLSearchParams(searchParams);
                params.set('sort_by', sortBy);
                params.set('sort_order', sortOrder);
                params.set('page', '1');
                setSearchParams(params);
              }}
              className={`${inputClass} w-auto min-w-[180px]`}
              aria-label="Sort results"
            >
              <option value="created_at_desc">Newest first</option>
              <option value="created_at_asc">Oldest first</option>
              <option value="price_asc">Price: Low to high</option>
              <option value="price_desc">Price: High to low</option>
              <option value="square_feet_desc">Largest first</option>
              <option value="views_desc">Most viewed</option>
              <option value="saves_desc">Most saved</option>
            </select>

            <div className="flex rounded-lg border border-gray-300 bg-white p-0.5 shadow-sm" role="group" aria-label="View mode">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'split' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Map + List"
              >
                <MapIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Map</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'list' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="List only"
              >
                <Squares2X2Icon className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>

            {compareIds.length > 0 && (
              <button
                type="button"
                onClick={() => navigate(`/compare?ids=${compareIds.join(',')}`)}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                Compare ({compareIds.length})
              </button>
            )}

            {isAuthenticated && searchParams.toString() && (
              <button
                type="button"
                onClick={() => setShowSaveSearch(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-600 bg-white px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
                Save search
              </button>
            )}
          </div>
        </div>

        {/* Filter panel (desktop: always visible or toggled; mobile: collapsible) */}
        <div
          className={`mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 ${
            filtersOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="border-b border-gray-100 px-4 py-3 sm:px-6 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Clear all
                </button>
              )}
              <button
                type="button"
                onClick={() => setFilterBodyExpanded((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                aria-expanded={filterBodyExpanded}
              >
                {filterBodyExpanded ? (
                  <>
                    <ChevronUpIcon className="h-4 w-4" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDownIcon className="h-4 w-4" />
                    Show filters
                  </>
                )}
              </button>
            </div>
          </div>
          {filterBodyExpanded && (
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
              {/* Listing type */}
              <div className="space-y-2">
                <label className={labelClass}>Property type</label>
                <select
                  value={searchParams.get('property_type') || ''}
                  onChange={(e) => updateFilterParam('property_type', e.target.value)}
                  className={inputClass}
                >
                  <option value="">All types</option>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Status</label>
                <select
                  value={searchParams.get('status') || ''}
                  onChange={(e) => updateFilterParam('status', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Any status</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Beds</label>
                <select
                  value={searchParams.get('bedrooms') || ''}
                  onChange={(e) => updateFilterParam('bedrooms', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Any</option>
                  {BED_BATH_OPTIONS.map((v) => (
                    <option key={`beds-${v}`} value={v}>{v}+ Beds</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Baths</label>
                <select
                  value={searchParams.get('bathrooms') || ''}
                  onChange={(e) => updateFilterParam('bathrooms', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Any</option>
                  {BED_BATH_OPTIONS.map((v) => (
                    <option key={`baths-${v}`} value={v}>{v}+ Baths</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Min price</label>
                <input
                  type="number"
                  placeholder="No min"
                  value={searchParams.get('min_price') || ''}
                  onChange={(e) => updateFilterParam('min_price', e.target.value)}
                  className={inputClass}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Max price</label>
                <input
                  type="number"
                  placeholder="No max"
                  value={searchParams.get('max_price') || ''}
                  onChange={(e) => updateFilterParam('max_price', e.target.value)}
                  className={inputClass}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>City</label>
                <input
                  type="text"
                  placeholder="Any city"
                  value={searchParams.get('city') || ''}
                  onChange={(e) => updateFilterParam('city', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>State</label>
                <input
                  type="text"
                  placeholder="Any state"
                  value={searchParams.get('state') || ''}
                  onChange={(e) => updateFilterParam('state', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Min sq ft</label>
                <input
                  type="number"
                  placeholder="No min"
                  value={searchParams.get('min_square_feet') || ''}
                  onChange={(e) => updateFilterParam('min_square_feet', e.target.value)}
                  className={inputClass}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Max sq ft</label>
                <input
                  type="number"
                  placeholder="No max"
                  value={searchParams.get('max_square_feet') || ''}
                  onChange={(e) => updateFilterParam('max_square_feet', e.target.value)}
                  className={inputClass}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Year built (min)</label>
                <input
                  type="number"
                  placeholder="Any"
                  value={searchParams.get('min_year_built') || ''}
                  onChange={(e) => updateFilterParam('min_year_built', e.target.value)}
                  className={inputClass}
                  min={1800}
                  max={2100}
                />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Year built (max)</label>
                <input
                  type="number"
                  placeholder="Any"
                  value={searchParams.get('max_year_built') || ''}
                  onChange={(e) => updateFilterParam('max_year_built', e.target.value)}
                  className={inputClass}
                  min={1800}
                  max={2100}
                />
              </div>
              <div className="flex items-end sm:col-span-2 lg:col-span-1">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-3 transition-colors hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={searchParams.get('featured') === 'true'}
                    onChange={() =>
                      updateFilterParam('featured', searchParams.get('featured') === 'true' ? '' : 'true')
                    }
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Featured only</span>
                </label>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {Array.from(searchParams.entries()).map(([key, value]) => {
              if (!value || ['page', 'per_page', 'sort_by', 'sort_order', 'search'].includes(key)) return null;
              if (key === 'amenities') return null; // skip multi-value for chip display
              const label = filterLabel(key, value);
              return (
                <span
                  key={`${key}-${value}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 py-1.5 pl-3 pr-1.5 text-sm text-indigo-800"
                >
                  {label}
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams);
                      params.delete(key);
                      params.set('page', '1');
                      setSearchParams(params);
                    }}
                    className="rounded-full p-0.5 text-indigo-600 hover:bg-indigo-100"
                    aria-label={`Remove ${label}`}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

      {/* Save Search Modal */}
      <SaveSearchModal
        isOpen={showSaveSearch}
        onClose={() => setShowSaveSearch(false)}
        filters={Object.fromEntries(searchParams.entries())}
        onSave={() => {
          setShowSaveSearch(false);
          alert('Search saved successfully!');
        }}
      />

      {properties.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No properties found</p>
          <p className="text-gray-400 mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className={viewMode === 'split' ? 'grid grid-cols-1 xl:grid-cols-12 gap-6' : ''}>
            {viewMode === 'split' && (
              <div className="xl:col-span-7">
                <div className="sticky top-4">
                  <MapSearch
                    properties={properties}
                    onPropertyClick={handleMapPropertyClick}
                    onAreaFilterChange={(payload) => {
                      if (!payload) {
                        setAreaFilterIds(null);
                        setSelectedAreaName('');
                        setSelectedPropertyId(null);
                        return;
                      }
                      setAreaFilterIds(payload.propertyIds || []);
                      setSelectedAreaName(payload.areaName || '');
                      setSelectedPropertyId(null);
                    }}
                    enableBoundsFilter={false}
                    heightClass="h-[70vh]"
                  />
                </div>
              </div>
            )}

            <div className={viewMode === 'split' ? 'xl:col-span-5' : ''}>
              {viewMode === 'split' && selectedAreaName && (
                <div className="mb-3 px-3 py-2 rounded-md bg-indigo-50 text-indigo-700 text-sm font-medium">
                  Showing properties in: {selectedAreaName} ({displayedProperties.length})
                  <button
                    onClick={() => {
                      setAreaFilterIds(null);
                      setSelectedAreaName('');
                      setSelectedPropertyId(null);
                    }}
                    className="ml-3 text-indigo-700 underline"
                  >
                    Remove Boundary
                  </button>
                </div>
              )}
              {viewMode === 'split' && selectedAreaName && displayedProperties.length === 0 && (
                <div className="mb-3 px-3 py-3 rounded-md bg-amber-50 text-amber-800 text-sm">
                  No properties found inside this selected boundary. Try another area.
                </div>
              )}
              <div
                className={
                  viewMode === 'split'
                    ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                }
              >
                {displayedProperties.map((property) => (
                  <div
                    key={property.id}
                    className={selectedPropertyId === property.id ? 'ring-2 ring-red-500 rounded-lg' : ''}
                  >
                    <PropertyCard
                      property={property}
                      onFavoriteToggle={handleFavoriteToggle}
                      isFavorite={false} // TODO: Get from favorites store
                      isSelectedForCompare={compareIds.includes(propertySlug(property))}
                      onCompareToggle={() => handleCompareToggle(propertySlug(property))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <nav
              className="mt-8 flex flex-wrap items-center justify-center gap-2"
              aria-label="Pagination"
            >
              <button
                type="button"
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === pagination.last_page ||
                      (page >= pagination.current_page - 2 &&
                        page <= pagination.current_page + 2)
                  )
                  .map((page, index, array) => (
                    <span key={page} className="flex items-center gap-1">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">…</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handlePageChange(page)}
                        className={`min-w-[2.25rem] rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition-colors ${
                          pagination.current_page === page
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    </span>
                  ))}
              </div>
              <button
                type="button"
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
      </div>
    </div>
  );
};

export default PropertyList;
