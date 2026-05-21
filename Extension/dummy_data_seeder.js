// dummy_data_seeder.js
// Copy and paste this entire script into your Voydr Extension Console (or Dashboard Console) to seed 30 days of realistic dummy data.

(async function seedDummyData() {
  const SITES = [
    { domain: "youtube.com", min: 600, max: 7200 }, // 10m to 2h
    { domain: "github.com", min: 1800, max: 14400 }, // 30m to 4h
    { domain: "twitter.com", min: 300, max: 3600 }, // 5m to 1h
    { domain: "reddit.com", min: 600, max: 5400 }, // 10m to 1.5h
    { domain: "figma.com", min: 3600, max: 18000 }, // 1h to 5h
    { domain: "stackoverflow.com", min: 300, max: 2400 }, // 5m to 40m
    { domain: "docs.google.com", min: 1200, max: 7200 } // 20m to 2h
  ];

  console.log("Fetching existing screenTime data...");
  const { screenTime: existingScreenTime } = await chrome.storage.local.get(['screenTime']);
  const screenTime = existingScreenTime || {};

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  console.log("Generating data for the past 30 days...");
  // Generate data for the past 30 days (skipping today so we don't overwrite your real tracking)
  for (let i = 1; i <= 30; i++) {
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - i);
    const dateStr = pastDate.toISOString().split("T")[0];

    // Only generate if we don't already have data for this date
    if (!screenTime[dateStr]) {
      screenTime[dateStr] = {};
      
      // Randomly pick sites and assign realistic times
      SITES.forEach(site => {
        // 70% chance the user visited this site on any given day
        if (Math.random() > 0.3) {
          const randomSeconds = Math.floor(Math.random() * (site.max - site.min + 1)) + site.min;
          screenTime[dateStr][site.domain] = randomSeconds;
        }
      });
      
      // Add a little randomness so weekends look different
      const dayOfWeek = pastDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
         if (screenTime[dateStr]["github.com"]) screenTime[dateStr]["github.com"] /= 2; // less coding
         if (screenTime[dateStr]["youtube.com"]) screenTime[dateStr]["youtube.com"] *= 1.5; // more youtube
      }
    }
  }

  // Save the merged data back to chrome.storage.local
  await chrome.storage.local.set({ screenTime });
  
  console.log("%c✅ Dummy Data Seeded Successfully!", "color: #10b981; font-size: 18px; font-weight: bold;");
  console.log("We added realistic data for the last 30 days without touching today's real data.");
  console.log("👉 Go to your Voydr Dashboard and hit Refresh to see your charts fill up!");
})();
