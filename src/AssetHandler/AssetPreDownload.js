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
import zlib from "zlib";
import axios from "axios";
import crypto from "crypto";
import { Buffer } from "buffer";
import { promisify } from "util";
import * as cheerio from "cheerio";
import { readFile, readdir, access } from "fs/promises";

const [unzip, inflate] = [promisify(zlib.unzip), promisify(zlib.inflate)];

import { MainConfig, logging, i18next } from "../MainConfig.js";
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
			logging.error(i18next.t("parameters.assetname.notfound", { name: `${this.appname}_${assetname}` }));
			console.error(i18next.t("parameters.assetname.notfound", { name: `${this.appname}_${assetname}` }));
		  return
    };
    const { pathServer } = await new RequestEndpoint(this.appname, assetname).pathnameServerLocal();
		let { access_token } = await new RequestAttribute(this.appname).authToken({ mode: "read" });
	  let headers = await new RequestAttribute(this.appname).customHeader({ access_token: access_token });
	  // Try to get data using current token.
	  // If failed, perform an update token and retry the function.
	  try {
			const { data } = await axios.get(pathServer, { headers });
			logging.info(i18next.t("general.dataget.success", { dataname: `${this.appname}_${assetname}` }));
		  return data;
		} catch (e) {
			logging.error(i18next.t("general.dataget.failed", { dataname: `${this.appname}_${assetname}` })); 
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
	async mobameMessages({ assetname, member, fromdate, todate, parallel }) {
		// Verify assetname.
		if (!AppsLists.messagesList.includes(this.appname)) {
			logging.error(i18next.t("parameters.assetname.notfound", { name: `${this.appname}_${assetname}` }));
			console.error(i18next.t("parameters.assetname.notfound", { name: `${this.appname}_${assetname}` }));
		  return
		};
		// Verify mode.
		if (!["timeline", "past_messages"].includes(assetname)) {
			logging.error(i18next.t("parameters.assetname.wrongassetname_mobamemessages"));
			console.error(i18next.t("parameters.assetname.wrongassetname_mobamemessages"));
		  return
		};
		// Verify member data type.
		if (!Array.isArray(member)) {
			logging.error(i18next.t("parameters.member.wrongmembertype"));
			console.error(i18next.t("parameters.member.wrongmembertype"));
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
				logging.error(i18next.t("general.dataget.failed", { dataname: `${this.appname}_${assetname}` })); 
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
		const memberdata = JSON.parse(await readFile(MainConfig.memberDataConfig, "utf8"))[
			this.appname === "nogitalk" ? "nogizaka46" 
			: this.appname === "sakutalk" ? "sakurazaka46" 
			: this.appname === "hinatalk" ? "hinatazaka46" 
			: this.appname === "asukatalk" ? "saitoasuka" 
		  : this.appname === "mizukitalk" ? "yamashitamizuki" 
			: this.appname === "maiyantalk" ? "shiraishimai" 
		  : this.appname === "centforcetalk" ? "centforce" 
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
		  logging.error(i18next.t("general.dataget.failed", { dataname: "memberlist" })); 
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
		    const url = new URL(path.join(mem, assetname), `${pathServer}/`);
		    if (assetname === "timeline") {
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
    if (!messages.length) {
	    logging.info(i18next.t("general.dataget.failed", { dataname: "messages" }));
	    console.info(i18next.t("general.dataget.failed", { dataname: "messages" }));
	    process.exit(0);
    };
    logging.info(i18next.t("general.dataget.success", { dataname: i18next.t("parameters.appname.mobame.title") })); 
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
		if (!AppsLists.messagesList.includes(this.appname)) {
			logging.error(i18next.t("parameters.assetname.notfound", { name: this.appname }));
			console.error(i18next.t("parameters.assetname.notfound", { name: this.appname }));
		  return
		};
		// Verify member data type.
		if (!Array.isArray(member)) {
			logging.error(i18next.t("parameters.member.wrongmembertype"));
			console.error(i18next.t("parameters.member.wrongmembertype"));
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
		const memberdata = JSON.parse(await readFile(MainConfig.memberDataConfig, "utf8"))[
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
    
    // Generate urls
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
		    url.searchParams.append("cd",
		      this.appname === "nogitalk" 
		      ? "MEMBER" 
		      : this.appname === "sakutalk" 
		      ? "blog" : "member"
		    );
			  url.searchParams.append("fromdate", dat);
			  url.searchParams.append("timestatus", "new");
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
    
    // Finally return and generate list of blogs object.
    logging.info(i18next.t("general.dataget.success", { dataname: i18next.t("parameters.assetname.blog.title") })); 
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
	
	/**
	 * Prepare common image assets url server.
	 * @param {Object} params - Parameters object.
   * @param {string} params.assetname - Which assetname you want to download.
   * @param {string|number} params.fromid - Start id of asset to download.
   * @param {string|number} params.toid - End id of asset to download.
   * @param {string|number} params.member - List of member in name kanji or id.
   * @param {string} params.color - Nogikoi card has color. Pink, blue, or green.
   * @param {string} params.star - Nogikoi card also has star between 1-8.
   * @param {string} params.series - Nogikoi sprites has series id for sprites asset.
   * @param {boolean} params.parallel - Activate some asynchronous function.
   * @param {boolean} params.record - Enabling r/w asset record.
   * @return {Promise<Array<Object>>|undefined} - Return list of data urls and size.
	 */
	async preDownloadCommonImages({ assetname, fromid, toid, member, color, star, series, parallel=false, record=false }) {
		/**
		 * Verify game asset name.
		 */
		const commonAsset = `${this.appname}_${assetname}`;
		const allowedCommonAsset = [
		  ...AppsLists.commonImageList,
		  ...AppsLists.commonUsmList,
		  "nogifes_focus_data",
		  "nogifes_focus_data_high"
		];
		if (!allowedCommonAsset.includes(commonAsset)) {
			logging.error(i18next.t("parameters.assetname.notfound", { name: commonAsset }));
			console.error(i18next.t("parameters.assetname.notfound", { name: commonAsset }));
		  return
		};
		if (fromid && toid && fromid > toid) {
			logging.error(i18next.t("parameters.index.wrongindex_fromlessto"));
			console.error(i18next.t("parameters.index.wrongindex_fromlessto"));
	    return
		};
		if (!fromid && !toid && commonAsset !== "nogikoi_sprites") {
			logging.error(i18next.t("parameters.index.wrongindex_undefined"));
			console.error(i18next.t("parameters.index.wrongindex_undefined"));
	    return
		};
		if (fromid && toid && (toid - fromid + 1 > 500)) {
			logging.error(i18next.t("parameters.index.wrongindex_maxrangeexceed"));
			console.error(i18next.t("parameters.index.wrongindex_maxrangeexceed"));
			return
		};
		/**
		 * Generate URLs
		 */
		let { pathServer } = await new RequestEndpoint(this.appname, assetname).pathnameServerLocal();
		const filename = commonAsset === "nogifes_photo_common"
		  // Nogifes section
		  ? "photo_common_<index>.png"
		  : commonAsset === "nogifes_movie_card_th"
		  ? "movie_card_thumbnail_<index>.png"
		  : commonAsset === "nogifes_bonus_campaign"
		  ? "campaign_login_bonus_background_<index>.png"
		  : commonAsset === "nogifes_movie_card"
		  ? "movie_card_<index>.usme"
		  : commonAsset === "nogifes_reward_movie"
		  ? "reward_movie_<index>.usme"
		  : commonAsset === "nogifes_focus_data"
		  ? "focus_data_<index>.cpk"
		  : commonAsset === "nogifes_focus_data_high"
		  ? "focus_data_high_<index>.cpk"
		  // Nogikoi Section
		  : ["nogikoi_card_png", "nogikoi_card_png_bg", "nogikoi_card_jpg"].includes(commonAsset)
		  ? "<color><star><index>.<ext>" // 1 > pink, 2 > blue, 3 > green
		  : commonAsset === "nogikoi_sprites"
		  ? "n<member>_<fuku>_v<series>_<pose>.png" // n50_02_v6_f.png
	    : undefined;
	  
	  const membersdata = JSON.parse(await readFile(MainConfig.memberDataConfig, "utf8"))["nogizaka46"];
	  const memberdata = (typeof member === "string" && membersdata.find(mdata => mdata.name === member))
		  ? membersdata.find(mdata => mdata.name === member) //["nogikoi"]
			: (typeof member === "number" && membersdata.find(mdata => mdata.nogikoi === member.toString()))
			? membersdata.find(mdata => mdata.nogikoi === member.toString()) //["nogikoi"]
			: undefined;
	  const filenames = new Set();
	  for (let id = fromid; id <= toid; id++) {
		  if (commonAsset.includes("nogifes")) {
			  filenames.add(filename.replace("<index>", id.toString().padStart(5, "0")));
		  };
		  if (commonAsset.includes("nogikoi_card")) {
			  var colorid = {
				  "1": ["1", "pink"],
				  "2": ["2", "blue"],
				  "3": ["3", "green"],
				  "pink": ["1", "pink"],
				  "blue": ["2", "blue"],
				  "green": ["3", "green"]
			  };
			  var starid = {
				  "1": "10",
				  "2": "21",
				  "3": "30",
				  "4": "41",
				  "5": "50",
				  "6": "61",
				  "7": "70",
				  "8": "81"
			  };
			  if (!color || !colorid[color] || !colorid[color][0]) {
				  logging.error(i18next.t("parameters.color.wrongcolor_nogikoicard"));
				  console.error(i18next.t("parameters.color.wrongcolor_nogikoicard"));
		      break
			  };
			  if (!star || !starid[star]) {
				  logging.error(i18next.t("parameters.card.wrongcard_nogikoicard"));
				  console.error(i18next.t("parameters.card.wrongcard_nogikoicard"));
		      break
			  };
			  const ids = id < 10000
			    ? id.toString().padStart(4, "0")
			    : id.toString();
			  filenames.add(
				  filename
				    .replace("<color>", colorid[color][0])
				    .replace("<star>", starid[star])
				    .replace("<index>", ids)
				    .replace("<ext>", (commonAsset.includes("jpg") ? "jpg" : "png"))
				);
		  };
	  };
	  if (commonAsset === "nogikoi_sprites") {
		  if (!memberdata || !memberdata["nogikoi"]) {
				logging.error(i18next.t("parameters.member.wrongmembertype"));
			  console.error(i18next.t("parameters.member.wrongmembertype"));
        return
			};
			if (series < 0 || series > 7) {
				logging.error(i18next.t("parameters.series.wrongseries_nogikoisprites"));
				console.error(i18next.t("parameters.series.wrongseries_nogikoisprites"));
		    return
			};
			//pathLocal = path.join(pathLocal, `${memberdata["gen"]}. ${memberdata["name"]}`);
			[...Array(12).keys()].slice(1).forEach(fuku => {
				["a", "b", "c", "d", "e", "f", "g"].forEach(pose => {
					filenames.add(
						filename
						  .replace("<member>", memberdata["nogikoi"])
						  .replace("<fuku>", fuku.toString().padStart(2, "0"))
						  .replace("<series>", series)
						  .replace("<pose>", pose)
				  );
				});
			});
	  };
	  
	  // Generate urls
	  const metadata = [];
	  const generateMetadata = async ({ filename }) => {
	    const urlServer = new URL(pathServer);
	    const isIncludes = await MainConfig.assetsRecord.read({ 
			  logpath: path.join(MainConfig.rcdsDir, `assets_record_${commonAsset}`),
			  logstring: filename
		  });
		  if (record && isIncludes) {
			  return
		  };
		  try {
			  const { headers } = await axios.head(new URL(filename, pathServer).href);
			  metadata.push({
				  url: new URL(filename, pathServer).href,
				  size: parseInt(headers["content-length"])
			  });
		  } catch (err) {
			  if (err.status === 403) {
				  urlServer.hostname = this.appname === "nogifes"
				    ? "v2static.nogifes.jp"
				    : "prd-content-gree.static.game.nogikoi.jp";
				  pathServer = urlServer.href;
				  await generateMetadata({ filename: filename });
			  };
		  };
	  };
	  if (parallel) {
		  await Promise.all([...filenames].map(filename => generateMetadata({ filename: filename })));
	  } else {
		  for (let i = 0; i < [...filenames].length; i++) {
		    await generateMetadata({ filename: [...filenames][i] })
	    };
	  };
	  // Return urls list
	  if (!metadata.length) {
	    logging.info(i18next.t("general.dataget.failed", { dataname: "metadata" }));
	    console.info(i18next.t("general.dataget.failed", { dataname: "metadata" }));
	    process.exit(0);
    };
	  logging.info(i18next.t("general.dataget.success", { dataname: i18next.t(`parameters.appname.${this.appname}.title`) })); 
	  return metadata
  };
  
  /**
   * Generate catalog and return catalog object.
   * @param {Object} params 
   * @param {string} params.mode - Read or generate catalog.
   * @param {string} params.id - Catalog server id.
   * @return {Promise<Object>}
   */
  async gameCatalogs({ mode, id }) {
	  // Verify appname
	  if (!AppsLists.commonCatalogList.includes(`${this.appname}_catalog`)) {
		  logging.error(i18next.t("parameters.assetname.notfound", { name: `${this.appname}_catalog` }));
			console.error(i18next.t("parameters.assetname.notfound", { name: `${this.appname}_catalog` }));
		  return
	  };
	  //Verify mode
	  if (!/^(read|generate)$/.test(mode)) {
		  logging.error(i18next.t("parameters.mode.wrongmode_catalogmode"));
			console.error(i18next.t("parameters.mode.wrongmode_catalogmode"));
			return
	  };
	  // Verify id if mode generate
	  if (mode === "generate" && !id) {
		  logging.error(i18next.t("parameters.index.wrongindex_catalogid"));
		  console.error(i18next.t("parameters.index.wrongindex_catalogid"));
		  return
	  };
	  
	  let commonAsset = id ? `${this.appname}_catalog_${id}` : `${this.appname}_catalog`;
	  // Mode read
	  let { pathServer, pathLocal } = await new RequestEndpoint(this.appname, "catalog").pathnameServerLocal();
	  if (mode === "read") {
		  const pathCatalog = id
		    ? path.join(pathLocal, commonAsset)
		    : (await readdir(MainConfig.ctlgDir))
		      .filter(catalog => catalog.split("_")[0] === this.appname)
		      .map(catalog => path.join(MainConfig.ctlgDir, catalog)).pop();
		  if (await access(pathCatalog).then(() => false).catch(() => true)) {
			  logging.error(i18next.t("parameters.catalog.wrongcatalog_notfound", { name: this.appname }));
			  console.error(i18next.t("parameters.catalog.wrongcatalog_notfound", { name: this.appname }));
			  return
		  };
		  commonAsset = path.basename(pathCatalog);
		  try {
		    const catalog = JSON.parse(await readFile(pathCatalog))
		    catalog.id = pathCatalog.split("_")[2];
		    return catalog
		    //[this.appname === "unison" ? "assets_masters" : "data"];
		  } catch (err) {
			  logging.error(err.name);
			  logging.error(err.stack);
			  logging.error(i18next.t("parameters.catalog.wrongcatalog_corrupted", { name: commonAsset }));
			  console.error(i18next.t("parameters.catalog.wrongcatalog_corrupted", { name: commonAsset }));
			  process.exit(1);
		  };
	  };
	  
	  // Mode generate
	  try {
	    pathServer = decodeURIComponent(pathServer).replace("<server_version>", id);
		  const { data } = await axios.get(pathServer, { responseType: "arraybuffer" });
		  let catalog = "";
		  if (this.appname === "unison") {
		    const decipher = crypto.createDecipheriv(
			    "aes-256-cbc",
			    Buffer.from("MgTWfLGCfeFRVyA1WeHcW8mW6yNzVYMFJJBqCBt99DQ=", "base64"),
			    Buffer.from("tIEJY1DpzfxTsi85Y1Ug/w==", "base64")
			  );
			  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
			  catalog = await inflate(decrypted);
		  } else {
		    catalog = await unzip(data);
		  };
			logging.info(i18next.t("general.dataget.success", { dataname: commonAsset })); 
		  return catalog
	  } catch (err) {
		  logging.error(err.stack);
			logging.error(err.response.data);
			logging.error(i18next.t("general.dataget.failed", { dataname: commonAsset })); 
			console.error(i18next.t("general.dataget.failed", { dataname: commonAsset })); 
			process.exit(1);
	  };
  };
  
	/**
	 * Prepare common video assets url server.
	 * @param {Object} params - Parameters object.
   * @param {string} params.assetname - Which assetname you want to download.
   * @param {string|number} params.fromid - Start id of asset to download.
   * @param {string|number} params.toid - End id of asset to download.
   * @param {string|number} params.member - List of member in name kanji or id.
   * @param {string} params.catalogid - Catalog id that appear in server endpoint.
   * @param {boolean} params.disablefilter - Disable some filtering function.
   * @param {boolean} params.record - Enabling r/w asset record.
   * @return {Promise<Object|Buffer>}
	 */
	async preDownloadCommonVideos({ assetname, fromid, toid, member, catalogid, disablefilter=false, record=false }) {
		const commonAsset = `${this.appname}_${assetname}`;
		const allowedCommonAsset = [
		  ...AppsLists.commonVideoList,
		  ...AppsLists.commonUnityList.filter(item => !item.includes("nogifes") || !item.includes("nogifra")),
		  ...AppsLists.commonCpkList.filter(item => !item.includes("nogifes")),
		];
		if (!allowedCommonAsset.includes(commonAsset)) {
			logging.error(i18next.t("parameters.assetname.notfound", { name: commonAsset }));
			console.error(i18next.t("parameters.assetname.notfound", { name: commonAsset }));
		  return
		};
		if (fromid && toid && fromid > toid) {
			logging.error(i18next.t("parameters.index.wrongindex_fromlessto"));
			console.error(i18next.t("parameters.index.wrongindex_fromlessto"));
	    return
		};
		if (fromid && toid && (toid - fromid + 1 > 500)) {
			logging.error(i18next.t("parameters.index.wrongindex_maxrangeexceed"));
			console.error(i18next.t("parameters.index.wrongindex_maxrangeexceed"));
			return
		};
		const { id, ...data } = await this.gameCatalogs({ mode: "read", id: catalogid });
    let catalog = this.appname === "unison" ? data.assets_masters : data.data;
    const catalogLength = catalog.length;
    if (!catalog) {
	    logging.info(i18next.t("general.dataget.failed", { dataname: "catalog" }));
	    console.info(i18next.t("general.dataget.failed", { dataname: "catalog" }));
	    return;
    };
		// Catalog filtering
		if (["sakukoi", "hinakoi"].includes(this.appname)) {
	    catalog = catalog.map((item, index) => {
		    return {
			    id: index + 1,
			    ...item
		    };
	    });
	    if (!fromid || !toid) {
		    logging.error(i18next.t("parameters.index.wrongindex_undefined"));
		    console.error(i18next.t("parameters.index.wrongindex_undefined"));
		    return
	    };
		  if (!disablefilter) {
	      catalog = catalog.filter(catalogs => {
		      return assetname === "card"
	          ? catalogs.fileSize <= 500000
	          : catalogs.fileSize >= 1000000
	      });
		  };
		};
		if (this.appname === "unison") {
			catalog = catalog.filter(catalogs => {
			  return AppsLists.commonVideoList.includes(commonAsset)
			    ? catalogs.code.split("/").pop().includes(assetname)
			      && catalogs.code.endsWith(".mp4")
			    : assetname === "live_movie"
			    ? catalogs.code.split("/").pop().includes(assetname)
			      && catalogs.code.endsWith(".cpk")
			      && !catalogs.code.split("/").pop().includes("low")
			    : assetname === "chara_profile"
			    ? /chara_(\d{3})_profile/.test(catalogs.code.split("/").pop())
			      && catalogs.code.endsWith(".cpk")
			    : ["drama_bgm", "event_bgm"].includes(assetname)
			    ? catalogs.code.split("/")[1].includes(assetname)
			    : ["scene_card", "gacha_stamp"].includes(assetname)
			    ? catalogs.code.endsWith(".unity3d")
			      && catalogs.code.split("/").pop().includes(assetname)
			    : catalogs.code.split("/").pop().includes(assetname)
			      && catalogs.code.endsWith(".cpk")
			      && !catalogs.code.split("/").pop().includes("low")
			});
		};
			/*
		if (this.appname === "unison" && AppsLists.commonCpkList.includes(commonAsset)) {
			catalog = catalog.filter(catalogs => 
			);
			if (assetname === "live_movie") {
				catalog = catalog.map(catalogs => {
				  catalogs.codeAudio = catalogs.code.replace(/_(\d{3}).cpk$/, "");
					catalogs.codeAudio = catalogs.codeAudio.replace("video/live_movie/live_movie_", "sound/song/live_music_")
					catalogs.codeAudio = `${catalogs.codeAudio.replace(/\.\w{2,4}$/i, "")}.cpk`
				  return catalogs
			  });
			};
		};
			*/
		
		const membersdata = JSON.parse(await readFile(MainConfig.memberDataConfig, "utf8"));
	  const memberdata = (typeof member === "string" && [...membersdata.sakurazaka46, ...membersdata.hinatazaka46].find(mdata => mdata.name === member))
		  ? [...membersdata.sakurazaka46, ...membersdata.hinatazaka46].find(mdata => mdata.name === member)
		  : (typeof member === "number" && [...membersdata.sakurazaka46, ...membersdata.hinatazaka46].find(mdata => mdata.unison === member.toString()))
		  ? [...membersdata.sakurazaka46, ...membersdata.hinatazaka46].find(mdata => mdata.unison === member.toString())
		  : undefined;
		  
		if (this.appname === "unison" && member && !memberdata) {
		  logging.error("Seems that you entered the wrong member name or id!");
		  console.error("Seems that you entered the wrong member name or id!");
		  return;
	  };
	  if (this.appname === "unison" && member && memberdata) {
		  catalog = catalog.filter(catalogs => {
		    return assetname === "live_movie"
		      ? catalogs.code.split("/").pop().match(/_(\d{3}).cpk$/) 
		        && catalogs.code.split("/").pop().match(/_(\d{3}).cpk$/)[1] === memberdata.unison
		      : catalogs.code.split("/").pop().match(/_(\d{3})_/) 
		        && catalogs.code.split("/").pop().match(/_(\d{3})_/)[1] === memberdata.unison
		  });
	  };
	  if ((fromid && fromid > catalog.length) || (toid && toid > catalog.length)) {
			logging.error(i18next.t("parameters.index.wrongindex_lessthancatalog", { length: catalog.length }));
			console.error(i18next.t("parameters.index.wrongindex_lessthancatalog", { length: catalog.length }));
			return
		};
		catalog = catalog.filter((item, index) => {
			return fromid && toid
			  ? index >= fromid - 1 && index <= toid - 1
			  : fromid
			  ? index >= fromid - 1
			  : toid
			  ? index >= toid - 1
			  : true
		});
		if (record) {
			catalog = (await Promise.all(catalog.map(async item => {
				const isIncludes = await MainConfig.assetsRecord.read({ 
			    logpath: path.join(MainConfig.rcdsDir, `assets_record_${commonAsset}`),
			    logstring: this.appname === "unison" ? item.code : item.assetBundleName
		    });
		    return isIncludes ? false : item
			}))).filter(item => item)
		};
		logging.info(i18next.t("general.dataget.success", { dataname: i18next.t(`parameters.catalog.title`) })); 
		return { id, length: catalogLength, catalog };
	 };
	 
	/**
	 * Prepare common usm assets url server.
	 * @param {Object} params - Parameters object.
   * @param {string} params.assetname - Which assetname you want to download.
   * @param {string|number} params.fromid - Start id of asset to download.
   * @param {string|number} params.toid - End id of asset to download.
   * @param {boolean} params.parallel - Activate some asynchronous function.
   * @param {boolean} params.record - Enabling r/w asset record.
   * @return {Promise<Array<Object>>|undefined} - Return list of urls.
	 */
	async preDownloadCommonUsms({ assetname, fromid, toid, parallel=false, record=false }) {
		return await this.preDownloadCommonImages({
			assetname: assetname,
			fromid: fromid,
			toid: toid,
			parallel: parallel,
			record: record
		});
	};
	
	/**
	 * Prepare common video assets url server.
	 * @param {Object} params - Parameters object.
   * @param {string} params.assetname - Which assetname you want to download.
   * @param {string|number} params.fromid - Start id of asset to download.
   * @param {string|number} params.toid - End id of asset to download.
   * @param {string|number} params.member - List of member in name kanji or id.
   * @param {string} params.catalogid - Catalog id that appear in server endpoint.
   * @param {boolean} params.parallel - Activate some asynchronous function.
   * @param {boolean} params.record - Enabling r/w asset record.
   * @return {Promise<Array<Object>>|undefined} - Return list of urls.
	 */
	async preDownloadCommonCpks({ assetname, fromid, toid, member, catalogid, parallel=false, record=false }) {
		return this.appname === "nogifes"
			? await this.preDownloadCommonImages({
			    assetname: assetname,
			    fromid: fromid,
			    toid: toid,
			    parallel: parallel,
			    record: record
		    })
		  : this.appname === "unison"
		  ? await this.preDownloadCommonVideos({ 
			    assetname: assetname, 
			    fromid: fromid, 
			    toid: toid, 
			    member: member, 
			    catalogid: catalogid, 
			    record: record 
		    })
		  : undefined;
	};
	
	/**
	 * Prepare common unity assets url server.
	 * @param {Object} params - Parameters object.
   * @param {string} params.assetname - Which assetname you want to download.
   * @param {string|number} params.fromid - Start id of asset to download.
   * @param {string|number} params.toid - End id of asset to download.
   * @param {string|number} params.member - List of member in name kanji or id.
   * @param {string} params.catalogid - Catalog id that appear in server endpoint.
   * @param {boolean} params.disablefilter - Disable some filtering function.
   * @param {boolean} params.record - Enabling r/w asset record.
   * @return {Promise<Object|Buffer>}
	 */
	async preDownloadCommonUnitys({ assetname, fromid, toid, member, catalogid, disablefilter=false, record=false }) {
	  return await this.preDownloadCommonVideos({ 
		  assetname: assetname, 
			fromid: fromid, 
			toid: toid, 
			member: member, 
			catalogid: catalogid, 
			disablefilter: disablefilter,
			record: record 
		});
	};
};

export { AssetPreDownload };