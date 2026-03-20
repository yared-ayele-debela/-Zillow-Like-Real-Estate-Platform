import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import usePropertyStore from '../../store/propertyStore';
import ImageUpload from './ImageUpload';
import { propertyService } from '../../services/propertyService';
import paymentService from '../../services/paymentService';
import AgentLayout from '../agent/AgentLayout';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const PropertyForm = ({ property: propData = null, isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { createProperty, updateProperty, fetchProperty, currentProperty, isLoading } =
    usePropertyStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [images, setImages] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [availableAmenities, setAvailableAmenities] = useState([]);
  const [error, setError] = useState('');
  const [loadingProperty, setLoadingProperty] = useState(false);
  const [loadingAmenities, setLoadingAmenities] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);
  const [limits, setLimits] = useState(null);
  const [limitReachedError, setLimitReachedError] = useState(false);

  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markerRef = useRef(null);

  const property = propData || currentProperty;
  const isEditing = isEdit || !!id;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    defaultValues: property || {
      title: '',
      description: '',
      property_type: 'house',
      status: 'for_sale',
      price: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'Italy',
      latitude: '',
      longitude: '',
      bedrooms: '',
      bathrooms: '',
      square_feet: '',
      year_built: '',
      lot_size: '',
      virtual_tour_url: '',
      video_tour_url: '',
    },
  });

  const totalSteps = 5;

  useEffect(() => {
    if (isEditing && id && !property) {
      setLoadingProperty(true);
      fetchProperty(id)
        .then(() => setLoadingProperty(false))
        .catch(() => setLoadingProperty(false));
    }
  }, [id, isEditing, property, fetchProperty]);

  useEffect(() => {
    if (!isEditing) {
      paymentService.checkSubscription().then((data) => setLimits(data?.limits || null)).catch(() => {});
    }
  }, [isEditing]);

  const latitude = watch('latitude');
  const longitude = watch('longitude');
  const addressValue = watch('address');

  // Address autocomplete using Geoapify Autocomplete API
  useEffect(() => {
    const query = addressValue?.trim();
    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      setIsAddressDropdownOpen(false);
      return;
    }

    const geoapifyKey =
      process.env.REACT_APP_GEOAPIFY_API_KEY ||
      process.env.REACT_APP_MAP_API_KEY ||
      null;

    if (!geoapifyKey) {
      return;
    }

    let cancelled = false;
    setIsAddressLoading(true);

    const timeoutId = setTimeout(async () => {
      try {
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
          query,
        )}&format=json&limit=5&apiKey=${encodeURIComponent(geoapifyKey)}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Autocomplete request failed');
        }
        const data = await response.json();
        if (!cancelled) {
          const results = Array.isArray(data.results) ? data.results : [];
          setAddressSuggestions(results);
          setIsAddressDropdownOpen(results.length > 0);
        }
      } catch (e) {
        if (!cancelled) {
          setAddressSuggestions([]);
          setIsAddressDropdownOpen(false);
        }
      } finally {
        if (!cancelled) {
          setIsAddressLoading(false);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [addressValue]);

  useEffect(() => {
    // Only initialize the map when the Location step is visible
    if (currentStep !== 2) return;
    if (!mapContainerRef.current || mapRef.current) return;

    const initialLat = property?.latitude ? Number(property.latitude) : 41.8719;
    const initialLng = property?.longitude ? Number(property.longitude) : 12.5674;
    const initialZoom = property?.latitude && property?.longitude ? 14 : 6;

    const geoapifyKey =
      process.env.REACT_APP_GEOAPIFY_API_KEY ||
      process.env.REACT_APP_MAP_API_KEY ||
      null;

    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: true,
    }).setView([initialLat, initialLng], initialZoom);

    const selectedIcon = L.divIcon({
      className: '',
      html: `
        <div style="
          position:relative;
          width:22px;
          height:22px;
        ">
          <div style="
            position:absolute;
            top:0;
            left:50%;
            transform:translateX(-50%);
            width:18px;
            height:18px;
            border-radius:9999px;
            background:#2563eb;
            border:2px solid #ffffff;
            box-shadow:0 4px 10px rgba(0,0,0,0.35);
          "></div>
          <div style="
            position:absolute;
            bottom:-6px;
            left:50%;
            transform:translateX(-50%);
            width:6px;
            height:6px;
            border-radius:9999px;
            background:rgba(37,99,235,0.35);
          "></div>
        </div>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 18],
    });

    // Add Geoapify Address Search control if available
    if (geoapifyKey && L.control && typeof L.control.addressSearch === 'function') {
      const addressSearchControl = L.control.addressSearch(geoapifyKey, {
        position: 'topleft',
        resultCallback: (address) => {
          if (!address) {
            return;
          }

          const lat = address.lat;
          const lng = address.lon;

          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return;
          }

          mapRef.current.setView([lat, lng], 15);

          setValue('latitude', lat.toFixed(6), {
            shouldValidate: true,
            shouldDirty: true,
          });
          setValue('longitude', lng.toFixed(6), {
            shouldValidate: true,
            shouldDirty: true,
          });

          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = L.marker([lat, lng], { icon: selectedIcon }).addTo(
              mapRef.current
            );
          }

          const props = address;
          if (props.address_line1 || props.formatted) {
            setValue('address', props.address_line1 || props.formatted, {
              shouldDirty: true,
            });
          }
          const cityValue =
            props.city || props.town || props.village || props.suburb || null;
          if (cityValue) {
            setValue('city', cityValue, { shouldDirty: true });
          }
          if (props.state) {
            setValue('state', props.state, { shouldDirty: true });
          }
          if (props.postcode) {
            setValue('zip_code', props.postcode, { shouldDirty: true });
          }
          if (props.country) {
            setValue('country', props.country, { shouldDirty: true });
          }
        },
      });

      mapRef.current.addControl(addressSearchControl);
    }

    const tileUrl = geoapifyKey
      ? `https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey=${geoapifyKey}`
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 20,
      attribution: geoapifyKey
        ? '&copy; OpenStreetMap contributors | Tiles by Geoapify'
        : '&copy; OpenStreetMap contributors',
    }).addTo(mapRef.current);

    if (property?.latitude && property?.longitude) {
      const lat = Number(property.latitude);
      const lng = Number(property.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        markerRef.current = L.marker([lat, lng], { icon: selectedIcon }).addTo(
          mapRef.current
        );
      }
    }

    mapRef.current.on('click', async (event) => {
      const { lat, lng } = event.latlng;

      setValue('latitude', lat.toFixed(6), { shouldValidate: true, shouldDirty: true });
      setValue('longitude', lng.toFixed(6), { shouldValidate: true, shouldDirty: true });

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { icon: selectedIcon }).addTo(
          mapRef.current
        );
      }

      if (!geoapifyKey) {
        return;
      }

      try {
        const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${encodeURIComponent(
          lat,
        )}&lon=${encodeURIComponent(lng)}&apiKey=${encodeURIComponent(geoapifyKey)}`;
        const response = await fetch(url);
        const data = await response.json();
        const props = data?.features?.[0]?.properties;

        if (props) {
          if (props.address_line1) {
            setValue('address', props.address_line1, { shouldDirty: true });
          }
          const cityValue =
            props.city || props.town || props.village || props.suburb || null;
          if (cityValue) {
            setValue('city', cityValue, { shouldDirty: true });
          }
          if (props.state) {
            setValue('state', props.state, { shouldDirty: true });
          }
          if (props.postcode) {
            setValue('zip_code', props.postcode, { shouldDirty: true });
          }
          if (props.country) {
            setValue('country', props.country, { shouldDirty: true });
          }
        }
      } catch (reverseError) {
        console.error('Reverse geocoding failed', reverseError);
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [currentStep, property, setValue]);

  // Geoapify address search plugin is wired up directly in the map effect above

  useEffect(() => {
    if (property) {
      setImages(property.images || []);
      setAmenities(property.amenities?.map((a) => a.id) || []);
    }
  }, [property]);

  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        setLoadingAmenities(true);
        const filterOptions = await propertyService.getFilterOptions();
        const groupedAmenities = filterOptions?.amenities || {};
        const flattenedAmenities = Object.values(groupedAmenities).flat();
        setAvailableAmenities(flattenedAmenities);
      } catch (err) {
        console.error('Failed to load amenities:', err);
        setAvailableAmenities([]);
      } finally {
        setLoadingAmenities(false);
      }
    };

    fetchAmenities();
  }, []);

  const onSubmit = async (data) => {
    setError('');
    setLimitReachedError(false);
    try {
      const formData = {
        ...data,
        images: images.filter((img) => img.file).map((img) => img.file),
        amenities: amenities,
      };

      if (isEditing && property) {
        await updateProperty(property.id, formData);
      } else {
        await createProperty(formData);
      }

      navigate('/properties');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save property');
      setLimitReachedError(!!err.response?.data?.limit_reached);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAmenityToggle = (amenityId) => {
    setAmenities((prev) =>
      prev.includes(amenityId)
        ? prev.filter((id) => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  if (loadingProperty) {
    return (
      <AgentLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout>
      <div className="max-w-8xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {isEditing ? 'Edit Property' : 'Create New Property'}
        </h1>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div
              key={step}
              className={`flex-1 h-2 mx-1 rounded ${
                step <= currentStep ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-600 text-center">
          Step {currentStep} of {totalSteps}
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          {limitReachedError && (
            <Link to="/subscription" className="block mt-2 underline font-medium text-red-800">
              Upgrade your plan →
            </Link>
          )}
        </div>
      )}
      {!isEditing && limits && !limits.can_add_listing && (
        <div className="mb-6 bg-amber-50 border border-amber-400 text-amber-800 px-4 py-3 rounded">
          You have reached your listing limit. <Link to="/subscription" className="underline font-medium">Upgrade your plan</Link> to add more properties.
        </div>
      )}

        <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Beautiful 3 Bedroom House"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                {...register('description', {
                  required: 'Description is required',
                  minLength: {
                    value: 50,
                    message: 'Description must be at least 50 characters',
                  },
                })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describe your property in detail..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type *
                </label>
                <select
                  {...register('property_type', { required: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="condo">Condo</option>
                  <option value="land">Land</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  {...register('status', { required: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="for_sale">For Sale</option>
                  <option value="for_rent">For Rent</option>
                  <option value="sold">Sold</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <input
                {...register('price', {
                  required: 'Price is required',
                  min: { value: 0, message: 'Price must be positive' },
                })}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="500000"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-xl font-semibold mb-4">Location</h2>

            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  {...register('address', { required: 'Address is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Start typing an address..."
                  onFocus={() => {
                    if (addressSuggestions.length > 0) {
                      setIsAddressDropdownOpen(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay closing so click handlers can run
                    setTimeout(() => setIsAddressDropdownOpen(false), 150);
                  }}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                )}

                {isAddressLoading && (
                  <p className="mt-1 text-xs text-gray-400">Searching addresses...</p>
                )}

                {isAddressDropdownOpen && addressSuggestions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {addressSuggestions.map((item, index) => (
                      <button
                        key={`${item.place_id || index}`}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const lat = item.lat;
                          const lng = item.lon;

                          setValue('address', item.formatted || '', {
                            shouldDirty: true,
                            shouldValidate: true,
                          });

                          const cityValue =
                            item.city ||
                            item.town ||
                            item.village ||
                            item.suburb ||
                            null;
                          if (cityValue) {
                            setValue('city', cityValue, { shouldDirty: true });
                          }
                          if (item.state) {
                            setValue('state', item.state, { shouldDirty: true });
                          }
                          if (item.postcode) {
                            setValue('zip_code', item.postcode, { shouldDirty: true });
                          }
                          if (item.country) {
                            setValue('country', item.country, { shouldDirty: true });
                          }

                          if (Number.isFinite(lat) && Number.isFinite(lng)) {
                            setValue('latitude', lat.toFixed(6), {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                            setValue('longitude', lng.toFixed(6), {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }

                          setIsAddressDropdownOpen(false);
                        }}
                      >
                        <div className="font-medium text-gray-800 line-clamp-1">
                          {item.formatted}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {item.country || ''}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    {...register('city', { required: 'City is required' })}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="New York"
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    {...register('state', { required: 'State is required' })}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="NY"
                  />
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code *
                  </label>
                  <input
                    {...register('zip_code', { required: 'ZIP code is required' })}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="10001"
                  />
                  {errors.zip_code && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.zip_code.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    {...register('country')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Click on the map to select the exact location of the property. We’ll try
                  to auto-fill the address details from the map.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      {...register('latitude')}
                      type="text"
                      value={latitude || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <input
                      {...register('longitude')}
                      type="text"
                      value={longitude || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                    />
                  </div>
                </div>
              </div>

              <div className="h-64 md:h-80 w-full rounded-lg overflow-hidden border border-gray-200">
                <div ref={mapContainerRef} className="w-full h-full" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Details */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-xl font-semibold mb-4">Property Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bedrooms
                </label>
                <input
                  {...register('bedrooms', { min: 0 })}
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bathrooms
                </label>
                <input
                  {...register('bathrooms', { min: 0 })}
                  type="number"
                  min="0"
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Square Feet
                </label>
                <input
                  {...register('square_feet', { min: 0 })}
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year Built
                </label>
                <input
                  {...register('year_built', {
                    min: 1800,
                    max: new Date().getFullYear(),
                  })}
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lot Size (sq ft)
              </label>
              <input
                {...register('lot_size', { min: 0 })}
                type="number"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Virtual tour URL (3D / 360°)
                </label>
                <input
                  {...register('virtual_tour_url')}
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://my-3d-tour.example.com"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Link to a Matterport or other interactive 3D/360° tour.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Video tour URL
                </label>
                <input
                  {...register('video_tour_url')}
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://youtube.com/..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Public video link (YouTube, Vimeo, or similar).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Amenities */}
        {currentStep === 4 && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-xl font-semibold mb-4">Amenities</h2>

            {loadingAmenities ? (
              <div className="text-center py-8 text-gray-500">
                <p>Loading amenities...</p>
              </div>
            ) : availableAmenities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No amenities available. Please add amenities in the admin panel.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {availableAmenities.map((amenity) => (
                  <label
                    key={amenity.id}
                    className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={amenities.includes(amenity.id)}
                      onChange={() => handleAmenityToggle(amenity.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{amenity.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Images */}
        {currentStep === 5 && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-xl font-semibold mb-4">Property Images</h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload at least one image. The first image will be set as primary.
            </p>

            <ImageUpload
              images={images}
              onImagesChange={setImages}
            />
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-600"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-600 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : isEditing ? 'Update Property' : 'Create Property'}
            </button>
          )}
        </div>
        </form>
      </div>
    </AgentLayout>
  );
};

export default PropertyForm;
