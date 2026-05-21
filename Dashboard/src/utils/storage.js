// A wrapper around chrome.storage.local that provides mock data when running outside the extension
const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

const getTodayDate = () => new Date().toISOString().split('T')[0];

const MOCK_DATA = {
  screenTime: {
    [getTodayDate()]: {
      'github.com': 6200,
      'youtube.com': 3480,
      'stackoverflow.com': 2700,
      'twitter.com': 1920,
      'docs.google.com': 1680,
    },
    // Mock past days for chart
    [new Date(Date.now() - 86400000).toISOString().split('T')[0]]: { 'github.com': 5000, 'youtube.com': 2000 },
    [new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0]]: { 'github.com': 4500, 'youtube.com': 3000 },
    [new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0]]: { 'github.com': 6000, 'twitter.com': 1000 },
    [new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0]]: { 'github.com': 5500, 'youtube.com': 1500 },
    [new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0]]: { 'github.com': 3000, 'youtube.com': 4500 },
    [new Date(Date.now() - 86400000 * 6).toISOString().split('T')[0]]: { 'github.com': 2000, 'youtube.com': 5000 },
  },

  blockedSites: {
    [getTodayDate()]: ['twitter.com', 'reddit.com'],
  },
  limits: {
    'youtube.com': {
      limitInSeconds: 3600,
      hardBlock: true
    },
    'twitter.com': {
      limitInSeconds: 1800,
      hardBlock: false
    }
  }
};

let localMockState = { ...MOCK_DATA };
let mockListeners = [];

export const storage = {
  get: async (keys) => {
    if (isExtension) {
      return await chrome.storage.local.get(keys);
    }
    // Mock environment
    if (!keys) return localMockState;
    if (Array.isArray(keys)) {
      return keys.reduce((acc, key) => {
        if (localMockState[key] !== undefined) acc[key] = localMockState[key];
        return acc;
      }, {});
    }
    if (typeof keys === 'string') {
      return { [keys]: localMockState[keys] };
    }
    return localMockState;
  },

  set: async (items) => {
    if (isExtension) {
      return await chrome.storage.local.set(items);
    }
    // Mock environment
    localMockState = { ...localMockState, ...items };
    const changes = Object.keys(items).reduce((acc, key) => {
      acc[key] = { newValue: items[key] }; // Mocking change object
      return acc;
    }, {});
    mockListeners.forEach(listener => listener(changes, 'local'));
  },

  onChange: (callback) => {
    if (isExtension) {
      chrome.storage.onChanged.addListener(callback);
      return () => chrome.storage.onChanged.removeListener(callback);
    }
    
    mockListeners.push(callback);
    return () => {
      mockListeners = mockListeners.filter(l => l !== callback);
    };
  }
};
