#!/usr/bin/env node

import dedent from "dedent";
import SmartWrap from "smartwrap";
import { Command } from "commander";

import { MainConfig, i18n } from "./MainConfig.js";
import { AppsLists } from "./RequestHandler/RequestEndpoint.js";
import { RequestAttribute } from "./RequestHandler/RequestAttribute.js";
import { AssetPreDownload } from "./AssetHandler/AssetPreDownload.js";
import { AssetDownload } from "./AssetHandler/AssetDownload.js";

const program = new Command()
program
  .name(MainConfig.appName)
  .usage("[options] args")
  .description(dedent`
  ${i18n.__("param.progsdesc")}
    - Sakamichi Mobame (${i18n.__("app.name.mobame")})
    - Saito Asuka Mobame (${i18n.__("app.name.mobame")})
  
  ${i18n.__("param.downloaddir")} ${MainConfig.saveDir}
  ${i18n.__("param.author")} ${MainConfig.appAuthor}
  
  ${i18n.__("param.progsearlywarn")}
  `)
  .on("--help", () => { 
  console.log("\n")
  console.log(dedent`
  ${i18n.__("param.progsfulldocs")}
    ${MainConfig.appRepository}
  
  ${i18n.__("param.progssample")}
    hashinami-app -A nogitalk -T timeline -M 柴田柚菜 -fd 2025-02-08 -td 2025-02-11
    hashinami-app -A nogitalk -T past_messages -M 柴田柚菜
  `)})
  .option("-A, --app <app>", SmartWrap(i18n.__("param.optsapp"), { width: 60 }))
  .option("-T, --type <type>", SmartWrap(i18n.__("param.optstype"), { width: 60 }))
  .option("-M, --member <member...>", SmartWrap(i18n.__("param.optsmember"), { width: 60 }))
  .option("-fd, --fromdate <fromdate>", SmartWrap(i18n.__("param.optsdate"), { width: 60 }))
  .option("-td, --todate <todate>", SmartWrap(i18n.__("param.optsdate"), { width: 60 }))
  .option("-rt, --refresh-token <refreshtoken>", SmartWrap(i18n.__("param.optsrefreshtoken"), { width: 60 }))
  .option("--parallel", SmartWrap(i18n.__("param.optsparallel"), { width: 60 }))
  .version(MainConfig.appVersion, "-v, --version", SmartWrap(i18n.__("param.optsversion"), { width: 60 }))
  .helpOption("-h, --help", SmartWrap(i18n.__("param.optshelp"), { width: 60 }))
  .parse(process.argv);
  
if (!process.argv.slice(2).length) {
  program.outputHelp();
  process.exit(0);
};
const opts = program.opts();
// const args = program.args;

if (opts.app && AppsLists.messagesList.includes(opts.app)) {
	if (opts.refreshToken) {
		await new RequestAttribute(opts.app).authToken({ mode: "write", refresh_token: opts.refreshToken });
		console.log(i18n.__("credentials.acctokenupdated", opts.app))
    process.exit(0);
	};
	if (opts.type === "blogs") {
    await new AssetDownload(opts.app).commonBlogs({ member: opts.member, fromdate: opts.fromdate, todate: opts.todate, parallel: opts.parallel })
    process.exit(0);
	};
	if ((opts.fromdate || opts.todate) && (!opts.member || !opts.type)) {
		console.error(i18n.__("param.optsmember"));
		console.error(i18n.__("param.optstype"));
    process.exit(1);
	};
	if ((opts.type === "timeline" && !opts.member)) {
	  const groupdata = await new AssetPreDownload(opts.app, "groups").mobameData({ assetname: "groups" });
		const member = groupdata
		  .filter(item => item.subscription && item.subscription.state === "active")
		  .map(item => item.id);
	  await new AssetDownload(opts.app, "messages").commonMessages({ mode: "timeline", member: member, parallel: opts.parallel })
    process.exit(0);
	};
	await new AssetDownload(opts.app, "messages").commonMessages({ mode: opts.type, member: opts.member, fromdate: opts.fromdate, todate: opts.todate, parallel: opts.parallel })
  process.exit(0);
} else {
	console.log(i18n.__("app.notfound", opts.app))
  process.exit(0);
};