#!/usr/bin/env node

import SmartWrap from "smartwrap";
import { Command } from "commander";

import { MainConfig, i18next } from "./MainConfig.js";
import { AppsLists } from "./RequestHandler/RequestEndpoint.js";
import { RequestAttribute } from "./RequestHandler/RequestAttribute.js";
import { AssetPreDownload } from "./AssetHandler/AssetPreDownload.js";
import { AssetDownload } from "./AssetHandler/AssetDownload.js";
import { DependencyHandler } from "./DependencyHandler/DependencyHandler.js";

//await new AssetDownload("sakukoi").commonUnitys({ assetname: "card", fromid: 14900, toid: 15100, disablefilter: false, parallel: true, record: false });
//await new AssetDownload("unison").commonUnitys({ assetname: "scene_card", catalogid: "", /*member: "中嶋優月",*/ disablefilter: false, parallel: true, record: false });
//process.exit(0)

const descWidth = 50;
const program = new Command()

program
  .name(MainConfig.appName)
  .usage("[options] <arguments>")
  .description(
	  i18next.t("cli.description", {
		  dir: MainConfig.saveDir,
		  author: MainConfig.appAuthor,
		  repo: MainConfig.appRepository,
	  })
	)
  .option("-A, --app <app>"          , SmartWrap(i18next.t("parameters.appname.cli_opts")   , { width: descWidth }))
  .option("-T, --type <type>"        , SmartWrap(i18next.t("parameters.assetname.cli_opts") , { width: descWidth }))
  .option("-M, --member <member...>" , SmartWrap(i18next.t("parameters.member.cli_opts")    , { width: descWidth }))
  .option("-C, --catalog <catalog>"  , SmartWrap(i18next.t("parameters.catalog.cli_opts")   , { width: descWidth }))
  .option("-f, --from <from>"        , SmartWrap(i18next.t("parameters.index.cli_opts")     , { width: descWidth }))
  .option("-t, --to <to>"            , SmartWrap(i18next.t("parameters.index.cli_opts")     , { width: descWidth }))
  .option("-c, --color <color>"      , SmartWrap(i18next.t("parameters.color.cli_opts")     , { width: descWidth }))
  .option("-st, --star <star>"       , SmartWrap(i18next.t("parameters.star.cli_opts")      , { width: descWidth }))
  .option("-sr, --series <series>"   , SmartWrap(i18next.t("parameters.series.cli_opts")    , { width: descWidth }))
  .option("--refresh-token <token>"  , SmartWrap(i18next.t("credentials.refresh_token.cli_opts"), { width: descWidth }))
  .option("--cheatsheet"             , SmartWrap(i18next.t("parameters.cheatsheet.cli_opts"), { width: descWidth }))
  .option("--disable-filter"         , SmartWrap(i18next.t("parameters.filter.cli_opts")    , { width: descWidth }))
  .option("--parallel"               , SmartWrap(i18next.t("parameters.parallel.cli_opts")  , { width: descWidth }))
  .option("--record"                 , SmartWrap(i18next.t("parameters.record.cli_opts")    , { width: descWidth }))
  .option("--install-deps"           , SmartWrap(i18next.t("parameters.process.name.pythondeps_install"), { width: descWidth }))
  .version(MainConfig.appVersion     , "-v, --version", SmartWrap(i18next.t("parameters.version.cli_opts"), { width: descWidth }))
  .helpOption("-h, --help"           , SmartWrap(i18next.t("parameters.help.cli_opts")      , { width: descWidth }))
	.addHelpText("after", i18next.t("cli.help"))
	.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
  process.exit(0);
};
const opts = program.opts();
// const args = program.args;

if (opts.installDeps) {
	await new DependencyHandler().installPythonDependencies();
	process.exit(0);
};

