console.log("Voydr popup loaded");

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

function formatDuration(totalSeconds) {
	if (totalSeconds < 60) {
		return `${totalSeconds}s`;
	}

	if (totalSeconds < 3600) {
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes}m ${seconds}s`;
	}

	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	return `${hours}h ${minutes}m`;
}

document.addEventListener("DOMContentLoaded", () => {
	const appElement = document.getElementById("app");
	const dashboardBtn = document.getElementById("open-dashboard-btn");

	if (dashboardBtn) {
		dashboardBtn.addEventListener("click", () => {
			chrome.tabs.create({ url: chrome.runtime.getURL("dashboard/index.html") });
		});
	}

	if (!appElement) {
		return;
	}

	chrome.storage.local.get(["screenTime", "blockedSites"], ({ screenTime, blockedSites: storedBlockedSites }) => {
		const today = getTodayDate();
		const todayData = screenTime?.[today];
		
		const blockedSitesToday = storedBlockedSites?.[today] || [];

		const entries =
			todayData && typeof todayData === "object"
				? Object.entries(todayData).filter(([, seconds]) => Number.isFinite(seconds) && seconds > 0)
				: [];

		const totalSeconds = entries.reduce((sum, [, seconds]) => sum + seconds, 0);
		const topSites = [...entries].sort((a, b) => b[1] - a[1]).slice(0, 3);

		const renderDashboard = () => {
			appElement.innerHTML = "";

			const totalSection = document.createElement("section");
			const totalHeading = document.createElement("h2");
			totalHeading.textContent = "Total Time Today";
			const totalValue = document.createElement("p");
			totalValue.className = "focus-score"; // Reusing this class for large text
			totalValue.textContent = formatDuration(totalSeconds);
			totalSection.append(totalHeading, totalValue);

			const sitesSection = document.createElement("section");
			const sitesHeading = document.createElement("h2");
			sitesHeading.textContent = "Top Sites";
			sitesSection.appendChild(sitesHeading);

			if (topSites.length === 0) {
				const emptyState = document.createElement("p");
				emptyState.className = "empty-state";
				emptyState.textContent = "No activity tracked today.";
				sitesSection.appendChild(emptyState);
			} else {
				const list = document.createElement("ol");
				list.className = "site-list";

				topSites.forEach(([hostname, seconds], index) => {
					const listItem = document.createElement("li");
					listItem.className = "site-item";

					const siteIdentity = document.createElement("div");
					siteIdentity.className = "site-identity";

					const siteFavicon = document.createElement("div");
					siteFavicon.className = "site-favicon";
					siteFavicon.textContent = hostname.charAt(0).toUpperCase();

					const siteName = document.createElement("span");
					siteName.className = "site-host";
					siteName.textContent = hostname;

					siteIdentity.append(siteFavicon, siteName);

					const siteTime = document.createElement("span");
					siteTime.className = "site-time";
					siteTime.textContent = formatDuration(seconds);

					listItem.append(siteIdentity, siteTime);
					list.appendChild(listItem);
				});

				sitesSection.appendChild(list);
			}

			appElement.append(totalSection, sitesSection);
		};

		renderDashboard();
	});
});
