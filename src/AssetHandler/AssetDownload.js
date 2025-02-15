/**
 * @module AssetDownload
 * @description Download various assets.
 * 
 * Available classes:
 * - {@link AssetDownload} - Download assets.
 * 
 * @author hashinami46
 */

// import zlib from "zlib"
import path from "path";
import axios from "axios";
// import crypto from "crypto";
// import { python } from "pythonia";
import axiosRetry from "axios-retry";
import { readFileSync, /* readdirSync, statSync, */ mkdirSync, writeFileSync, existsSync } from "fs";
import { Listr } from "listr2";

import { MainConfig, logging, i18n } from "../MainConfig.js";
import { RequestEndpoint } from "../RequestHandler/RequestEndpoint.js";
import { AssetPreDownload } from "../AssetHandler/AssetPreDownload.js";

axiosRetry(axios, { retries: 3 });

/**
 * Class to download assets.
 * @class AssetDownload
 */ 
class AssetDownload {
	/**
	 * @constructor
	 * @param {string} appname - Which appname you want to get the url and path.
	 * @param {string} assetname - Which app asset you want to get the url and path.
	 */
	constructor (appname, assetname) {
		this.appname = appname;
		this.assetname = `${appname.replace(/_(1|2)/, "")}_${assetname}`;
	};
	
	/**
	 * Download mobame messages.
	 * @param {Object} params - Parameters object.
	 * @param {string} params.mode - Mode timeline or past_messages.
	 * @param {Array<(string|number)>} params.member - List of member in name kanji or id.
	 * @param {string} params.fromdate - Which date you want to start download the message.
	 * @param {string} params.todate - Which date you want to stop download the message.
	 * @param {boolean} params.parallel - Activate some asynchronous function.
	 * @return {Promise<void>}
	 */
	async commonMessages({ mode, member, fromdate, todate, parallel=false }) {
		// Get memberdata list config.
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
	  // Get messages data and return if doesn't found!
	  const messagesdata = await new AssetPreDownload(this.appname).mobameMessages({ mode: mode, member: member, fromdate: fromdate, todate: todate, parallel: parallel }) || [] ;
		if (!messagesdata.length) {
      logging.error(i18n.__("asset.datagetnotfound", "messagesdata"));
	    return
	  };
		// Function to download single message.
		const { pathLocal } = await new RequestEndpoint(this.appname, "groups").pathnameServerLocal();
		const downloadMessage = async ({ message, task }) => {
			const requiredKeys = ["id", "group_id", "member_id", "type", "published_at", "updated_at"];
			if (!requiredKeys.every(key => Object.keys(message).includes(key))) {
        logging.error(i18n.__("object.missingkey"));
        throw new Error(i18n.__("object.missingkey"));
      };
      // Check member data availability.
      const memberobject = memberdata.find(mdata => mdata[this.appname.replace("talk", "msg")] === message.group_id.toString());
      if (!memberobject) {
	      logging.error(i18n.__("asset.datagetfailed", i18n.__("asset.type.member")));
	      throw new Error(i18n.__("asset.datagetfailed", i18n.__("asset.type.member")));
      };
      // Create local download folder.
      const folderpath = path.join(pathLocal, `${memberobject.gen ? (memberobject.gen + ". ") : ""}${memberobject.name}`, `${message.published_at.split("T")[0].replaceAll("-", ".")}`);
      if (!existsSync(folderpath)) {
	      mkdirSync(folderpath, { recursive: true });
      };
      // Download picture, video or voice. Also download text if exists.
      // Text filename depends on message.type.
      let filename = `${message.id}-${message.published_at.split("T")[0].replace(/-/g, "")}-${message.published_at.split("T")[1].replace(/[:Z]/g, "")}.txt`;
			task.title = i18n.__("asset.downloadpreparing", filename.replace(/\.\w{2,4}$/i, ""));
      if (["picture", "video", "voice"].includes(message.type)) {
	      filename = path.basename(new URL(message.file).pathname);
	      try {
	        if (!existsSync(path.join(folderpath, filename))) {
		        const { data } = await axios.get(new URL(message.file).href, { responseType: "arraybuffer" });
		        writeFileSync(path.join(folderpath, filename), Buffer.from(data, "binary"));
	        };
	      } catch (err) {
		      logging.error(err.stack);
		      throw new Error(i18n.__("asset.downloadfailed", filename.replace(/\.\w{2,4}$/i, "")));
	      };
      };
	    const textpath = path.join(folderpath, filename).replace(/\.\w{2,4}$/i, ".txt");
      if (message.text && !existsSync(textpath)) {
	      writeFileSync(textpath, message.text, { flag: "a+" })
      };
		  task.title = i18n.__("asset.downloadsuccess", filename.replace(/\.\w{2,4}$/i, ""));
		};
		
		// Listr
		const subtasks = [...messagesdata].map(message => ({
			title: "",
			task: async (_, task) => {
				await downloadMessage({ message: message, task: task });
				task.title = "";
			}
		}));
		const tasks = new Listr();
		tasks.add({
			title: i18n.__("asset.downloadpreparing", i18n.__("app.name.mobame")),
			task: async (_, task) => (
		    task.newListr(
			    subtasks,
				  { concurrent: 3, exitOnError: false })
			)
		});
		tasks.options = {
			concurrent: true,
			renderer: "default",
			rendererOptions: {
				collapseSubtasks: false
			},
			exitOnError: false
		};
		
		const now = MainConfig.nowTimestamp();
		console.log(MainConfig.createBox({
			[i18n.__("param.assetname")]   : i18n.__("app.name.mobame"),
			[i18n.__("param.type")]        : i18n.__(`asset.type.${mode}`),
			...(mode === "timeline" && fromdate ? { [i18n.__("param.fromdate")] : fromdate } : {}),
			...(mode === "timeline" && todate ? { [i18n.__("param.todate")] : todate } : {}),
			[i18n.__("param.member")]      : member.join(", "),
			[i18n.__("param.requestedat")] : now
		}));
		await tasks.run().catch(err => logging.error(err.stack));
	};
	