if (opts.app && AppsLists.messagesList.includes(opts.app)) {
	if (opts.cheatsheet) {
		await MainConfig.cheatSheet({ appname: opts.app });
    process.exit(0);
	};
	if (opts.refreshToken) {
		await new RequestAttribute(opts.app).authToken({ mode: "write", refresh_token: opts.refreshToken });
		console.info(i18next.t("credentials.refresh_token.update.success", { name: opts.app }));
    process.exit(0);
	};
	if (["nogitalk", "sakutalk", "hinatalk"].includes(opts.app) && !/^(timeline|past_messages|blogs)$/.test(opts.type)) {
		console.error(i18next.t("parameters.assetname.wrongassetname_mobamemessagesandblogs"));
    process.exit(1);
	};
	if (!["nogitalk", "sakutalk", "hinatalk"].includes(opts.app) && !/^(timeline|past_messages)$/.test(opts.type)) {
		console.error(i18next.t("parameters.assetname.wrongassetname_mobamemessages"));
    process.exit(1);
	};
	
	opts.member = opts.app === "asukatalk" 
	  ? ["齋藤飛鳥"]
	  : opts.app === "maiyantalk" 
	  ? ["白石麻衣"]
	  : opts.app === "mizukitalk" 
	  ? ["山下美月"]
	  : opts.member;
	
	if ((opts.from || opts.to) && (!opts.member)) {
		console.error(i18next.t("parameters.member.wrongmembertype"));
    process.exit(1);
	};
	if (opts.type === "blogs") {
    await new AssetDownload(opts.app).commonBlogs({ member: opts.member, fromdate: opts.from, todate: opts.to, parallel: opts.parallel })
    process.exit(0);
	};
	if (opts.type === "timeline" && !opts.member) {
	  const groupdata = await new AssetPreDownload(opts.app).mobameData({ assetname: "groups" });
		const member = groupdata
		  .filter(item => item.subscription && item.subscription.state === "active")
		  .map(item => item.id);
	  await new AssetDownload(opts.app).commonMessages({ assetname: "timeline", member: member, parallel: opts.parallel })
    process.exit(0);
	};
	await new AssetDownload(opts.app).commonMessages({ assetname: opts.type, member: opts.member, fromdate: opts.from, todate: opts.to, parallel: opts.parallel })
  process.exit(0);
} else if (opts.app && AppsLists.gamesList.includes(opts.app)) {
	if (opts.cheatsheet) {
		await MainConfig.cheatSheet({ appname: opts.app });
    process.exit(0);
	};
	if (!opts.type) {
		console.error(i18next.t("parameters.assetname.cli_opts"));
		process.exit(1);
	};
	const commonAsset = `${opts.app}_${opts.type}`;
	const commonAssetList = ["Image", "Video", "Unity", "Usm", "Cpk", "Catalog"].flatMap(asset => AppsLists[`common${asset}List`] );
  if (!commonAssetList.includes(commonAsset)) {
	  console.error(i18next.t("parameters.assetname.wrongassetname_assets", { name: opts.name }));
	  process.exit(1);
  };
	if (AppsLists.commonCatalogList.includes(commonAsset)) {
		await new AssetDownload(opts.app).commonCatalogs({ 
			id: opts.catalog 
		});
	  process.exit(0);
	};
	if (AppsLists.commonImageList.includes(commonAsset)) {
	  await new AssetDownload(opts.app).commonImages({
		  assetname: opts.type, 
		  fromid: opts.from,
		  toid: opts.to, 
		  member: opts.member ? opts.member[0] : "", 
		  color: opts.color, 
		  star: opts.star, 
		  series: opts.series, 
		  parallel: opts.parallel, 
	    record: opts.record 
	  });
	  process.exit(0);
	};
	if (AppsLists.commonVideoList.includes(commonAsset)) {
	  await new AssetDownload(opts.app).commonVideos({
		  assetname: opts.type, 
		  fromid: opts.from, 
		  toid: opts.to, 
		  member: opts.member ? opts.member[0] : "",
		  catalogid: opts.catalog,
		  disablefilter: opts.disableFilter,
		  parallel: opts.parallel,
		  record: opts.record
		});
	  process.exit(0);
	};
	if (AppsLists.commonUsmList.includes(commonAsset)) {
	  await new AssetDownload(opts.app).commonUsms({
		  assetname: opts.type, 
		  fromid: opts.from, 
		  toid: opts.to, 
		  parallel: opts.parallel,
		  record: opts.record
		});
	  process.exit(0);
	};
	if (AppsLists.commonCpkList.includes(commonAsset)) {
	  await new AssetDownload(opts.app).commonCpks({
		  assetname: opts.type, 
		  fromid: opts.from, 
		  toid: opts.to, 
		  member: opts.member ? opts.member[0] : "",
		  catalogid: opts.catalog,
		  parallel: opts.parallel,
		  record: opts.record
		});
	  process.exit(0);
	};
	if (AppsLists.commonUnityList.includes(commonAsset)) {
		await new AssetDownload(opts.app).commonUnitys({
		  assetname: opts.type, 
		  fromid: opts.from, 
		  toid: opts.to, 
		  member: opts.member ? opts.member[0] : "",
		  catalogid: opts.catalog,
		  disablefilter: opts.disableFilter,
		  parallel: opts.parallel,
		  record: opts.record
		});
	  process.exit(0);
	};
} else {
	console.error(i18next.t("parameters.appname.notfound", { name: opts.app }));
	console.error(i18next.t("parameters.assetname.notfound", { name: opts.type }));
  process.exit(0);
};