console.log("Voydr popup loaded");

const CATEGORY_OPTIONS = [
	{ value: "productive", label: "Productive" },
	{ value: "neutral", label: "Neutral" },
	{ value: "distracting", label: "Distracting" }
];

const CATEGORY_LABELS = {
	productive: "PRODUCTIVE",
	neutral: "NEUTRAL",
	distracting: "DISTRACTING"
};

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

function getFocusMessage(scorePercent) {
	if (scorePercent >= 70) {
		return "Great focus today 💪";
	}

	if (scorePercent >= 40) {
		return "Room to improve.";
	}

	return "Let's refocus.";
}

function calculateFocusScore(entries, siteCategory) {
	const totalTime = entries.reduce((sum, [, seconds]) => sum + seconds, 0);
	if (totalTime === 0) {
		return 0;
	}

	const productiveTime = entries.reduce((sum, [hostname, seconds]) => {
		const category = siteCategory[hostname] || "neutral";
		if (category === "productive") {
			return sum + seconds;
		}

		return sum;
	}, 0);

	return Math.round((productiveTime / totalTime) * 100);
}

document.addEventListener("DOMContentLoaded", () => {
	const appElement = document.getElementById("app");
	if (!appElement) {
		return;
	}

	chrome.storage.local.get(["screenTime", "siteCategory"], ({ screenTime, siteCategory: storedSiteCategory }) => {
		const today = getTodayDate();
		const todayData = screenTime?.[today];
		const siteCategory =
			storedSiteCategory && typeof storedSiteCategory === "object" && !Array.isArray(storedSiteCategory)
				? storedSiteCategory
				: {};

		const entries =
			todayData && typeof todayData === "object"
				? Object.entries(todayData).filter(([, seconds]) => Number.isFinite(seconds) && seconds > 0)
				: [];

		const totalSeconds = entries.reduce((sum, [, seconds]) => sum + seconds, 0);
		const topSites = [...entries].sort((a, b) => b[1] - a[1]).slice(0, 3);

		const renderDashboard = () => {
			const focusScore = calculateFocusScore(entries, siteCategory);

			appElement.innerHTML = "";

			const focusSection = document.createElement("section");
			const focusHeading = document.createElement("h2");
			focusHeading.textContent = "Focus Score";
			const focusValue = document.createElement("p");
			focusValue.className = "focus-score";
			focusValue.textContent = `${focusScore}%`;
			const focusMessage = document.createElement("p");
			focusMessage.className = "focus-message";
			focusMessage.textContent = getFocusMessage(focusScore);
			focusSection.append(focusHeading, focusValue, focusMessage);

			const totalSection = document.createElement("section");
			const totalHeading = document.createElement("h2");
			totalHeading.textContent = "Total Time Today";
			const totalValue = document.createElement("p");
			totalValue.textContent = formatDuration(totalSeconds);
			totalSection.append(totalHeading, totalValue);

			const sitesSection = document.createElement("section");
			const sitesHeading = document.createElement("h2");
			sitesHeading.textContent = "Top Sites";
			sitesSection.appendChild(sitesHeading);

			if (topSites.length === 0) {
				const emptyState = document.createElement("p");
				emptyState.textContent = "No activity tracked today.";
				sitesSection.appendChild(emptyState);
			} else {
				const list = document.createElement("ol");
				list.className = "site-list";

				topSites.forEach(([hostname, seconds]) => {
					const listItem = document.createElement("li");
					listItem.className = "site-item";

					const siteMeta = document.createElement("div");
					siteMeta.className = "site-meta";
					const selectedCategory = siteCategory[hostname] || "neutral";

					const siteIdentity = document.createElement("div");
					siteIdentity.className = "site-identity";

					const siteName = document.createElement("span");
					siteName.className = "site-host";
					siteName.textContent = hostname;

					const categoryBadge = document.createElement("span");
					categoryBadge.className = `category-badge category-${selectedCategory}`;
					categoryBadge.textContent = CATEGORY_LABELS[selectedCategory] || CATEGORY_LABELS.neutral;

					siteIdentity.append(siteName, categoryBadge);

					const siteTime = document.createElement("span");
					siteTime.className = "site-time";
					siteTime.textContent = formatDuration(seconds);

					siteMeta.append(siteIdentity, siteTime);

					const categorySelect = document.createElement("select");
					categorySelect.className = "category-select";
					categorySelect.dataset.hostname = hostname;

					CATEGORY_OPTIONS.forEach(({ value, label }) => {
						const option = document.createElement("option");
						option.value = value;
						option.textContent = label;
						option.selected = value === selectedCategory;
						categorySelect.appendChild(option);
					});

					categorySelect.addEventListener("change", (event) => {
						const target = event.target;
						if (!(target instanceof HTMLSelectElement)) {
							return;
						}

						siteCategory[hostname] = target.value;
						renderDashboard();
						chrome.storage.local.set({ siteCategory });
					});

					listItem.append(siteMeta, categorySelect);
					list.appendChild(listItem);
				});

				sitesSection.appendChild(list);
			}

			appElement.append(focusSection, totalSection, sitesSection);
		};

		renderDashboard();
	});
});
