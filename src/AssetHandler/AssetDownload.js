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
import { python } from "pythonia";
import { Buffer } from "buffer";
import axiosRetry from "axios-retry";
import { readFile, mkdir, rm, writeFile, access, stat } from "fs/promises";
import { Listr, delay } from "listr2";
import { extractCpk } from "node-critools";
import { ffmpegPath } from "ffmpeg-ffprobe-static";

import { MainConfig, logging, i18next } from "../MainConfig.js";
import { RequestEndpoint } from "../RequestHandler/RequestEndpoint.js";
import { AssetPreDownload } from "../AssetHandler/AssetPreDownload.js";

axiosRetry(axios, { retries: 3 });

const UnityJs = {
	load: async (unity) => {
	  const { bytes } = await python("builtins").catch(err => {
		  logging.error(err);
		  logging.error(i18next.t("general.install.deps_notinstalled", { name: "PyCriCodecs" }));
		  console.error(i18next.t("general.install.deps_notinstalled", { name: "PyCriCodecs" }));
	  });
		const sys = await python("sys");
	  const sysPath = await sys.path;
	  await sysPath.append(MainConfig.python_modules);
	  const UnityPy = await python("UnityPy").catch(err => {
		  logging.error(err);
		  logging.error(i18next.t("general.install.deps_notinstalled", { name: "PyCriCodecs" }));
		  console.error(i18next.t("general.install.deps_notinstalled", { name: "PyCriCodecs" }));
	  });
	  const assets = typeof unity === "string"
	    ? await UnityPy.load(unity)
	    : await UnityPy.load(await bytes(unity))
	  return await assets.objects;
	},
	objects: async (unityObject) => {
		const assetReturn = {}
		const type = await unityObject.type;
		const read = await unityObject.read();
	  assetReturn.type = await type.name;
		assetReturn.m_Name = await read.m_Name;
		if (["Texture2D", "Sprite"].includes(await type.name)) {
		  assetReturn.image = await read.image;
		};
		return assetReturn;
	},
};

/**
 * Class to download assets.
 * @class AssetDownload
 */ 
class AssetDownload {
	/**
	 * @constructor
	 * @param {string} appname - Which appname you want to get the url and path.
   */
	constructor (appname) {
		this.appname = appname;
  };
	
	/**
	 * Download mobame messages.
	 * @param {Object} params - Parameters object.
	 * @param {string} params.assetname - Mode timeline or past_messages.
	 * @param {Array<(string|number)>} params.member - List of member in name kanji or id.
	 * @param {string} params.fromdate - Which date you want to start download the message.
	 * @param {string} params.todate - Which date you want to stop download the message.
	 * @param {boolean} params.parallel - Activate some asynchronous function.
	 * @return {Promise<void>}
	 */
	async commonMessages({ assetname, member, fromdate, todate, parallel=false }) {
		// Get memberdata list config.
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
    
	  // Get messages data and return if doesn't found!
	  const messagesdata = await new AssetPreDownload(this.appname).mobameMessages({ assetname: assetname, member: member, fromdate: fromdate, todate: todate, parallel: parallel }) || [] ;
		if (!messagesdata.length) {
	    logging.info(i18next.t("general.dataget.failed", { dataname: "messagesdata" }));
	    console.info(i18next.t("general.dataget.failed", { dataname: "messagesdata" }));
	    return;
    };
		// Function to download single message.
		const { pathLocal } = await new RequestEndpoint(this.appname, "groups").pathnameServerLocal();
		const downloadMessage = async ({ message, task }) => {
			// Verify message object
			const requiredKeys = ["id", "group_id", "member_id", "type", "published_at", "updated_at"];
			if (!requiredKeys.every(key => Object.keys(message).includes(key))) {
        logging.error(i18next.t("parameters.message.wrongmessage_noobjectkeys"));
        throw new Error(i18next.t("parameters.message.wrongmessage_noobjectkeys"));
      };
      // Check member data availability.
      const memberobject = memberdata.find(mdata => mdata[this.appname.replace("talk", "msg")] === message.group_id.toString());
      if (!memberobject) {
	      logging.error(i18next.t("general.dataget.failed", { dataname: "memberobject" })); 
	      throw new Error(i18next.t("general.dataget.failed", { dataname: "memberobject" })); 
      };
      // Create local download folder.
      const folderpath = path.join(pathLocal, `${memberobject.gen ? (memberobject.gen + ". ") : ""}${memberobject.name}`, `${message.published_at.split("T")[0].replaceAll("-", ".")}`);
	    await mkdir(folderpath, { recursive: true });
      
      // Download picture, video or voice. Also download text if exists.
      // Text filename depends on message.type.
      let filename = `${message.id}-${message.published_at.split("T")[0].replace(/-/g, "")}-${message.published_at.split("T")[1].replace(/[:Z]/g, "")}.txt`;
			task.title = i18next.t("general.download.happening", { name: filename.replace(/\.\w{2,4}$/i, "") });
      if (["picture", "video", "voice"].includes(message.type)) {
	      filename = path.basename(new URL(message.file).pathname);
	      try {
	        if (await access(path.join(folderpath, filename)).then(() => false).catch(() => true)) {
		        const { data } = await axios.get(new URL(message.file).href, { responseType: "arraybuffer" });
		        await writeFile(path.join(folderpath, filename), Buffer.from(data, "binary"));
	        };
	      } catch (err) {
		      logging.error(err.name);
		      logging.error(err.stack);
		      logging.error(i18next.t("general.download.failed", { name: filename.replace(/\.\w{2,4}$/i, "") }));
		      throw new Error(i18next.t("general.download.failed", { name: filename.replace(/\.\w{2,4}$/i, "") }));
	      };
      };
	    const textpath = path.join(folderpath, filename).replace(/\.\w{2,4}$/i, ".txt");
      if (message.text && (await access(textpath).then(() => false).catch(() => true))) {
	      await writeFile(textpath, message.text, { flag: "a+" })
      };
		  task.title = i18next.t("general.download.success", { name: filename.replace(/\.\w{2,4}$/i, "") });
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
			title: i18next.t("general.download.happening", { name: i18next.t("parameters.appname.mobame.title") }),
			task: async (_, task) => (task.newListr(
			  subtasks,
				{ 
					concurrent: parallel ? 3 : false, 
					exitOnError: false 
				}
			))
		});
		tasks.options = {
			concurrent: parallel,
			renderer: "default",
			rendererOptions: {
				collapseSubtasks: false
			},
			exitOnError: false
		};
		
