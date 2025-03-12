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

import path from "path";
import boxen from "boxen";
import axios from "axios";
import crypto from "crypto";
import { homedir } from "os";
import i18next from "i18next";
import Table from "cli-table3";
import { Buffer } from "buffer";
import { fileURLToPath } from "url";
import decompress from "decompress";
import { spawn } from "child_process";
import stringWidth from "string-width";
import Backend from "i18next-fs-backend";
import DailyRotateFile from "winston-daily-rotate-file";
import { createLogger, format, /* transports */ } from "winston";
import { access, writeFile, readFile, mkdir, rm, readdir } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { combine, timestamp, printf } = format;
const packageJson = path.join(__dirname, "../package.json");
const { name, version, author, organization, repository } = JSON.parse(await readFile(packageJson, "utf8"));

import { AppsLists } from "./RequestHandler/RequestEndpoint.js";
import { RequestAttribute } from "./RequestHandler/RequestAttribute.js";

/**
 * Object that contains basic informations and functions.
 * @namespace MainConfig 
 * @property {string} appName - App name.
 * @property {string} appVersion - App version.
 * @property {string} appAuthor - The author of the app.
 * @property {string} appOrganization - App organization.
 * @property {string} appRepository - App repository.
 * @property {string} memberDataConfig - Member data location.
 * @property {string} credentialsConfig - Credentials location.
 * @property {string} langDir - Language asset directory.
 * @property {string} tempDir - Temporary asset directory.
 * @property {string} logsDir - Logs directory.
 * @property {string} rcdsDir - Asset record directory.
 * @property {string} ctlgDir - Catalog asset directory.
 * @property {string} saveDir - Asset download directory.
 * @property {string} backDir - Config backup directory.
 * @property {Function} createBox - Function to generate cli-box.
 * @property {Object} assetsRecord - Function to record downloaded assets.
 * @property {Function} nowTimestamp - Function to generate current timestamp in yyyy-mm-dd hh:MM:ss TZ format.
 * @property {Function} cheatSheet - Function to generate memberid.
 */
