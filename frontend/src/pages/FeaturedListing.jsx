import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import paymentService from '../services/paymentService';
import { StarIcon } from '@heroicons/react/24/outline';
import { propertyService } from '../services/propertyService';
import PaymentForm from '../components/payment/PaymentForm';
import { DEFAULT_PROPERTY_IMAGE } from '../utils/defaultImages';

const FeaturedListing = () => {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [packages, setPackages] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [limits, setLimits] = useState(null);

  useEffect(() => {
    fetchProperties();
    fetchPackages();
    paymentService.checkSubscription().then((data) => setLimits(data?.limits || null)).catch(() => {});
  }, []);

  const fetchProperties = async () => {
    try {
      const data = await propertyService.getMyProperties();
      setProperties(data.data || []);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    }
  };

  const fetchPackages = async () => {
    try {
      const data = await paymentService.getFeaturedPackages();
      setPackages(data || []);
      if (data?.length) {
        setSelectedPackageId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch featured packages:', err);
    }
  };

  const handleFeatureRequest = async () => {
    if (!selectedProperty) {
      alert('Please select a property');
      return;
    }
    if (!selectedPackageId) {
      alert('Please select a feature package');
      return;
    }

    setLoading(true);
    try {
      const data = await paymentService.featureProperty(selectedProperty.id, selectedPackageId);
      setPaymentData({
        clientSecret: data.client_secret,
        amount: data.payment.amount,
        currency: data.payment.currency,
        paymentId: data.payment.id,
      });
      setShowPaymentForm(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentForm(false);
    setPaymentData(null);
    // Confirm payment
    if (paymentData?.paymentId) {
      try {
        await paymentService.confirmPayment(paymentData.paymentId);
        alert('Property featured successfully!');
        fetchProperties();
      } catch (err) {
        console.error('Payment confirmation error:', err);
      }
    }
  };

  const selectedPackage = packages.find((pkg) => pkg.id === selectedPackageId);

  const canFeature = limits?.can_feature_listing !== false;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Feature Your Property</h1>

        {limits && !canFeature && (
          <div className="mb-6 bg-amber-50 border border-amber-400 text-amber-800 px-4 py-3 rounded">
            You have reached your featured listing limit ({limits.current_featured_listings} / {limits.max_featured_listings}).
            <Link to="/subscription" className="ml-2 underline font-medium">Upgrade your plan</Link> to feature more properties.
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Property</h2>
          {properties.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You don't have any properties yet.</p>
              <Link
                to="/properties/new"
                className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Create Your First Property
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {properties.map((property) => (
                <button
                  key={property.id}
                  onClick={() => setSelectedProperty(property)}
                  className={`p-4 border-2 rounded-lg text-left transition ${
                    selectedProperty?.id === property.id
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={
                        property.primary_image?.image_url ||
                        property.primary_image?.thumbnail_url ||
                        DEFAULT_PROPERTY_IMAGE
                      }
                      alt={property.title}
                      className="w-20 h-20 object-cover rounded"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_PROPERTY_IMAGE;
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{property.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {property.address}, {property.city}
                      </p>
                      <p className="text-sm font-semibold text-indigo-600 mt-1">
                        ${property.price?.toLocaleString()}
                      </p>
                      {property.is_featured && (
                        <span className="inline-flex items-center gap-1 mt-2 text-xs text-yellow-600">
                          <StarIcon className="h-4 w-4" />
                          Currently Featured
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedProperty && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Duration</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {packages.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedPackageId(option.id)}
                  className={`p-4 border-2 rounded-lg text-center transition ${
                    selectedPackageId === option.id
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-semibold text-gray-900">{option.name}</p>
                  <p className="text-sm text-gray-500">{option.duration_days} days</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-2">
                    ${option.price}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedProperty && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Payment Summary</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Feature "{selectedProperty.title}" for {selectedPackage?.duration_days || 0} days
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-indigo-600">${selectedPackage?.price || 0}</p>
              </div>
            </div>
            <button
              onClick={handleFeatureRequest}
              disabled={loading || !canFeature}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : !canFeature ? 'Featured limit reached — Upgrade to add more' : 'Proceed to Payment'}
            </button>
          </div>
        )}

        {/* Payment Form Modal */}
        {paymentData && (
          <PaymentForm
            isOpen={showPaymentForm}
            onClose={() => {
              setShowPaymentForm(false);
              setPaymentData(null);
            }}
            clientSecret={paymentData.clientSecret}
            amount={paymentData.amount}
            currency={paymentData.currency}
            onSuccess={handlePaymentSuccess}
            onError={(err) => {
              console.error('Payment error:', err);
              alert('Payment failed. Please try again.');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default FeaturedListing;