	/**
	 * Download blogs.
	 * @param {Object} params - Parameters object.
   * @param {Array<(string|number)>} params.member - List of member in name kanji or id.
	 * @param {string} params.fromdate - Which date you want to start gather the blog.
	 * @param {string} params.todate - Which date you want to stop gather the blog.
	 * @param {boolean} params.parallel - Activate some asynchronous function.
	 * @return {Promise<void>}
	 */
	async commonBlogs({ member, fromdate, todate, parallel=false }) {
		// Get memberdata list config.
		const memberdata = JSON.parse(readFileSync(MainConfig.memberDataConfig, "utf8"))[
			this.appname === "nogitalk" ? "nogizaka46" 
			: this.appname === "sakutalk" ? "sakurazaka46" 
			: this.appname === "hinatalk" ? "hinatazaka46" 
		  : "yodel"
		];
		// Function to download single blog object.
		const { pathLocal } = await new RequestEndpoint(this.appname, "blogs").pathnameServerLocal();
		const downloadBlog = async ({ blog, task }) => {
			// Check memberdata availability. 
			const memberobject = memberdata.find(mdata => mdata[this.appname.replace("talk", "blog")] === blog.member_id.toString());
			if (!memberobject) {
	      logging.error(i18n.__("asset.datagetfailed", i18n.__("asset.type.member")));
	      throw new Error(i18n.__("asset.datagetfailed", i18n.__("asset.type.member")));
      };
      // Create local download folder.
      const pubdate = new Date(blog.pubdate)
      const folderpath = path.join(pathLocal, `${memberobject.gen ? (memberobject.gen + ". ") : ""}${memberobject.name}`, `${pubdate.toISOString().split("T")[0].replaceAll("-", ".")}`, blog.id);
			if (!existsSync(folderpath)) {
	      mkdirSync(folderpath, { recursive: true });
      };
      
      // Download blog content and images.
      const filename = `${blog.id}-contents.html`;
      if (!existsSync(path.join(folderpath, filename))) {
	      writeFileSync(path.join(folderpath, filename), blog.content, { flag: "a+" })
      };
      // Download blog images.
      const downloadBlogImage = async ({ url }) => {
		    const filename = `${blog.id}-asset-${path.basename(new URL(url).pathname)}`;
	      try {
		      if (!existsSync(path.join(folderpath, filename))) {
		        const { data } = await axios.get(new URL(url).href, { responseType: "arraybuffer" });
		        writeFileSync(path.join(folderpath, filename), Buffer.from(data, "binary"));
	        };
		    } catch (err) {
			    logging.error(err.stack);
		      throw new Error(i18n.__("asset.downloadfailed", filename.replace(/\.\w{2,4}$/i, "")));
		    };
      };
      if (blog.images.length && parallel) {
        await Promise.all([...blog.images].map(url => downloadBlogImage({ url: url })))
      };
      if (blog.images.length && !parallel) {
	      for (let i = 0; i < [...blog.images].length; i++) {
		      await downloadBlogImage({ url: [...blog.images][i] })
	      };
      };
      task.title = i18n.__("asset.downloadsuccess", filename.replace(/\.\w{2,4}$/i, ""));
		};
		const blogsdata = await new AssetPreDownload(this.appname).mobameBlogs({ member: member, fromdate: fromdate, todate: todate })
		// Listr
		const subtasks = [...blogsdata].map(blog => ({
			title: "",
			task: async (_, task) => {
				await downloadBlog({ blog: blog, task: task });
				task.title = "";
			}
		}));
		const tasks = new Listr();
		tasks.add({
			title: i18n.__("asset.downloadpreparing", i18n.__("app.name.blog")),
			task: async (_, task) => (
		    task.newListr(
			    subtasks,
				  { concurrent: 3, exitOnError: false })
			)
		});
		tasks.options = {
			concurrent: true,
			renderer: "default",
			rendererOptions: {
				collapseSubtasks: false
			},
			exitOnError: false
		};
		
    const now = MainConfig.nowTimestamp();
		console.log(MainConfig.createBox({
			[i18n.__("param.assetname")]   : i18n.__("app.name.blog"),
			...(fromdate ? { [i18n.__("param.fromdate")] : fromdate } : {}),
			...(todate ? { [i18n.__("param.todate")] : todate } : {}),
			...(member ? { [i18n.__("param.member")] : member.join(", ") } : {}),
			[i18n.__("param.requestedat")] : now
		}));
		await tasks.run().catch(err => logging.error(err.stack));
	
	};
};

export { AssetDownload };