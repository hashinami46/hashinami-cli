import path from "path";
import { MainConfig, logging, i18n } from "../MainConfig.js";

// Available apps list. Might add in the comments later.
const AppsLists = {
	messagesList: [
    "nogitalk",
    "sakutalk",
    "hinatalk",
    "asukatalk",
    // "mizukitalk",
    // "maiyantalk",
    // "centforcetalk",
    // "yodeltalk",
  ],
  gamesList: [
	  "nogifes_1",
    "nogifes_2",
    "nogikoi_1",
    "nogikoi_2",
    "hinakoi",
    "sakukoi",
    "itsunogi",
    "nogifra",
    "unison"
	],
  commonImageList: [
    "nogifes_photo_common",
    "nogifes_movie_card_th",
    "nogifes_bonus_campaign",
    "nogikoi_card_png",
    "nogikoi_card_png_bg",
    "nogikoi_card_jpg",
    "nogikoi_sprites"
	],
	commonVideoList: [
		"sakukoi_movie",
    "hinakoi_movie",
    "unison_chara_movie",
    "unison_card_movie",
    "unison_event_reward_movie"
	],
	commonUnityList: [
	  "nogifes_card",
    "itsunogi_sprites",
    "itsunogi_card",
    "itsunogi_photo",
    //"itsunogi_sound",
    "sakukoi_card",
    "hinakoi_card",
    "nogifra_images",
    "unison_scene_card", 
    "unison_gacha_stamp", 
    "unison_stamp"
	],
	commonUsmList: [
		"nogifes_movie_card",
    "nogifes_reward_movie",
    "nogifra_movies"
	],
	commonCpkList: [
		"nogifes_focus_data_lo",
    "nogifes_focus_data_hi",
    "unison_appeal_movie", 
    "unison_chara_profile",
    "unison_exf_member_movie",
    "unison_fav_rank_cheer", 
    "unison_fav_rank_movie", 
    "unison_gacha_effect_chara", 
    "unison_gacha_effect_pickup", 
    "unison_gacha_movie", 
    "unison_sign_movie", 
    "unison_live_movie", 
    "unison_making_movie",
    "unison_smart_movie", 
    "unison_movie_photo", 
    "unison_drama_bgm", 
    "unison_gacha_bgm", 
    "unison_voice",
    "nogifra_sounds"
	],
	commonConfigList: [
		...["nogitalk",
		    "sakutalk", 
		    "hinatalk", 
		    "asukatalk", 
		    // "mizukitalk",
		    // "maiyantalk",
		    // "centforcetalk",
		    "yodeltalk"]
		 .map(app => [
			`${app}_update_token`,
			`${app}_devices`,
			`${app}_groups`,
			`${app}_members`,
			`${app}_tags`,
			`${app}_announcements`])
		 .flat(),
		...["nogitalk", "sakutalk", "hinatalk"].map(app => [`${app}_blogs`]).flat(),
	],
	commonCatalogList: [
		"sakukoi_catalog", 
		"hinakoi_catalog", 
		"unison_catalog"
	],
};

// Class to generate url and path related.
class RequestEndpoint {
	constructor (appname, assetname = "") {
		this.appname = appname;
		this.assetname = `${appname.replace(/_(1|2)/, "")}_${assetname}`;
	};
	
