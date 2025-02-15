/**
 * @module AssetPreDownload
 * @description Generate predownload assets.
 * 
 * Available classes:
 * - {@link AssetPreDownload} - Generate list of predownload assets.
 * 
 * @author hashinami46
 */

import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import { readFileSync, /* readdirSync, writeFileSync, statSync, existsSync */ } from "fs";

import { MainConfig, logging, i18n } from "../MainConfig.js";
import { RequestEndpoint, AppsLists } from "../RequestHandler/RequestEndpoint.js";
import { RequestAttribute } from "../RequestHandler/RequestAttribute.js";

/**
 * Class to prepare download materials.
 * @class AssetPreDownload
 */
class AssetPreDownload {
	/**
	 * @constructor
	 * @param {string} appname - Which appname you want to gather the assets.
   */
	constructor (appname) {
		this.appname = appname;
	};
	
	/**
	 * Get mobame data such as /blogs, /announcements, /members, and /groups.
	 * @param {Object} params 
	 * @param {string} params.assetname
	 * @return {Promise<(Array<Object>|undefined)>} 
	 */
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
	
	/**
	 * Generate mobame messages list.
	 * @param {Object} params - Parameters object.
	 * @param {string} params.mode - Mode timeline or past_messages.
	 * @param {Array<(string|number)>} params.member - List of member in name kanji or id.
	 * @param {string} params.fromdate - Which date you want to start gather the resource.
	 * @param {string} params.todate - Which date you want to stop gather the resource.
	 * @param {boolean} params.parallel - Activate some asynchronous function.
	 * @return {Promise<Array<Object>>}
	 */
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
	  const today = new Date();
	  const yesterday = new Date(today);
	  yesterday.setDate(yesterday.getDate() - 1);
	  for (var datelist = [], date = new Date(fromdate || new Date(yesterday)); date <= new Date(todate || new Date()); date.setDate(date.getDate() + 1 )) {
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
	  datelist.forEach(dat => {
      memberlist.forEach(mem => {
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
    // That because if I don't perform this, the app will generate new access token for every urls given.
    await getMessage({ url: [...urls][0] });
    
    // Finally generate and return a list of messages object.
    let messages = [];
    if (parallel) {
      messages = (await Promise.all([...urls].map(url => getMessage({ url: url })))).flatMap(r => r);
    } else {
      for (let i = 0; i < [...urls].length; i++) {
        messages.push(...(await getMessage({ url: [...urls][i] })))
      };
    };
    logging.info(i18n.__("asset.datagetsuccess", `${this.appname}_messages`));
    return [...new Map(messages.map(message => [message.id, message])).values()];
	};
	
	/**
	 * Generate blogs list.
	 * @param {Object} params - Parameters object.
   * @param {Array<(string|number)>} params.member - List of member in name kanji or id.
	 * @param {string} params.fromdate - Which date you want to start gather the resource.
	 * @param {string} params.todate - Which date you want to stop gather the resource.
	 * @return {Promise<Array<Object>>}
	 */
	async mobameBlogs({ member, fromdate, todate }) {
		// Verify assetname.
		if (!["nogitalk", "sakutalk", "hinatalk"].includes(this.appname)) {
			logging.error(i18n.__("asset.notkindof", this.appname, i18n.__("app.name.blog")));
			console.error(i18n.__("asset.notkindof", this.appname, i18n.__("app.name.blog")));
			return
		};
		// Verify member data type.
		if (member && !Array.isArray(member)) {
			logging.error(i18n.__("asset.wrongmembertype"));
			console.error(i18n.__("asset.wrongmembertype"));
      return
		};
		
		// Function to generate blogs.
		const getBlogs = async ({ urls }) => {
	    try {
		    const req = urls.map(url => axios.get(url));
		    const res = await Promise.all(req);
		    return res.flatMap(r => r.data.blog);
	    } catch (e) {
		    logging.error(e.stack);
		    console.error(e.stack);
		    process.exit(1);
	    };
    };
		
		// Parsing given member name to get it's id.
		// After that, gather it's id as a list.
		const memberdata = JSON.parse(readFileSync(MainConfig.memberDataConfig, "utf8"))[
			this.appname === "nogitalk" ? "nogizaka46" 
			: this.appname === "sakutalk" ? "sakurazaka46" 
			: this.appname === "hinatalk" ? "hinatazaka46" 
		  : "yodel"
		];
		const memberlist = member ? [...new Set(member
	    .map(data => {
		    return typeof data === "string" && memberdata.find(r => r.name === data)
		    ? memberdata.find(r => r.name === data)[this.appname.replace("talk", "blog")]
		    : typeof data === "number" && memberdata.find(r => r[this.appname.replace("talk", "blog")] === data.toString())
		    ? memberdata.find(r => r[this.appname.replace("talk", "blog")] === data.toString())[this.appname.replace("talk", "blog")] 
		    : undefined;
	    })
	    .filter(Boolean)
	  )] : [];
	  // Generate list of date.
	  const today = new Date();
	  const yesterday = new Date(today);
	  yesterday.setDate(yesterday.getDate() - 1);
	  for (var datelist = [], date = new Date(fromdate || new Date(yesterday)); date <= new Date(todate || new Date()); date.setDate(date.getDate() + 1 )) {
      date.setUTCHours(0);
      date.setUTCMinutes(0);
      date.setUTCSeconds(0);
      datelist.push(date.toISOString().replace(/\.\d{3}Z$/g, "").replace(/[TZ:-]/g, ""));;
    };
    
    let urls = new Set();
	  datelist.forEach(dat => {
		  const url = new URL(
			  path.join(
				  "s", 
				  this.appname === "nogitalk" 
				    ? "n46" 
				    : this.appname === "sakutalk" 
				    ? "s46app" 
				    : "h46app",
				  "/api/json/diary"
			  ), 
		    this.appname === "nogitalk" 
		      ? "https://www.nogizaka46.com" 
		      : this.appname === "sakutalk" 
		      ? "https://www.sakurazaka46.com" 
		      : "https://hinatazaka46.com"
		  );
		    url.searchParams.append("cd", this.appname === "nogitalk" ? "MEMBER" : this.appname === "sakutalk" ? "blog" : "member");
			  url.searchParams.append("fromdate", dat);
			  url.searchParams.append("timestatus", "old");
			  url.searchParams.append("getnum", "10");
			  url.searchParams.append("get", "B");
		    urls.add(url.href);
    });
    if (memberlist.length) {
	    const tempurls = new Set(urls);
	    urls.clear();
      memberlist.forEach(mem => {
	      [...tempurls].forEach(tempurl => {
		      const url = new URL(tempurl);
			    url.searchParams.append("member_id", mem);
			    urls.add(url.href);
	      });
	    });
    };
    let blogs = await getBlogs({ urls: [...urls] });
    logging.info(i18n.__("asset.datagetsuccess", i18n.__("app.name.blog")));
    
    // Finally return and generate list of blogs object.
    return [
	    ...new Map(blogs.map(blog => {
	      let blogdata = cheerio.load(blog.content);
	      return [blog.id, { 
		      title: blog.title,
		      link: blog.link,
		      id: blog.id,
		      creator: blog.creator,
		      member_id: blog.member_id,
		      pubdate: blog.pubdate,
		      thumbnail: blog.thumbnail,
		      content: `<h1 id="title">${blog.title}</h1> ${blog.content}`,
		      images: blogdata("img").map((id, el) => {
		        return blogdata(el).attr("src") 
		      }).get()
        }]
	    })).values()
	  ];
	};
	
};

export { AssetPreDownload };