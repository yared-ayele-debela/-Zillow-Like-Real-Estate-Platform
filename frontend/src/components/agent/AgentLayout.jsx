import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  BuildingOffice2Icon,
  EnvelopeIcon,
  ChartBarIcon,
  PlusCircleIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  BanknotesIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import useAuthStore from '../../store/authStore';
import NotificationBell from '../common/NotificationBell';

const AgentLayout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const navigation = [
    { name: 'Dashboard', href: '/agent/dashboard', icon: HomeIcon },
    { name: 'My Properties', href: '/agent/properties', icon: BuildingOffice2Icon },
    { name: 'Leads', href: '/agent/leads', icon: EnvelopeIcon },
    { name: 'Offers', href: '/agent/offers', icon: BanknotesIcon },
    { name: 'Analytics', href: '/agent/analytics', icon: ChartBarIcon },
    { name: 'Notifications', href: '/notifications', icon: BellIcon },
    { name: 'Add Property', href: '/properties/new', icon: PlusCircleIcon },
    { name: 'Profile', href: '/agent/profile', icon: UserCircleIcon },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const currentTitle = navigation.find((item) => isActive(item.href))?.name || 'Agent';

  return (
    <div className="min-h-screen bg-gray-50">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="h-16 px-4 border-b border-gray-200 flex items-center justify-between">
          <Link to="/agent/dashboard" className="text-lg font-semibold text-gray-900">
            Agent Panel
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                  active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-3 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <UserCircleIcon className="h-8 w-8 text-gray-400" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Agent'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">{currentTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link to="/" className="text-sm text-indigo-600 hover:text-indigo-700">
              View Site
            </Link>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
};

export default AgentLayout;
