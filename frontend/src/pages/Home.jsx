import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MagnifyingGlassIcon, MapPinIcon, HomeIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { propertyService } from '../services/propertyService';
import { DEFAULT_PROPERTY_IMAGE } from '../utils/defaultImages';
import { propertySlug } from '../utils/propertyRoute';

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyType, setPropertyType] = useState('');

  const { data: featuredData } = useQuery({
    queryKey: ['featuredProperties'],
    queryFn: () => propertyService.getProperties({ is_featured: 1, per_page: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const featuredProperties = featuredData?.data || featuredData?.properties?.data || [];

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (propertyType) params.set('property_type', propertyType);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple hero with search */}
      <section className="bg-indigo-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold">
            Find your next home.
          </h1>
          <p className="mt-4 max-w-xl text-indigo-100">
            Search properties by city, neighborhood, or address and quickly see the ones that match
            your budget and needs.
          </p>

          <form onSubmit={handleSearch} className="mt-8 bg-white rounded-xl shadow p-2 flex flex-col sm:flex-row gap-2 sm:gap-0">
            <div className="flex items-center flex-1 px-3 py-2">
              <MapPinIcon className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="City, neighborhood, or address"
                className="w-full border-0 outline-none text-gray-900 placeholder-gray-400 text-sm sm:text-base"
              />
            </div>
            <div className="h-px bg-gray-200 sm:h-auto sm:w-px sm:bg-gray-200" />
            <div className="flex items-center sm:w-48 px-3 py-2 border-t sm:border-t-0 sm:border-l border-gray-200">
              <HomeIcon className="w-5 h-5 text-gray-400 mr-2" />
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full border-0 bg-transparent text-gray-900 text-sm sm:text-base outline-none"
              >
                <option value="">All types</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="condo">Condo</option>
                <option value="villa">Villa</option>
                <option value="townhouse">Townhouse</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg sm:ml-2 text-sm sm:text-base"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
              <span>Search</span>
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <span className="text-indigo-100">Quick search:</span>
            {['New York', 'Los Angeles', 'Miami', 'San Francisco', 'Chicago'].map((city) => (
              <button
                key={city}
                onClick={() => navigate(`/properties?search=${encodeURIComponent(city)}`)}
                className="px-3 py-1 rounded-full bg-indigo-600/40 hover:bg-indigo-600/60 text-indigo-100"
                type="button"
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Simple featured properties grid */}
      <section className="py-10 sm:py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Featured properties
            </h2>
            <Link
              to="/properties?is_featured=1"
              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700"
            >
              View all
              <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {featuredProperties.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No featured properties yet. Check back soon or browse all listings.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((property) => {
                const primaryImage =
                  property.images?.find((img) => img.is_primary) ?? property.images?.[0];
                const imageUrl = primaryImage
                  ? `${process.env.REACT_APP_API_URL?.replace('/api', '')}/storage/${primaryImage.image_path}`
                  : null;

                return (
                  <Link
                    key={property.id}
                    to={`/properties/${propertySlug(property)}`}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
                  >
                    <div className="h-44 bg-gray-100 relative">
                      <img
                        src={imageUrl || DEFAULT_PROPERTY_IMAGE}
                        alt={property.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_PROPERTY_IMAGE;
                        }}
                      />
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        {property.formatted_price ||
                          `$${Number(property.price).toLocaleString()}`}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                        {property.title}
                      </h3>
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        <span className="line-clamp-1">
                          {property.city}, {property.state}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-3 text-xs text-gray-600">
                        {property.bedrooms != null && (
                          <span>{property.bedrooms} bd</span>
                        )}
                        {property.bathrooms != null && (
                          <span>{property.bathrooms} ba</span>
                        )}
                        {property.square_feet != null && (
                          <span>{Number(property.square_feet).toLocaleString()} sqft</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;