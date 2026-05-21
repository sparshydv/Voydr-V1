import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';

export function useExtensionData() {
  const [data, setData] = useState({
    screenTime: {},
    blockedSites: {},
    limits: {},
    loading: true
  });

  useEffect(() => {
    // Initial fetch
    storage.get(['screenTime', 'blockedSites', 'limits']).then((res) => {
      setData({
        screenTime: res.screenTime || {},
        blockedSites: res.blockedSites || {},
        limits: res.limits || {},
        loading: false
      });
    });

    // Listen for changes
    const cleanup = storage.onChange((changes, areaName) => {
      if (areaName === 'local') {
        setData(prev => {
          const newData = { ...prev };
          let hasRelevantChange = false;

          ['screenTime', 'blockedSites', 'limits'].forEach(key => {
            if (changes[key]) {
              newData[key] = changes[key].newValue || {};
              hasRelevantChange = true;
            }
          });

          return hasRelevantChange ? newData : prev;
        });
      }
    });

    return cleanup;
  }, []);

  return data;
}
