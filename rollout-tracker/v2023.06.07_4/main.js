try {
	const siteData = {
		version: "v2023.06.07_4",
		updated: 1686163919
	};

	const themeToggle = document.getElementById('themeToggle');
	themeToggle.addEventListener('change', function () {
		if (this.checked) {
			document.body.classList.add('dark');
			document.body.classList.remove('light');
			localStorage.setItem('theme', 'dark');
		} else {
			document.body.classList.add('light');
			document.body.classList.remove('dark');
			localStorage.setItem('theme', 'light');
		};
	});

	// Load theme
	const userPreference = localStorage.getItem('theme');
	const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

	if (userPreference) {
		document.body.classList.add(userPreference);
		themeToggle.checked = (userPreference === "dark");
	} else {
		document.body.classList.add(systemPreference);
		themeToggle.checked = (systemPreference === "dark");
	};



	/* ============================================== PAGE UPDATE */
	const versionText = document.getElementById('version');
	const lastUpdate = document.getElementById('lastUpdated');
	versionText.innerHTML = siteData.version;
	lastUpdate.innerHTML = '<c-timestamp unix="' + siteData.updated + '">...</c-timestamp>';

	setTimeout(() => {
		window.location.reload();
	}, ((60 * 1000) * 5));


	/* ============================================== TIMESTAMP */
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
			}
		}

		handleMouseLeave() {
			if (this.tooltipVisible) {
			document.body.removeChild(this.tooltip);
			this.tooltipVisible = false; // Set tooltip visibility to false
			}
		}
	};

	customElements.define('c-timestamp', CustomTimestamp);
} catch (Ex) {
	alert("Something went wrong. Please reload the page.");
};