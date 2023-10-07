/*
 * Discord Username Rollout Tracker
 * Created by @thecodingguy
 * https://github.com/Aisuruneko/discordrollout/
 * (c) 2023 Netro Corporation, on behalf of @thecodingguy
 */

class RolloutTracker {
	constructor() {
		// Main
		this.version = "v2023.10.07";
	}

	init() {
		try {
			// Handle Theme
			this.themeInit();
			if (window.DONOTPOLL) return;
			this.sortInit();
		} catch (Ex) {
			console.error(
				`==== ERROR ====` + "\n" +
				`Generated: ${new Date().getTime()}` + "\n" +
				`Error: ${Ex}` + "\n" +
				Ex.stack +
				`==== ERROR ====`
			);
			alert("Sorry, something went wrong while initializing. Try refreshing?");
		};
	}

	themeInit() {
		const updateTheme = (shouldBeDark, fromToggle = false) => {
			if (!fromToggle) themeToggle.checked = shouldBeDark;
			document.body.classList[(shouldBeDark ? "add" : "remove")]("dark");
			localStorage.setItem("theme", (shouldBeDark ? "dark" : "light"));
		}
		// Toggle
		const themeToggle = document.getElementById("themeToggle");
		themeToggle.addEventListener("change", function() {
			return updateTheme(this.checked, true);
		});

		// Theme Handling
		const usrPreference = localStorage.getItem("theme");
		const sysPreference = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

		return ((usrPreference) ? (updateTheme((usrPreference === "dark"))) : (updateTheme((sysPreference === "dark"))));
	}

	sortInit() {
		const timelineList = document.getElementById("timeline-list");
		const timelineHeader = document.getElementById("timeline-header");

		if (!timelineList || !timelineHeader) return;

		let sortToggle = document.getElementById("sortToggle");
		
		if (!sortToggle) {
			sortToggle = document.createElement("button");
			sortToggle.id = "sortToggle";
			sortToggle.className = "button badge confirmed";
			sortToggle.innerHTML = "Sort by Newest";
			timelineHeader.appendChild(sortToggle);
		};

		const updateSort = (forceMode) => {
			const timelineItems = Array.from(timelineList.getElementsByTagName("li"));

			const ascending = (!forceMode ? (timelineList.getAttribute("data-sort-order") === "asc") : (forceMode === "asc"));

			timelineList.setAttribute("data-sort-order", (ascending ? "desc" : "asc"));

			// Sorting time!
			timelineItems.sort(function (a, b) {
				const textA = a.querySelector("h3").textContent;
				const textB = b.querySelector("h3").textContent;

				const numberA = parseInt(textA.match(/\d+/)[0]);
				const numberB = parseInt(textB.match(/\d+/)[0]);

				return ((ascending) ? (numberA - numberB) : (numberB - numberA));
			});

			// Reorder the list items
			timelineItems.forEach(function (li) {
				timelineList.appendChild(li);
			});

			// Update toggle button
			sortToggle.className = `button badge ${ascending ? "confirmed" : "unconfirmed"}`;
			sortToggle.innerText = `Sort by ${ascending ? "Newest" : "Oldest"}`;

			if (!forceMode) localStorage.setItem("sortingTimelineMethod", (ascending ? "asc" : "desc"));
		};

		// Toggle
		sortToggle.addEventListener("click", function() {
			return updateSort();
		});

		const usrPreference = localStorage.getItem("sortingTimelineMethod");

		return usrPreference ? updateSort(usrPreference) : null;
	}


}


class CustomTimestamp extends HTMLElement {
	constructor() {
		super();
		this.unixTimestamp = parseInt(this.getAttribute("unix"));
		this.tooltip = document.createElement("div");
		this.tooltipVisible = false;
		this.tooltipText = `UNIX Timestamp: ${this.unixTimestamp}`;
		this.originalText = "";
		this.copyTimeout = null;

		this.handleClick = this.handleClick.bind(this);
		this.handleMouseLeave = this.handleMouseLeave.bind(this);
	}

	connectedCallback() {
		this.render();
		this.addEventListener("click", this.handleClick);
		this.tooltip.addEventListener("dblclick", this.handleClick);
		this.tooltip.addEventListener("mouseleave", this.handleMouseLeave);
	}

	render() {
		const timestamp = new Date(this.unixTimestamp * 1000).toLocaleString();
		this.originalText = timestamp;
		this.innerHTML = `<span class="timestamp">${timestamp}</span>`;
		this.style.cursor = "pointer";
		this.style.position = "relative";
	}

	handleClick(event) {
		if (!this.tooltipVisible) {
			this.tooltip.innerText = this.tooltipText;
			this.tooltip.classList.add("tooltip");

			const rect = this.getBoundingClientRect();

			this.tooltip.style.top = `${rect.top + window.scrollY - 30}px`;
			this.tooltip.style.left = `${rect.left + window.scrollX}px`;

			document.body.appendChild(this.tooltip);

			this.addEventListener("mouseleave", this.handleMouseLeave);
			this.tooltipVisible = true;
		} else if (event.target === this.tooltip) {
			this.copyToClipboard();
		}
	}

	handleMouseLeave(event) {
		const { relatedTarget } = event;

		if (!this.contains(relatedTarget) && !this.tooltip.contains(relatedTarget)) {
			document.body.removeChild(this.tooltip);
			this.removeEventListener("mouseleave", this.handleMouseLeave);
			this.tooltipVisible = false;
		}
	}

	copyToClipboard() {
		this.tooltip.removeEventListener("mouseleave", this.handleMouseLeave);
		navigator.clipboard.writeText(this.tooltipText.toLowerCase().replace("unix timestamp: ", "")).then(() => {
			this.tooltip.innerText = "Copied!";
			this.copyTimeout = setTimeout(() => {
				this.tooltip.innerText = this.tooltipText;
				this.tooltip.addEventListener("mouseleave", this.handleMouseLeave);
			}, 1000);
		});
	}

	disconnectedCallback() {
		clearTimeout(this.copyTimeout);
	}
}

customElements.define("c-timestamp", CustomTimestamp);
