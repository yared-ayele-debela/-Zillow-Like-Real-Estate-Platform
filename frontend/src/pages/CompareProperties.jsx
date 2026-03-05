import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { propertyService } from '../services/propertyService';
import { DEFAULT_PROPERTY_IMAGE } from '../utils/defaultImages';

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Compare Properties
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Select up to 4 properties from the listings page to compare them
              side by side.
            </p>
          </div>
          <Link
            to="/properties"
            className="text-indigo-600 hover:text-indigo-600 text-sm font-medium"
          >
            ← Back to Properties
          </Link>
        </div>

        {ids.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-600">
            No properties selected for comparison. Go back to the properties
            page and use the Compare checkbox on listings.
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          </div>
        )}

        {!isLoading && hasEnoughToCompare && (
          <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attribute
                  </th>
                  {properties.map((property) => (
                    <th
                      key={property.id}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex flex-col gap-1">
                        <Link
                          to={`/properties/${property.id}`}
                          className="text-sm font-semibold text-indigo-600 hover:text-indigo-600 line-clamp-2"
                        >
                          {property.title}
                        </Link>
                        <span className="text-xs text-gray-500">
                          #{property.id}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-sm">
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-700">
                    Photos
                  </td>
                  {properties.map((property) => {
                    const images = property.images || [];
                    const primaryImage =
                      images.find((img) => img.is_primary) || images[0];
                    const imageUrl = primaryImage
                      ? `${process.env.REACT_APP_API_URL?.replace('/api', '')}/storage/${primaryImage.image_path}`
                      : DEFAULT_PROPERTY_IMAGE;

                    return (
                      <td key={property.id} className="px-4 py-3">
                        <div className="flex flex-col items-start gap-2">
                          <button
                            type="button"
                            className="relative h-20 w-32 overflow-hidden rounded-md border border-gray-200 bg-gray-100"
                            onClick={() =>
                              setImageModal({
                                isOpen: true,
                                property,
                                index: 0,
                              })
                            }
                          >
                            <img
                              src={imageUrl}
                              alt={property.title}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = DEFAULT_PROPERTY_IMAGE;
                              }}
                            />
                            <div className="absolute inset-0 bg-black/25 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-medium text-white">
                              View photos
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
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-700">
                    Price
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-gray-900">
                      {property.formatted_price ||
                        (property.price
                          ? `$${Number(property.price).toLocaleString()}`
                          : '—')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-700">
                    Beds
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-gray-900">
                      {property.bedrooms ?? '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-700">
                    Baths
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-gray-900">
                      {property.bathrooms ?? '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-700">
                    Square Feet
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-gray-900">
                      {property.square_feet
                        ? Number(property.square_feet).toLocaleString()
                        : '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-700">
                    Location
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-gray-900">
                      {[
                        property.address,
                        property.city,
                        property.state,
                        property.zip_code,
                      ]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-700">
                    Property Type
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-gray-900 capitalize">
                      {property.property_type || '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-700">
                    Status
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-gray-900 capitalize">
                      {property.status?.replace('_', ' ') || '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-700">
                    Year Built
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-gray-900">
                      {property.year_built || '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-700">
                    Key Amenities
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-gray-900">
                      {Array.isArray(property.amenities) &&
                      property.amenities.length > 0
                        ? property.amenities
                            .map((a) => a.name || a.label || a.slug)
                            .filter(Boolean)
                            .slice(0, 5)
                            .join(', ')
                        : '—'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && ids.length > 0 && !hasEnoughToCompare && (
          <div className="mt-4 bg-yellow-50 border border-yellow-400 text-yellow-800 px-4 py-3 rounded">
            Select at least 2 properties to compare. Currently selected:{' '}
            {ids.length}.
          </div>
        )}
      </div>

      {imageModal.isOpen && imageModal.property && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="relative w-full max-w-4xl rounded-xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 line-clamp-1">
                  {imageModal.property.title}
                </h2>
                <p className="text-xs text-gray-500">
                  {imageModal.property.address}, {imageModal.property.city},{' '}
                  {imageModal.property.state} {imageModal.property.zip_code}
                </p>
              </div>
              <button
                type="button"
                className="rounded-full p-2 hover:bg-gray-100 text-gray-500"
                onClick={() =>
                  setImageModal({ isOpen: false, property: null, index: 0 })
                }
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 bg-black flex items-center justify-center">
                {imageModal.property.images &&
                imageModal.property.images.length > 0 ? (
                  <img
                    src={`${process.env.REACT_APP_API_URL?.replace('/api', '')}/storage/${imageModal.property.images[imageModal.index].image_path}`}
                    alt={imageModal.property.title}
                    className="max-h-[70vh] w-auto object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_PROPERTY_IMAGE;
                    }}
                  />
                ) : (
                  <img
                    src={DEFAULT_PROPERTY_IMAGE}
                    alt={imageModal.property.title}
                    className="max-h-[70vh] w-auto object-contain"
                  />
                )}
              </div>
              {imageModal.property.images &&
                imageModal.property.images.length > 0 && (
                  <div className="w-full md:w-60 border-t md:border-t-0 md:border-l bg-gray-50 p-3 space-y-2">
                    <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">
                      Gallery
                    </p>
                    <div className="grid grid-cols-4 md:grid-cols-2 gap-2 max-h-[260px] md:max-h-[400px] overflow-y-auto pr-1">
                      {imageModal.property.images.map((img, idx) => (
                        <button
                          key={img.id || idx}
                          type="button"
                          className={`relative h-16 w-full overflow-hidden rounded-md border ${
                            idx === imageModal.index
                              ? 'border-indigo-600 ring-1 ring-indigo-600'
                              : 'border-gray-200'
                          }`}
                          onClick={() =>
                            setImageModal((prev) => ({
                              ...prev,
                              index: idx,
                            }))
                          }
                        >
                          <img
                            src={img.image_path ? `${process.env.REACT_APP_API_URL?.replace('/api', '')}/storage/${img.image_path}` : DEFAULT_PROPERTY_IMAGE}
                            alt={imageModal.property.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = DEFAULT_PROPERTY_IMAGE;
                            }}
                          />
                        </button>
                      ))}
                    </div>
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