const MainConfig = {
	
	// About
	appName: name,
	appVersion: version,
	appAuthor: author,
	appOrganization: organization,
	appRepository: repository.url.replace("git+", ""),
	
	// Some important paths
	memberDataConfig: path.join(__dirname, "../.config/member.data.json"),
	credentialsConfig: path.join(__dirname, `../.config/secrets.credentials${process.env.HASHINAMI_APP_MODE === "dev" ? ".dev" : ""}.json`), 
  langDir: path.join(__dirname, "../.config/locales"),
	tempDir: path.join(__dirname, "../.cache/temp"),
	//tempDir: path.join(process.env.HASHINAMI_LOCAL_DIR || (homedir() + "/HASHINAMI"), ".cache/temp"),
	logsDir: path.join(process.env.HASHINAMI_LOCAL_DIR || (homedir() + "/HASHINAMI"), ".cache/logs"),
	rcdsDir: path.join(process.env.HASHINAMI_LOCAL_DIR || (homedir() + "/HASHINAMI"), ".cache/records"),
	ctlgDir: path.join(process.env.HASHINAMI_LOCAL_DIR || (homedir() + "/HASHINAMI"), ".catalogs"),
	saveDir: path.join(process.env.HASHINAMI_LOCAL_DIR || (homedir() + "/HASHINAMI")),
	backDir: path.join(process.env.HASHINAMI_LOCAL_DIR || (homedir() + "/HASHINAMI"), ".backups"),
	python_modules: path.join(__dirname, "../python_modules"),
	
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
	   * @return {Promise<void>} - This function doesn't return anything.
	   * @memberOf MainConfig.assetsRecord
		 */
		write: async (options) => {
		  await mkdir(path.dirname(options.logpath), { recursive: true });
			if (await access(options.logpath).then(() => false).catch(() => true)) {
			  await writeFile(options.logpath, "", "utf8");
		  };
		  const stringlist = (await readFile(options.logpath, "utf8")).split("\n").filter(stringlists => stringlists !== "");
		  stringlist.push(options.logstring);
			await writeFile(
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
	   * @return {Promise<boolean>} - This function return true or false.
	   * @memberOf MainConfig.assetsRecord
		 */
		read: async (options) => {
		  try {
		    const stringlist = (await readFile(options.logpath, "utf8")).split("\n").filter(stringlists => stringlists !== "");
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

i18next
  .use(Backend)
  .init({
	  lng: ["en", "id", "ja"].includes(process.env.HASHINAMI_LANG) ? process.env.HASHINAMI_LANG : "en",
	  fallbackLng: "en",
	  preload: ["en", "id", "ja"],
	  backend: {
		  loadPath: path.join(MainConfig.langDir, "{{lng}}.json")
	  },
	  initImmediate: false 
  });

/**
 * Configure logging function.
 */
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

/**
 * Function to create box in cli.
 * @param {Object} options - {logstring, logpath}.
 * @return {string} Generate box string.
 * @memberOf MainConfig
 */	
MainConfig.createBox = (options) => {
	try {
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
	  logging.info(i18next.t("general.clibox.success"));
    console.info(boxen(text, { padding: 1, borderStyle: "round" }));
	} catch (err) {
	  logging.error(err.name);
	  logging.error(i18next.t("general.clibox.failed"));
	};
};

/**
 * Function to encrypt or decrypt data.
 * @namespace security
 * @memberOf MainConfig
 */
MainConfig.security = {
	key: crypto.createHash("sha512").update(process.env.HASHINAMI_KEY || "HASHINAMI").digest("hex").substring(0, 32),
	iv: crypto.createHash("sha512").update("b70673ab3cbf690159a1367ab11c20ec").digest("hex").substring(0, 16),
	encrypt: (data) => {
		try {
		  const cipher = crypto.createCipheriv(
			  "aes-256-cbc", 
			  MainConfig.security.key, 
			  MainConfig.security.iv
		  );
		  logging.info(i18next.t("general.encrypt.success"));
		  return Buffer.from(
        cipher.update(data, "utf8", "hex") + 
        cipher.final("hex")
      ).toString("base64");
		} catch (err) {
			logging.error(err.stack);
		  logging.error(i18next.t("general.encrypt.failed"));
		  console.error(i18next.t("general.encrypt.failed"));
		};
	},
	decrypt: (data) => {
		try {
		  const decipher = crypto.createDecipheriv(
		    "aes-256-cbc", 
			  MainConfig.security.key, 
			  MainConfig.security.iv
		  );
      logging.info(i18next.t("general.decrypt.success"));
		  return (
        decipher.update(Buffer.from(data, "base64").toString("utf8"), "hex", "utf8") +
        decipher.final("utf8")
      );
		} catch (err) {
			logging.error(err.stack);
			logging.error(i18next.t("general.decrypt.success"));
			console.error(i18next.t("general.decrypt.success"));
		};
	}
};

/**
 * Function to asynchronously run spawn.
 * @namespace run
 * @memberOf MainConfig
 * @return {Promise<>}
 */
MainConfig.run = async (command, args) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { stdio: "ignore" });
    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
	      logging.error(i18next.t("general.spawn.error", { command: command }));
        reject(i18next.t("general.spawn.error", { command: command }));
      };
    });
  });
};

/**
 * Function to generate available asset table. 
 * @function cheatSheet
 * @return {Promise<void>}
 * @memberOf MainConfig
 */