		const now = MainConfig.nowTimestamp();
		MainConfig.createBox({
			[i18next.t("parameters.appname.title")]     : i18next.t("parameters.appname.mobame.title"),
			[i18next.t("parameters.assetname.title")]   : assetname,
			...(assetname === "timeline" && fromdate    ? { [i18next.t("parameters.index.title_fromdate")] : fromdate } : {}),
			...(assetname === "timeline" && todate      ? { [i18next.t("parameters.index.title_todate")] : todate } : {}),
			[i18next.t("parameters.member.title")]      : member.join(", "),
			[i18next.t("parameters.parallel.title")]    : parallel.toString(),
			[i18next.t("parameters.requestedat.title")] : now,		
		});
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
		const memberdata = JSON.parse(await readFile(MainConfig.memberDataConfig, "utf8"))[
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
	      logging.error(i18next.t("general.dataget.failed", { dataname: "memberobject" })); 
	      throw new Error(i18next.t("general.dataget.failed", { dataname: "memberobject" })); 
      };
      // Create local download folder.
      const pubdate = new Date(blog.pubdate)
      const folderpath = path.join(pathLocal, `${memberobject.gen ? (memberobject.gen + ". ") : ""}${memberobject.name}`, `${pubdate.toISOString().split("T")[0].replaceAll("-", ".")}`, blog.id);
	    await mkdir(folderpath, { recursive: true });
      
      // Download blog content and images.
      const filename = `${blog.id}-contents.html`;
      task.title = i18next.t("general.download.happening", { name: blog.title });
      if (await access(path.join(folderpath, filename)).then(() => false).catch(() => true)) {
	      await writeFile(path.join(folderpath, filename), blog.content, { flag: "a+" })
      };
      // Download blog images.
      const downloadBlogImage = async ({ url }) => {
		    const filename = `${blog.id}-asset-${path.basename(new URL(url).pathname)}`;
        task.title = i18next.t("general.download.happening", { name: filename });
	      try {
		      if (await access(path.join(folderpath, filename)).then(() => false).catch(() => true)) {
		        const { data } = await axios.get(new URL(url).href, { responseType: "arraybuffer" });
		        await writeFile(path.join(folderpath, filename), Buffer.from(data, "binary"));
	        };
		    } catch (err) {
			    logging.error(err.name);
			    logging.error(err.stack);
			    logging.error(i18next.t("general.download.failed", { name: filename.replace(/\.\w{2,4}$/i, "") }));
			    throw new Error(i18next.t("general.download.failed", { name: filename.replace(/\.\w{2,4}$/i, "") }));
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
      task.title = i18next.t("general.download.success", { name: filename.replace(/\.\w{2,4}$/i, "") });
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
			title: i18next.t("general.download.happening", { name: i18next.t("parameters.assetname.blog.title") }),
			task: async (_, task) => (task.newListr(
			  subtasks,
				{ 
					concurrent: parallel ? 3 : false, 
					exitOnError: false 
				}
			))
		});
		tasks.options = {
			concurrent: parallel,
			renderer: "default",
			rendererOptions: {
				collapseSubtasks: false
			},
			exitOnError: false
		};
		
