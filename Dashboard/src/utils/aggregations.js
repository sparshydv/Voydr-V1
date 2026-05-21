export const getTodayDate = () => new Date().toISOString().split('T')[0];

export function getTodayStats(screenTime) {
  const today = getTodayDate();
  const todayData = screenTime[today] || {};
  
  let totalSeconds = 0;

  Object.values(todayData).forEach(seconds => {
    totalSeconds += seconds;
  });

  return {
    totalSeconds
  };
}

export function formatDurationShort(totalSeconds) {
  if (!totalSeconds) return '0m';
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function getWeeklyUsage(screenTime) {
  const data = [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayData = screenTime[dateStr] || {};
    
    let total = 0;
    
    Object.values(dayData).forEach(seconds => {
      total += seconds;
    });

    data.push({
      name: days[d.getDay()],
      total,
      fullDate: dateStr
    });
  }
  return data;
}

export function getTopWebsites(screenTime) {
  const today = getTodayDate();
  const todayData = screenTime[today] || {};
  
  const sites = Object.entries(todayData)
    .filter(([, seconds]) => seconds > 0)
    .map(([name, seconds]) => {
      return {
        name,
        minutes: Math.round(seconds / 60),
        time: formatDurationShort(seconds),
        favicon: name.charAt(0).toUpperCase()
      };
    })
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 5);
    
  return sites;
}

export function getHistoricalDataSummary(screenTime, days = 45) {
  if (!screenTime) return "";
  const dataStrs = [];
  
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    if (screenTime[dateStr]) {
      const dayData = screenTime[dateStr];
      const activities = [];
      Object.entries(dayData)
        .sort((a, b) => b[1] - a[1]) // sort by time descending
        .forEach(([hostname, seconds]) => {
          if (seconds > 0) {
            activities.push(`${hostname}: ${formatDurationShort(seconds)}`);
          }
        });
      if (activities.length > 0) {
        dataStrs.push(`Date: ${dateStr} | Activity: ${activities.join(', ')}`);
      }
    }
  }
  return dataStrs.join('\n');
}
