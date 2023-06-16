/*
 * Discord Username Rollout Tracker
 * (c) 2023 Netro Corporation, on behalf of thecodingguy
*/

const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const puppeteer = require("puppeteer");

const fs = require("fs");
const path = require("path");

const data = require("../../../data/main.json");
const alerts = require("../../../data/alerts.json");

const oneMinute = (60 * 1000);

module.exports = (app) => {

	// Add in some data.
	data.maintainer = {
		handle: process.env.MAINTAINER_HANDLE,
		platform: process.env.MAINTAINER_PLATFORM,
		url: process.env.MAINTAINER_URL
	};
	data.footer = {
		"content": [
			"%SITE_VERSION% | Data Updated: <c-timestamp unix=%DATA_LAST_UPDATED%>...</c-timestamp>"
		]
	};
	data.source = process.env.BASE_URL;
	alerts.source = process.env.BASE_URL;

	const rateLimitMessages = [
		"You've have too much to drink of the tea!",
		"Aah, that's too much! Make sure to drink water and eat food!" ,
		"You love this so much, and we love you too, but too much love may kill!",
		"Hey look, the flowers are pretty outside.",
		"It's a beautiful day outside. Birds are singing, flowers are blooming. On days like these, kids like you... should be enjoying the view.",
		"You're not trying to break me, are you?",
		"Hang on, let me moonwalk right quick!",
		"You've been hit by! You've been struck by! A smooth ratelimit.",
		"You've been hit by! You've been struck by! Truck.",
		"Touch grass.",
		"https://twitter.com/discord/status/1501263121729552385"
	];

	const apiLimiterErr = (req) => {
		const returningError = app.functions.returnError(429, `Blocked ${req.ip} from accessing ${req.url} due to RATELIMIT.`, true);
		returningError["human"] = rateLimitMessages[Math.floor(Math.random() * rateLimitMessages.length)];
		returningError["message"] = "Too many requests! Please contact the maintainer if you have any questions.";
		returningError["maintainer"] = data.maintainer;
		return returningError;
	};

	router.use((req, res, next) => {
		/* CORS */
		const cors = req.hostname.includes(process.env.ALLOWORIGINHOST);
		res.set({
			"Access-Control-Allow-Origin": ((cors) ? req.headers.origin : process.env.ALLOWORIGINHOST),
			"Access-Control-Allow-Methods": "POST, GET, OPTIONS",
			"Access-Control-Allow-Headers": "Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Access-Control-Allow-Origin",
			"Access-Control-Allow-Credentials": "true"
		});
		if (req.method == "OPTIONS") {
			return res.end();
		};

		if (!req.url.includes("/data/full")) return next();
		else if (!req.headers["referer"] || !req.headers["referer"].includes(process.env.BASE_URL)) {
			const returningError = app.functions.returnError(403, `Blocked ${req.ip} from accessing ${req.url} due to RESOURCE_BLOCKED.`, true);
			returningError["message"] = "This endpoint is only available for the main site! Please contact the maintainer if you have any questions.";
			returningError["maintainer"] = data.maintainer;
			return res.status(403).json(returningError);
		};
		return next();
	});

	const apiLimiter = rateLimit({
		windowMs: (oneMinute * 10), // x minutes.
		max: 100, // Limit each IP to y requests per window.
		standardHeaders: true, // Return info to "RateLimit-*" headers.
		legacyHeaders: false, // Disable the "X-RateLimit-*" headers.
		skipFailedRequests: true, // Do not count failed requests (status >= 400)
		message: apiLimiterErr // Custom JSON error.
	});
	router.use(apiLimiter);

	/* == / == */
	router.get("/", (req, res) => {
		return res.json({
			status: "OK",
			server: app.config.server
		});
	});


	/* == /data/ == */
	router.get("/data/full", (req, res) => {
		return res.json(data);
	});
	router.get("/data/maintainer", (req, res) => {
		return res.json(data.maintainer);
	});
	router.get("/data/status", (req, res) => {
		return res.json({ ...data.status, meta: data.meta, source: data.source});
	});


	/* == /alerts/ == */
	router.get("/alerts/full", (req, res) => {
		return res.json(alerts);
	});
	router.get("/alerts/:alertID", (req, res) => {
		return res.json(alerts);
	});


	/* == /image/ == */
	const statusImgCache = {
		lastChecked: 0,
		data: null,
		error: false
	};
	const updateImg = async() => {
		const currentTime = new Date().getTime();
		const startHeight = 200;
		let DOMheight = startHeight;
		let html = `
			<body class="dark">
			<div class="main">
			<section class="status" id="status">
				<h2>Rollout Status</h2>
				<p id="header">This applies up to the dates listed:</p>`;
			if (data.status.confirmed) {
				html += `
				<p>
				<span style="font-size:60%;" class="badge confirmed">CONFIRMED</span><br>
				<b>Nitro Users</b>: ${data.status.confirmed.nitro}<br>
				<b>Non-Nitro Users</b>: ${data.status.confirmed.nonnitro}<br><br>
				</p>`;
				DOMheight += startHeight;
			};
			if (data.status.unconfirmed) {
				html += `
				<p>
				<span style="font-size:60%;" class="badge unconfirmed">UNCONFIRMED</span><br>
				<b>Nitro Users</b>: ${data.status.unconfirmed.nitro}<br>
				<b>Non-Nitro Users</b>: ${data.status.unconfirmed.nonnitro}<br><br>
				</p>`;
				DOMheight += startHeight;
			};
			if (data.status.pending) {
				html += `
				<p>
				<span style="font-size:60%;" class="badge pending">PENDING</span><br>
				<b>Nitro Users</b>: ${data.status.pending.nitro}<br>
				<b>Non-Nitro Users</b>: ${data.status.pending.nonnitro}<br><br>
				</p>`;
				DOMheight += startHeight;
			};
			html += `
			<p style="font-size:30%;margin: 0 auto;margin-top:-2.5em;width:100%;">Generated: ${currentTime} | Visit ${process.env.BASE_URL}</p>
			</section>
			</div>
			</body>
		`;

		const css = `
			html, body { background: #222 !important; width: 100% !important; }
			.main{
				margin: auto;
				padding: 20px;
				border: none;
				width: 100% !important;
				height: fit-content;
				box-shadow: none !important;
				font-size: 240% !important;
			}
		`;

		const theHTML = `
			<link rel="stylesheet" href="${process.env.BASE_URL}/cdn/RolloutTracker.css">
			<style>${css}</style>
			${html}
		`;

		statusImgCache.lastChecked = currentTime;
		try {
			const browser = await puppeteer.launch({ headless: "new" });
			const page = await browser.newPage();

			await page.setViewport({ width: 1200, height: DOMheight, deviceScaleFactor: 0 });
			await page.goto(`data:text/html,${encodeURIComponent(theHTML)}`, { waitUntil: "domcontentloaded" });

			statusImgCache.data = await page.screenshot({ type: "png" });
			statusImgCache.error = false;
			await browser.close();

		} catch (error) {
			console.error(error);
			statusImgCache.data = error;
			statusImgCache.error = true;
		};
	};

	router.get("/image/status", async(req, res) => {
		const timeChk = (new Date().getTime() - statusImgCache.lastChecked) / 1000;
		if (statusImgCache.error) {
			if (timeChk >= 60) await updateImg();
		} else {
			if (timeChk >= 300) await updateImg();
		};

		if (statusImgCache.error) {
			return res.status(500).json(app.functions.returnError(500, statusImgCache.data, true));
		};

		res.set("Content-Type", "image/png");
		res.set("Cache-Control", "max-age=60");
		res.end(statusImgCache.data);
		return;
	});

	router.all("*", (req, res, next) => res.status(404).json(app.functions.returnError(404, null, false)));

	return router;
};