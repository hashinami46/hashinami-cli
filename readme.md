<h1 align="center">Hashinami CLI</h1>

<div align="center">
  <img src="https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E" alt="JavaScript">
</div>

<div align="center">
  <img style={{marginRight: "5px", marginLeft: "5px"}} src="https://img.shields.io/npm/v/hashinami-cli?logo=npm&logoColor=cb3837" alt="npm version" />
  <img style={{marginRight: "5px", marginLeft: "5px"}} src="https://img.shields.io/npm/dw/hashinami-cli?logo=npm&logoColor=cb3837" alt="npm download total" />
  <img style={{marginRight: "5px", marginLeft: "5px"}} src="https://github.com/hashinami46/hashinami-cli/actions/workflows/npm-publish.yml/badge.svg" alt="github build status" />
</div>

# Support Me

<div align="center">
  <a href="https://www.buymeacoffee.com/hashinami"><img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="BuyMeACoffe"></a>
</div>

# Table of Contents

<!-- toc -->

- [Intro](#intro)
  * [Description](#description)
  * [Motivation](#motivation)
  * [Features](#features)
- [Installation and Setup](#installation-and-setup)
  * [Requirements](#requirements)
    + [Runtime](#runtime)
    + [Python Dependencies](#python-dependencies)
  * [Installation](#installation)
    + [Quick Installation](#quick-installation)
    + [Manual Installation](#manual-installation)
    + [Developer Installation](#developer-installation)
  * [Setup](#setup)
    + [Setting Up Credentials](#setting-up-credentials)
    + [Setting Up Python Dependencies](#setting-up-python-dependencies)
    + [Downloading Catalog](#downloading-catalog)
    + [Available Environment Variable](#available-environment-variable)
- [Supported Apps and Usage](#supported-apps-and-usage)
  * [Available Assets](#available-assets)
  * [Apps](#apps)
    + [Sakamichi Blogs](#sakamichi-blogs)
    + [Sony Music Message Apps](#sony-music-message-apps)
  * [Games](#games)
    + [乃木坂46リズムフェスティバル (Nogifes)](#%E4%B9%83%E6%9C%A8%E5%9D%8246%E3%83%AA%E3%82%BA%E3%83%A0%E3%83%95%E3%82%A7%E3%82%B9%E3%83%86%E3%82%A3%E3%83%90%E3%83%AB-nogifes)
    + [乃木恋～坂道の下であの日僕は恋をした (Nogikoi)](#%E4%B9%83%E6%9C%A8%E6%81%8B%E5%9D%82%E9%81%93%E3%81%AE%E4%B8%8B%E3%81%A7%E3%81%82%E3%81%AE%E6%97%A5%E5%83%95%E3%81%AF%E6%81%8B%E3%82%92%E3%81%97%E3%81%9F-nogikoi)
    + [サクコイとひなこい (Sakukoi & Hinakoi)](#%E3%82%B5%E3%82%AF%E3%82%B3%E3%82%A4%E3%81%A8%E3%81%B2%E3%81%AA%E3%81%93%E3%81%84-sakukoi--hinakoi)
    + [ユニゾンエアー (Unison)](#%E3%83%A6%E3%83%8B%E3%82%BE%E3%83%B3%E3%82%A8%E3%82%A2%E3%83%BC-unison)
  * [Directory Structure](#directory-structure)
- [JavaScript Api](#javascript-api)
  * [Namespace AppsLists](#namespace-appslists)
    + [Properties](#properties)
      - [`messagesList`](#messageslist)
      - [`gamesList`](#gameslist)
      - [`commonImageList`](#commonimagelist)
      - [`commonVideoList`](#commonvideolist)
      - [`commonUnityList`](#commonunitylist)
      - [`commonUsmList`](#commonusmlist)
      - [`commonCpkList`](#commoncpklist)
      - [`commonConfigList`](#commonconfiglist)
      - [`commonCatalogList`](#commoncataloglist)
  * [Class RequestEndpoint](#class-requestendpoint)
    + [Constructors](#constructors)
      - [`constructor(appname, assetname)`](#constructorappname-assetname)
    + [Methods](#methods)
      - [`basenameServerLocal()`](#basenameserverlocal)
      - [`pathnameServerLocal()`](#pathnameserverlocal)
  * [Class RequestAttribute](#class-requestattribute)
    + [Constructors](#constructors-1)
      - [`constructor(appname)`](#constructorappname)
    + [Methods](#methods-1)
      - [`authToken({ mode, refresh_token, access_token })`](#authtoken-mode-refresh_token-access_token-)
      - [`customHeader({ access_token })`](#customheader-access_token-)
  * [Class AssetPreDownload](#class-assetpredownload)
    + [Constructors](#constructors-2)
      - [`constructor(appname)`](#constructorappname-1)
    + [Methods](#methods-2)
      - [`mobameData({ assetname })`](#mobamedata-assetname-)
      - [`mobameMessages({ mode, member, from, to, parallel })`](#mobamemessages-mode-member-from-to-parallel-)
      - [`mobameBlogs({ member, fromdate, todate })`](#mobameblogs-member-fromdate-todate-)
      - [`gameCatalogs({ mode, id })`](#gamecatalogs-mode-id-)
      - [`preDownloadCommonImages({ assetname, fromid, toid, member, color, star, series, parallel, record })`](#predownloadcommonimages-assetname-fromid-toid-member-color-star-series-parallel-record-)
      - [`preDownloadCommonVideos({ assetname, fromid, toid, member, catalogid, disablefilter, record })`](#predownloadcommonvideos-assetname-fromid-toid-member-catalogid-disablefilter-record-)
      - [`preDownloadCommonUsms({ assetname, fromid, toid, parallel, record})`](#predownloadcommonusms-assetname-fromid-toid-parallel-record)
      - [`preDownloadCommonCpks({ assetname, fromid, toid, member, catalogid, parallel, record })`](#predownloadcommoncpks-assetname-fromid-toid-member-catalogid-parallel-record-)
      - [`preDownloadCommonUnitys({ assetname, fromid, toid, member, catalogid, disablefilter, record })`](#predownloadcommonunitys-assetname-fromid-toid-member-catalogid-disablefilter-record-)
- [Miscellaneous](#miscellaneous)
  * [To do List](#to-do-list)
  * [Credits](#credits)
  * [License](#license)

<!-- tocstop -->

# Intro
## Description
Improved version of sakamichi-app-ts-cli. A cli tool to download various assets from Sakamichi Apps and Games. It's still under development and I'll add some features to download assets from other apps later.
## Motivation
Collecting every cuteness from my oshi. I also want to provide an archive for myself. 
So, if my oshi is graduating, I can still see their cute pictures on my disk.
## Features
- Download images, videos, and other assets from Sakamichi Apps and Games.
- Automatic sorting and organizing downloaded assets.
- Support for multiple apps with future updates.
- Multiple language support.

# Installation and Setup
## Requirements
### Runtime
- Nodejs LTS
- Python3

### Python Dependencies
- UnityPy
- PyCriCodecs

## Installation
There are two ways of installation. If you're planning to use app to download the asset directly, read quick installation or manual installation. However, if you want to create your own method to download the assets, read developer installation. 

### Quick Installation 
Just directly install this app globally using npm and the app is ready to use.
```shell script
npm i -g hashinami-cli
hashinami-cli -v
```
### Manual Installation
1. Clone this repository.
```shell script 
git clone https://github.com/hashinami46/hashinami-cli.git
```
2. Go to the cloned app directory and install the dependencies. After that, build the app. 
```shell script
# Go to cloned app directory
cd hashinami-cli
# Install dependencies
npm install
# Build app
npm run build
```
3. Run `npm link` and the app is ready to use.
```shell script
# Link to global package
npm link
hashinami-cli -v
```

### Developer Installation
**A. Git clone method**
1. Clone this repository.
```shell script 
git clone https://github.com/hashinami46/hashinami-cli.git
```
2. Go to the cloned app directory and install the dependencies. After that, build the app. 
```shell script
# Go to cloned app directory
cd hashinami-cli
# Install dependencies
npm install
# Build app
npm run build
```
3. You can add your own method, scripts, etc.

**B. Npm install method**
1. Create a new project
```shell script
mkdir my-project
cd my-project
npm init -y
```
2. Change your project to esm by adding `"type":"module"` to package.json. 
```json title="package.json"
{
	"name": "my-project",
	"type": "module",
	...
}
```
3. Install the app to your current project using npm install. 
```shell script
npm i hashinami-cli
```
4. Create an index.js file and import api that I provided. Example
```js title="index.js"
import { AppsLists } from "hashinami-cli";
console.log(AppsList.messagesList);
/* 
  [
    "nogitalk",
    "sakutalk",
    "hinatalk",
    "asukatalk"
  ]
*/
```

## Setup
Here you'll learn how to setup this app. I'll show you how to obtain refresh token, change download directory and change language. Read until the end!
### Setting Up Credentials

> [!CAUTION]
> Actually, this is prohibited to share since it's gathering sensitive information data such as credentials. The app already told you not to messed up. So, if you want to continue, I'm not responsible with the damage that you caused.

You need to specify the refresh token to download mobame assets. The format is uuid v4. For example "9cdfc60a-63bd-432a-9a3f-3aea8a4f5595" (This is invalid token). If you ask me how to obtain that, visit this [link](https://github.com/proshunsuke/colmsg/blob/main/doc%2Fhow_to_get_refresh_token.md). You need to relog the app to catch **/signin** form or wait for 1 hour to catch **/update_token** form. After you get the refresh_token, insert it using this command
```shell script
# -A can be nogitalk, sakutalk, hinatalk, asukatalk, maiyantalk, mizukitalk, centforcetalk, or yodeltalk.
hashinami-cli -A nogitalk --refresh-token 9cdfc60a-63bd-432a-9a3f-3aea8a4f5595
```

### Setting Up Python Dependencies
Basically, this app is just a wrapper to do batch download action. This app still needs some dependencies to extract and decrypt non-playable media to playable one. Especially for Unity assets. I don't find and port or pure JavaScript module version to extract it's assets. So, it's still need Python to keep running. You can automatically install it's dependencies by executing this command
```shell script
hashinami-cli --install-deps
```

### Downloading Catalog

> [!WARNING]
> Catalog is an essential data that contains assets information. Catalog is required if you want to download Sakukoi, Hinakoi, and Unison assets.

The steps to obtain catalog is same as how to obtain refresh_token data. The difference is you only need to capture current server url. For example if you're updating unison game to the latest and do a packet capture, you'll get url server like this "https://cdn-assets.unis-on-air.com/client_assets/20231227133511/". The number **(20231227133511)** in the url is the url version. Finally, download the catalog by executing this command
```shell script
hashinami-cli -A unison -T catalog -C 20231227133511
```

### Available Environment Variable
Some variable such as refresh_token or default language can be overridden by declaring variable before executing this app or store it in the system environment variable. If you're using linux, you can declare the variable in .bashrc file and restart your terminal. However, if you're using windows see [this](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/set_1) for cmd or [this](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables?view=powershell-7.5) for powershell. The available variable is
```bash
# Mobame refresh_token
NOGITALK_REFRESH_TOKEN
SAKUTALK_REFRESH_TOKEN
HINATALK_REFRESH_TOKEN
ASUKATALK_REFRESH_TOKEN
MAIYANTALK_REFRESH_TOKEN
MIZUKITALK_REFRESH_TOKEN
CENTFORCETALK_REFRESH_TOKEN
YODELTALK_REFRESH_TOKEN

# Custom download directory
HASHINAMI_LOCAL_DIR

# Custom language translation
# can be en, ja, or id (default en)
HASHINAMI_LANG
```
Sample with .bashrc
```bash
export HASHINAMI_LOCAL_DIR=<your desired path>
```
Sample without .bashrc
```shell script
HASHINAMI_LOCAL_DIR=<your desired path> hashinami-cli
```

***

# Supported Apps and Usage
## Available Assets
You can check the available assets and member id by adding --cheatsheet after appname.
```shell script
hashinami-cli -A nogifes --cheatsheet
```

## Apps
### Sakamichi Blogs
- **Member Blogs Content and Images**
```shell script
<<COMMENT
Options
-A, --app Appname (nogitalk, sakutalk, hinatalk, or asukatalk).
-T, --type Asset type. Should be blogs.
-M, --member Member name. Optional argument. If you don't specify this, the app will download the latest blogs. You can enter membername in kanji or id. Can be one or more.
-f, --from yyyy-mm-dd formatted date. Optional argument. From which date you should start.
-t, --to yyyy-mm-dd formatted date. Optional argument. Until which date you should stop.
--parallel If you add this argument, some asynchronous function will executed at once.
--cheatsheet Show common usages, member id and available assets.
COMMENT

hashinami-cli -A sakutalk -T blogs --parallel
hashinami-cli -A sakutalk -T blogs -M 小島凪紗 --parallel
```

### Sony Music Message Apps
- **All Daily Text, Images, Videos, and Call**
```shell script
<<COMMENT
Options
-A, --app Appname (nogitalk, sakutalk, hinatalk, asukatalk, maiyantalk, mizukitalk, centforcetalk, or yodeltalk).
-T, --type Asset type. Required argument. Should be timeline or past_messages.
-M, --member Member name. Optional argument. If you don't specify this, the app will download the latest messages. You can enter membername in kanji or id. Can be one or more.
-f, --from yyyy-mm-dd formatted date. Optional argument. From which date you should start.
-t, --to yyyy-mm-dd formatted date. Optional argument. Until which date you should stop.
--parallel If you add this argument, some asynchronous function will executed at once.
--cheatsheet Show common usages, member id and available assets.
COMMENT

hashinami-cli -A nogitalk -T timeline -M 柴田柚菜 -fd 2025-02-08 -td 2025-02-11 --parallel
hashinami-cli -A sakutalk -T past_messages -M 小島凪紗 --parallel
hashinami-cli -A hinatalk -T timeline --parallel
```

## Games
### 乃木坂46リズムフェスティバル (Nogifes)
- **Photos and Movies**
```shell script
<<COMMENT
Options
-A, --app Appname (nogifes).
-T, --type Asset type. Required argument.
-f, --from Required argument. From which index you should start.
-t, --to Required argument. Until which index you should stop.
--record Optional argument. Enabling r/w asset record.
--parallel If you add this argument, some asynchronous function will executed at once.
--cheatsheet Show common usages, member id and available assets.
COMMENT

hashinami-cli -A nogifes -T photo_common -f 00001 -t 00002 --parallel
hashinami-cli -A nogifes -T movie_card_th -f 00001 -t 00002 --parallel
hashinami-cli -A nogifes -T movie_card -f 00001 -t 00002 --parallel
hashinami-cli -A nogifes -T reward_movie -f 00001 -t 00002 --parallel
hashinami-cli -A nogifes -T focus_data -f 00001 -t 00002 --parallel
hashinami-cli -A nogifes -T focus_data_high -f 00001 -t 00002 --parallel
```

### 乃木恋～坂道の下であの日僕は恋をした (Nogikoi)
- **Photos and Cards**
```shell script
<<COMMENT
Options
-A, --app Appname (nogikoi).
-T, --type Asset type. Required argument.
-M, --member Member name. Optional argument. If you want to download nogikoi sprites, this is Required Argument. You can enter membername in kanji or id.
-f, --from Required argument. From which index you should start.
-t, --to Required argument. Until which index you should stop.
--record Optional argument. Enabling r/w asset record.
--parallel If you add this argument, some asynchronous function will executed at once.
--cheatsheet Show common usages, member id and available assets.
COMMENT

hashinami-cli -A nogikoi -T card_png -st 8 -c pink -f 12000 -t 12100 --parallel
hashinami-cli -A nogikoi -T sprites -M 柴田柚菜 -sr 4 -c -f 120 -t 130 --parallel
```

### サクコイとひなこい (Sakukoi & Hinakoi)
- **Cards and Movies**
```shell script
<<COMMENT
Options
-A, --app Appname (sakukoi or hinakoi).
-T, --type Asset type. Required argument.
-f, --from Required argument. From which index you should start.
-t, --to Required argument. Until which index you should stop.
-C, --catalog Optional argument. Choose which catalog you want to use. The default is latest catalog in local.
--disable-filter Optional argument. Enable or disable catalog filtering.
--record Optional argument. Enabling r/w asset record.
--parallel If you add this argument, some asynchronous function will executed at once.
--cheatsheet Show common usages, member id and available assets.
COMMENT

hashinami-cli -A sakukoi -T movie -f 3000 -t 3299 --disablefilter --parallel --record
hashinami-cli -A sakukoi -T card -f 11900 -t 12000 --parallel
hashinami-cli -A hinakoi -T card -f 4000 -t 4299 --parallel --record
```

### ユニゾンエアー (Unison)
- **Images and Movies**
```shell script
<<COMMENT
Options
-A, --app Appname (nogikoi).
-T, --type Asset type. Required argument.
-M, --member Member name. Optional argument. You can enter membername in kanji or id.
-f, --from Required argument. From which index you should start.
-t, --to Required argument. Until which index you should stop.
-C, --catalog Optional argument. Choose which catalog you want to use. The default is latest catalog in local.
--record Optional argument. Enabling r/w asset record.
--parallel If you add this argument, some asynchronous function will executed at once.
--cheatsheet Show common usages, member id and available assets.
COMMENT

hashinami-cli -A unison -T chara_movie -f 1 -t 200 --parallel
hashinami-cli -A unison -T card_movie -M 中嶋優月 -f 1 -t 200 --parallel
```

## Directory Structure
```
HASHINAMI/
├── .cache/
│   ├── logs/
│   └── records/
├── Blog/
├── Hinakoi/
├── Mobame/
├── Nogifes/
├── Nogikoi/
├── Sakukoi/
└── Unison/
```

***

# JavaScript Api
## Namespace AppsLists
- **Description**: Object that store list of apps.

### Properties
```js
import { AppsList } from "hashinami-cli";
console.log(AppsLists.messagesLists);
```
#### `messagesList`
- **Description**: Contains list of available message apps.
- **Type**: `Array<string>`

#### `gamesList`
- **Description**: Contains list of available game apps.
- **Type**: `Array<string>`

#### `commonImageList`
- **Description**: Contains list of available image assets that can be downloaded.
- **Type**: `Array<string>`

#### `commonVideoList`
- **Description**: Contains list of available video assets that can be downloaded.
- **Type**: `Array<string>`

#### `commonUnityList`
- **Description**: Contains list of available unity assets that can be downloaded.
- **Type**: `Array<string>`

#### `commonUsmList`
- **Description**: Contains list of available usm assets that can be downloaded.
- **Type**: `Array<string>`

#### `commonCpkList`
- **Description**: Contains list of available cpk assets that can be downloaded.
- **Type**: `Array<string>`

#### `commonConfigList`
- **Description**: Contains list of available config assets that can be downloaded.
- **Type**: `Array<string>`

#### `commonCatalogList`
- **Description**: Contains list of available catalog assets that can be downloaded.
- **Type**: `Array<string>`

## Class RequestEndpoint
- **Description**: Class to generate url and path related.

### Constructors
#### `constructor(appname, assetname)`
- **Parameters**:
  - `appname`: `string`. Which app you want to get the url and path.
  - `assetname`: `string`. Which app asset you want to get the url and path.
- **Description**: Construct a new instance of `RequestEndpoint`.

### Methods
#### `basenameServerLocal()`
```js
import { RequestEndpoint } from "hashinami-cli";
const { baseServer, baseLocal } = await new RequestEndpoint("nogitalk").basenameServerLocal();
console.log(baseServer, baseLocal);
```
- **Description**: Get base url server or local path storage of the specified app.
- **Return**: `Promise<Object>`.

#### `pathnameServerLocal()`
```js
import { RequestEndpoint } from "hashinami-cli";
const { pathServer, pathLocal } = await new RequestEndpoint("nogitalk", "blogs").pathnameServerLocal();
console.log(pathServer, pathLocal);
```
- **Description**: Get sub url server or local path storage of the specified app.
- **Return**: `Promise<Object>`.

## Class RequestAttribute
- **Description**: Class to generate request header such as token, etc.

### Constructors
#### `constructor(appname)`
- **Parameters**:
  - `appname`: `string`. Which app you want to get the request attribute.
- **Description**: Construct a new instance of `RequestAttribute`.

### Methods
#### `authToken({ mode, refresh_token, access_token })`
```js
import { RequestEndpoint } from "hashinami-cli";
const { refresh_token, access_token } = await RequestAttribute("nogitalk")
  .authToken({
    mode: read 
  });
console.log(refresh_token, access_token);
```
- **Parameters**:
  - `params.mode`: `string`. Should be "read, write, or update".
  - `params.refresh_token`: `string|undefined`. Token to refresh access_token.
  - `params.access_token`: `string|undefined`. Token to access some api.
- **Description**: Read, write, update token or cookies for talk apps.
- **Return**: `Promise<Object|undefined>`.

#### `customHeader({ access_token })`
```js
import { RequestEndpoint } from "hashinami-cli";
const data = await RequestAttribute("nogitalk")
  .customHeader({ 
    access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
  });
console.log(data);
```
- **Parameters**:
  - `params.access_token`: `string|undefined`. Token to access some api.
- **Description**: Generate http header to perform an app request.
- **Return**: `Promise<Object|undefined>`.

## Class AssetPreDownload
- **Description**: Class to prepare download materials.

### Constructors
#### `constructor(appname)`
- **Parameters**:
  - `appname`: `string`. Which app you want to gather the asset.
- **Description**: Construct a new instance of `AssetPreDownload`.

### Methods

#### `mobameData({ assetname })`
```js
import { AssetPreDownload } from "hashinami-cli";
const data = await new AssetPreDownload("nogitalk")
  .mobameData({ 
    assetname: "blogs" 
  });
console.log(data);
```
- **Parameters**:
  - `params.assetname`: `string`. What kind of assets you wanna gather the data.
- **Description**: Get mobame data such as `/blogs`, `/announcements`, `/members`, and `/groups`.
- **Return**: `Promise<Array[]>`.

#### `mobameMessages({ mode, member, from, to, parallel })`
```js
import { AssetPreDownload } from "hashinami-cli";
const data = await new AssetPreDownload("nogitalk")
  .mobameMessages({
    mode: "timeline",
    member: ["柴田柚菜"]
  });
console.log(data);
```
- **Parameters**:
  - `params.mode`: `string`. Choose one between `timeline` or `past_messages`.
  - `params.member`: `Array[]`. List member in kanji or id.
  - `params.from`: `string|undefined`. Optional parameter. Query start date in yyyy-mm-dd or `new Date()` format.
  - `params.to`: `string|undefined`. Optional parameter. Query end date in yyyy-mm-dd or `new Date()` format.
  - `params.parallel`: `boolean`. Optional parameter. Default is `false`. Activate some asynchronous function.
- **Description**: Generate mobame messages list.
- **Return**: `Promise<Array[]>`.

#### `mobameBlogs({ member, fromdate, todate })` 
```js
import { AssetPreDownload } from "hashinami-cli";
const data = await new AssetPreDownload("nogitalk")
  .mobameBlogs({
    member: ["柴田柚菜"] 
  });
console.log(data);
```
- **Parameters**:
  - `params.member`: `Array[]`. List member in kanji or id.
  - `params.fromdate`: `string|undefined`. Optional parameter. Query start date in yyyy-mm-dd or `new Date()` format.
  - `params.todate`: `string|undefined`. Optional parameter. Query end date in yyyy-mm-dd or `new Date()` format.
- **Description**: Generate mobame blogs list.
- **Return**: `Promise<Array[]>`.

#### `gameCatalogs({ mode, id })`
```js
import { AssetPreDownload } from "hashinami-cli";
const data = await new AssetPreDownload("unison")
  .gameCatalogs({
    mode: generate,
    id: "20250228120634"
  });
console.log(data);
```
- **Parameters**:
  - `mode` : `string`. Should be read (from local) or generate (from server).
  - `id` : `string|number`. Server Id.
- **Description**: Generate catalog and return catalog object.
- **Return**: `Promise<Object>`.

#### `preDownloadCommonImages({ assetname, fromid, toid, member, color, star, series, parallel, record })`
```js
import { AssetPreDownload } from "hashinami-cli";
const data = await new AssetPreDownload("nogifes")
  .preDownloadCommonImages({
	  assetname: "photo_common", 
	  fromid: 1,
	  toid: 2, 
	  parallel: true, 
	  record: false 
  });
console.log(data);
```
- **Parameters**:
  - `params.assetname`: `string`. Which assetname you want to download.
  - `params.fromid`: `string|number`. Start id of asset to download.
  - `params.toid`: `string|number`. End id of asset to download.
  - `params.member`: `string|number`. List of member in name kanji or id.
  - `params.color`: `string`. Nogikoi card has color. Pink, blue, or green.
  - `params.star`: `string`. Nogikoi card also has star between 1-8.
  - `params.series`: `string`. Nogikoi sprites has series id for sprites asset.
  - `params.parallel`: `boolean`. Default `false`. Activate some asynchronous function.
  - `params.record`: `boolean`. Default `false`. Enabling r/w asset record.
- **Description**: Prepare common image assets url server.
- **Return**: `Promise<Array<Object>|undefined>`

#### `preDownloadCommonVideos({ assetname, fromid, toid, member, catalogid, disablefilter, record })`
```js
import { AssetPreDownload } from "hashinami-cli";
const data = await new AssetPreDownload("sakukoi")
  .preDownloadCommonVideos({
	  assetname: "movie", 
	  fromid: 11900,
	  toid: 12000, 
	  parallel: true, 
  });
console.log(data);
```
- **Parameters**:
  - `params.assetname`: `string`. Which assetname you want to download.
  - `params.fromid`: `string|number`. Start id of asset to download.
  - `params.toid`: `string|number`. End id of asset to download.
  - `params.member`: `string|number`. List of member in name kanji or id.
  - `params.catalogid`: `string|number`. Catalog Id in local storage.
  - `params.disablefilter`: `boolean`. Default `false`. Disable some filtering function.
  - `params.record`: `boolean`. Default `false`. Enabling r/w asset record.
- **Description**: Prepare common video assets url server.
- **Return**: `Promise<Object|undefined>`.

#### `preDownloadCommonUsms({ assetname, fromid, toid, parallel, record})`
```js
import { AssetPreDownload } from "hashinami-cli";
const data = await new AssetPreDownload("nogifes")
  .preDownloadCommonUsms({
	  assetname: "photo_common", 
	  fromid: 1,
	  toid: 2, 
	  parallel: true, 
	  record: false 
  });
console.log(data);
```
- **Parameters**:
  - `params.assetname`: `string`. Which assetname you want to download.
  - `params.fromid`: `string|number`. Start id of asset to download.
  - `params.toid`: `string|number`. End id of asset to download.
  - `params.member`: `string|number`. List of member in name kanji or id.
  - `params.parallel`: `boolean`. Default `false`. Activate some asynchronous function.
  - `params.record`: `boolean`. Default `false`. Enabling r/w asset record.
- **Description**: Prepare common usm assets url server.
- **Return**: `Promise<Array<Object>|undefined>`

#### `preDownloadCommonCpks({ assetname, fromid, toid, member, catalogid, parallel, record })`
```js
import { AssetPreDownload } from "hashinami-cli";
const data = await new AssetPreDownload("nogifes")
  .preDownloadCommonCpks({
	  assetname: "focus_data_high", 
	  fromid: 1700,
	  toid: 1701, 
	  parallel: true, 
  });
console.log(data);
```
- **Parameters**:
  - `params.assetname`: `string`. Which assetname you want to download.
  - `params.fromid`: `string|number`. Start id of asset to download.
  - `params.toid`: `string|number`. End id of asset to download.
  - `params.member`: `string|number`. List of member in name kanji or id.
  - `params.catalogid`: `string|number`. Catalog Id in local storage.
  - `params.parallel`: `boolean`. Default `false`. Activate some asynchronous function.
  - `params.record`: `boolean`. Default `false`. Enabling r/w asset record.
- **Description**: Prepare common cpk assets url server.
- **Return**: `Promise<Object|undefined>`.

#### `preDownloadCommonUnitys({ assetname, fromid, toid, member, catalogid, disablefilter, record })`
```js
import { AssetPreDownload } from "hashinami-cli";
const data = await new AssetPreDownload("sakukoi")
  .preDownloadCommonUnitys({
	  assetname: "card", 
	  fromid: 11900,
	  toid: 12000, 
	  catalogid: 225022801,
	  disablefilter: true, 
  });
console.log(data);
```
- **Parameters**:
  - `params.assetname`: `string`. Which assetname you want to download.
  - `params.fromid`: `string|number`. Start id of asset to download.
  - `params.toid`: `string|number`. End id of asset to download.
  - `params.member`: `string|number`. List of member in name kanji or id.
  - `params.catalogid`: `string|number`. Catalog Id in local storage.
  - `params.disablefilter`: `boolean`. Default `false`. Disable some filtering function.
  - `params.record`: `boolean`. Default `false`. Enabling r/w asset record.
- **Description**: Prepare common unity assets url server.
- **Return**: `Promise<Object|undefined>`.

***

# Miscellaneous 
## To do List
- [x] Create sony communication messages downloader.
- [x] Create sakamichi blogs downloader.
- [x] Create Nogifes downloader.
- [x] Create Nogikoi downloader.
- [x] Create Sakukoi and Hinakoi downloader.
- [x] Create Unison downloader.
- [ ] Create BokuAo blogs downloader.
- [ ] Create bot for telegram, and another messaging apps.

## Credits
- [Colmsg](https://github.com/proshunsuke/colmsg)
- [UnityPy](https://pypi.org/project/UnityPy/)
- [PyCriCodecs](https://github.com/Youjose/PyCriCodecs) 
- And all my friends that helps me to maintain and find the issues.

## License
This application is provided as open source and is offered as-is. The author is not responsible for any damages caused by this application. By using this application, users agree to assume any risks associated with its use. This application is provided under the MIT License. Please be aware of the following items in Article 8 (Prohibited Activities) of the App's Terms of Use:
- (16) Acts of accessing or attempting to access this service by means other than those specified by the company
- (17) Acts of accessing or attempting to access this service using automated methods (including crawlers and similar technologies)