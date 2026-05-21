console.log("Voydr background loaded");

const HEARTBEAT_ALARM = "voydr-heartbeat";

// ── In-memory tracking state ──────────────────────────────────
// These are restored from chrome.storage.session on every worker wake-up
// so they survive service worker restarts (MV3).
let activeHostname = null;
let lastTimestamp = null;
let isWindowFocused = true;
let stateRestored = false;

// ── State Persistence ─────────────────────────────────────────
// chrome.storage.session persists across service worker restarts
// but clears when the browser is closed — perfect for tracking state.

async function persistState() {
	try {
		await chrome.storage.session.set({
			_trackState: { activeHostname, lastTimestamp, isWindowFocused }
		});
	} catch (e) {
		console.error("[Persist Error]", e);
	}
}

async function restoreState() {
	if (stateRestored) return;
	stateRestored = true;
	try {
		const result = await chrome.storage.session.get("_trackState");
		const s = result?._trackState;
		if (s) {
			activeHostname = s.activeHostname;
			lastTimestamp = s.lastTimestamp;
			isWindowFocused = s.isWindowFocused;
			console.log("[State Restored]", activeHostname,
				"| age:", lastTimestamp ? Math.round((Date.now() - lastTimestamp) / 1000) + "s" : "n/a");
		}
	} catch (e) {
		console.error("[Restore Error]", e);
	}
}

// ── Heartbeat Alarm ───────────────────────────────────────────
// Fires every 25 seconds to flush accumulated time before
// Chrome can kill the service worker (~30s idle timeout).

async function setupHeartbeat() {
	try {
		const existing = await chrome.alarms.get(HEARTBEAT_ALARM);
		if (!existing) {
			// delayInMinutes: first tick after 0.4 min (~24s)
			// periodInMinutes: repeat every 0.4 min (~24s)
			chrome.alarms.create(HEARTBEAT_ALARM, {
				delayInMinutes: 0.4,
				periodInMinutes: 0.4
			});
			console.log("[Heartbeat] Alarm created (every ~24s)");
		}
	} catch (e) {
		console.error("[Heartbeat Setup Error]", e);
	}
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
	if (alarm.name !== HEARTBEAT_ALARM) return;

	await restoreState();
	trackTime();

	// Reset timestamp for next interval so we don't double-count
	if (activeHostname && isWindowFocused) {
		lastTimestamp = Date.now();
	}
	await persistState();
});

// ── Boot ──────────────────────────────────────────────────────
restoreState().then(() => setupHeartbeat());

// ── Utility Functions ─────────────────────────────────────────

function extractHostname(url) {
	try {
		if (
			!url ||
			url.startsWith("chrome://") ||
			url.startsWith("chrome-extension://") ||
			url.startsWith("edge://") ||
			url.startsWith("about:") ||
			url.startsWith("devtools://")
		) {
			return null;
		}

		const hostname = new URL(url).hostname;
		if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
			return null;
		}

		return hostname;
	} catch {
		return null;
	}
}

function getTodayDate() {
	const now = new Date();
	return now.toISOString().split("T")[0];
}

function cleanInputHostname(input) {
	let urlString = input.trim().toLowerCase();
	if (!urlString) return "";

	if (!urlString.includes("://")) {
		urlString = "https://" + urlString;
	}

	try {
		let hostname = new URL(urlString).hostname;
		if (hostname.startsWith("www.")) {
			hostname = hostname.substring(4);
		}
		return hostname;
	} catch {
		return urlString.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
	}
}

// ── Core Tracking ─────────────────────────────────────────────

function trackTime() {
	if (!activeHostname || !lastTimestamp) {
		return;
	}

	const now = Date.now();
	let deltaSeconds = Math.floor((now - lastTimestamp) / 1000);

	if (deltaSeconds <= 0) {
		return;
	}

	if (deltaSeconds > 300) {
		console.log("[CAPPED DELTA]", deltaSeconds, "→ 300");
		deltaSeconds = 300;
	}

	lastTimestamp = now;
	void saveTime(activeHostname, deltaSeconds);
}

async function saveTime(hostname, secondsToAdd) {
	try {
		const { screenTime: storedScreenTime } = await chrome.storage.local.get(["screenTime"]);
		const screenTime = storedScreenTime || {};
		const today = getTodayDate();

		if (!screenTime[today]) {
			screenTime[today] = {};
		}

		if (!screenTime[today][hostname]) {
			screenTime[today][hostname] = 0;
		}

		screenTime[today][hostname] += secondsToAdd;
		const updatedTotalForToday = screenTime[today][hostname];
		await chrome.storage.local.set({ screenTime });
		await checkReminder(hostname, updatedTotalForToday);
		console.log(`[SAVED] ${hostname} +${secondsToAdd}s (total: ${updatedTotalForToday}s)`);
	} catch (error) {
		console.error("[Save Error]", error);
	}
}

// ── Reminders & Blocking ──────────────────────────────────────

