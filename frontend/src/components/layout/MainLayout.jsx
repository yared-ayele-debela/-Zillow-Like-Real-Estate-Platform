import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  BellIcon,
  ChevronDownIcon,
  HeartIcon,
  BookmarkIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import useAuthStore from '../../store/authStore';
import { useWebSettings } from '../../context/WebSettingsContext';

const MainLayout = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { siteName, siteDescription, logo } = useWebSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  const navLinks = [
    { to: '/properties', label: 'Browse' },
    { to: '/agents', label: 'Find agents' },
    { to: '/properties?is_featured=1', label: 'Featured' },
    { to: '/mortgage-calculator', label: 'Affordability' },
    { to: '/compare', label: 'Compare' },
  ];

  const isActive = (to) => {
    if (to === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(to.split('?')[0]);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header
        className={`sticky top-0 z-40 border-b bg-white/90 backdrop-blur ${
          scrolled ? 'shadow-sm' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                {logo ? (
                  <img src={logo} alt={siteName} className="h-9 w-auto max-w-[140px] object-contain" />
                ) : (
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <HomeIcon className="w-5 h-5 text-white" />
                  </div>
                )}
                <span className="hidden sm:inline text-xl font-bold text-gray-900">
                  {siteName}
                </span>
              </button>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? 'text-indigo-700 bg-indigo-50'
                      : 'text-gray-600 hover:text-indigo-700 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/properties')}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-700"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
                Advanced search
              </button>

              {isAuthenticated ? (
                <>
                  {(user?.role === 'agent' || user?.role === 'admin') && (
                    <Link
                      to={user?.role === 'admin' ? '/admin/dashboard' : '/agent/dashboard'}
                      className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      Dashboard
                    </Link>
                  )}
                  <Link
                    to="/notifications"
                    className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-700"
                    aria-label="Notifications"
                  >
                    <BellIcon className="w-4 h-4" />
                  </Link>
                  <div className="relative" ref={userMenuRef}>
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen((v) => !v)}
                      className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      aria-expanded={userMenuOpen}
                      aria-haspopup="true"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span className="hidden sm:inline max-w-[100px] truncate">
                        {user?.name?.split(' ')[0] || 'Account'}
                      </span>
                      <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-50">
                        <div className="px-3 py-2 border-b border-gray-100">
                          <p className="text-xs font-medium text-gray-900 truncate">{user?.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                        <Link
                          to="/favorites"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <HeartIcon className="w-4 h-4 text-gray-400" />
                          Favorites
                        </Link>
                        <Link
                          to="/saved-searches"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <BookmarkIcon className="w-4 h-4 text-gray-400" />
                          Saved searches
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <UserCircleIcon className="w-4 h-4 text-gray-400" />
                          Edit profile
                        </Link>
                        {(user?.role === 'agent' || user?.role === 'admin') && (
                          <Link
                            to={user?.role === 'admin' ? '/admin/dashboard' : '/agent/dashboard'}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 sm:hidden"
                          >
                            <Cog6ToothIcon className="w-4 h-4 text-gray-400" />
                            Dashboard
                          </Link>
                        )}
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setUserMenuOpen(false);
                              logout();
                              navigate('/login');
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <ArrowRightOnRectangleIcon className="w-4 h-4" />
                            Log out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-indigo-700 hover:bg-gray-50"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold shadow-sm hover:from-indigo-700 hover:to-purple-700"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <Link to="/" className="flex items-center gap-2">
                {logo ? (
                  <img src={logo} alt={siteName} className="h-8 w-auto max-w-[120px] object-contain" />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <HomeIcon className="w-4 h-4 text-white" />
                  </div>
                )}
                <span className="text-lg font-semibold text-gray-900">{siteName}</span>
              </Link>
              <p className="mt-2 text-sm text-gray-500 max-w-md">
                {siteDescription}
              </p>
            </div>

            <div className="flex flex-wrap gap-8 text-sm">
              <div>
                <p className="font-medium text-gray-900 mb-2">Explore</p>
                <ul className="space-y-1 text-gray-600">
                  <li>
                    <Link to="/properties" className="hover:text-indigo-600">
                      Browse properties
                    </Link>
                  </li>
                  <li>
                    <Link to="/properties?is_featured=1" className="hover:text-indigo-600">
                      Featured listings
                    </Link>
                  </li>
                  <li>
                    <Link to="/agents" className="hover:text-indigo-600">
                      Find agents
                    </Link>
                  </li>
                  <li>
                    <Link to="/mortgage-calculator" className="hover:text-indigo-600">
                      Affordability calculator
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-2">For agents</p>
                <ul className="space-y-1 text-gray-600">
                  <li>
                    <Link to="/agent/dashboard" className="hover:text-indigo-600">
                      Agent dashboard
                    </Link>
                  </li>
                  <li>
                    <Link to="/feature-listing" className="hover:text-indigo-600">
                      Feature a listing
                    </Link>
                  </li>
                  <li>
                    <Link to="/subscription" className="hover:text-indigo-600">
                      Pricing
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-2">Contact</p>
                <ul className="space-y-1 text-gray-600">
                  <li>support@estatehub.com</li>
                  <li>+1 (555) 123-4567</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
            <div className="flex flex-wrap gap-4">
              <button type="button" className="hover:text-gray-700">
                Privacy
              </button>
              <button type="button" className="hover:text-gray-700">
                Terms
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;

