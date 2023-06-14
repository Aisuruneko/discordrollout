/*
 * Discord Username Rollout Tracker
 * (c) 2023 Netro Corporation, on behalf of thecodingguy
*/

(async() => {
require("dotenv").config();
const os = require("os");
const fs = require("fs");
const path = require("path");

const express = require("express");
const app = express();
app.set("trust proxy", true);

const userAgent = require("express-useragent");

let logger = null;

app.uptimeTimestamp = new Date().getTime();
app.utils = {};
const initLogger = () => {
	let options = "BOOTSTRAP";
	const fileName = "logger";

	const theUtil = require(path.join(__dirname, "/utils/", fileName + ".js"))(app, options);

	logger = new theUtil.execute(app, options);

	const meta = theUtil.meta();

	logger.info(`Bootstrapper ${meta.name} initialized!`);
};
await initLogger();

fs.readdirSync(path.join(__dirname, "/utils/")).filter(file => path.extname(file) === ".js").forEach(file => {
	let options = {};
	const fileName = file.replace(path.extname(file), "");

	const theUtil = require(path.join(__dirname, "/utils/", file))(app, options);

	app.utils[fileName] = theUtil.execute;

	const meta = theUtil.meta();

	logger.info(`${meta.name} initialized!`);
});

let cacheConfig = null;
try { cacheConfig = require(path.join(__dirname, "cdn-cache.json")); } catch {};

app.config = {
	port: process.env.PORT || 16697,
	server: {
		location: process.env.SERVER_LOCATION || "Unknown",
		name: process.env.SERVER_NAME || os.hostname()
	}
};

app.functions = new app.utils.functions(app);

logger.info(`Config initialized!`);

// app.use((req, res, next) => { app.utils.ReqLogger(app, req, res, next); });


app.use(express.json({ limit: '16mb' }));
app.use(express.urlencoded({ extended: true, limit: '16mb' }));
app.use(userAgent.express());

app.set("views", path.join(__dirname, "/views"));
app.set("view engine", 'ejs');

fs.readdirSync(path.join(__dirname, "/routes/")).filter(file => path.extname(file) === ".js").forEach(file => {
	const router = require(path.join(__dirname, "/routes/", file));
	const routeName = file.replace(path.extname(file), "");
	const route = (routeName === "index" ? "/" : ("/" + routeName + "/"));
	app.use(`${route}`, router(app));
	logger.info(`Route ${route} registered!`);
});


// This is the cache reset thing.
// Don't ask me how it works, but it just works(TM).
app.cacheReset = {
	currentTimestamp: 0,
	timer: null
};
app.cacheReset.timer = setInterval(() => { app.cacheReset.currentTimestamp = new Date().getTime(); });
app.cacheReset.currentTimestamp = new Date().getTime();

app.listen(app.config.port, () => {
	logger.info(`Listening on port ${app.config.port}!`);
});

})();