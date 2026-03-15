import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import usePropertyStore from '../../store/propertyStore';
import PropertyCard from './PropertyCard';
import SaveSearchModal from '../search/SaveSearchModal';
import MapSearch from '../search/MapSearch';
import useAuthStore from '../../store/authStore';

const PROPERTY_TYPES = ['house', 'apartment', 'condo', 'townhouse', 'land', 'commercial'];
const STATUS_OPTIONS = ['for_sale', 'for_rent', 'sold', 'pending'];
const BED_BATH_OPTIONS = ['1', '2', '3', '4', '5'];

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
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [areaFilterIds, setAreaFilterIds] = useState(null);
  const [selectedAreaName, setSelectedAreaName] = useState('');
  const [compareIds, setCompareIds] = useState([]);

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

  return (
    <div className="container-fluid mx-auto px-4 py-8">
      {/* Horizontal Filters + Header */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white px-4 py-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Properties ({pagination.total})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium text-gray-700"
              >
                Clear Filters
              </button>
              {isAuthenticated && searchParams.toString() && (
                <button
                  onClick={() => setShowSaveSearch(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-600 text-sm font-medium"
                >
                  Save Search
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('split')}
              className={`p-2 rounded ${
                viewMode === 'split'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Map + List
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              List
            </button>
            {compareIds.length > 0 && (
              <button
                onClick={() => {
                  const idsParam = compareIds.join(',');
                  navigate(`/compare?ids=${idsParam}`);
                }}
                className="ml-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-600 text-sm font-medium"
              >
                Compare ({compareIds.length})
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
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
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="created_at_desc">Sort: Newest First</option>
            <option value="created_at_asc">Sort: Oldest First</option>
            <option value="price_asc">Sort: Price Low to High</option>
            <option value="price_desc">Sort: Price High to Low</option>
            <option value="square_feet_desc">Sort: Largest First</option>
            <option value="views_desc">Sort: Most Viewed</option>
            <option value="saves_desc">Sort: Most Saved</option>
          </select>

          <select
            value={searchParams.get('property_type') || ''}
            onChange={(e) => updateFilterParam('property_type', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Property Type</option>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace('_', ' ')}
              </option>
            ))}
          </select>

          <select
            value={searchParams.get('status') || ''}
            onChange={(e) => updateFilterParam('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Min Price"
            value={searchParams.get('min_price') || ''}
            onChange={(e) => updateFilterParam('min_price', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />

          <input
            type="number"
            placeholder="Max Price"
            value={searchParams.get('max_price') || ''}
            onChange={(e) => updateFilterParam('max_price', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />

          <select
            value={searchParams.get('bedrooms') || ''}
            onChange={(e) => updateFilterParam('bedrooms', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Beds</option>
            {BED_BATH_OPTIONS.map((value) => (
              <option key={`beds-${value}`} value={value}>
                {value}+ Beds
              </option>
            ))}
          </select>

          <select
            value={searchParams.get('bathrooms') || ''}
            onChange={(e) => updateFilterParam('bathrooms', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Baths</option>
            {BED_BATH_OPTIONS.map((value) => (
              <option key={`baths-${value}`} value={value}>
                {value}+ Baths
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <input
            type="text"
            placeholder="City"
            value={searchParams.get('city') || ''}
            onChange={(e) => updateFilterParam('city', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />

          <input
            type="text"
            placeholder="State"
            value={searchParams.get('state') || ''}
            onChange={(e) => updateFilterParam('state', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />

          <input
            type="number"
            placeholder="Min Sq Ft"
            value={searchParams.get('min_square_feet') || ''}
            onChange={(e) => updateFilterParam('min_square_feet', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />

          <input
            type="number"
            placeholder="Max Sq Ft"
            value={searchParams.get('max_square_feet') || ''}
            onChange={(e) => updateFilterParam('max_square_feet', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />

          <input
            type="number"
            placeholder="Min Year"
            value={searchParams.get('min_year_built') || ''}
            onChange={(e) => updateFilterParam('min_year_built', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />

          <input
            type="number"
            placeholder="Max Year"
            value={searchParams.get('max_year_built') || ''}
            onChange={(e) => updateFilterParam('max_year_built', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Featured</span>
          <button
            type="button"
            onClick={() =>
              updateFilterParam(
                'featured',
                searchParams.get('featured') === 'true' ? '' : 'true'
              )
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              searchParams.get('featured') === 'true' ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
            aria-pressed={searchParams.get('featured') === 'true'}
            aria-label="Toggle featured properties only"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                searchParams.get('featured') === 'true' ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-gray-500">
            {searchParams.get('featured') === 'true' ? 'Featured only' : 'All listings'}
          </span>
        </div>
      </div>

      {/* Active Filters Display */}
      <div className="mb-4">
        {searchParams.toString() && (
          <div className="flex flex-wrap gap-2">
            {Array.from(searchParams.entries()).map(([key, value]) => {
              if (key === 'page' || key === 'per_page' || key === 'sort_by' || key === 'sort_order') {
                return null;
              }
              return (
                <span
                  key={key}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                >
                  {key}: {value}
                  <button
                    onClick={() => {
                      const params = new URLSearchParams(searchParams);
                      params.delete(key);
                      setSearchParams(params);
                    }}
                    className="ml-2 text-indigo-600 hover:text-indigo-600"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

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
                      isSelectedForCompare={compareIds.includes(property.id)}
                      onCompareToggle={() => handleCompareToggle(property.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>

              {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === pagination.last_page ||
                    (page >= pagination.current_page - 2 &&
                      page <= pagination.current_page + 2)
                )
                .map((page, index, array) => (
                  <div key={page} className="flex items-center gap-2">
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2">...</span>
                    )}
                    <button
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 border rounded ${
                        pagination.current_page === page
                          ? 'bg-indigo-600 text-white'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  </div>
                ))}

              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PropertyList;
