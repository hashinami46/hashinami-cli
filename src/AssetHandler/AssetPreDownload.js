import path from "path";
import axios from "axios";
// import * as cheerio from "cheerio";
import { readFileSync, /* readdirSync, writeFileSync, statSync, existsSync */ } from "fs";

import { MainConfig, logging, i18n } from "../MainConfig.js";
import { RequestEndpoint, AppsLists } from "../RequestHandler/RequestEndpoint.js";
import { RequestAttribute } from "../RequestHandler/RequestAttribute.js";

// Class to preparing download materials.
class AssetPreDownload {
	constructor (appname) {
		this.appname = appname;
	};
	
	// Get mobame data such as /blogs, /announcements, /members, and /groups.
	async mobameData({ assetname }) {
		
		// Verify assetname.
		if (!AppsLists.commonConfigList.includes(`${this.appname}_${assetname}`)) {
			logging.error(i18n.__("asset.notkindof", `${this.appname}_${assetname}`));
			console.error(i18n.__("asset.notkindof", `${this.appname}_${assetname}`));
		  return
    };
    const { pathServer } = await new RequestEndpoint(this.appname, assetname).pathnameServerLocal();
		let { access_token } = await new RequestAttribute(this.appname).authToken({ mode: "read" });
	  let headers = await new RequestAttribute(this.appname).customHeader({ access_token: access_token });
	  
	  // Try to get data using current token.
	  // If failed, perform an update token and retry the function.
	  try {
			const { data } = await axios.get(pathServer, { headers });
			logging.info(i18n.__("asset.datagetsuccess", `${this.appname}_${assetname}`));
			return data;
		} catch (e) {
			logging.error(i18n.__("asset.datagetfailed", `${this.appname}_${assetname}`));
			logging.error(e.response.data)
			if (e.response.status === 401) {
				await new RequestAttribute(this.appname).authToken({ mode: "update" });
				return await this.mobameData({ assetname });
			} else {
				process.exit(1);
			};
		};
	};
	
	// Get mobame messages data.
	async mobameMessages({ mode, member, fromdate, todate, parallel }) {
		
		// Verify assetname.
		if (!AppsLists.messagesList.includes(this.appname)) {
			logging.error(i18n.__("asset.notkindof", this.appname, i18n.__("app.name.mobame")));
			console.error(i18n.__("asset.notkindof", this.appname, i18n.__("app.name.mobame")));
			return
		};
		
		// Verify mode.
		if (!["timeline", "past_messages"].includes(mode)) {
			logging.error(i18n.__("asset.wrongapptype", i18n.__("app.name.mobame"), i18n.__("asset.type.timelineorpast"), mode))
			console.error(i18n.__("asset.wrongapptype", i18n.__("app.name.mobame"), i18n.__("asset.type.timelineorpast"), mode))
			return
		};
		
		// Verify member data type.
		if (!Array.isArray(member)) {
			logging.error(i18n.__("asset.wrongmembertype"));
			console.error(i18n.__("asset.wrongmembertype"));
      return
		};
		
		let { pathServer } = await new RequestEndpoint(this.appname, "groups").pathnameServerLocal();
		
		// Function to generate single page message from mobame app.
		const getMessage = async ({ url }) => {
			try {
				let { access_token } = await new RequestAttribute(this.appname).authToken({ mode: "read" });
				let headers = await new RequestAttribute(this.appname).customHeader({ access_token: access_token });
				const { data } = await axios.get(url, { headers });
		    return data.messages;
			} catch (e) {
				logging.error(e.stack);
				logging.error(e.response.data);
				logging.error(i18n.__("asset.datagetfailed", `${this.appname} messages`));
				if (e.response.status === 401) {
				  await new RequestAttribute(this.appname).authToken({ mode: "update" });
				  return await getMessage({ url: url });
			  } else {
				  process.exit(1);
			  };
			};
		};
		
		// Parsing given member name to get it's id.
		// After that, gather it's id as a list.
		const memberdata = JSON.parse(readFileSync(MainConfig.memberDataConfig, "utf8"))[
			this.appname === "nogitalk" ? "nogizaka46" 
			: this.appname === "sakutalk" ? "sakurazaka46" 
			: this.appname === "hinatalk" ? "hinatazaka46" 
			: this.appname === "asukatalk" ? "saitoasuka" 
			// : this.appname === "mizukitalk" ? "yamashitamizuki" 
			// : this.appname === "maiyantalk" ? "shiraishimai" 
			// : this.appname === "centforcetalk" ? "centforce" 
		  : "yodel"
		];
	  // Get memberlist data and return if doesn't found.
	  const memberlist = [...new Set(member
	    .map(data => {
		    return typeof data === "string" && memberdata.find(r => r.name === data)
		    ? memberdata.find(r => r.name === data)[this.appname.replace("talk", "msg")]
		    : typeof data === "number" && memberdata.find(r => r[this.appname.replace("talk", "msg")] === data.toString())
		    ? memberdata.find(r => r[this.appname.replace("talk", "msg")] === data.toString())[this.appname.replace("talk", "msg")] 
		    : undefined;
	    })
	    .filter(Boolean)
	  )];
	  if (!memberlist.length) {
		  logging.error(i18n.__("asset.datagetnotfound", "memberlist"));
	    return
	  };
	  // Generate list of date.
	  for (var datelist = [], date = new Date(fromdate || new Date()); date <= new Date(todate || new Date()); date.setDate(date.getDate() + 1 )) {
      date.setUTCHours(0);
      date.setUTCMinutes(0);
      date.setUTCSeconds(0);
      datelist.push(
	      date.toISOString()
	        .replace(/\.\d{3}Z$/g, "Z")
	        // .replace(/[TZ:-]/g, "")
	    );
    };
    // Generate list of messages urls by combining memberlist and datelist.
    let urls = new Set();
    memberlist.forEach(mem => {
	    datelist.forEach(dat => {
		    const url = new URL(path.join(mem, mode), `${pathServer}/`);
		    if (mode === "timeline") {
			    url.searchParams.append("updated_from", dat);
			    url.searchParams.append("sort", "asc");
			    url.searchParams.append("count", "100");
		    };
		    urls.add(url.href);
	    });
    });
    
    // Perform an access token check if it still valid or expired.
    // That because if I don't perform this, the app will generate new access token
    // for every urls given.
    await getMessage({ url: [...urls][0] });
    
    // Finally generate and return a list of messages object.
    let messages = [];
    if (parallel) {
      messages = (await Promise.all([...urls].map(url => getMessage({ url: url, appname: this.appname })))).flatMap(r => r);
    } else {
      for (let i = 0; i < [...urls].length; i++) {
        messages.push(...(await getMessage({ url: [...urls][i], appname: this.appname })))
      };
    };
    logging.info(i18n.__("asset.datagetsuccess", `${this.appname}_messages`));
    return [...new Map(messages.map(message => [message.id, message])).values()];
	};
	
};

export { AssetPreDownload };