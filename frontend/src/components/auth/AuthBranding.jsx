import { Link } from 'react-router-dom';
import { HomeIcon } from '@heroicons/react/24/outline';
import { useWebSettings } from '../../context/WebSettingsContext';

const AuthBranding = () => {
  const { siteName, logo } = useWebSettings();

  return (
    <Link to="/" className="flex items-center gap-2 mb-6">
      {logo ? (
        <img src={logo} alt={siteName} className="h-10 w-auto max-w-[160px] object-contain" />
      ) : (
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
          <HomeIcon className="w-6 h-6 text-white" />
        </div>
      )}
      <span className="text-xl font-bold text-gray-900">{siteName}</span>
    </Link>
  );
};

export default AuthBranding;
