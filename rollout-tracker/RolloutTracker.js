/*
 * Discord Username Rollout Tracker
 * Created by @thecodingguy
 * https://github.com/Aisuruneko/discordrollout/
 * (c) 2023 Netro Corporation, on behalf of @thecodingguy
 */

class RolloutTracker {
	constructor() {
		// Main
		this.version = "v2023.06.08";
		this.assets = {
			base: "https://nekos.sh/rollout-tracker/",
			data: "data.json"
		};
		this.elements = {};
		this.maintainer = {
			handle: "thecodingguy",
			platform: "DISCORD"
		}
	}


	init() {
		try {
			// Handle Theme
			this.themeInit();

			// Get the site loaders
			this.elements.loaders = document.getElementsByClassName("loader");
			this.elements.sections = document.getElementsByTagName("section");
			this.elements.footer = document.getElementsByTagName("footer")[0];

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

			// Fetch the data
			const dataUrl = `${this.assets.base}${this.assets.data}`;
			fetch(dataUrl)
				.then(response => {
					if (!response.ok) throw new Error(response.status);
					else return response.json();
				})
				.then(data => {
					if (!data) throw new Error("Data missing");
					// We got the data!

					// Handle footer
					const footerSection = this.elements.footer;
					const footerpElement = document.createElement("p");
					if (data.footer) {
						footerpElement.innerHTML = (typeof data.footer.content === "object") ? data.footer.content.join("<br>") : data.footer.content;
						footerpElement.appendChild(document.createElement("br"))
					};

					const footerversionElement = document.createElement("span");
					footerversionElement.id = "version";
					footerversionElement.innerHTML = this.version;
					const footerlastUpdatedElement = document.createElement("span");
					footerlastUpdatedElement.id = "lastUpdated";
					footerlastUpdatedElement.innerHTML = `<c-timestamp unix=${data.meta.lastUpdated}>...</c-timestamp>`;

					footerpElement.appendChild(footerversionElement);
					footerpElement.appendChild(document.createTextNode(" | Updated: "));
					footerpElement.appendChild(footerlastUpdatedElement);

					footerSection.appendChild(footerpElement);

					// Handle status
					const statusSection = findIdFromElements(this.elements.sections, "status");
					if (statusSection) {

						// Remove loader
						const statusLoader = findIdFromElements(this.elements.loaders, "status-loader");
						statusLoader.remove();

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

						// Remove loader
						const timelineLoader = findIdFromElements(this.elements.loaders, "timeline-loader");
						timelineLoader.remove();

						// Handle adding data
						if (data.timeline && (data.timeline ? data.timeline.length > 0 : false)) {
							const ulElement = document.createElement("ul");

							for (let i = 0; i < data.timeline.length; i++) {
								if (!data.timeline[i].type || !data.timeline[i].header || !data.timeline[i].content) continue;

								// Append each item
								const liElement = document.createElement("li");

								// Header part
								const h3Element = document.createElement("h3");
								const badge = document.createElement("span");
								badge.className = `badge ${data.timeline[i].type}`;
								badge.textContent = data.timeline[i].type.toUpperCase();
								const rolloutText = document.createTextNode(` ${data.timeline[i].header}`);

								h3Element.appendChild(badge);
								h3Element.appendChild(rolloutText);

								// Content
								const pElement = document.createElement("p");
								pElement.innerHTML = (typeof data.timeline[i].content === "object") ? data.timeline[i].content.join("<br>") : data.timeline[i].content;

								liElement.appendChild(h3Element);
								liElement.appendChild(pElement);
								ulElement.appendChild(liElement);
							};

							timelineSection.appendChild(ulElement);
						} else {
							timelineSection.appendChild(document.createTextNode(`There is no timeline.`));
						};
					} else {
						throw new Error("Missing section: timeline");
					};
	
					// Handle FAQ
					const faqSection = findIdFromElements(this.elements.sections, "faq");
					if (faqSection) {

						// Remove loader
						const faqLoader = findIdFromElements(this.elements.loaders, "faq-loader");
						faqLoader.remove();

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
								pElement.style = "font-size: 90%;";
								pElement.innerHTML = (typeof data.faq[i].content === "object") ? data.faq[i].content.join("<br>") : data.faq[i].content;

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

						// Remove loader
						const footnotesLoader = findIdFromElements(this.elements.loaders, "footnotes-loader");
						footnotesLoader.remove();

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
				})
				.catch(error => {
					// We don't got the data...
					const loaders = findIdFromElements(this.elements.loaders, "*");
					if (loaders) Object.values(loaders).forEach(el => {
						el.remove();
					});

					console.error(
						`==== ERROR ====` + "\n" +
						`PLEASE REPORT TO ${this.maintainer.handle} ON ${this.maintainer.platform}` + "\n" +
						`Generated: ${new Date().getTime()}` + "\n" +
						`Error: ${error}` + "\n" +
						error.stack +
						`==== ERROR ====`
					);
					alert("Sorry, something went wrong while loading data. Try refreshing?");
				});
		} catch (Ex) {
			console.error(
				`==== ERROR ====` + "\n" +
				`PLEASE REPORT TO ${this.maintainer.handle} ON ${this.maintainer.platform}` + "\n" +
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
		const sysPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light";

		return ((usrPreference) ? (updateTheme((usrPreference === "dark"))) : (updateTheme((sysPreference === "dark"))));
	}
}




class CustomTimestamp extends HTMLElement {
	constructor() {
		super();
		this.unixTimestamp = parseInt(this.getAttribute('unix'));
		this.tooltip = document.createElement('div');
		this.tooltipVisible = false; // Track the visibility of the tooltip

		this.handleMouseEnter = this.handleMouseEnter.bind(this);
		this.handleMouseLeave = this.handleMouseLeave.bind(this);
	}

	connectedCallback() {
		this.render();
		this.addEventListener('mouseenter', this.handleMouseEnter);
		this.addEventListener('mouseleave', this.handleMouseLeave);
	}

	render() {
		const timestamp = new Date(this.unixTimestamp * 1000).toLocaleString();
		this.innerHTML = `<span class="timestamp">${timestamp}</span>`;
		this.style.cursor = 'pointer';
		this.style.position = 'relative';
	}

	handleMouseEnter() {
		if (!this.tooltipVisible) {
			this.tooltip.innerText = `UNIX Timestamp: ${this.unixTimestamp}`;
			this.tooltip.classList.add('tooltip');

			const rect = this.getBoundingClientRect();

			this.tooltip.style.top = `${rect.top + window.scrollY - 19}px`;
			this.tooltip.style.left = `${rect.left + window.scrollX}px`;

			document.body.appendChild(this.tooltip);

			this.tooltip.addEventListener('mouseenter', () => {
				this.tooltip.style.visibility = 'visible';
			});

			this.tooltip.addEventListener('mouseleave', this.handleMouseLeave);
			this.addEventListener('mouseleave', this.handleMouseLeave);

			this.tooltipVisible = true; // Set tooltip visibility to true
		};
	}

	handleMouseLeave() {
		if (this.tooltipVisible) {
			document.body.removeChild(this.tooltip);
			this.tooltipVisible = false; // Set tooltip visibility to false
		};
	}
};
customElements.define("c-timestamp", CustomTimestamp);

// } catch (Ex) {
// 	console.error(
// 		`==== ERROR ====` + "\n" +
// 		`PLEASE REPORT TO ${this.maintainer.handle} ON ${this.maintainer.platform}` + "\n" +
// 		`Generated: ${new Date().getTime()}` + "\n" +
// 		`Error: ${Ex}` + "\n" +
// 		Ex.stack +
// 		`==== ERROR ====`
// 	);
// 	alert("Sorry, something went wrong while initializing. Try refreshing?");
// };