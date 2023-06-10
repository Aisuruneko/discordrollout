/*
 * Discord Username Rollout Tracker
 * (c) 2023 Netro Corporation, on behalf of thecodingguy
*/

const meta = () => {
	return {
		name: "Functions",
		description: "Common functions helper.",
		author: "TheCodingGuy"
	};
};

class Functions {

    constructor (app) {
		this.app = app;
    };

	checkIfEmpty = (str) => { return (!str || str.length === 0 || /^\s*$/.test(str)) };

	errorHandler = (err, req, res, next) => {
		if (!req.get("Accept")) { return res.send("I have no idea what you want, or how you want it.").end(); };
		if (!req.get("Accept").includes("text/html")) return (next) ? next() : false;

		const statusCode = err.statusCode || 500;
		const theError = err.error || err;

		const errData = this.app.functions.returnError(statusCode, theError);
		if (this.app.config.environment !== "prod") errData.fullError = err;

		// Render error page.
		return res.status(statusCode).render("pages/error", {
			session: req.session,
			app: this.app,
			errData
		});
	};

	returnError = (code, reason, genRefID = true) => {
		let data = this.app.utils.codes.HTTP[code];
		if (!data) return { error: "Could not find a valid code to throw back!!!" };
		data["refID"] = (genRefID) ? new this.app.utils.error(this.app).log(new Error(reason)) : undefined;
		return {
			status: data.geeky,
			code,
			message: genRefID ? data.friendly : undefined,
			refID: data.refID
		};
	};
};

module.exports = (app) => {
	return {
		meta,
		execute: Functions
	}
};