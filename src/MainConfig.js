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

// メインコンフィグ
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
	
	// Function to create box in cli
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
	
	// Function to create file record. Useful if you don't wanna duplicate files to download.
	assetsRecord: {
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
		read: (options) => {
		  try {
		    const stringlist = readFileSync(options.logpath, "utf8").split("\n").filter(stringlists => stringlists !== "");
		    return stringlist.includes(options.logstring);
		  } catch (err) {
			  return false;
		  };
		}
	},
	
	// Function to generate human readable timestamp.
	nowTimestamp: () => {
	  const now = new Date();
		return (
		  now.getFullYear().toString() + "-" +
		  now.getMonth().toString().padStart(2, "0")   + "-" +
		  now.getDate().toString().padStart(2, "0")    + " " +
		  now.getHours().toString().padStart(2, "0")   + ":" +
			now.getMinutes().toString().padStart(2, "0") + ":" +
			now.getSeconds().toString().padStart(2, "0") + " " +
			now.toLocaleDateString(undefined, { day:"2-digit", timeZoneName: "long" }).substring(4).match(/\b(\w)/g).join("")
	  );
  },
};

// Setup language
i18n.configure({
  locales: ["en", "id", "ja"],
  directory: MainConfig.langDir,
  defaultLocale: ["en", "id", "ja"].includes(process.env.HASHINAMI_LANG) ? process.env.HASHINAMI_LANG : "en",
  objectNotation: true
});

// ロッグメーカー
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