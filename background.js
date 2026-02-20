console.log("Voydr background loaded");

let activeHostname = null;
let lastTimestamp = null;
let isWindowFocused = true;

function extractHostname(url) {
	if (!url || url.startsWith("chrome://") || url.startsWith("edge://")) {
		return null;
	}

	try {
		return new URL(url).hostname;
	} catch {
		return null;
	}
}

function trackTime() {
	if (!activeHostname || !isWindowFocused || !lastTimestamp) {
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

	console.log(`[TRACKED] ${activeHostname} +${deltaSeconds}s`);
	lastTimestamp = now;
}

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
	try {
		const tab = await chrome.tabs.get(tabId);
		const hostname = extractHostname(tab?.url);
		if (!hostname) {
			return;
		}

		trackTime();
		activeHostname = hostname;
		lastTimestamp = Date.now();
		console.log("[Activated]", activeHostname);
	} catch (error) {
		console.error("[Activated Error]", error);
	}
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.status === "complete" && tab?.active === true) {
		const hostname = extractHostname(tab?.url);
		if (!hostname) {
			return;
		}

		trackTime();
		activeHostname = hostname;
		lastTimestamp = Date.now();
		console.log("[Updated]", activeHostname);
	}
});

chrome.windows.onFocusChanged.addListener((windowId) => {
	if (windowId === chrome.windows.WINDOW_ID_NONE) {
		trackTime();
		isWindowFocused = false;
		console.log("[Window Blur]");
		return;
	}

	isWindowFocused = true;
	lastTimestamp = Date.now();
	console.log("[Window Focus]");
});

chrome.runtime.onSuspend.addListener(() => {
	trackTime();
	console.log("[Service Worker Suspended]");
});
