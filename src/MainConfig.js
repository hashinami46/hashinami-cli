/**
 * @module MainConfig
 * @description Stores all basic configurations for the application.
 * 
 * Available functions and objects:
 * - {@link MainConfig} - Stores general configuration values.
 * - {@link logging} - Manages application logging.
 * 
 * @author hashinami46
 */

import i18n from "i18n";
import path from "path";
import boxen from "boxen";
import { homedir } from "os";
import stringWidth from "string-width";
import DailyRotateFile from "winston-daily-rotate-file";
import { createLogger, format, /* transports */ } from "winston";
import { existsSync, writeFileSync, readFileSync, mkdirSync, /* readdirSync , unlinkSync */ } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { combine, timestamp, printf } = format;
const packageJson = path.join(__dirname, "../package.json");
const { name, version, author, organization, repository } = JSON.parse(readFileSync(packageJson, "utf8"));

/**
 * Object that contains basic informations and functions.
 * @namespace MainConfig 
 * @property {string} appName - App name.
 * @property {string} appVersion - App version.
 * @property {string} appAuthor - The author of the app.
 * @property {string} appOrganization - App organization.
 * @property {string} appRepository - App repository.
 * @property {string} memberDataConfig - App repository.
 * @property {string} credentialsConfig - App repository.
 * @property {string} langDir - Language asset directory.
 * @property {string} tempDir - Temporary asset directory.
 * @property {string} logsDir - Logs directory.
 * @property {string} rcdsDir - Asset record directory.
 * @property {string} ctlgDir - Catalog asset directory.
 * @property {string} saveDir - Asset download directory.
 * @property {Function} createBox - Function to generate cli-box.
 * @property {Object} assetsRecord - Function to record downloaded assets.
 * @property {Function} nowTimestamp - Function to generate current timestamp in yyyy-mm-dd hh:MM:ss TZ format.
 */
const MainConfig = {
	
	// About
	appName: name,
	appVersion: version,
	appAuthor: author,
	appOrganization: organization,
	appRepository: repository.url,
	
	// Some important paths
	memberDataConfig: path.join(__dirname, "../.config/member.data.json"),
	credentialsConfig: path.join(__dirname, `../.config/secrets.credentials${process.env.HASHINAMI_APP_MODE === "dev" ? ".dev" : ""}.json`),
	langDir: path.join(__dirname, "../.config/locales"),
	tempDir: path.join(process.env.HASHINAMI_LOCAL_DIR || (homedir() + "/HASHINAMI"), ".cache/temp"),
	logsDir: path.join(process.env.HASHINAMI_LOCAL_DIR || (homedir() + "/HASHINAMI"), ".cache/logs"),
	rcdsDir: path.join(process.env.HASHINAMI_LOCAL_DIR || (homedir() + "/HASHINAMI"), ".cache/records"),
	ctlgDir: path.join(process.env.HASHINAMI_LOCAL_DIR || (homedir() + "/HASHINAMI"), ".catalogs"),
	saveDir: path.join(process.env.HASHINAMI_LOCAL_DIR || (homedir() + "/HASHINAMI")),
	
	/**
	 * Function to create box in cli.
	 * @param {Object} options - {logstring, logpath}.
	 * @return {string} Generate box string.
	 * @memberOf MainConfig
	 */
	createBox: (options) => {
	  let text = "";
    const [max_key, max_val] = Object.entries(options)
      .reduce(([maxKey, maxVal], [key, val]) => {
        return [
	        Math.max(maxKey, stringWidth(key)), 
	        Math.max(maxVal, stringWidth(val))
	      ];
      }, [0, 0]);
    for (const [index, [key, value]] of Object.entries(options).entries()) {
	    if (index === Object.entries(options).length - 1) {
        text += `${key.padEnd(max_key + 1 - stringWidth(key) + key.length)} : ${value.padEnd(max_val + 1 - stringWidth(value) + value.length)}`;
      } else {
        text += `${key.padEnd(max_key + 1 - stringWidth(key) + key.length)} : ${value.padEnd(max_val + 1 - stringWidth(value) + value.length)}\n`;
	    };
    };
    return boxen(text, { padding: 1, borderStyle: "round" });
	},
	
	/**
	 * Function to create and read file record. Useful if you don't wanna duplicate files to download. 
	 * @namespace assetsRecord
   * @memberOf MainConfig
	 */
	assetsRecord: {
		/**
		 * Writes text record to the specified path.
		 * @function write
		 * @param {Object} options
	   * @param {string} options.logpath - File records path.
	   * @param {string} options.logstring - What string to record.
	   * @return {void} - This function doesn't return anything.
	   * @memberOf MainConfig.assetsRecord
		 */
		write: (options) => {
			if (!existsSync(path.dirname(options.logpath))) {
				mkdirSync(path.dirname(options.logpath), { recursive: true });
			};
			if (!existsSync(options.logpath)) {
			  writeFileSync(options.logpath, "", "utf8");
		  };
		  const stringlist = readFileSync(options.logpath, "utf8").split("\n").filter(stringlists => stringlists !== "");
		  stringlist.push(options.logstring);
			writeFileSync(
				options.logpath,
				stringlist.join("\n"),
				"utf8"
		  );
		},
		
		/**
		 * Reads text record to the specified path.
		 * @function read
		 * @param {Object} options
	   * @param {string} options.logpath - File records path.
	   * @param {string} options.logstring - What string to record.
	   * @return {boolean} - This function return true or false.
	   * @memberOf MainConfig.assetsRecord
		 */
		read: (options) => {
		  try {
		    const stringlist = readFileSync(options.logpath, "utf8").split("\n").filter(stringlists => stringlists !== "");
		    return stringlist.includes(options.logstring);
		  } catch (err) {
			  return false;
		  };
		}
	},
	
	/**
	 * Function to generate human readable timestamp.
	 * @function nowTimestamp
	 * @return {string} - Return current timestamp in yyyy-mm-dd hh:MM:ss TZ format.
	 * @memberOf MainConfig
	 */
	nowTimestamp: () => {
	  const now = new Date();
		const datePart = now.toISOString().split("T")[0];
		const timePart = now.toISOString().split("T")[1].split(".")[0];
		const timeZone = now.toLocaleDateString(undefined, { day:"2-digit", timeZoneName: "long" }).substring(4).match(/\b(\w)/g).join("");
		return `${datePart} ${timePart} ${timeZone}`;
  },
};

/**
 * Configures the application language settings using `i18n`.
 *
 * - Supports English (`en`), Indonesian (`id`), and Japanese (`ja`).
 * - Language files are stored in the directory specified by `MainConfig.langDir`.
 * - The default locale is determined by the `HASHINAMI_LANG` environment variable.
 *   If the value is not in the supported locales, it defaults to English (`en`).
 * - Enables object notation for nested translations.
 * 
 */
i18n.configure({
  locales: ["en", "id", "ja"],
  directory: MainConfig.langDir,
  defaultLocale: ["en", "id", "ja"].includes(process.env.HASHINAMI_LANG) ? process.env.HASHINAMI_LANG : "en",
  objectNotation: true
});

const logging = createLogger({
	format: combine(
		timestamp(),
		printf(({ level, message, timestamp }) => {
      return `${timestamp} - ${MainConfig.appName} - ${level.toUpperCase()} - ${message}`;
    })
	),
	transports: [
	  new DailyRotateFile({
		  filename: path.join(MainConfig.logsDir, "logging-%DATE%.log"),
		  datePattern: "YYYY-MM-DD", 
		  maxSize : "15m", 
		  maxFiles: "10d"
	  })
	]
});

export { MainConfig, logging, i18n };