/**
 * @module RequestAttribute
 * @description Generate some requirements to perform an http request.
 * 
 * Available classes and namespace:
 * - {@link RequestAttribute} - Generate http header and read, write, or update token..
 * 
 * @author hashinami46
 */

import axios from "axios";
import { readFileSync, writeFileSync } from "fs";

import { MainConfig, logging, i18n } from "../MainConfig.js";
import { /*AppsLists,*/ RequestEndpoint } from "./RequestEndpoint.js";

/**
 * Class to generate request header such as token, etc.
 * @class RequestAttribute
 */
class RequestAttribute {
	/**
	 * @constructor
	 * @param {string} appname - Which appname you want to get the url and path.
   */
	constructor (appname) {
		this.appname = appname;
	};
	
	/**
	 * Read, write, update token or cookies for talk apps.
	 * 
	 * @typedef {"read"|"write"|"update"} AuthTokenMode
	 * 
	 * @typedef {Object} AccessRefreshToken
	 * @property {string} refresh_token - Token to refresh access_token.
	 * @property {string} access_token - Token to access some api.
	 * 
	 * @param {Object} params
	 * @param {AuthTokenMode} params.mode - Choose to read, write, or update the token.
	 * @param {string} params.refresh_token
	 * @param {string} params.access_token
	 * 
	 * @return {Promise<(AccessRefreshToken|void)>}
	 */
	async authToken({ mode, refresh_token, access_token }) {
	  // Check if appname registered in the credentials.json
		if (!Object.keys(JSON.parse(readFileSync(MainConfig.credentialsConfig, "utf8"))).includes(this.appname)) {
			logging.error(i18n.__("credentials.notfound", this.appname));
			console.error(i18n.__("credentials.notfound", this.appname));
	    return
		};
		// Check if the given token format match with the format.
		if ((refresh_token && this.appname.includes("talk") && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(refresh_token)) 
		  || (refresh_token && this.appname.includes("bot") && !/^[0-9]{8,10}:[a-zA-Z0-9_-]{35}$/.test(refresh_token))) {
			logging.error(i18n.__("credentials.reftokenunmatch", refresh_token, this.appname));
			console.error(i18n.__("credentials.reftokenunmatch", refresh_token, this.appname));
	    return
    };
    // Read token from credentials.json.
    if (mode === "read") {
	    let { refresh_token, access_token } = JSON.parse(readFileSync(MainConfig.credentialsConfig, "utf8"))[this.appname];
			if (process.env[`${this.appname.toUpperCase()}_REFRESH_TOKEN`]) {
				refresh_token = process.env[`${this.appname.toUpperCase()}_REFRESH_TOKEN`];
			  await this.authToken({ "refresh_token": refresh_token });
			};
			return { refresh_token, access_token };
    };
    // Write token to credentials.json.
    if (mode === "write") {
			const credentials = JSON.parse(readFileSync(MainConfig.credentialsConfig, "utf8"));
			if (refresh_token) {
				credentials[this.appname].refresh_token = refresh_token;
			};
			if (access_token) {
				credentials[this.appname].access_token = access_token;
			};
			writeFileSync(MainConfig.credentialsConfig, JSON.stringify(credentials, null, 2));
		};
		// Update token in credentials.json.
		if (mode === "update") {
			const { refresh_token, access_token } = await this.authToken({ mode: "read" });
			const { pathServer } = await new RequestEndpoint(this.appname, "update_token").pathnameServerLocal();
			try {
				const headers = await this.customHeader({ access_token: access_token });
			  const { data } = await axios.post(pathServer, { "refresh_token": refresh_token }, { headers });
				await this.authToken({ mode: "write", refresh_token: data.refresh_token, access_token: data.access_token });
				logging.info(i18n.__("credentials.acctokenupdated", this.appname));
			} catch (e) {
				logging.error(e.stack);
				logging.error(e.message);
				console.error(e.response.data.message);
				logging.error(i18n.__("credentials.reftokenundefined", this.appname));
				console.error(i18n.__("credentials.reftokenundefined", this.appname));
				process.exit(1);
			};
		};
	};
	
	/**
	 * Generate http header to perform an apo request.
	 * @param {Object} AccessToken
	 * @param {string} AccessToken.access_token
	 * @return {Promise<Object>}
	 */
	async customHeader({ access_token }) {
		const { baseServer } = await new RequestEndpoint(this.appname).basenameServerLocal();
		return {
		  "Host"                : new URL(baseServer).hostname,
      "X-Talk-App-ID"       : `jp.co.sonymusic.communication.${
				this.appname === "nogitalk" ? "nogizaka"
				: this.appname === "sakutalk" ? "sakurazaka"
				: this.appname === "hinatalk" ? "keyakizaka" 
				: this.appname === "asukatalk" ? "asukasaito" 
				// : this.appname === "mizukitalk" ? "mizukiyamashita" 
				// : this.appname === "maiyantalk" ? "maishiraishi" 
				// : this.appname === "centforce" ? "*" 
				: "yodel"} 2.4`,
      "X-Talk-App-Platform" : `android`,
      "Authorization"       : `Bearer ${access_token}`,
      "User-Agent"          : `Dart/3.4 (dart:io)`,
      "Connection"          : `Keep-Alive`,
      "Content-Type"        : `application/json`,
      "Accept-Encoding"     : `gzip`,
      "Accept-Language"     : `${new Intl.Locale(i18n.getLocale()).maximize().toString().replace(/-[A-Za-z]{4}/, "")}; q=1.0`,
	  };
	};
};

export { RequestAttribute };