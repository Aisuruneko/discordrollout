/*
 * Discord Username Rollout Tracker
 * Created by @thecodingguy
 * https://github.com/Aisuruneko/discordrollout/
 * (c) 2023 Netro Corporation, on behalf of @thecodingguy
 */

class RolloutTracker {
	constructor() {
		// Main
		this.version = "v2023.06.16_1";
		this.assets = {
			data: "data/full",
			alerts: "alerts/full"
		};
		this.elements = {};
		this.refreshTimer = {
			seconds: {
				total: 300,
				current: 0,
				showAfter: 2
			},
			onEnd: () => { this.refreshData(); },
			timer: null
		};
	}


	convertSeconds(seconds) {
		const days = Math.floor(seconds / (3600 * 24));
		seconds %= 3600 * 24;

		const hours = Math.floor(seconds / 3600);
		seconds %= 3600;

		const minutes = Math.floor(seconds / 60);
		seconds %= 60;

		return { days, hours, minutes, seconds };
	}
	padZero(i) { return ((i < 10) ? `0${i}` : i); }

	init() {
		try {
			// Handle Theme
			this.themeInit();
			if (window.DONOTPOLL) return;

			// Get the site elements
			this.elements.alerts = document.getElementsByClassName("alerts")[0];
			this.elements.loaders = document.getElementsByClassName("loader");
			this.elements.sections = document.getElementsByTagName("section");
			this.elements.footer = document.getElementsByTagName("footer")[0];
			this.elements.refreshButton = document.getElementById("refreshButton");

			// Removes the whole loader altogether
			const loaderDimmer = document.getElementById("loader-dim");
			if (loaderDimmer) loaderDimmer.remove();

			// Do the data stuff
			this.elements.refreshButton.addEventListener("click", () => {
				if (!this.elements.refreshButton.classList.contains("disabled")) this.refreshData();
			});

			this.refreshData();
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

	async refreshData() {
		clearInterval(this.refreshTimer.timer);
		// Adds the loading thing next to the site name
		const headerLoader = document.getElementById("header-loader");
		headerLoader.style.display = "block";

		const refreshButtonStatus = (disabled) => {
			this.elements.refreshButton.classList[disabled ? "add" : "remove"]("disabled");
			this.elements.refreshButton.innerText = disabled ? "Refreshing ..." : "Refresh now!";
			this.elements.refreshButton.disabled = disabled;
		};
		refreshButtonStatus(true);
		let nextCheckElement = document.getElementById("nextCheck");
		if (nextCheckElement) nextCheckElement.innerHTML = "(Checking now...)";

		const lastCheckedElement = document.getElementById("lastChecked");

		const findIdFromElements = (elements, id) => {
			if (id == "*") {
				const result = {};
				for (let i = 0; i < elements.length; i++) {
					const element = elements[i];
					if (element.id) result[elements.id] = element;
				};
				return result;
			} else {
				for (let i = 0; i < elements.length; i++) {
					if (elements[i].id === id) return elements[i];
				};
				return null;
			};
		};

		const cleanElements = (temp) => Object.values(temp.children).filter(el => !["h2", "h3", "button"].includes(el.tagName.toLowerCase()) && !["header"].includes(el.id.toLowerCase())).forEach(el => el.remove());

		// Fetch the data
		const alertsUrl = `${this.assets.base}${this.assets.alerts}`;
		await fetch(alertsUrl)
			.then(response => {
				if (!response.ok) throw new Error(response.status);
				else return response.json();
			})
			.then(data => {
				if (!data) throw new Error("Data missing");
				// We got the alerts!

				if (data.alerts && (data.alerts.length ? data.alerts.length > 0 : false)) {
					const alertsContainer = this.elements.alerts;

					// Clear out old stuff (if it applies ofc)

					if (alertsContainer) { cleanElements(alertsContainer); };

					for (let i = 0; i < data.alerts.length; i++) {
						if (!data.alerts[i].id || !data.alerts[i].icon || !data.alerts[i].text) continue;
						const alertContainer = document.createElement("div");


						const alertIconElement = document.createElement("span");
						alertIconElement.className = "alert-icon";
						alertIconElement.innerHTML = data.alerts[i].icon;
						const alertTextElement = document.createElement("span");
						alertTextElement.className = "alert-text";
						alertTextElement.innerHTML = data.alerts[i].text;

						alertContainer.appendChild(alertIconElement);
						alertContainer.appendChild(alertTextElement);


						alertsContainer.appendChild(alertContainer);
					};
				};
			})
			.catch(error => {
				// We don't got the alerts...

				const genericError = (err) => {
					console.error(
						`==== ERROR ====` + "\n" +
						`Generated: ${new Date().getTime()}` + "\n" +
						`Error: ${err}` + "\n" +
						err.stack +
						`==== ERROR ====`
					);
					alert("Sorry, something went wrong while loading alerts. Try refreshing?");
				};

				if (error.stack) genericError()
				else {
					if (typeof error.json === "function") {
						error.json().then(errorData => {
							console.error(
								`==== ERROR ====` + "\n" +
								`Generated: ${new Date().getTime()}` + "\n" +
								`Error: ${errorData.toString()}` + "\n" +
								`==== ERROR ====`
							);
							alert(("Loading alerts failed: " + errorData.human) || "Sorry, something went wrong while loading alerts. Try refreshing?");
						}).catch(err => {
							genericError(err);
						});
					} else genericError(error);
				};
			});

		// Fetch the data
		const dataUrl = `${this.assets.base}${this.assets.data}`;
		await fetch(dataUrl)
			.then(response => {
				if (!response.ok) throw response;
				else return response.json();
			})
			.then(data => {
				if (!data) throw new Error("Data missing");
				// We got the data!

				// Clear out old stuff (if it applies ofc)
				let temp = document.getElementsByTagName("footer");
				if (temp) { cleanElements(temp[0]); };

				// Handle footer
				const footerSection = this.elements.footer;
				const footerpElement = document.createElement("p");
				if (data.footer) {
					let footerpContent = (typeof data.footer.content === "object") ? data.footer.content.join("<br>") : data.footer.content;
					footerpElement.innerHTML = footerpContent
						.replaceAll("%MAINTAINER_URL%", data.maintainer.url)
						.replaceAll("%MAINTAINER_HANDLE%", data.maintainer.handle)
						.replaceAll("%MAINTAINER_PLATFORM%", data.maintainer.platform)
						.replaceAll("%SITE_VERSION%", this.version)
						.replaceAll("%DATA_LAST_UPDATED%", data.meta.lastUpdated);
					footerpElement.appendChild(document.createElement("br"))
				};

				footerSection.appendChild(footerpElement);

				// Handle status
				const statusSection = findIdFromElements(this.elements.sections, "status");
				if (statusSection) {

					// Clear out old stuff (if it applies ofc)
					let temp = document.getElementById("status");
					if (temp) { cleanElements(temp); };

					// Handle adding data
					const pElement = document.createElement("p");

					const createStatus = (badgeName, dataSrc) => {
						const container = document.createDocumentFragment();

						// Create badge
						const badge = document.createElement("span");
						badge.className = `badge ${badgeName}`;
						badge.textContent = badgeName.toUpperCase();
						container.appendChild(badge);
						container.appendChild(document.createElement("br"));

						// Create footnote
						const nitroUsersFootnote = document.createElement("span");
						nitroUsersFootnote.className = "footnote";
						nitroUsersFootnote.textContent = "1";

						// Create the "Nitro Users" & "Non-Nitro Users"
						const nitroUsersBold = document.createElement("b");
						nitroUsersBold.textContent = "Nitro Users";
						const nonNitroUsersBold = document.createElement("b");
						nonNitroUsersBold.textContent = "Non-Nitro Users";

						// Append the footnote
						nitroUsersBold.appendChild(nitroUsersFootnote);
						nonNitroUsersBold.appendChild(nitroUsersFootnote.cloneNode(true));

						// Append "Nitro Users" & "Non-Nitro Users" to main p
						container.appendChild(nitroUsersBold);
						container.appendChild(document.createTextNode(`: ${dataSrc.nitro}`));
						container.appendChild(document.createElement("br"));
						container.appendChild(nonNitroUsersBold);
						container.appendChild(document.createTextNode(`: ${dataSrc.nonnitro}`));

						// Space me lol
						container.appendChild(document.createElement("br"));
						container.appendChild(document.createElement("br"));

						return container;
					};

					if (data.status.confirmed) {
						pElement.appendChild(createStatus("confirmed", data.status.confirmed));
					};
					if (data.status.unconfirmed) {
						pElement.appendChild(createStatus("unconfirmed", data.status.unconfirmed));
					};
					if (data.status.pending) {
						pElement.appendChild(createStatus("pending", data.status.pending));
					};

					statusSection.appendChild(pElement);
				} else {
					throw new Error("Missing section: status");
				};

				// Handle timeline
				const timelineSection = findIdFromElements(this.elements.sections, "timeline");
				if (timelineSection) {

					// Clear out old stuff (if it applies ofc)
					let temp = document.getElementById("timeline-list");
					if (temp) { temp.remove(); };

					// Handle adding data
					if (data.timeline && (data.timeline ? data.timeline.length > 0 : false)) {
						const ulElement = document.createElement("ul");
						ulElement.id = "timeline-list";

						for (let i = 0; i < data.timeline.length; i++) {
							const timelineItem = data.timeline[i];
							if (!timelineItem.type) continue;

							// Append each item
							const liElement = document.createElement("li");

							// Header part
							const containerElement = document.createElement("div");
							const badge = document.createElement("span");
							const h3Element = document.createElement("h3");
							containerElement.className = "header";
							badge.className = `badge ${timelineItem.type}`;
							badge.textContent = timelineItem.type.toUpperCase();
							const rolloutText = document.createTextNode(`Day ${timelineItem.day}`);
							h3Element.appendChild(rolloutText);

							containerElement.appendChild(badge);
							containerElement.appendChild(h3Element);

							// Content
							const pElement = document.createElement("p");
							let pElementContent = "";

							if (timelineItem.content) pElementContent += timelineItem.content + "<br>";

							if (timelineItem.updates) {
								for (let k = 0; k < timelineItem.updates.length; k++) {
									if (timelineItem.updates[k].wave) {
										pElementContent += `<b>Wave ${timelineItem.updates[k].wave}</b><br>`;
										for (let r = 0; r < timelineItem.updates[k].rollouts.length; r++) {
											const key = Object.keys(timelineItem.updates[k].rollouts[r]);	
											pElementContent += `[<c-timestamp unix="${key}"></c-timestamp>] ${timelineItem.updates[k].rollouts[r][key]}<br>`;
										};
										if (timelineItem.updates.length > (k + 1)) pElementContent += "<br>";
									} else {
										const key = Object.keys(timelineItem.updates[k]);
										pElementContent += `[<c-timestamp unix="${key}"></c-timestamp>] ${timelineItem.updates[k][key]}<br>`;
									};
								};
							};

							pElement.innerHTML = pElementContent;

							liElement.appendChild(containerElement);
							liElement.appendChild(pElement);
							ulElement.appendChild(liElement);
						};

						timelineSection.appendChild(ulElement);
						this.sortInit();
						
					} else {
						timelineSection.appendChild(document.createTextNode(`There is no timeline.`));
					};
				} else {
					throw new Error("Missing section: timeline");
				};
	
				// Handle FAQ
				const faqSection = findIdFromElements(this.elements.sections, "faq");
				if (faqSection) {

					// Clear out old stuff (if it applies ofc)
					let temp = document.getElementById("faq");
					if (temp) { cleanElements(temp); };


					// Handle adding data
					if (data.faq && (data.faq ? data.faq.length > 0 : false)) {
						for (let i = 0; i < data.faq.length; i++) {
							if (!data.faq[i].header || !data.faq[i].content) continue;

							// Append each item
							const faqItemElement = document.createElement("div");
							faqItemElement.className = "faq-item";

							// Header part
							const h4Element = document.createElement("h4");
							h4Element.textContent = data.faq[i].header;

							// Content
							const pElement = document.createElement("p");
							let pContent = (typeof data.faq[i].content === "object") ? data.faq[i].content.join("<br>") : data.faq[i].content;
							pElement.style = "font-size: 90%;";
							pElement.innerHTML = pContent
								.replaceAll("%MAINTAINER_URL%", data.maintainer.url)
								.replaceAll("%MAINTAINER_HANDLE%", data.maintainer.handle)
								.replaceAll("%MAINTAINER_PLATFORM%", data.maintainer.platform);

							faqItemElement.appendChild(h4Element);
							faqItemElement.appendChild(pElement);

							faqSection.appendChild(faqItemElement);
						};
					} else {
						faqSection.appendChild(document.createTextNode(`There is no FAQ???`));
					};
				} else {
					throw new Error("Missing section: FAQ");
				};

				// Handle Footnotes
				const footnotesSection = findIdFromElements(this.elements.sections, "footnotes");
				if (footnotesSection) {

					// Clear out old stuff (if it applies ofc)
					let temp = document.getElementById("footnotes");
					if (temp) { cleanElements(temp); };

					// Handle adding data
					if (data.footnotes && (data.footnotes ? data.footnotes.length > 0 : false)) {
						const pElement = document.createElement("p");

						for (let i = 0; i < data.footnotes.length; i++) {
							if (!data.footnotes[i].note || !data.footnotes[i].content) continue;

							// Make the footnote
							const footnoteElement = document.createElement("span");
							footnoteElement.className = "footnote";
							footnoteElement.textContent = data.footnotes[i].note;

							// Start the content
							const footnoteTextElement = document.createElement("span");
							footnoteTextElement.style = "font-size: 90%;";
							footnoteTextElement.innerHTML = (typeof data.footnotes[i].content === "object") ? data.footnotes[i].content.join("<br>") : data.footnotes[i].content;

							pElement.appendChild(footnoteElement);
							pElement.appendChild(footnoteTextElement);
						};
						footnotesSection.appendChild(pElement);
					} else {
						footnotesSection.appendChild(document.createTextNode(`There is no footnotes???`));
					};
				} else {
					throw new Error("Missing section: footnotes");
				};

				this.timerInit();

				headerLoader.style.display = "none";

				// Update refreshed data & enable button
				cleanElements(lastCheckedElement);
				lastCheckedElement.innerHTML = `Last checked: <c-timestamp unix="${new Date().getTime() / 1000}"></c-timestamp> `;
				nextCheckElement = document.createElement("span");
				nextCheckElement.id = "nextCheck";
				nextCheckElement.innerText = "(Checked just now!)";
				lastCheckedElement.appendChild(nextCheckElement);
				refreshButtonStatus(false);

			})
			.catch(error => {
				// We don't got the data...
				headerLoader.style.display = "none";
				refreshButtonStatus(false);

				lastCheckedElement.innerHTML = `Failed to fetch latest data!`;

				const genericError = (err) => {
					console.error(
						`==== ERROR ====` + "\n" +
						`Generated: ${new Date().getTime()}` + "\n" +
						`Error: ${err}` + "\n" +
						err.stack +
						`==== ERROR ====`
					);
					alert("Sorry, something went wrong while loading data. Try refreshing?");
				};

				if (error.stack) genericError()
				else {
					if (typeof error.json === "function") {
						error.json().then(errorData => {
							console.error(
								`==== ERROR ====` + "\n" +
								`Generated: ${new Date().getTime()}` + "\n" +
								`Error: ${errorData.toString()}` + "\n" +
								`==== ERROR ====`
							);
							alert(("Loading data failed: " + errorData.human) || "Sorry, something went wrong while loading data. Try refreshing?");
						}).catch(err => {
							genericError(err);
						});
					} else genericError(error);
				};
			});
		
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

	timerInit() {
		this.refreshTimer.seconds.current = this.refreshTimer.seconds.total; // Reset
		this.refreshTimer.timer = setInterval(() => {
			if (this.refreshTimer.seconds.current < 0) {
				clearInterval(this.refreshTimer.timer);
				this.refreshTimer.onEnd();
			} else {
				if ((this.refreshTimer.seconds.total - this.refreshTimer.seconds.current) >= this.refreshTimer.seconds.showAfter) {
					let nextCheckElement = document.getElementById("nextCheck");
					const { days, hours, minutes, seconds } = this.convertSeconds(this.refreshTimer.seconds.current);
					if (nextCheckElement) nextCheckElement.innerHTML = "(Checking in " +
						`${(days != 0 ? (this.padZero(days) + "d") : "")}` +
						`${(hours != 0 ? (this.padZero(hours) + "h") : "")}` +
						`${(minutes != 0 ? (this.padZero(minutes) + "m") : "")}` +
						`${(seconds + "s")}` +
						".)";
				};

				this.refreshTimer.seconds.current--;
			};
		}, 1000);
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
