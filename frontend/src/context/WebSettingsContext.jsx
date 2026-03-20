import { createContext, useContext, useEffect, useState } from 'react';
import settingsService from '../services/settingsService';

const WebSettingsContext = createContext({
  siteName: 'Zillow Clone',
  siteDescription: 'Real Estate Platform',
  logo: null,
  favicon: null,
  loading: true,
});

export const useWebSettings = () => useContext(WebSettingsContext);

export const WebSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    siteName: 'Zillow Clone',
    siteDescription: 'Real Estate Platform',
    logo: null,
    favicon: null,
    loading: true,
  });

  useEffect(() => {
    settingsService
      .getPublicWebSettings()
      .then((data) => {
        setSettings({
          siteName: data?.site_name || 'Zillow Clone',
          siteDescription: data?.site_description || 'Real Estate Platform',
          logo: data?.logo || null,
          favicon: data?.favicon || null,
          loading: false,
        });
      })
      .catch(() => {
        setSettings((prev) => ({ ...prev, loading: false }));
      });
  }, []);

  // Update document title and favicon when settings load
  useEffect(() => {
    if (!settings.loading) {
      document.title = settings.siteName;
      const faviconLink = document.querySelector("link[rel*='icon']");
      if (settings.favicon && faviconLink) {
        faviconLink.href = settings.favicon;
      }
    }
  }, [settings.loading, settings.siteName, settings.favicon]);

  return (
    <WebSettingsContext.Provider value={settings}>
      {children}
    </WebSettingsContext.Provider>
  );
};