MainConfig.cheatSheet = async ({ appname }) => {

	const memberdata = JSON.parse(await readFile(MainConfig.memberDataConfig, "utf8"));
	const membersdata = appname.includes("nogi")
	  ? memberdata.nogizaka46
	  : appname.includes("saku")
	  ? memberdata.sakurazaka46
	  : appname.includes("hina")
	  ? memberdata.hinatazaka46
	  : appname === "unison"
	  ? [...memberdata.sakurazaka46, ...memberdata.hinatazaka46]
	  : appname === "asukatalk"
	  ? memberdata.saitoasuka
	  : appname === "maiyantalk"
	  ? memberdata.shiraishimai
	  : appname === "mizukitalk"
	  ? memberdata.yamashitamizuki
	  : appname === "centforcetalk"
	  ? memberdata.centforce
	  : memberdata.yodel
	const cheatsheet = new Table({
		chars: { "top": "" , "top-mid": "" , "top-left": "" , "top-right": ""
         , "bottom": "" , "bottom-mid": "" , "bottom-left": "" , "bottom-right": ""
         , "left": "" , "left-mid": "" , "mid": "" , "mid-mid": ""
         , "right": "" , "right-mid": "" , "middle": "|" },
		head: appname.includes("talk") && Object.keys(membersdata[0]).includes(appname.replace("talk", "blog"))
		  ? ["talk", "blog", "漢字"]
		  : appname.includes("talk")
		  ? ["talk", "漢字"]
		  : [appname, "漢字"],
		colAligns: appname.includes("talk") && Object.keys(membersdata[0]).includes(appname.replace("talk", "blog"))
		  ? ["right", "right"]
		  : ["right", "left"]
	});
	
	membersdata.forEach((item, index) => {
		const apptype = appname.includes("talk")
		  ? item[appname.replace("talk", "msg")]
		  : item[appname]
		const appblog = appname.includes("talk") &&  item[appname.replace("talk", "blog")]
		  ? item[appname.replace("talk", "blog")]
		  : undefined
		const checkblog = appname.includes("talk") && Object.keys(membersdata[index]).includes(appname.replace("talk", "blog"));
	  if (checkblog && apptype && appblog) {
			cheatsheet.push([apptype, appblog, item.name])
		  return 
	  };
	  if (checkblog && apptype && !appblog) {
			cheatsheet.push([apptype, "", item.name])
		  return 
	  };
	  if (!checkblog && apptype) {
	    cheatsheet.push([apptype, item.name])
		  return
	  };
	});
	const appMemberId = `${i18next.t("parameters.info.title_memberid")}\n${cheatsheet.toString()}\n`;
	const appTitle = AppsLists.messagesList.filter(app => ["nogitalk", "sakutalk", "hinatalk"].includes(app)).includes(appname)
	  ? `${i18next.t("parameters.info.title_apptitle")}\n  ${i18next.t("parameters.appname.mobameblog.title")}\n`
	  : AppsLists.messagesList.filter(app => !["nogitalk", "sakutalk", "hinatalk"].includes(app)).includes(appname)
	  ? `${i18next.t("parameters.info.title_apptitle")}\n  ${i18next.t("parameters.appname.mobame.title")}\n`
	  : `${i18next.t("parameters.info.title_apptitle")}\n  ${i18next.t(`parameters.appname.${appname}.title`)}\n`
	const appName = `${i18next.t("parameters.info.title_appname")}\n  ${appname}\n`
	const commonAssetList = ["Image", "Video", "Unity", "Usm", "Cpk", "Config", "Catalog"]
	  .flatMap(asset => AppsLists[`common${asset}List`] )
	  .filter(asset => asset.includes(appname))
	  .map(asset => asset.replace(`${appname}_`, "  - "));
	const appAsset = AppsLists.messagesList.filter(app => ["nogitalk", "sakutalk", "hinatalk"].includes(app)).includes(appname)
	  ? `${i18next.t("parameters.info.title_availableasset")}\n  - timeline\n  - past_messages\n  - blogs\n`
	  : AppsLists.messagesList.filter(app => !["nogitalk", "sakutalk", "hinatalk"].includes(app)).includes(appname)
	  ? `${i18next.t("parameters.info.title_availableasset")}\n  - timeline\n  - past_messages\n`
	  : `${i18next.t("parameters.info.title_availableasset")}\n${commonAssetList.join("\n")}\n`
	const sampleMember = appname === "nogitalk" 
	  ? "柴田柚菜"
	  : appname === "sakutalk"
	  ? "小島凪紗"
	  : appname === "hinatalk"
	  ? "小西夏菜実"
	  : appname === "yodeltalk"
	  ? "樋口日奈"
	  : appname === "centforcetalk" 
	  ? "新内眞衣"
	  : appname === "sakukoi" 
	  ? "中嶋優月"
	  : appname === "hinakoi" 
	  ? "森本茉莉"
	  : appname === "unison" 
	  ? "中嶋優月"
	  : undefined
	const sampleUsageList = ["nogitalk", "sakutalk", "hinatalk"].includes(appname)
	  ? [
		    `  hashinami-cli -A ${appname} -T timeline --parallel`,
		    `  hashinami-cli -A ${appname} -T timeline -f 2025-03-01 -t 2025-04-01 -M ${sampleMember} --parallel`,
		    `  hashinami-cli -A ${appname} -T past_messages -M ${sampleMember} --parallel`,
		    `  hashinami-cli -A ${appname} -T blogs --parallel`
		  ]
	  : ["yodeltalk", "centforcetalk"].includes(appname)
	  ? [
		    `  hashinami-cli -A ${appname} -T timeline --parallel`,
		    `  hashinami-cli -A ${appname} -T timeline -f 2025-03-01 -t 2025-04-01 -M ${sampleMember} --parallel`,
		    `  hashinami-cli -A ${appname} -T past_messages -M ${sampleMember} --parallel`,
		  ]
	  : ["asukatalk", "maiyantalk", "mizukitalk"].includes(appname)
	  ? [
		    `  hashinami-cli -A ${appname} -T timeline --parallel`,
		    `  hashinami-cli -A ${appname} -T timeline -f 2025-03-01 -t 2025-04-01 --parallel`,
		    `  hashinami-cli -A ${appname} -T past_messages --parallel`,
		  ]
		: appname === "nogikoi"
		? [
			  `  hashinami-cli -A ${appname} -T card_png -st 8 -c pink -f 12000 -t 12100 --parallel`,
			  `  hashinami-cli -A ${appname} -T sprites -M 柴田柚菜 -sr 4 -c -f 120 -t 130 --parallel`
		  ]
		: appname === "nogifes"
		? [
		    `  hashinami-cli -A ${appname} -T photo_common -f 12812 -t 12850 --parallel`,
		    `  hashinami-cli -A ${appname} -T movie_card -f 700 -t 720 --parallel`,
		    `  hashinami-cli -A ${appname} -T reward_movie -f 2890 -t 2900 --parallel`,
		  ]
		: ["sakukoi", "hinakoi"].includes(appname)
		? [
		    `  hashinami-cli -A ${appname} -T movie -f 3000 -t 3299 --disablefilter --parallel`,
		    `  hashinami-cli -A ${appname} -T card -f 4000 -t 4299 --parallel`,
		    `  hashinami-cli -A ${appname} -T card -M ${sampleMember} -f 4000 -t 4299 --parallel`,
		  ]
		: appname === "unison"
		? [
		    `  hashinami-cli -A ${appname} -T chara_movie -f 1 -t 200 --parallel`,
		    `  hashinami-cli -A ${appname} -T card_movie -M ${sampleMember} -f 1 -t 200 --parallel`,
		  ]
		: []
	const appSampleUsage = `${i18next.t("parameters.info.title_sampleusage")}\n${sampleUsageList.map((item, index) => index === sampleUsageList.length - 1 ? item : item + "\n" ).join("")}`
	const catalogId = appname === "unison" ? "20250228120634" : "225022801"
	const appAdvancedUsage = AppsLists.messagesList.includes(appname)
	  ? `\n${i18next.t("parameters.info.title_advancedusage")}\n  hashinami-cli -A ${appname} --refresh-token <your-refresh-token>`
	  : ["unison", "sakukoi", "hinakoi"].includes(appname)
	  ? `\n${i18next.t("parameters.info.title_advancedusage")}\n  hashinami-cli -A ${appname} -T catalog -C ${catalogId}`
	  : ""
	let refreshToken = "";
	if (appname.includes("talk")) {
	  const { refresh_token } = await new RequestAttribute(appname).authToken({ mode: "read" });
	  if (refresh_token) {
	    refreshToken = `\n${i18next.t("parameters.info.title_refreshtoken")}\n  ${refresh_token.replace(/-(?!.*-).*/, (match) => match[0] + "*".repeat(match.length - 1))}`
	  };
	};
  console.log([appTitle, appName, appAsset, appMemberId, appSampleUsage, appAdvancedUsage, refreshToken].join(""));
};

/**
 * Function to generate available asset table. 
 * @function listFileRecursive
 * @return {Promise<void>}
 * @memberOf MainConfig
 */
MainConfig.listFileRecursive = async (dirpath) => {
	let listFile = [];
	const entries = await readdir(dirpath, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = path.join(dirpath, entry.name);
		if (entry.isDirectory()) {
			const nestedFiles = await MainConfig.listFileRecursive(fullPath);
      listFile = listFile.concat(nestedFiles);
		} else if (entry.isFile()) {
			listFile.push(fullPath);
		};
	};
	return listFile
};

export { MainConfig, logging, i18next };