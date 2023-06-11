/*
 * Discord Username Rollout Tracker
 * (c) 2023 Netro Corporation, on behalf of thecodingguy
*/

const express = require("express");
const router = express.Router();

const fs = require("fs");
const path = require("path");

const blocked = require("../../data/blocked.json");

module.exports = (app) => {

	const logger = new app.utils.logger(app, "SYSTEM");

	app.use((req, res, next) => {
		if (blocked[req.ip]) { // IP Blocked
			const theBlocked = blocked[req.ip];
			if (((typeof theBlocked.blocked === "object") ? req.url.includes(theBlocked.blocked) : theBlocked.blocked === "all")) {
				const returningError = app.functions.returnError(403, `Blocked ${req.ip} from accessing ${req.url} due to ${theBlocked.reason}`, true);
				returningError["message"] = theBlocked.blockMessage;
				returningError["maintainer"] = theBlocked.containMaintainer ? { handle: process.env.MAINTAINER_HANDLE, platform: process.env.MAINTAINER_PLATFORM, url: process.env.MAINTAINER_URL } : null;
				return res.status(returningError.code).json(returningError);
			};
		};
		return next();
	});

	fs.readdirSync(path.join(__dirname, "/middlewares/")).filter(file => path.extname(file) === ".js").forEach(file => {
		const router = require(path.join(__dirname, "/middlewares/", file));
		const routeName = file.replace(path.extname(file), "");
		const route = (routeName === "index" ? "/" : ("/" + routeName + "/"));
		app.use(`${route}`, router(app));
		logger.info(`Subroute ${route} registered!`);
	});

	/* == / == */
	router.get("/", async(req, res) => {
		return res.render(`pages/index`, {
			app
		});
	});

	router.get("/favicon.ico", async(req, res) => {
		return res.sendFile(`${process.cwd()}/src/favicon.ico`);
	});

	router.all("*", (req, res, next) => app.functions.errorHandler({ error: new Error("Route Not Found"), statusCode: 404 }, req, res, next));

	return router;
};