async function checkReminder(hostname, totalSeconds) {
	try {
		const today = getTodayDate();
		const { remindersSent: storedRemindersSent, limits } = await chrome.storage.local.get(["remindersSent", "limits"]);
		
		const activeClean = cleanInputHostname(hostname);
		
		// Find limit
		let limitConfig = null;
		if (limits) {
			const limitKey = Object.keys(limits).find(key => {
				const limitClean = cleanInputHostname(key);
				return activeClean === limitClean || activeClean.endsWith("." + limitClean);
			});
			if (limitKey) limitConfig = limits[limitKey];
		}

		// Only send reminder if there's a limit, hardBlock is false, and limit is exceeded
		if (!limitConfig || limitConfig.hardBlock) {
			return; // If hardblock is true, checkBlock will handle the redirect.
		}

		if (totalSeconds < limitConfig.limitInSeconds) {
			return;
		}

		const remindersSent =
			storedRemindersSent && typeof storedRemindersSent === "object" && !Array.isArray(storedRemindersSent)
				? storedRemindersSent
				: {};

		if (!remindersSent[today] || typeof remindersSent[today] !== "object" || Array.isArray(remindersSent[today])) {
			remindersSent[today] = {};
		}

		if (remindersSent[today][hostname]) {
			return; // Already sent today
		}

		chrome.notifications.create(
			{
				type: "basic",
				iconUrl: chrome.runtime.getURL("icons/icon48.png"),
				title: "Voydr Limit Exceeded",
				message: `You've reached your limit for ${hostname}. Stay intentional.`,
				priority: 2,
			},
			(notificationId) => {
				if (chrome.runtime.lastError) {
					console.error("Notification Error:", chrome.runtime.lastError);
				} else {
					console.log("[REMINDER SENT]", hostname);
				}
			}
		);

		remindersSent[today][hostname] = true;
		await chrome.storage.local.set({ remindersSent });
	} catch (error) {
		console.error("[Reminder Error]", error);
	}
}

async function checkBlock(tabId, url) {
	if (!url) return false;
	const hostname = extractHostname(url);
	if (!hostname) return false;

	try {
		const { blockedSites, limits, screenTime } = await chrome.storage.local.get(["blockedSites", "limits", "screenTime"]);
		const today = getTodayDate();
		const todayBlocked = blockedSites?.[today] || [];
		
		const activeClean = cleanInputHostname(hostname);
		
		// 1. Check explicit block list
		const isBlocked = todayBlocked.some(blocked => {
			const blockedClean = cleanInputHostname(blocked);
			return activeClean === blockedClean || activeClean.endsWith("." + blockedClean);
		});

		if (isBlocked) {
			const blockedUrl = chrome.runtime.getURL(`blocked.html?site=${hostname}`);
			await chrome.tabs.update(tabId, { url: blockedUrl });
			return true;
		}

		// 2. Check limits with hardBlock enabled
		if (limits) {
			const limitKey = Object.keys(limits).find(key => {
				const limitClean = cleanInputHostname(key);
				return activeClean === limitClean || activeClean.endsWith("." + limitClean);
			});
			
			if (limitKey && limits[limitKey].hardBlock) {
				const limitConfig = limits[limitKey];
				let usedTime = 0;
				const todayData = screenTime?.[today] || {};
				Object.keys(todayData).forEach(host => {
					const hostClean = cleanInputHostname(host);
					if (hostClean === activeClean || hostClean.endsWith("." + activeClean)) {
						usedTime += todayData[host];
					}
				});

				if (usedTime >= limitConfig.limitInSeconds) {
					const blockedUrl = chrome.runtime.getURL(`blocked.html?site=${hostname}`);
					await chrome.tabs.update(tabId, { url: blockedUrl });
					return true;
				}
			}
		}

	} catch (err) {
		console.error("Block check error", err);
	}
	return false;
}

// ── Event Listeners ───────────────────────────────────────────

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
	await restoreState();

	// Always save time for the PREVIOUS tab first
	trackTime();

	try {
		const tab = await chrome.tabs.get(tabId);
		
		const isBlocked = await checkBlock(tabId, tab?.url);
		if (isBlocked) {
			activeHostname = null;
			lastTimestamp = null;
			await persistState();
			return;
		}

		const hostname = extractHostname(tab?.url);
		if (!hostname) {
			activeHostname = null;
			lastTimestamp = null;
			await persistState();
			return;
		}

		activeHostname = hostname;
		lastTimestamp = Date.now();
		await persistState();
		console.log("[Activated]", activeHostname);
	} catch (error) {
		activeHostname = null;
		lastTimestamp = null;
		await persistState();
		console.error("[Activated Error]", error);
	}
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
	if (changeInfo.url) {
		const isBlocked = await checkBlock(tabId, changeInfo.url);
		if (isBlocked) return;
	}

	if (changeInfo.status === "complete" && tab?.active === true) {
		await restoreState();

		// Save time for the previous page BEFORE checking new URL
		trackTime();

		const hostname = extractHostname(tab?.url);
		if (!hostname) {
			activeHostname = null;
			lastTimestamp = null;
			await persistState();
			return;
		}

		activeHostname = hostname;
		lastTimestamp = Date.now();
		await persistState();
		console.log("[Updated]", activeHostname);
	}
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
	await restoreState();

	if (windowId === chrome.windows.WINDOW_ID_NONE) {
		trackTime();
		isWindowFocused = false;
		lastTimestamp = null;
		await persistState();
		console.log("[Window Blur]");
		return;
	}

	isWindowFocused = true;
	lastTimestamp = Date.now();
	await persistState();
	console.log("[Window Focus]");
});

chrome.runtime.onSuspend.addListener(() => {
	trackTime();
	console.log("[Service Worker Suspended]");
});
