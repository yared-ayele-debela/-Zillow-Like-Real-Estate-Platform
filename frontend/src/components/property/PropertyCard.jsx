import { Link } from 'react-router-dom';
import { MapPinIcon, Squares2X2Icon, PlayCircleIcon } from '@heroicons/react/24/outline';
import FavoriteButton from './FavoriteButton';
import { DEFAULT_PROPERTY_IMAGE } from '../../utils/defaultImages';

const PropertyCard = ({
  property,
  onFavoriteToggle,
  isFavorite = false,
  isSelectedForCompare = false,
  onCompareToggle,
}) => {
  const primaryImage = property.images?.find((img) => img.is_primary) || property.images?.[0];
  const imageUrl = primaryImage
    ? `${process.env.REACT_APP_API_URL?.replace('/api', '')}/storage/${primaryImage.image_path}`
    : DEFAULT_PROPERTY_IMAGE;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border border-gray-100">
      <Link to={`/properties/${property.id}`}>
        <div className="relative h-48 bg-gray-200">
          <img
            src={imageUrl}
            alt={property.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_PROPERTY_IMAGE;
            }}
          />
          {property.is_featured && (
            <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-semibold">
              Featured
            </span>
          )}
          <div
            className="absolute top-2 right-2 flex items-center gap-2"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <button
              type="button"
              className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-medium backdrop-blur-sm transition-colors ${
                isSelectedForCompare
                  ? 'border-indigo-600 bg-indigo-600/90 text-white shadow-sm'
                  : 'border-white/70 bg-black/30 text-white hover:bg-black/40'
              }`}
              onClick={onCompareToggle}
            >
              <span
                className={`mr-1 inline-flex h-3 w-3 items-center justify-center rounded-[3px] border ${
                  isSelectedForCompare
                    ? 'border-white bg-white'
                    : 'border-white/70 bg-transparent'
                }`}
              >
                {isSelectedForCompare && (
                  <span className="block h-2 w-2 rounded-[2px] bg-indigo-600" />
                )}
              </span>
              <Squares2X2Icon className="mr-1 h-3 w-3" />
              Compare
            </button>
            <FavoriteButton
              propertyId={property.id}
              savesCount={property.saves || 0}
              onToggle={onFavoriteToggle}
            />
          </div>
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/properties/${property.id}`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-indigo-600 transition-colors">
            {property.title}
          </h3>
        </Link>

        <div className="flex items-center text-gray-600 mb-2">
          <MapPinIcon className="w-4 h-4 mr-1" />
          <span className="text-sm">
            {property.address}, {property.city}, {property.state} {property.zip_code}
          </span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-indigo-600">
            {property.formatted_price || `$${Number(property.price).toLocaleString()}`}
          </span>
          <span className="text-sm text-gray-500 capitalize">{property.status.replace('_', ' ')}</span>
        </div>

        {(property.virtual_tour_url || property.video_tour_url) && (
          <div className="mb-2 inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 px-2 py-1 text-[11px] font-medium">
            <PlayCircleIcon className="w-3 h-3 mr-1" />
            Virtual tour available
          </div>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-600 border-t pt-3">
          {property.bedrooms && (
            <span>
              <strong>{property.bedrooms}</strong> Bed{property.bedrooms !== 1 ? 's' : ''}
            </span>
          )}
          {property.bathrooms && (
            <span>
              <strong>{property.bathrooms}</strong> Bath{property.bathrooms !== 1 ? 's' : ''}
            </span>
          )}
          {property.square_feet && (
            <span>
              <strong>{Number(property.square_feet).toLocaleString()}</strong> sq ft
            </span>
          )}
        </div>

        {property.property_type && (
          <div className="mt-2">
            <span className="inline-block bg-white text-gray-700 text-xs px-2 py-1 rounded capitalize">
              {property.property_type}
            </span>
          </div>
        )}

        {property.user?.id && (
          <div className="mt-3 text-sm">
            <Link
              to={`/agents/${property.user.id}`}
              className="text-indigo-600 hover:text-indigo-600"
            >
              Listed by {property.user.name}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyCard;
