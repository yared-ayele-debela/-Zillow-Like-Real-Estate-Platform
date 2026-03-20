import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  Squares2X2Icon,
  PhotoIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { propertyService } from '../services/propertyService';
import PageHero from '../components/common/PageHero';
import { DEFAULT_PROPERTY_IMAGE } from '../utils/defaultImages';
import { propertySlug } from '../utils/propertyRoute';

const CompareProperties = () => {
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    property: null,
    index: 0,
  });

  const idsParam = searchParams.get('ids') || '';
  const ids = idsParam
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  useEffect(() => {
    const fetchComparedProperties = async () => {
      if (ids.length === 0) {
        setProperties([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await propertyService.getProperties({
          ids: ids.join(','),
          per_page: ids.length,
        });

        const data = response.data || response;
        const items = Array.isArray(data) ? data : data.data || [];

        setProperties(items);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            'Failed to load properties for comparison'
        );
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComparedProperties();
  }, [ids.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasEnoughToCompare = properties.length >= 2;

  const getImageUrl = (property) => {
    const images = property.images || [];
    const primaryImage = images.find((img) => img.is_primary) || images[0];
    return primaryImage
      ? `${process.env.REACT_APP_API_URL?.replace('/api', '')}/storage/${primaryImage.image_path}`
      : DEFAULT_PROPERTY_IMAGE;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHero
        title="Compare Properties"
        subtitle="Side-by-side comparison of up to 4 properties. Select listings from the properties page to get started."
        backLink={{ to: '/properties', label: 'Back to Properties' }}
        badge={hasEnoughToCompare ? `Comparing ${properties.length} propert${properties.length !== 1 ? 'ies' : 'y'}` : null}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            {error}
          </div>
        )}

        {ids.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 sm:p-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
              <Squares2X2Icon className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">No properties selected</h2>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">
              Go to the properties page and use the Compare checkbox on listings you want to compare. Select 2–4 properties.
            </p>
            <Link
              to="/properties"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Browse Properties
              <ArrowLeftIcon className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        )}

        {isLoading && ids.length > 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-600 border-t-transparent" />
            <p className="mt-4 text-gray-500">Loading properties...</p>
          </div>
        )}

        {!isLoading && ids.length > 0 && !hasEnoughToCompare && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800">
            <p className="font-medium">Select at least 2 properties to compare.</p>
            <p className="mt-1 text-sm text-amber-700">Currently selected: {ids.length}</p>
            <Link
              to="/properties"
              className="mt-4 inline-flex items-center gap-2 text-amber-800 font-medium hover:underline"
            >
              Add more properties
              <ArrowLeftIcon className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        )}

        {!isLoading && hasEnoughToCompare && (
          <div className="space-y-6">
            {/* Table - horizontal scroll on mobile */}
            <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="min-w-[640px] sm:min-w-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="sticky left-0 z-10 min-w-[140px] sm:min-w-[160px] px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                        Attribute
                      </th>
                      {properties.map((property) => (
                        <th
                          key={property.id}
                          className="min-w-[180px] sm:min-w-[200px] px-4 sm:px-6 py-4 text-left bg-gray-50 border-l border-gray-100"
                        >
                          <Link
                            to={`/properties/${propertySlug(property)}`}
                            className="block group"
                          >
                            <span className="text-sm font-semibold text-indigo-600 group-hover:text-indigo-700 line-clamp-2">
                              {property.title}
                            </span>
                            <span className="mt-1 block text-xs text-gray-500 font-normal">
                              {property.formatted_price ||
                                (property.price
                                  ? `$${Number(property.price).toLocaleString()}`
                                  : '—')}
                            </span>
                          </Link>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Photos row */}
                    <tr>
                      <td className="sticky left-0 z-10 px-4 sm:px-6 py-4 font-medium text-gray-700 bg-white">
                        Photos
                      </td>
                      {properties.map((property) => {
                        const imageUrl = getImageUrl(property);
                        const images = property.images || [];
                        return (
                          <td key={property.id} className="px-4 sm:px-6 py-4 border-l border-gray-100">
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                className="relative aspect-[4/3] w-full max-w-[200px] overflow-hidden rounded-lg border border-gray-200 bg-gray-100 group/btn"
                                onClick={() =>
                                  setImageModal({ isOpen: true, property, index: 0 })
                                }
                              >
                                <img
                                  src={imageUrl}
                                  alt={property.title}
                                  className="h-full w-full object-cover group-hover/btn:scale-105 transition-transform duration-200"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = DEFAULT_PROPERTY_IMAGE;
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/btn:opacity-100 transition-opacity flex items-center justify-center">
                                  <PhotoIcon className="w-8 h-8 text-white" />
                                </div>
                              </button>
                              <span className="text-xs text-gray-500">
                                {images.length > 0
                                  ? `${images.length} photo${images.length > 1 ? 's' : ''}`
                                  : 'No photos'}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {[
                      { key: 'price', label: 'Price', get: (p) => p.formatted_price || (p.price ? `$${Number(p.price).toLocaleString()}` : '—') },
                      { key: 'beds', label: 'Beds', get: (p) => p.bedrooms ?? '—' },
                      { key: 'baths', label: 'Baths', get: (p) => p.bathrooms ?? '—' },
                      { key: 'sqft', label: 'Square Feet', get: (p) => p.square_feet ? Number(p.square_feet).toLocaleString() : '—' },
                      { key: 'location', label: 'Location', get: (p) => [p.address, p.city, p.state, p.zip_code].filter(Boolean).join(', ') || '—' },
                      { key: 'type', label: 'Property Type', get: (p) => (p.property_type || '—').replace(/_/g, ' ') },
                      { key: 'status', label: 'Status', get: (p) => (p.status?.replace('_', ' ') || '—') },
                      { key: 'year', label: 'Year Built', get: (p) => p.year_built || '—' },
                      {
                        key: 'amenities',
                        label: 'Key Amenities',
                        get: (p) =>
                          Array.isArray(p.amenities) && p.amenities.length > 0
                            ? p.amenities
                                .map((a) => a.name || a.label || a.slug)
                                .filter(Boolean)
                                .slice(0, 5)
                                .join(', ')
                            : '—',
                      },
                    ].map(({ key, label, get }) => (
                      <tr key={key} className="hover:bg-gray-50/50">
                        <td className="sticky left-0 z-10 px-4 sm:px-6 py-3 font-medium text-gray-700 bg-white">
                          {label}
                        </td>
                        {properties.map((property) => (
                          <td key={property.id} className="px-4 sm:px-6 py-3 text-gray-900 border-l border-gray-100">
                            {get(property)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile hint for horizontal scroll */}
            <p className="text-center text-sm text-gray-500 sm:hidden">
              ← Scroll horizontally to compare →
            </p>
          </div>
        )}
      </div>

      {/* Image modal */}
      {imageModal.isOpen && imageModal.property && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setImageModal({ isOpen: false, property: null, index: 0 })}
        >
          <div
            className="relative w-full max-w-4xl rounded-xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 sm:px-6 py-4">
              <div className="min-w-0 flex-1 pr-4">
                <h2 className="text-base font-semibold text-gray-900 line-clamp-1">
                  {imageModal.property.title}
                </h2>
                <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">
                  {[imageModal.property.address, imageModal.property.city, imageModal.property.state]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-lg p-2 hover:bg-gray-100 text-gray-500 transition-colors"
                onClick={() =>
                  setImageModal({ isOpen: false, property: null, index: 0 })
                }
                aria-label="Close"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 bg-gray-900 flex items-center justify-center min-h-[200px] md:min-h-[400px]">
                {imageModal.property.images?.length > 0 ? (
                  <img
                    src={`${process.env.REACT_APP_API_URL?.replace('/api', '')}/storage/${imageModal.property.images[imageModal.index]?.image_path}`}
                    alt={imageModal.property.title}
                    className="max-h-[60vh] md:max-h-[70vh] w-auto object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_PROPERTY_IMAGE;
                    }}
                  />
                ) : (
                  <img
                    src={DEFAULT_PROPERTY_IMAGE}
                    alt={imageModal.property.title}
                    className="max-h-[60vh] md:max-h-[70vh] w-auto object-contain"
                  />
                )}
              </div>
              {imageModal.property.images?.length > 1 && (
                <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Gallery
                  </p>
                  <div className="grid grid-cols-4 md:grid-cols-2 gap-2 max-h-[140px] md:max-h-[360px] overflow-y-auto">
                    {imageModal.property.images.map((img, idx) => (
                      <button
                        key={img.id || idx}
                        type="button"
                        className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                          idx === imageModal.index
                            ? 'border-indigo-600 ring-2 ring-indigo-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() =>
                          setImageModal((prev) => ({ ...prev, index: idx }))
                        }
                      >
                        <img
                          src={
                            img.image_path
                              ? `${process.env.REACT_APP_API_URL?.replace('/api', '')}/storage/${img.image_path}`
                              : DEFAULT_PROPERTY_IMAGE
                          }
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = DEFAULT_PROPERTY_IMAGE;
                          }}
                        />
                      </button>
                    ))}
                  </div>
                  {imageModal.property.images.length > 1 && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() =>
                          setImageModal((prev) => ({
                            ...prev,
                            index: Math.max(0, prev.index - 1),
                          }))
                        }
                        disabled={imageModal.index === 0}
                        className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-50"
                      >
                        <ChevronLeftIcon className="w-4 h-4" />
                        Prev
                      </button>
                      <span className="text-xs text-gray-500">
                        {imageModal.index + 1} / {imageModal.property.images.length}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setImageModal((prev) => ({
                            ...prev,
                            index: Math.min(
                              prev.property.images.length - 1,
                              prev.index + 1
                            ),
                          }))
                        }
                        disabled={
                          imageModal.index ===
                          imageModal.property.images.length - 1
                        }
                        className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-50"
                      >
                        Next
                        <ChevronRightIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompareProperties;
