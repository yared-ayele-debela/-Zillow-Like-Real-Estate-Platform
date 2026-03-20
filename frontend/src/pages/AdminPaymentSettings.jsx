import { useEffect, useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import paymentService from '../services/paymentService';

const AdminPaymentSettings = () => {
  const [plans, setPlans] = useState([]);
  const [featuredPackages, setFeaturedPackages] = useState([]);
  const [newPlanFeature, setNewPlanFeature] = useState('');
  const [newPlan, setNewPlan] = useState({
    name: '',
    slug: '',
    price: '',
    stripe_price_id: '',
    features: [],
    is_active: true,
    sort_order: 0,
  });
  const [newPackage, setNewPackage] = useState({
    name: '',
    duration_days: '',
    price: '',
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    fetchPaymentConfigs();
  }, []);

  const fetchPaymentConfigs = async () => {
    try {
      const [plansData, packagesData] = await Promise.all([
        paymentService.getAdminPlans(),
        paymentService.getAdminFeaturedPackages(),
      ]);
      setPlans(plansData || []);
      setFeaturedPackages(packagesData || []);
    } catch (error) {
      console.error('Failed to load payment configs:', error);
    }
  };

  const addPlanFeature = () => {
    if (!newPlanFeature.trim()) return;
    setNewPlan((prev) => ({ ...prev, features: [...prev.features, newPlanFeature.trim()] }));
    setNewPlanFeature('');
  };

  const removePlanFeature = (idx) => {
    setNewPlan((prev) => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) }));
  };

  const createPlan = async () => {
    try {
      await paymentService.createAdminPlan({
        ...newPlan,
        price: Number(newPlan.price),
      });
      setNewPlan({
        name: '',
        slug: '',
        price: '',
        stripe_price_id: '',
        features: [],
        is_active: true,
        sort_order: 0,
      });
      fetchPaymentConfigs();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create plan');
    }
  };

  const createFeaturedPackage = async () => {
    try {
      await paymentService.createAdminFeaturedPackage({
        ...newPackage,
        duration_days: Number(newPackage.duration_days),
        price: Number(newPackage.price),
      });
      setNewPackage({
        name: '',
        duration_days: '',
        price: '',
        is_active: true,
        sort_order: 0,
      });
      fetchPaymentConfigs();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create featured package');
    }
  };

  const togglePlanActive = async (plan) => {
    await paymentService.updateAdminPlan(plan.id, { is_active: !plan.is_active });
    fetchPaymentConfigs();
  };

  const togglePackageActive = async (pkg) => {
    await paymentService.updateAdminFeaturedPackage(pkg.id, { is_active: !pkg.is_active });
    fetchPaymentConfigs();
  };

  return (
    <AdminLayout>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Payment Settings</h1>

        <div className="space-y-8">
          {/* Subscription Plans */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription Plans</h2>
            <div className="space-y-2 mb-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between border rounded-md p-3"
                >
                  <div>
                    <p className="font-medium">
                      {plan.name} ({plan.slug})
                    </p>
                    <p className="text-sm text-gray-600">
                      ${plan.price} / {plan.currency}
                    </p>
                  </div>
                  <button
                    onClick={() => togglePlanActive(plan)}
                    className={`px-3 py-1 text-sm rounded ${
                      plan.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <input
                  placeholder="Plan Name"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  placeholder="Slug (e.g. premium)"
                  value={newPlan.slug}
                  onChange={(e) => setNewPlan({ ...newPlan, slug: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  placeholder="Price"
                  type="number"
                  step="0.01"
                  value={newPlan.price}
                  onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  placeholder="Stripe Price ID"
                  value={newPlan.stripe_price_id}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, stripe_price_id: e.target.value })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  placeholder="Add feature"
                  value={newPlanFeature}
                  onChange={(e) => setNewPlanFeature(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={addPlanFeature}
                  className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Add
                </button>
                <button
                  onClick={createPlan}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create Plan
                </button>
              </div>
              {newPlan.features.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newPlan.features.map((f, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs inline-flex items-center"
                    >
                      {f}
                      <button
                        onClick={() => removePlanFeature(i)}
                        className="ml-2 hover:text-indigo-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Featured Packages */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Featured Packages</h2>
            <div className="space-y-2 mb-4">
              {featuredPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="flex items-center justify-between border rounded-md p-3"
                >
                  <div>
                    <p className="font-medium">{pkg.name}</p>
                    <p className="text-sm text-gray-600">
                      {pkg.duration_days} days - ${pkg.price}
                    </p>
                  </div>
                  <button
                    onClick={() => togglePackageActive(pkg)}
                    className={`px-3 py-1 text-sm rounded ${
                      pkg.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {pkg.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Package</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  placeholder="Package Name"
                  value={newPackage.name}
                  onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  placeholder="Duration Days"
                  type="number"
                  value={newPackage.duration_days}
                  onChange={(e) =>
                    setNewPackage({ ...newPackage, duration_days: e.target.value })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  placeholder="Price"
                  type="number"
                  step="0.01"
                  value={newPackage.price}
                  onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <button
                onClick={createFeaturedPackage}
                className="mt-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Create Package
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPaymentSettings;
