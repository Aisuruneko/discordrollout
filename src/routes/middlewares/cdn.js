/*
 * Discord Username Rollout Tracker
 * (c) 2024 Netro Corporation, on behalf of thecodingguy
*/

const express = require("express");
const router = express.Router();

const fs = require("fs");
const path = require("path");

module.exports = (app) => {
	router.use((req, res, next) => {
		if (typeof cacheConfig === 'object' && typeof cacheConfig.cache === 'object') {
			app.config.cacheConfig.cache.forEach(function (route) {
				if (req.path.match(new RegExp(route.path, 'g'))) {
					res.set('Cache-Control', 'max-age=' + route.ttl);
				};
			});
		};
		next();
	});

	router.all("*", async(req, res) => {

		const cors = req.hostname.includes(process.env.ALLOWORIGINHOST);
		res.set({
			"Access-Control-Allow-Origin": ((cors) ? req.headers.origin : process.env.ALLOWORIGINHOST),
			"Access-Control-Allow-Methods": "POST, GET, OPTIONS",
			"Access-Control-Allow-Headers": "Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Access-Control-Allow-Origin",
			"Access-Control-Allow-Credentials": "true",
			"Content-Length": 0
		});
		if (req.method == "OPTIONS") {
			return res.end();
		} else if (req.method == "GET") {

			const fileName = req.url.split("?")[0];

			const sendData = (buffer, format) => {
				res.set("Content-Type", (app.utils.mime[format && format.startsWith(".") ? `${format || ".txt"}` : `.${format || "txt"}`]));
				res.send(buffer);
			};

			const fileExt = path.extname(fileName).substring(1);


			const trueName = fileName.replace(`.${fileExt}`, "");
			const isImg = (app.utils.mime[`.${fileExt}`] ? app.utils.mime[`.${fileExt}`].includes("image") : (`.${fileExt}` == ".webp")) || false;

			fs.readFile(path.join(__dirname, "../", "public", fileName), (err, data) => {
				if (err) return res.status(404).json(app.functions.returnError(404, null, false));
				else {
					return sendData(data, fileExt);
				};
			});
		} else return res.status(405).json(app.functions.returnError(405, null, false));
	});

	return router;
};