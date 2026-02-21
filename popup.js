console.log("Voydr popup loaded");

function getTodayDate() {
	const now = new Date();
	return now.toISOString().split("T")[0];
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

function renderNoActivity(appElement) {
	appElement.textContent = "No activity tracked today.";
}

function renderDashboard(appElement, totalSeconds, topSites) {
	const totalFormatted = formatDuration(totalSeconds);
	const topSitesLines = topSites
		.map(([hostname, seconds], index) => `${index + 1}. ${hostname} — ${formatDuration(seconds)}`)
		.join("\n");

	appElement.innerHTML = `
		<section>
			<h2>Total Time Today</h2>
			<p>${totalFormatted}</p>
		</section>
		<section>
			<h2>Top Sites</h2>
			<pre>${topSitesLines}</pre>
		</section>
	`;
}

document.addEventListener("DOMContentLoaded", () => {
	const appElement = document.getElementById("app");
	if (!appElement) {
		return;
	}

	chrome.storage.local.get(["screenTime"], ({ screenTime }) => {
		const today = getTodayDate();
		const todayData = screenTime?.[today];

		if (!todayData || typeof todayData !== "object") {
			renderNoActivity(appElement);
			return;
		}

		const entries = Object.entries(todayData).filter(([, seconds]) => Number.isFinite(seconds) && seconds > 0);
		if (entries.length === 0) {
			renderNoActivity(appElement);
			return;
		}

		const totalSeconds = entries.reduce((sum, [, seconds]) => sum + seconds, 0);
		const topSites = [...entries].sort((a, b) => b[1] - a[1]).slice(0, 3);

		renderDashboard(appElement, totalSeconds, topSites);
	});
});
