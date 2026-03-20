import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  StarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  CreditCardIcon,
  MapPinIcon,
  ShieldCheckIcon,
  KeyIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import useAuthStore from '../../store/authStore';
import { useWebSettings } from '../../context/WebSettingsContext';
import NotificationBell from '../common/NotificationBell';

const AdminLayout = ({ children }) => {
  const webSettings = useWebSettings();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigationSections = [
    {
      label: null,
      items: [
        { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
      ],
    },
    {
      label: 'Content',
      items: [
        { name: 'Users', href: '/admin/users', icon: UsersIcon },
        { name: 'Properties', href: '/admin/properties', icon: BuildingOfficeIcon },
        { name: 'Reviews', href: '/admin/reviews', icon: StarIcon },
        { name: 'Reports', href: '/admin/reports', icon: ExclamationTriangleIcon },
      ],
    },
    {
      label: 'Insights',
      items: [
        { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
      ],
    },
    {
      label: 'Settings',
      items: [
        { name: 'Web Settings', href: '/admin/web-settings', icon: GlobeAltIcon },
        { name: 'Email Settings', href: '/admin/email-settings', icon: EnvelopeIcon },
        { name: 'Payment Settings', href: '/admin/payment-settings', icon: CreditCardIcon },
        { name: 'Locations', href: '/admin/locations', icon: MapPinIcon },
      ],
    },
    {
      label: 'Security',
      items: [
        { name: 'Roles', href: '/admin/roles', icon: ShieldCheckIcon },
        { name: 'Permissions', href: '/admin/permissions', icon: KeyIcon },
      ],
    },
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getActivePageName = () => {
    for (const section of navigationSections) {
      const found = section.items.find((item) => isActive(item.href));
      if (found) return found.name;
    }
    return 'Admin';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } w-64 bg-white border-r border-gray-200 text-gray-900`}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Link to="/admin/dashboard" className="flex items-center gap-2">
              {webSettings.logo ? (
                <img src={webSettings.logo} alt={webSettings.siteName} className="h-8 w-auto max-w-[120px] object-contain" />
              ) : (
                <BuildingOfficeIcon className="h-8 w-8 text-indigo-400" />
              )}
              <span className="text-xl font-bold">{webSettings.logo ? webSettings.siteName : 'Admin Panel'}</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
            {navigationSections.map((section) => (
              <div key={section.label || 'main'}>
                {section.label && (
                  <p className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {section.label}
                  </p>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          active
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <UserCircleIcon className="h-10 w-10 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
              </div>
            </div>
            <Link
              to="/"
              className="block w-full text-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              View Site
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`lg:pl-64 transition-all duration-300 ${sidebarOpen ? '' : 'lg:pl-0'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Left side - Menu toggle */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:block text-gray-500 hover:text-gray-700"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {getActivePageName()}
              </h1>
            </div>

            {/* Right side - User actions */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <NotificationBell />

              {/* User menu */}
              <div className="relative group">
                <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  <span className="hidden sm:block text-sm font-medium">{user?.name || 'Admin'}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link
                    to="/admin/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
