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

	const apiLimiterErr = (req) => {
		const apiLimiterEx = new Error("")
		apiLimiterEx["reqURL"] = req.url;
		const error = app.functions.returnError(429, apiLimiterEx, true);
		error["message"] = "You've sent too many request. Try again later!!";
		return error;
	};

	const apiLimiter = rateLimit({
		windowMs: (oneMinute * 10), // 10 minutes.
		max: 100, // Limit each IP to 100 requests per window.
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