	// Basepath related
	async basenameServerLocal() {
		if (![...AppsLists.messagesList, ...AppsLists.gamesList].includes(this.appname)) {
			logging.error(i18n.__("app.unavailable", this.appname));
			console.error(i18n.__("app.unavailable", this.appname));
			return
	  };
	  return this.appname === "nogifes_1"
      ? { baseServer: "https://v1static.nogifes.jp", baseLocal: path.join(MainConfig.saveDir, "/Nogifes") }
      : this.appname === "nogifes_2"
      ? { baseServer: "https://v2static.nogifes.jp", baseLocal: path.join(MainConfig.saveDir, "/Nogifes") }
      : this.appname === "nogikoi_1"
      ? { baseServer: "https://prd-content.static.game.nogikoi.jp", baseLocal: path.join(MainConfig.saveDir, "/Nogikoi") }
      : this.appname === "nogikoi_2"
      ? { baseServer: "https://prd-content-gree.static.game.nogikoi.jp", baseLocal: path.join(MainConfig.saveDir, "/Nogikoi") }
      : this.appname === "hinakoi"
      ? { baseServer: "https://prd-content.static.game.hinakoi.jp", baseLocal: path.join(MainConfig.saveDir, "/Hinakoi") }
      : this.appname === "sakukoi"
      ? { baseServer: "https://prod-content.static.game.sakukoi.jp", baseLocal: path.join(MainConfig.saveDir, "/Sakukoi") }
      : this.appname === "itsunogi"
      ? { baseServer: "https://res.nogizaka46-always.emtg.jp", baseLocal: path.join(MainConfig.saveDir, "/Itsunogi") }
      : this.appname === "nogitalk"
      ? { baseServer: "https://api.n46.glastonr.net", baseLocal: path.join(MainConfig.saveDir, "/Mobame/nogizaka46") }
      : this.appname === "sakutalk"
      ? { baseServer: "https://api.s46.glastonr.net", baseLocal: path.join(MainConfig.saveDir, "/Mobame/sakurazaka46") }
      : this.appname === "hinatalk"
      ? { baseServer: "https://api.kh.glastonr.net", baseLocal: path.join(MainConfig.saveDir, "/Mobame/hinatazaka46") }
      : this.appname === "asukatalk"
      ? { baseServer: "https://api.asukasaito.glastonr.net", baseLocal: path.join(MainConfig.saveDir, "/Mobame/saitoasuka") }
      // : this.appname === "mizukitalk"
      // ? { baseServer: "https://api.mizukiyamashita.glastonr.net", baseLocal: path.join(MainConfig.saveDir, "/Mobame/yamashitamizuki") }
      // : this.appname === "maiyantalk"
      // ? { baseServer: "https://api.maishiraishi.glastonr.net", baseLocal: path.join(MainConfig.saveDir, "/Mobame/shiraishimai") }
      // : this.appname === "centforce"
      // ? { baseServer: "https://api.cf.glastonr.net", baseLocal: path.join(MainConfig.saveDir, "/Mobame/centforcetalk") }
      : this.appname === "yodeltalk"
      ? { baseServer: "https://api.ydl.glastonr.net", baseLocal: path.join(MainConfig.saveDir, "/Mobame/yodeltalk") }
      : this.appname === "nogifra"
      ? { baseServer: path.join(MainConfig.tempDir, "/Nogifra"), baseLocal: path.join(MainConfig.saveDir, "/Nogifra") }
      : this.appname === "unison"
      ? { baseServer: "https://cdn-assets.unis-on-air.com", baseLocal: path.join(MainConfig.saveDir, "/Unison") }
      : { baseServer: undefined, baseLocal: undefined };
	};
	
