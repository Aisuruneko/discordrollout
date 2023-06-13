/*
 * Discord Username Rollout Tracker
 * (c) 2023 Netro Corporation, on behalf of thecodingguy
*/

const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const fs = require("fs");
const path = require("path");

const data = require("../../../data/main.json");
const alerts = require("../../../data/alerts.json");

const oneMinute = (60 * 1000);

module.exports = (app) => {

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
		returningError["maintainer"] = { handle: process.env.MAINTAINER_HANDLE, platform: process.env.MAINTAINER_PLATFORM, url: process.env.MAINTAINER_URL };
		return returningError;
	};

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
	router.get("/", (req, res, next) => {
		return res.json({
			status: "OK",
			server: app.config.server
		});
	});



	/* == /data/ == */
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
	router.get("/data/full", (req, res, next) => {
		return res.json(data);
	});
	router.get("/data/maintainer", (req, res, next) => {
		return res.json(data.maintainer);
	});
	router.get("/data/status", (req, res, next) => {
		return res.json(data.status);
	});


	/* == /alerts/ == */
	router.get("/alerts/full", (req, res, next) => {
		return res.json(alerts);
	});
	router.get("/alerts/:alertID", (req, res, next) => {
		return res.json(alerts);
	});


	router.all("*", (req, res, next) => res.status(404).json(app.functions.returnError(404, null, false)));

	return router;
};