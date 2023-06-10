/*
 * Discord Username Rollout Tracker
 * (c) 2023 Netro Corporation, on behalf of thecodingguy
*/

const express = require("express");
const router = express.Router();

const fs = require("fs");
const path = require("path");

module.exports = (app) => {

	const logger = new app.utils.logger(app, "SYSTEM");

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