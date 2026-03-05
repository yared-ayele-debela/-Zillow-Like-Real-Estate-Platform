import { Link } from 'react-router-dom';
import { MapPinIcon } from '@heroicons/react/24/outline';
import PropertyCard from './PropertyCard';
import { DEFAULT_PROPERTY_IMAGE } from '../../utils/defaultImages';

const NearbyProperties = ({ properties = [], title = 'Nearby Properties' }) => {
  if (!properties || properties.length === 0) {
    return null;
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath) return DEFAULT_PROPERTY_IMAGE;
    if (imagePath.startsWith('http')) return imagePath;
    return `${process.env.REACT_APP_API_URL?.replace('/api', '')}/storage/${imagePath}`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map((property) => (
          <Link
            key={property.id}
            to={`/properties/${property.id}`}
            className="block hover:shadow-lg transition-shadow rounded-lg overflow-hidden border border-gray-200"
          >
            <div className="relative h-48 bg-gray-200">
              <img
                src={getImageUrl(property.primary_image)}
                alt={property.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_PROPERTY_IMAGE;
                }}
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                {property.title}
              </h3>
              <p className="text-indigo-600 font-bold mb-2">
                ${Number(property.price).toLocaleString()}
              </p>
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <MapPinIcon className="w-4 h-4 mr-1" />
                <span className="line-clamp-1">
                  {property.address}, {property.city}, {property.state}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {property.bedrooms && (
                  <span>{property.bedrooms} bed</span>
                )}
                {property.bathrooms && (
                  <span>{property.bathrooms} bath</span>
                )}
                {property.square_feet && (
                  <span>{Number(property.square_feet).toLocaleString()} sq ft</span>
                )}
              </div>
              {property.distance && (
                <div className="mt-2 text-xs text-gray-500">
                  {property.distance} miles away
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default NearbyProperties;