	// Subpath related
	async pathnameServerLocal() {
		const typelist = [
			...AppsLists.commonImageList,
			...AppsLists.commonVideoList,
			...AppsLists.commonUnityList,
			...AppsLists.commonUsmList,
			...AppsLists.commonCpkList,
			...AppsLists.commonConfigList,
			...AppsLists.commonCatalogList
		];
		if (!typelist.includes(this.assetname)) {
			logging.error(i18n.__("asset.unavailable", this.assetname));
			console.error(i18n.__("asset.unavailable", this.assetname));
			return
	  };
	  const { baseServer, baseLocal } = await this.basenameServerLocal();
	  return this.assetname === "nogifes_photo_common"
      ? { pathServer: new URL("/resource/Background/Photo/", baseServer).href, pathLocal: path.join(baseLocal, "/photo_common") }
      : this.assetname === "nogifes_bonus_campaign" 
      ? { pathServer: new URL("/resource/Background/CampaignLoginBonusBackground/", baseServer).href, pathLocal: path.join(baseLocal, "/bonus_campaign") }
      : this.assetname === "nogifes_reward_movie" 
      ? { pathServer: new URL("/resource/Movie/Reward/", baseServer).href, pathLocal: path.join(baseLocal, "/reward_movie") }
      : this.assetname === "nogifes_focus_data_lo"
      ? { pathServer: new URL("/resource/Movie/Focus/", baseServer).href, pathLocal: path.join(baseLocal, "/focus_data") }
      : this.assetname === "nogifes_focus_data_hi"
      ? { pathServer: new URL("/resource/Movie/HighFocusMovie/", baseServer).href, pathLocal: path.join(baseLocal, "/focus_data_high") }
      : this.assetname === "nogifes_movie_card"   
      ? { pathServer: new URL("/resource/Movie/MovieCard/", baseServer).href, pathLocal: path.join(baseLocal, "/movie_card") }
      : this.assetname === "nogifes_movie_card_th"
      ? { pathServer: new URL("/resource/Movie/MovieCard/Thumbnail/", baseServer).href, pathLocal: path.join(baseLocal, "/movie_card_thumbnail") }
      : this.assetname === "nogifes_card"    
      ? { pathServer: new URL("/resource/Android_2017_4_1f1/card/", baseServer).href, pathLocal: path.join(baseLocal, "/card") }
      : this.assetname === "nogikoi_card_png"
      ? { pathServer: new URL("/assets/img/card/mypage/", baseServer).href, pathLocal: path.join(baseLocal, "/card_png") }
      : this.assetname === "nogikoi_card_png_bg"
      ? { pathServer: new URL("/assets/img/card/bg/", baseServer).href, pathLocal: path.join(baseLocal, "/card_png_bg") }
      : this.assetname === "nogikoi_card_jpg"
      ? { pathServer: new URL("/assets/img/card/l/", baseServer).href, pathLocal: path.join(baseLocal, "/card_jpg") }
      : this.assetname === "nogikoi_sprites"   
      ? { pathServer: new URL("/assets/img/member/story", baseServer).href, pathLocal: path.join(baseLocal, "/member") }
      : this.assetname === "itsunogi_sprites"     
      ? { pathServer: new URL("/asset/1.1.453/Android/conciergeimage", baseServer).href, pathLocal: path.join(baseLocal, "/sprite") }
      : this.assetname === "itsunogi_card"        
      ? { pathServer: new URL("/asset/1.1.453/Android/card/card", baseServer).href, pathLocal: path.join(baseLocal, "/card") }
      : this.assetname === "itsunogi_photo"       
      ? { pathServer: new URL("/asset/1.1.453/Android/card/photo", baseServer).href, pathLocal: path.join(baseLocal, "/photo") }
      // : this.assetname === "itsunogi_sound"       
      // ? { pathServer: new URL("/asset/1.1.453/Android/sound/alarm_voice", baseServer).href, pathLocal: path.join(baseLocal, "/alarm_voice") }
      : ["sakukoi_card", "hinakoi_card"].includes(this.assetname)
      ? { pathServer : new URL("/assets/production/<server_version>/Android", baseServer).href, pathLocal : path.join(baseLocal, "/card") }
      : ["sakukoi_movie", "hinakoi_movie"].includes(this.assetname)
      ? { pathServer : new URL("/assets/production/<server_version>/Android", baseServer).href, pathLocal : path.join(baseLocal, "/movie") }
      : ["nogifra_images", "nogifra_sounds", "nogifra_movies"].includes(this.assetname)
      ? { pathServer : path.join(MainConfig.temp_dir, baseServer, this.assetname.split("_")[1]), pathLocal : path.join(MainConfig.saveDir, baseLocal, this.assetname.split("_")[1]) }
      : this.assetname !== "unison_catalog" && this.assetname.includes("unison")
      ? { pathServer : new URL("/client_assets/<server_version>/Android", baseServer).href, pathLocal : baseLocal }
      : AppsLists.commonConfigList.includes(this.assetname)
      ? { pathServer : new URL(`/v2/${this.assetname.replace(`${this.appname}_`, "")}`, baseServer).href, pathLocal : this.assetname.includes("blogs") ? baseLocal.replace("Mobame", "Blog") : baseLocal }
      : ["sakukoi_catalog", "hinakoi_catalog"].includes(this.assetname)
      ? { pathServer : new URL("/assets/production/<server_version>/Android/catalog.bytes", baseServer).href, pathLocal : MainConfig.ctlgDir }
      : this.assetname === "unison_catalog"
      ? { pathServer : new URL("/production/<server_version>/Android/assets_masters", "https://cdn-masters.unis-on-air.com").href, pathLocal : MainConfig.ctlgDir }
      : { pathServer: undefined, pathLocal: undefined }
	};
};

export { AppsLists, RequestEndpoint };