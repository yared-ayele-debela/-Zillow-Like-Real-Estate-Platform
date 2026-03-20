import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

/**
 * Reusable page hero section with gradient background.
 * @param {string} title - Main heading
 * @param {string} [subtitle] - Optional description text
 * @param {Object} [backLink] - Optional back link { to, label }
 * @param {string} [badge] - Optional badge text (e.g. "Comparing 3 properties")
 * @param {boolean} [centered] - Center title and subtitle (default: false)
 * @param {React.ReactNode} [children] - Optional content below title (e.g. search form)
 */
const PageHero = ({
  title,
  subtitle,
  backLink,
  badge,
  centered = false,
  children,
}) => {
  return (
    <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {backLink && (
          <Link
            to={backLink.to}
            className="inline-flex items-center gap-2 text-indigo-100 hover:text-white text-sm font-medium mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            {backLink.label}
          </Link>
        )}

        <div
          className={
            centered
              ? 'text-center max-w-2xl mx-auto'
              : 'flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4'
          }
        >
          <div className={centered ? '' : 'flex-1'}>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p
                className={`mt-2 sm:mt-3 text-indigo-100 text-base sm:text-lg ${
                  centered ? '' : 'max-w-xl'
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>
          {badge && !centered && (
            <p className="text-indigo-200 text-sm font-medium shrink-0">
              {badge}
            </p>
          )}
        </div>

        {children && (
          <div className="mt-8 sm:mt-10">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHero;
