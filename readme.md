<h1 align="center">Hashinami Cli</h1>

<div align="center">
  <img src="https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E" alt="JavaScript">
</div>

## 🌸 Support Me
<div align="center">
  <a href="https://www.buymeacoffee.com/hashinami"><img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="BuyMeACoffe"></a>
</div>

## 🚀 Description
Improved version of sakamichi-app-ts-cli. A cli tool to download various assets from Sakamichi Apps and Games.
It's still under development and I'll add some features to download assets from other apps later.

## 📝 Requirements
### **Runtime**
- Nodejs >= 18 (Suggested: 20.5.1)

## 🛠️ Installation and Setup
### 🐇 Quick Installation 
Just directly install this app globally using npm.
```shell script
npm i -g hashinami-cli
hashinami-cli -v
```
### 🐢 Manual Installation
1. Clone this repository.
```shell script 
git clone https://github.com/hashinami46/hashinami-cli.git
```
2. Go to cloned app directory and install dependency. After that, build the app. 
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

## 🔐 Setup Credentials
You need to specify the refresh token download mobame assets.
The format is uuid v4. For example "9cdfc60a-63bd-432a-9a3f-3aea8a4f5595" (This is invalid token). 
If you ask me how to obtain that, visit this [link](https://github.com/proshunsuke/colmsg/blob/main/doc%2Fhow_to_get_refresh_token.md). 
You need to relog the app to catch **/signin** form or wait for 1 hour to catch **/update_token** form. 
After you get the refresh_token, insert it using this command
```shell script
# -A can be nogitalk, sakutalk, hinatalk, or asukatalk.
hashinami-cli -A nogitalk --update-token 9cdfc60a-63bd-432a-9a3f-3aea8a4f5595
```

## 🔫 Supported Apps and Usage
### 📕 Sakamichi Blogs
- **Member Blogs Content and Images**
```shell script
Options
-A, --app Appname (nogitalk, sakutalk, hinatalk, or asukatalk).
-T, --type Asset type. Should be blogs.
-M, --member Member name. Optional argument. If you don't specify this, the app will download the latest blogs. You can enter membername in kanji or id. Can be one or more.
-fd, --fromdate yyyy-mm-dd formatted date. Optional argument. From which date you should start.
-td, --todate yyyy-mm-dd formatted date. Optional argument. Until which date you should stop.
--parallel This also doesn't require argument. If you add this argument, some asynchronous function will executed at once.

hashinami-cli -A sakutalk -T blogs
hashinami-cli -A sakutalk -T blogs -M 小島凪紗
```

### 💌 Sakamichi Mobile Messages
- **All Daily Text, Images, Videos, and Call**
```shell script
Options
-A, --app Appname (nogitalk, sakutalk, hinatalk, or asukatalk).
-T, --type Asset type. Required argument. Should be timeline or past_messages.
-M, --member Member name. Optional argument.  If you don't specify this, the app will download the latest messages. You can enter membername in kanji or id. Can be one or more.
-fd, --fromdate yyyy-mm-dd formatted date. Optional argument. From which date you should start.
-td, --todate yyyy-mm-dd formatted date. Optional argument. Until which date you should stop.
--parallel This also doesn't require argument. If you add this argument, some asynchronous function will executed at once.

hashinami-cli -A nogitalk -T timeline -M 柴田柚菜 -fd 2025-02-08 -td 2025-02-11
hashinami-cli -A sakutalk -T past_messages -M 小島凪紗 --parallel
hashinami-cli -A hinatalk -T timeline
```

### ⚙️ Other Arguments
```shell script
Options
-v, --version Show app build version

hashinami-cli -v
```

## 🌍 App Language and Download Directory
You can see the download directory in the app help. 
The default is `/your/home/dir/HASHINAMI/`.
I made this app with 3 language translation. 
The default is en (English). You can change to id (Indonesian), or ja (Japanese). 
You can also change those by adding the environment variable. 
Where to place those variable? You can specify before this app execution or if you're using linux, 
you can add in .bashrc file like this and restart your terminal. 
```
# .bashrc
export HASHINAMI_LANG=<your desired language>
export HASHINAMI_LOCAL_DIR=<your desired path>

# without .bashrc
HASHINAMI_LANG=ja hashinami-cli
HASHINAMI_LOCAL_DIR=/your/desired/path/ hashinami-cli
```

## 🌳 Directory Structure
```shell script
HASHINAMI/
├── .cache/
│   └── logs/
├── Mobame/
└── Blog/
```

## 🪵 Changelog
- v2.0.0
```
• Major Logic update
• Added blogs downloader
• Remove --mobametoday options 
• Added main at package.json
  You can now import the api from this app.
```
- v1.0.1 
```
• Bug Fix
```
- v1.0.0 
```
• First commit
```

## ⭐ Credits
- [Colmsg](https://github.com/proshunsuke/colmsg)
- And all my friends that helps me to maintain and find the issues.

## ©️ License
This application is provided as open source and is offered as-is. The author is not responsible for any damages caused by this application. By using this application, users agree to assume any risks associated with its use.\
This application is provided under the MIT License.

Please be aware of the following items in Article 8 (Prohibited Activities) of the App's Terms of Use:
- (16) Acts of accessing or attempting to access this service by means other than those specified by the company
- (17) Acts of accessing or attempting to access this service using automated methods (including crawlers and similar technologies)