    const now = MainConfig.nowTimestamp();
		MainConfig.createBox({
			[i18next.t("parameters.appname.title")]     : i18next.t("parameters.appname.mobame.title"),
			[i18next.t("parameters.assetname.title")]   : "blogs",
			...(fromdate ? { [i18next.t("parameters.index.title_fromdate")] : fromdate } : {}),
			...(todate ? { [i18next.t("parameters.index.title_todate")]     : todate } : {}),
			...(member ? { [i18next.t("parameters.member.title")]           : member.join(", ")} : {}),
			[i18next.t("parameters.parallel.title")]    : parallel.toString(),
			[i18next.t("parameters.requestedat.title")] : now,		
		});
		await tasks.run().catch(err => logging.error(err.stack));
	
	};
	
	/**
	 * Download common image assets.
	 * @param {Object} params - Parameters object.
   * @param {Array<(string|number)>} params.member - List of member in name kanji or id.
   * @param {string} params.assetname - Which assetname you want to download.
   * @param {string|number} params.fromid - Start id of asset to download.
   * @param {string|number} params.toid - End id of asset to download.
   * @param {string|number} params.member - List of member in name kanji or id.
   * @param {string} params.color - Nogikoi card has color. Pink, blue, or green.
   * @param {string} params.star - Nogikoi card also has star between 1-8.
   * @param {string} params.seried - Nogikoi sprites has series id for sprites asset.
   * @param {boolean} params.parallel - Activate some asynchronous function.
   * @param {boolean} params.record - Enabling r/w asset record.
   * @return {Promise<void>} - Return download function.
	 */
	async commonImages({ assetname, fromid, toid, member, color, star, series, parallel=false, record=false }) {
		const commonAsset = `${this.appname}_${assetname}`;
		// Generate Urls
		const imagesMetadata = await new AssetPreDownload(this.appname).preDownloadCommonImages({
			assetname: assetname, 
			fromid: fromid,
			toid: toid, 
			member: member, 
			color: color, 
			star: star, 
			series: series, 
			parallel: parallel, 
			record: record 
		});
	  // Generate path local.
	  let { pathLocal } = await new RequestEndpoint(this.appname, assetname).pathnameServerLocal();
	  if (commonAsset === "nogikoi_sprites") {
	    const membersdata = JSON.parse(await readFile(MainConfig.memberDataConfig, "utf8"))["nogizaka46"];
		  const memberdata = (typeof member === "string" && membersdata.nogizaka46.find(mdata => mdata.name === member))
		    ? membersdata.nogizaka46.find(mdata => mdata.name === member) //["nogikoi"]
			  : (typeof member === "number" && membersdata.nogizaka46.find(mdata => mdata.nogikoi === member.toString()))
			  ? membersdata.nogizaka46.find(mdata => mdata.nogikoi === member.toString()) //["nogikoi"]
			  : undefined;
		  pathLocal = path.join(pathLocal, `${memberdata["gen"]}. ${memberdata["name"]}`);
	  };
		// Download commonImage
		const downloadCommonImage = async ({ imageMetadata, task }) => {
			const { url } = imageMetadata;
			const filename = path.basename(new URL(url).pathname);
			const filepath = path.join(pathLocal, filename);
			task.title = i18next.t("general.download.happening", { name: filename.replace(/\.\w{2,4}$/i, "") });
		  if (await access(filepath).then(() => true).catch(() => false)) {
				task.item = i18next.t("general.exist", { name: filename.replace(/\.\w{2,4}$/i, "") });
			  await delay(500)
			  return
		  };
			try {
				const { data } = await axios.get(new URL(url).href, { responseType: "arraybuffer" });
			  await mkdir(path.dirname(filepath), { recursive: true })
		    await writeFile(filepath, Buffer.from(data, "binary"));
			} catch (err) {
        logging.error(err.name);
			  logging.error(err.stack);
			  logging.error(i18next.t("general.download.failed", { name: filename.replace(/\.\w{2,4}$/i, "") }));
			  throw new Error(i18next.t("general.download.failed", { name: filename.replace(/\.\w{2,4}$/i, "") }));
			};
		  if (record) {
				await MainConfig.assetsRecord.write({
			    logpath: path.join(MainConfig.rcdsDir, `assets_record_${commonAsset}`),
			    logstring: filename
			  });
		  };
			task.title = i18next.t("general.download.success", { name: filename.replace(/\.\w{2,4}$/i, "") });
		};
		
		// Listr
		const subtasks = [...imagesMetadata].map(imageMetadata => ({
			title: "",
			task: async (_, task) => {
				await downloadCommonImage({ imageMetadata: imageMetadata, task: task });
				task.title = "";
			}
		}));
		const tasks = new Listr();
		tasks.add({
			title: i18next.t("general.download.happening", { name: i18next.t(`parameters.appname.${this.appname}.title`) }),
			task: async (_, task) => (task.newListr(
			  subtasks,
				{ 
					concurrent: parallel ? 5 : false, 
					exitOnError: false 
				}
			))
		});
		tasks.options = {
			concurrent: parallel,
			renderer: "default",
			rendererOptions: {
				collapseSubtasks: false
			},
			exitOnError: false
		};
		
		if (commonAsset !== "nogikoi_sprites") {
			member = ""
			series = ""
		};
		if (this.appname === "nogikoi") {
			color = ""
			star = ""
		};
		const now = MainConfig.nowTimestamp();
		MainConfig.createBox({
			[i18next.t("parameters.appname.title")]     : i18next.t(`parameters.appname.${this.appname}.title`),
			[i18next.t("parameters.assetname.title")]   : assetname,
			...(fromid ? { [i18next.t("parameters.index.title_fromid")] : fromid } : {}),
			...(toid   ? { [i18next.t("parameters.index.title_toid")]   : toid } : {}),
			...(member ? { [i18next.t("parameters.member.title")]       : member} : {}),
			...(color  ? { [i18next.t("parameters.color.title")]        : color } : {}),
			...(star   ? { [i18next.t("parameters.star.title")]         : star.toString()} : {}),
			...(series ? { [i18next.t("parameters.series.title")]       : series.toString()} : {}),
			[i18next.t("parameters.parallel.title")]    : parallel.toString(),
			[i18next.t("parameters.record.title")]      : record.toString(),
			[i18next.t("parameters.requestedat.title")] : now,		
		});
		if (record) {
			await MainConfig.assetsRecord.write({
			  logpath: path.join(MainConfig.rcdsDir, `assets_record_${commonAsset}`),
			  logstring: now
			});
		};
		await tasks.run().catch(err => logging.error(err.stack))
	};
	
  /**
   * Download hinakoi, sakukoi, and unison catalog.
   * @param {Object} params 
   * @param {string} params.id - Catalog server id.
   * @return {Promise<void>}
   */
	async commonCatalogs({ id }) {
		const catalog = await new AssetPreDownload(this.appname).gameCatalogs({ mode: "generate", id: id })
    if (!catalog) {
	    logging.info(i18next.t("general.dataget.failed", { dataname: "catalog" }));
	    console.info(i18next.t("general.dataget.failed", { dataname: "catalog" }));
	    return;
    };
    const downloadCatalog = async ({ task }) => {
      task.title = i18next.t("general.download.happening", { name: `${this.appname}_catalog_${id}` });
      let { pathLocal } = await new RequestEndpoint(this.appname, "catalog").pathnameServerLocal();
		  await mkdir(pathLocal, { recursive: true });
      await writeFile(path.join(pathLocal, `${this.appname}_catalog_${id}`), catalog);
      task.title = i18next.t("general.download.success", { name: `${this.appname}_catalog_${id}` });
    };
    
		// Listr
		const subtasks = [({
			title: "",
			task: async (_, task) => {
				await downloadCatalog({ task: task });
				task.title = "";
			}
		})];
		const tasks = new Listr();
		tasks.add({
			title: i18next.t("general.download.happening", { name: `${this.appname}_catalog_${id}` }),
			task: async (_, task) => (task.newListr(
			  subtasks,
				{ 
					concurrent: 3, 
					exitOnError: false 
				}
			))
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
		MainConfig.createBox({
			[i18next.t("parameters.appname.title")]     : i18next.t(`parameters.appname.${this.appname}.title`),
			[i18next.t("parameters.assetname.title")]   : `${this.appname}_catalog`,
			[i18next.t("parameters.index.title_id")]    : id,
			[i18next.t("parameters.requestedat.title")] : now,
		});
		
		await tasks.run().catch(err => logging.error(err.stack));
	};
	
	/**
	 * Download common video assets.
	 * @param {Object} params - Parameters object.
   * @param {string} params.assetname - Which assetname you want to download.
   * @param {string|number} params.fromid - Start id of asset to download.
   * @param {string|number} params.toid - End id of asset to download.
   * @param {string|number} params.member - List of member in name kanji or id.
   * @param {string} params.catalogid - Catalog id that appear in server endpoint.
   * @param {boolean} params.disablefilter - Disable some filtering function.
   * @param {boolean} params.parallel - Activate some asynchronous function.
   * @param {boolean} params.record - Enabling r/w asset record.
	 */
	async commonVideos({ assetname, fromid, toid, member, catalogid, disablefilter=false, parallel=false, record=false }) {
		const commonAsset = `${this.appname}_${assetname}`;
		const videosMetadata = await new AssetPreDownload(this.appname).preDownloadCommonVideos({ 
			assetname: assetname, 
			fromid: fromid, 
			toid: toid, 
			member: member, 
			catalogid: catalogid, 
			disablefilter: disablefilter, 
			record: record 
		});
		if (!videosMetadata || !videosMetadata.catalog.length) {
			logging.info(i18next.t("general.dataget.failed", { dataname: i18next.t(`parameters.catalog.title`) })); 
			console.info(i18next.t("general.dataget.failed", { dataname: i18next.t(`parameters.catalog.title`) })); 
			return
		};
		
		const { id, length, catalog } = videosMetadata;
    let { pathServer, pathLocal } = await new RequestEndpoint(this.appname, assetname).pathnameServerLocal();
    pathServer = decodeURIComponent(pathServer).replace("<server_version>", id);
    const membersdata = JSON.parse(await readFile(MainConfig.memberDataConfig, "utf8"));
    const downloadCommonVideo = async ({ catalog, task }) => {
	    let filename = this.appname === "unison" ? path.basename(catalog.code) : `${catalog.id}-${catalog.assetBundleName.replace("/", "-")}.mp4`;
	    let filepath = this.appname === "unison" ? path.join(pathLocal, path.dirname(catalog.code)) : pathLocal;
	    task.title = i18next.t("general.download.happening", { name: filename.replace(/\.\w{2,4}$/i, "") });
	    if (this.appname === "unison") {
		    const member = catalog.code.split("/").pop().match(/_(\d{3})_/) 
		      ? catalog.code.split("/").pop().match(/_(\d{3})_/)[1]
		      : undefined
		    const memberdata = [...membersdata.sakurazaka46, ...membersdata.hinatazaka46].find(mdata => mdata.unison === member)
		      ? [...membersdata.sakurazaka46, ...membersdata.hinatazaka46].find(mdata => mdata.unison === member)
		      : undefined;
        filename = memberdata
          ? path.join(`${memberdata.unison ? memberdata.unison + ". " : ""}${memberdata.name}`, filename)
          : path.join("000. 不特定", filename);
	    };
	    filepath = path.join(filepath, filename)
	    const url = new URL((this.appname === "unison" ? catalog.code : catalog.assetBundleName), `${pathServer}/`).href;
      try {
	      if (await access(filepath).then(() => true).catch(() => false)) {
		      task.title = i18next.t("general.exists", { filename: path.basename(filename) })
		      await delay(500);
		      return
	      };
	      let { data } = await axios.get(url, { responseType: "arraybuffer" });
	      data = Buffer.from(data);
	      if (["sakukoi", "hinakoi"].includes(this.appname)) {
		      let key = data[15];
          for (let i = 0; i < 150; i++) {
            data[i] ^= key;
          };
          const [datahead, dataheadparser] = [
            Buffer.from(data.slice(0, 15), "utf8").filter(byte => ![0x00, 0x18].includes(byte)),
            Buffer.from("ftypmp42", "utf8")
          ];
          if (Buffer.compare(datahead, dataheadparser) !== 0) {
		        task.title = i18next.t("general.notkindof", { filename: path.basename(filename), assetname: assetname })
	          await delay(500);
	          return
          };
	      };
	      await mkdir(path.dirname(filepath), { recursive: true });
	      await writeFile(filepath, data);
      } catch (err) {
	      logging.error(err)
	      logging.error(err.name);
			  logging.error(err.stack);
			  logging.error(i18next.t("general.download.failed", { name: path.basename(filename).replace(/\.\w{2,4}$/i, "") }));
			  throw new Error(i18next.t("general.download.failed", { name: path.basename(filename).replace(/\.\w{2,4}$/i, "") }));
      };
      if (record) {
				await MainConfig.assetsRecord.write({
			    logpath: path.join(MainConfig.rcdsDir, `assets_record_${commonAsset}`),
			    logstring: this.appname === "unison" ? catalog.code : catalog.assetBundleName
			  });
		  };
	    task.title = i18next.t("general.download.success", { name: path.basename(filename).replace(/\.\w{2,4}$/i, "") });
    };
		
		//await downloadCommonVideos({ catalog: catalog[1]})
		// Listr
		const subtasks = [...catalog].map(catalog => ({
			title: "",
			task: async (_, task) => {
				await downloadCommonVideo({ catalog: catalog, task: task });
				task.title = "";
			}
		}));
		const tasks = new Listr();
		tasks.add({
			title: i18next.t("general.download.happening", { name: i18next.t(`parameters.appname.${this.appname}.title`) }),
			task: async (_, task) => (task.newListr(
			  subtasks,
				{ 
					concurrent: parallel ? 5 : false, 
					exitOnError: false 
				}
			))
		});
		tasks.options = {
			concurrent: parallel,
			renderer: "default",
			rendererOptions: {
				collapseSubtasks: false
			},
			exitOnError: false
		};
		const now = MainConfig.nowTimestamp();
		MainConfig.createBox({
			[i18next.t("parameters.appname.title")]                  : i18next.t(`parameters.appname.${this.appname}.title`),
			[i18next.t("parameters.assetname.title")]                : assetname,
			...(fromid    ? { [i18next.t("parameters.index.title_fromid")] : fromid.toString() } : {}),
			...(toid      ? { [i18next.t("parameters.index.title_toid")]   : toid.toString() } : {}),
			...(member    ? { [i18next.t("parameters.member.title")]       : member} : {}),
		  [i18next.t("parameters.catalog.title_id")]               : id,
		  [i18next.t("parameters.catalog.title_length")]           : length.toString(),
		  [i18next.t("parameters.catalog.title_requestedlength")]  : catalog.length.toString(),
		  [i18next.t("parameters.filter.title")]                   : disablefilter ? "false" : "true",
		  [i18next.t("parameters.parallel.title")]                 : parallel.toString(),
			[i18next.t("parameters.record.title")]                   : record.toString(),
			[i18next.t("parameters.requestedat.title")]              : now,		
		});
		if (record) {
			await MainConfig.assetsRecord.write({
			  logpath: path.join(MainConfig.rcdsDir, `assets_record_${commonAsset}`),
			  logstring: now
			});
		};
		await tasks.run().catch(err => logging.error(err.stack));
	};
	
	/**
	 * Download Usm assets.
	 * @param {Object} params - Parameters object.
   * @param {string} params.assetname - Which assetname you want to download.
   * @param {string|number} params.fromid - Start id of asset to download.
   * @param {string|number} params.toid - End id of asset to download.
   * @param {boolean} params.parallel - Activate some asynchronous function.
   * @param {boolean} params.record - Enabling r/w asset record.
   * @return {Promise<void>>}
	 */
	async commonUsms({ assetname, fromid, toid, parallel=false, record=false }) {
		const commonAsset = `${this.appname}_${assetname}`;
		// Generate Urls
		const usmsMetadata = await new AssetPreDownload(this.appname).preDownloadCommonUsms({
			assetname: assetname, 
			fromid: fromid,
			toid: toid, 
			parallel: parallel, 
			record: record 
		});
		const { pathLocal } = await new RequestEndpoint(this.appname, assetname).pathnameServerLocal();
	  const sys = await python("sys");
	  const sysPath = await sys.path
	  await sysPath.append(MainConfig.python_modules);
	  const PyCriCodecs = await python("PyCriCodecs").catch(err => {
		  logging.error(err);
		  logging.error(i18next.t("general.install.deps_notinstalled", { name: "PyCriCodecs" }));
		  console.error(i18next.t("general.install.deps_notinstalled", { name: "PyCriCodecs" }));
	  });
		const downloadCommonUsms = async ({ usmMetadata, task }) => {
			const { url, size } = usmMetadata;
			const filename = path.basename(new URL(url).pathname).replace(/\.\w{2,4}$/i, ".mp4");
			const filepath = path.join(pathLocal, filename);
			const temppath = path.join(MainConfig.tempDir, path.basename(new URL(url).pathname).replace(/\.\w{2,4}$/i, ""));
			const tempfile = path.join(temppath, path.basename(new URL(url).pathname));
			if (await access(filepath).then(() => true).catch(() => false)) {
				task.item = i18next.t("general.exist", { name: filename.replace(/\.\w{2,4}$/i, "") });
				await delay(500)
			  return 
			};
			try {
				task.title = i18next.t("general.temporary.create");
				if (await access(temppath).then(() => false).catch(() => true)) {
					await mkdir(temppath, { recursive: true });
				};
        if (await access(tempfile).then(() => false).catch(() => true) || (await stat(tempfile)).size !== parseInt(size)) {
				  const { data } = await axios.get(url, { responseType: "arraybuffer" });
				  await writeFile(tempfile, Buffer.from(data, "binary"));
        };
				task.title = i18next.t("general.demux");
				const usm = await PyCriCodecs.USM$(tempfile, { key: 0x0013F11BC5510101 });
				await usm.extract$({ dirname: temppath }).catch(err => {
					console.error(err);
					logging.error(err);
				});
				task.title = i18next.t("general.convert");
        const audiopath = (await MainConfig.listFileRecursive(temppath)).filter(item => path.basename(item).endsWith(".avi")).pop();
				const videopath = (await MainConfig.listFileRecursive(temppath)).filter(item => !path.basename(item).endsWith(".avi") && !path.basename(item).endsWith(".usme")).pop();
				if (await access(path.dirname(filepath)).then(() => false).catch(() => true)) {
					await mkdir(path.dirname(filepath), { recursive: true });
				};
				const ffmpegArguments = audiopath
				  ? ["-i", videopath, "-i", audiopath, "-c:v", "copy", "-ab", "320k", "-c:a:0", "libmp3lame", "-y", filepath]
				  : ["-i", videopath, "-c:v", "copy", "-y", filepath]
				await MainConfig.run(ffmpegPath, ffmpegArguments);
				task.title = i18next.t("general.temporary.delete");
	      if (await access(temppath).then(() => true).catch(() => false)) {
		      await rm(temppath, { recursive: true });
	      };
		  } catch (err) {
			  logging.error(err);
				logging.error(err.name);
			  logging.error(err.stack);
			  logging.error(i18next.t("general.download.failed", { name: filename.replace(/\.\w{2,4}$/i, "") }));
			  throw new Error(i18next.t("general.download.failed", { name: filename.replace(/\.\w{2,4}$/i, "") }));
			};
			if (record) {
				await MainConfig.assetsRecord.write({
			    logpath: path.join(MainConfig.rcdsDir, `assets_record_${commonAsset}`),
			    logstring: filename.replace(/\.\w{2,4}$/i, ".usme")
			  });
		  };
			task.title = i18next.t("general.download.success", { name: filename.replace(/\.\w{2,4}$/i, "") });
		};
		
		// Listr
		const subtasks = [...usmsMetadata].map(usmMetadata => ({
			title: "",
			task: async (_, task) => {
				await downloadCommonUsms({ usmMetadata: usmMetadata, task: task });
				task.title = "";
			}
		}));
		const tasks = new Listr();
		tasks.add({
			title: i18next.t("general.download.happening", { name: i18next.t(`parameters.appname.${this.appname}.title`) }),
			task: async (_, task) => (task.newListr(
			  subtasks,
				{ 
					concurrent: parallel ? 3 : false, 
					exitOnError: false 
				}
			))
		});
		tasks.options = {
			concurrent: parallel,
			renderer: "default",
			rendererOptions: {
				collapseSubtasks: false
			},
			exitOnError: false
		};
		const now = MainConfig.nowTimestamp();
		MainConfig.createBox({
			[i18next.t("parameters.appname.title")]                  : i18next.t(`parameters.appname.${this.appname}.title`),
			[i18next.t("parameters.assetname.title")]                : assetname,
			...(fromid    ? { [i18next.t("parameters.index.title_fromid")] : fromid.toString() } : {}),
			...(toid      ? { [i18next.t("parameters.index.title_toid")]   : toid.toString() } : {}),
      [i18next.t("parameters.parallel.title")]                 : parallel.toString(),
			[i18next.t("parameters.record.title")]                   : record.toString(),
			[i18next.t("parameters.requestedat.title")]              : now,		
		});
		if (record) {
			await MainConfig.assetsRecord.write({
			  logpath: path.join(MainConfig.rcdsDir, `assets_record_${commonAsset}`),
			  logstring: now
			});
		};
		await tasks.run().catch(err => logging.error(err.stack));
	};
	
	/**
	 * Download Cpk assets.
	 * @param {Object} params - Parameters object.
   * @param {string} params.assetname - Which assetname you want to download.
   * @param {string|number} params.fromid - Start id of asset to download.
   * @param {string|number} params.toid - End id of asset to download.
   * @param {string|number} params.member - List of member in name kanji or id.
   * @param {string} params.catalogid - Catalog id that appear in server endpoint.
   * @param {boolean} params.parallel - Activate some asynchronous function.
   * @param {boolean} params.record - Enabling r/w asset record.
   * @return {Promise<void>>}
	 */
	async commonCpks({ assetname, fromid, toid, member, catalogid, parallel=false, record=false }) {
		const commonAsset = `${this.appname}_${assetname}`;
	  const cpksMetadata = await new AssetPreDownload(this.appname).preDownloadCommonCpks({
			assetname: assetname, 
			fromid: fromid, 
			toid: toid, 
			member: member, 
			catalogid: catalogid, 
			parallel: parallel,
			record: record 
	  });
	  const [ id, length, catalog ] = [cpksMetadata.id || "", cpksMetadata.length, this.appname === "nogifes" ? cpksMetadata : cpksMetadata.catalog]
	  const { pathServer, pathLocal } = await new RequestEndpoint(this.appname, assetname).pathnameServerLocal();
		const membersdata = JSON.parse(await readFile(MainConfig.memberDataConfig, "utf8"));
	  const sys = await python("sys");
	  const sysPath = await sys.path
	  await sysPath.append(MainConfig.python_modules);
	  const PyCriCodecs = await python("PyCriCodecs").catch(err => {
		  logging.error(err);
		  logging.error(i18next.t("general.install.deps_notinstalled", { name: "PyCriCodecs" }));
		  console.error(i18next.t("general.install.deps_notinstalled", { name: "PyCriCodecs" }));
		  process.exit(1);
	  });
	  const downloadCommonCpks = async ({ catalog, task }) => {
	    const [url, size] = [catalog.url || new URL(catalog.code, `${decodeURIComponent(pathServer).replace("<server_version>", id)}/`).href, catalog.size || catalog.file_size];
	    let filename = path.basename(new URL(url).pathname).replace(/\.\w{2,4}$/i, ".mp4");
			let filepath = path.join(pathLocal, filename);
			if (this.appname === "unison") {
		    const member = assetname === "live_movie" && catalog.code.split("/").pop().match(/_(\d{3}).cpk$/) 
		      ? catalog.code.split("/").pop().match(/_(\d{3}).cpk$/)[1]
		      : catalog.code.split("/").pop().match(/_(\d{3})_/)
		      ? catalog.code.split("/").pop().match(/_(\d{3})_/)[1]
		      : undefined
		    const memberdata = [...membersdata.sakurazaka46, ...membersdata.hinatazaka46].find(mdata => mdata.unison === member)
		      ? [...membersdata.sakurazaka46, ...membersdata.hinatazaka46].find(mdata => mdata.unison === member)
		      : undefined;
        filename = memberdata
          ? path.join(`${memberdata.unison ? memberdata.unison + ". " : ""}${memberdata.name}`, filename)
          : path.join("000. 不特定", filename);
        filepath = path.join(pathLocal, path.dirname(catalog.code), filename);
	    };
			const temppath = path.join(MainConfig.tempDir, path.basename(new URL(url).pathname).replace(/\.\w{2,4}$/i, ""));
			const tempfile = path.join(temppath, path.basename(new URL(url).pathname));
			let [tempaudio, tempaudiopath] = ["", ""];
			if (commonAsset === "unison_live_movie") {
			  tempaudio = catalog.code.replace(/_(\d{3}).cpk$/, "")
			  tempaudio = tempaudio.replace("video/live_movie/live_movie_", "sound/song/live_music_");
			  tempaudio = `${tempaudio.replace(/\.\w{2,4}$/i, "")}.cpk`
			  tempaudiopath = path.join(temppath, path.basename(tempaudio));
			};
			if (await access(filepath).then(() => true).catch(() => false)) {
				task.item = i18next.t("general.exist", { name: path.basename(filename).replace(/\.\w{2,4}$/i, "") });
				await delay(500)
			  return 
			};
			try {
				task.title = i18next.t("general.temporary.create");
				if (await access(temppath).then(() => false).catch(() => true)) {
					await mkdir(temppath, { recursive: true });
				};
        if (await access(tempfile).then(() => false).catch(() => true) || (await stat(tempfile)).size !== parseInt(size)) {
				  const { data } = await axios.get(url, { responseType: "arraybuffer" });
				  await writeFile(tempfile, Buffer.from(data, "binary"));
        };
        await extractCpk(tempfile, temppath);
        if (tempaudio && await access(tempaudiopath).then(() => false).catch(() => true)) {
			    const url = new URL(tempaudio, `${decodeURIComponent(pathServer).replace("<server_version>", id)}/`).href;
				  const { data } = await axios.get(url, { responseType: "arraybuffer" });
				  await writeFile(tempaudiopath, Buffer.from(data, "binary"));
        };
        await extractCpk(tempaudiopath, temppath)
        task.title = i18next.t("general.demux");
        const key = this.appname === "nogifes" ? 0x0013F11BC5510101 : 0x0000047561F95FCF;
        const usmPath = (await MainConfig.listFileRecursive(temppath)).filter(item => path.basename(item) == "movie" || path.basename(item).endsWith(".usme")).pop();
        const acbPath = (await MainConfig.listFileRecursive(temppath)).filter(item => path.basename(item) == "music" || path.basename(item).endsWith(".acb")).pop();
        const usm = await PyCriCodecs.USM$(usmPath, { key: key });
        await usm.extract$({ dirname: temppath }).catch(err => {
					console.error(err);
					logging.error(err);
				});
        if (acbPath) {
          const acb = await PyCriCodecs.ACB(acbPath);
	        await acb.extract$({ dirname: temppath, decode: true, key: key }).catch(err => {
		        console.error(err);
					  logging.error(err);
				  });
        };
        task.title = i18next.t("general.convert");
        const audiopath = (await MainConfig.listFileRecursive(temppath)).filter(item => path.basename(item).endsWith(".wav") || path.basename(item).endsWith(".sfa")).pop();
				const videopath = (await MainConfig.listFileRecursive(temppath)).filter(item => path.basename(item).endsWith(".264_med") || path.basename(item).endsWith(".ivf")).pop();
        if (await access(path.dirname(filepath)).then(() => false).catch(() => true)) {
					await mkdir(path.dirname(filepath), { recursive: true });
				};
				const ffmpegArguments = audiopath
				  ? ["-i", videopath, "-i", audiopath, "-c:v", "copy", "-ab", "320k", "-c:a:0", "libmp3lame", "-y", filepath]
				  : ["-i", videopath, "-c:v", "copy", "-y", filepath]
				await MainConfig.run(ffmpegPath, ffmpegArguments);
				task.title = i18next.t("general.temporary.delete");
        if (await access(temppath).then(() => true).catch(() => false)) {
		      await rm(temppath, { recursive: true });
	      };
			} catch (err) {
			  logging.error(err);
				logging.error(err.name);
			  logging.error(err.stack);
			  logging.error(i18next.t("general.download.failed", { name: path.basename(filename).replace(/\.\w{2,4}$/i, "") }));
			  throw new Error(i18next.t("general.download.failed", { name: path.basename(filename).replace(/\.\w{2,4}$/i, "") }));
			};
			if (record) {
				await MainConfig.assetsRecord.write({
			    logpath: path.join(MainConfig.rcdsDir, `assets_record_${commonAsset}`),
			    logstring: filename.replace(/\.\w{2,4}$/i, ".usme")
			  });
		  };
			task.title = i18next.t("general.download.success", { name: path.basename(filename).replace(/\.\w{2,4}$/i, "") });
	  };
	  //await downloadCommonCpks({ catalog: catalog[0], task:{} });
		//return
		// Listr
		const subtasks = [...catalog].map(catalog => ({
			title: "",
			task: async (_, task) => {
				await downloadCommonCpks({ catalog: catalog, task: task });
				task.title = "";
			}
		}));
		const tasks = new Listr();
		tasks.add({
			title: i18next.t("general.download.happening", { name: i18next.t(`parameters.appname.${this.appname}.title`) }),
			task: async (_, task) => (task.newListr(
			  subtasks,
				{ 
					concurrent: parallel ? 3 : false, 
					exitOnError: false 
				}
			))
		});
		tasks.options = {
			concurrent: parallel,
			renderer: "default",
			rendererOptions: {
				collapseSubtasks: false
			},
			exitOnError: false
		};
		const now = MainConfig.nowTimestamp();
		
		let isCatalog = this.appname === "nogifes" ? false : true
		
		MainConfig.createBox({
			[i18next.t("parameters.appname.title")]                  : i18next.t(`parameters.appname.${this.appname}.title`),
			[i18next.t("parameters.assetname.title")]                : assetname,
			...(fromid    ? { [i18next.t("parameters.index.title_fromid")] : fromid.toString() } : {}),
			...(toid      ? { [i18next.t("parameters.index.title_toid")]   : toid.toString() } : {}),
      ...(member    ? { [i18next.t("parameters.member.title")]       : member} : {}),
		  ...(isCatalog ? { [i18next.t("parameters.catalog.title_id")]              : id } : {}),
		  ...(isCatalog ? { [i18next.t("parameters.catalog.title_length")]          : length.toString() } : {}),
		  ...(isCatalog ? { [i18next.t("parameters.catalog.title_requestedlength")] : catalog.length.toString() } : {}),
      [i18next.t("parameters.parallel.title")]                 : parallel.toString(),
			[i18next.t("parameters.record.title")]                   : record.toString(),
			[i18next.t("parameters.requestedat.title")]              : now,		
		});
		if (record) {
			await MainConfig.assetsRecord.write({
			  logpath: path.join(MainConfig.rcdsDir, `assets_record_${commonAsset}`),
			  logstring: now
			});
		};
		await tasks.run().catch(err => logging.error(err.stack));
	};
	
	async commonUnitys({ assetname, fromid, toid, member, catalogid, disablefilter=false, parallel=false, record=false }) {
		const commonAsset = `${this.appname}_${assetname}`;
		const unitysMetadata = await new AssetPreDownload(this.appname).preDownloadCommonUnitys({ 
			assetname: assetname, 
			fromid: fromid, 
			toid: toid, 
			member: member, 
			catalogid: catalogid, 
			disablefilter: disablefilter, 
			record: record 
		});
		if (!unitysMetadata || !unitysMetadata.catalog.length) {
			logging.info(i18next.t("general.dataget.failed", { dataname: i18next.t(`parameters.catalog.title`) })); 
			console.info(i18next.t("general.dataget.failed", { dataname: i18next.t(`parameters.catalog.title`) })); 
			return
		};
		
		const { id, length, catalog } = unitysMetadata;
    let { pathServer, pathLocal } = await new RequestEndpoint(this.appname, assetname).pathnameServerLocal();
    pathServer = decodeURIComponent(pathServer).replace("<server_version>", id);
    const membersdata = JSON.parse(await readFile(MainConfig.memberDataConfig, "utf8"));
    const downloadCommonUnity = async ({ catalog, task }) => {
	    let filename = this.appname === "unison" ? path.basename(catalog.code) : `${catalog.id}-${catalog.assetBundleName.replace("/", "-")}.png`;
	    let filepath = this.appname === "unison" ? path.join(pathLocal, path.dirname(catalog.code)) : pathLocal;
	    const url = new URL((this.appname === "unison" ? catalog.code : catalog.assetBundleName), `${pathServer}/`).href;
	    if (this.appname === "unison") {
		    const member = catalog.code.split("/").pop().match(/_(\d{3})_/) 
		      ? catalog.code.split("/").pop().match(/_(\d{3})_/)[1]
		      : undefined
		    const memberdata = [...membersdata.sakurazaka46, ...membersdata.hinatazaka46].find(mdata => mdata.unison === member)
		      ? [...membersdata.sakurazaka46, ...membersdata.hinatazaka46].find(mdata => mdata.unison === member)
		      : undefined;
        filename = memberdata
          ? path.join(`${memberdata.unison ? memberdata.unison + ". " : ""}${memberdata.name}`, filename)
          : path.join("000. 不特定", filename);
	    };
	    filepath = path.join(filepath, filename)
	    task.title = i18next.t("general.download.happening", { name: filename.replace(/\.\w{2,4}$/i, "") });
	    try {
		    if (this.appname === "unison" && await access(filepath).then(() => true).catch(() => false)) {
		      task.title = i18next.t("general.exists", { filename: path.basename(filename) })
		      await delay(500);
		      return
	      };
		    let { data } = await axios.get(url, { responseType: "arraybuffer" });
	      data = Buffer.from(data);
		    if (["sakukoi", "hinakoi"].includes(this.appname)) {
		      let key = data[7];
          for (let i = 0; i < 150; i++) {
            data[i] ^= key;
          };
          const [datahead, dataheadparser] = [
            Buffer.from(data.slice(0, 7), "utf8").filter(byte => ![0x00, 0x18].includes(byte)),
            Buffer.from("UnityFS", "utf8")
          ];
          if (Buffer.compare(datahead, dataheadparser) !== 0) {
		        task.title = i18next.t("general.notkindof", { filename: path.basename(filename).replace(/\.\w{2,4}$/i, ""), assetname: assetname })
	          await delay(500);
	          return
          };
	      };
	      const assets = await UnityJs.load(Array.from(data));
	      for await (const asset of await assets) {
		      const { type, m_Name, image } = await UnityJs.objects(await asset);
		      if (type === "AssetBundle" && ["sakukoi", "hinakoi"].includes(this.appname) && !m_Name.includes("02_card")) {
			      task.title = i18next.t("general.notkindof", { filename: path.basename(filename).replace(/\.\w{2,4}$/i, ""), assetname: assetname })
	          await delay(500);
			      return
		      };
		      if (type === "Texture2D") {
			      if (["sakukoi", "hinakoi"].includes(this.appname)) {
			        const member = this.appname === "sakukoi" && m_Name.match(/^(\d{7}|\d{7}_\d{1})$/)
			          ? m_Name.match(/(?<=\d{3})\d{3}/)[0]
			          : this.appname === "hinakoi" && m_Name.match(/^(\d{8}|\d{8}_\d{1})$/)
			          ? m_Name.match(/(?<=\d{3})\d{3}/)[0]
			          : undefined
			        const memberdata = [...membersdata.sakurazaka46, ...membersdata.hinatazaka46].find(mdata => mdata.gen + mdata[this.appname] === member)
		            ? [...membersdata.sakurazaka46, ...membersdata.hinatazaka46].find(mdata => mdata.gen + mdata[this.appname] === member)
		            : undefined;
		          filename = memberdata
                ? path.join(`${memberdata.gen ? memberdata.gen + ". " : ""}${memberdata.name}`, `${m_Name}.png`)
                : path.join("0. 不特定", `${m_Name}.png`)
			        filepath = path.join(path.dirname(filepath), filename)
			      };
			      if (await access(path.dirname(filepath)).then(() => false).catch(() => true)) {
					    await mkdir(path.dirname(filepath), { recursive: true });
				    };
				    task.title = i18next.t("general.download.happening", { name: path.basename(filepath).replace(/\.\w{2,4}$/i, "") });
			      if (await access(filepath).then(() => false).catch(() => true)) {
				      await image.save(filepath)
				    };
		      };
	      };
	    } catch (err) {
	      logging.error(err)
	      logging.error(err.name);
			  logging.error(err.stack);
			  logging.error(i18next.t("general.download.failed", { name: path.basename(filename).replace(/\.\w{2,4}$/i, "") }));
			  throw new Error(i18next.t("general.download.failed", { name: path.basename(filename).replace(/\.\w{2,4}$/i, "") }));
      };
      if (record) {
				await MainConfig.assetsRecord.write({
			    logpath: path.join(MainConfig.rcdsDir, `assets_record_${commonAsset}`),
			    logstring: this.appname === "unison" ? catalog.code : catalog.assetBundleName
			  });
		  };
	    task.title = i18next.t("general.download.success", { name: path.basename(filename).replace(/\.\w{2,4}$/i, "") });
    };
    
    /*
    for await (const ctlg of catalog) {
      await downloadCommonUnity({ catalog: ctlg, task: {} });
    }
    */
    // Listr
		const subtasks = [...catalog].map(catalog => ({
			title: "",
			task: async (_, task) => {
				await downloadCommonUnity({ catalog: catalog, task: task });
				task.title = "";
			}
		}));
		const tasks = new Listr();
		tasks.add({
			title: i18next.t("general.download.happening", { name: i18next.t(`parameters.appname.${this.appname}.title`) }),
			task: async (_, task) => (task.newListr(
			  subtasks,
				{ 
					concurrent: parallel ? 5 : false, 
					exitOnError: false 
				}
			))
		});
		tasks.options = {
			concurrent: parallel,
			renderer: "default",
			rendererOptions: {
				collapseSubtasks: false
			},
			exitOnError: false
		};
		const now = MainConfig.nowTimestamp();
		MainConfig.createBox({
			[i18next.t("parameters.appname.title")]                  : i18next.t(`parameters.appname.${this.appname}.title`),
			[i18next.t("parameters.assetname.title")]                : assetname,
			...(fromid    ? { [i18next.t("parameters.index.title_fromid")] : fromid.toString() } : {}),
			...(toid      ? { [i18next.t("parameters.index.title_toid")]   : toid.toString() } : {}),
			...(member    ? { [i18next.t("parameters.member.title")]       : member} : {}),
		  [i18next.t("parameters.catalog.title_id")]               : id,
		  [i18next.t("parameters.catalog.title_length")]           : length.toString(),
		  [i18next.t("parameters.catalog.title_requestedlength")]  : catalog.length.toString(),
		  [i18next.t("parameters.filter.title")]                   : disablefilter ? "false" : "true",
		  [i18next.t("parameters.parallel.title")]                 : parallel.toString(),
			[i18next.t("parameters.record.title")]                   : record.toString(),
			[i18next.t("parameters.requestedat.title")]              : now,		
		});
		if (record) {
			await MainConfig.assetsRecord.write({
			  logpath: path.join(MainConfig.rcdsDir, `assets_record_${commonAsset}`),
			  logstring: now
			});
		};
		await tasks.run().catch(err => logging.error(err.stack));
	};
};

await python.exit();
export { AssetDownload };