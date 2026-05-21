const QUOTES = [
  "Your focus determines your reality.",
  "Time is what we want most, but what we use worst.",
  "Starve your distractions, feed your focus.",
  "The key is in not spending time, but in investing it.",
  "Productivity is never an accident."
];

function getTodayDate() {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

function formatDuration(totalSeconds) {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  if (totalSeconds < 3600) {
    const m = Math.floor(totalSeconds / 60);
    return `${m}m`;
  }
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}h ${m}m`;
}

async function loadData() {
  // Set random quote
  const quoteBox = document.getElementById('quote-box');
  if (quoteBox) {
    quoteBox.textContent = `"${QUOTES[Math.floor(Math.random() * QUOTES.length)]}"`;
  }

  // Get site from URL
  const urlParams = new URLSearchParams(window.location.search);
  const site = urlParams.get('site');
  const blockedSiteEl = document.getElementById('blocked-site');
  if (site && blockedSiteEl) {
    blockedSiteEl.textContent = site;
  }
  
  const isLimit = urlParams.get('limit') === 'true';
  const statusBadge = document.getElementById('status-badge');
  if (isLimit && statusBadge) {
    statusBadge.textContent = 'Daily Limit Reached';
  }

  // Calculate Total Time
  try {
    const { screenTime } = await chrome.storage.local.get(['screenTime']);
    const today = getTodayDate();
    const todayData = screenTime?.[today] || {};

    let total = 0;
    Object.values(todayData).forEach(seconds => {
      total += seconds;
    });

    const totalTimeEl = document.getElementById('total-time');
    if (totalTimeEl) {
      totalTimeEl.textContent = formatDuration(total);
    }
  } catch (err) {
    console.error("Failed to load total time", err);
  }
}

// Add event listeners on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  loadData();



  const btnDashboard = document.getElementById('btn-dashboard');
  if (btnDashboard) {
    btnDashboard.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL("dashboard/index.html") });
    });
  }

  const urlParams = new URLSearchParams(window.location.search);
  const site = urlParams.get('site');

  const btnContinue = document.getElementById('btn-continue');
  if (btnContinue && site) {
    btnContinue.addEventListener('click', () => {
      window.location.href = `https://${site}`;
    });
  }

  // Auto-redirect if storage changes (e.g. unblocked in dashboard)
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && (changes.blockedSites || changes.limits) && site) {
      window.location.href = `https://${site}`;
    }
  });
});
