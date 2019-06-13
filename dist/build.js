"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const chalk_1 = require("chalk");
const _ = require("lodash");
const Util = require("./util");

// 默认的几个配置
const config_1 = require("./config");
const constants_1 = require("./util/constants");

// 核心的build方法
// appPath 项目根目录
// buildConfig build的配置，其中包含 type watch port release
function build(appPath, buildConfig) {
    // platform 是 taro build --plugin xx 的值
    const { type, watch, platform, port, release } = buildConfig;

    // path.join(appPath, constants_1.PROJECT_CONFIG) --> 项目根目录下的 config/index.js
    const configDir = require(path.join(appPath, constants_1.PROJECT_CONFIG))(_.merge);
    
    // 指定build 之后生成的项目路径 首先取 项目根目录下的 config 下的 outputRoot 配置项
    // 如果不存在则取默认值
    const outputPath = path.join(appPath, configDir.outputRoot || config_1.default.OUTPUT_DIR);

    // 如果 指定的输出路径对应的文件夹不存在则创建该文件夹
    if (!fs.existsSync(outputPath)) {
        fs.ensureDirSync(outputPath);
    }
    else if (type !== "h5" /* H5 */ && (type !== "quickapp" /* QUICKAPP */ || !watch)) {
        Util.emptyDirectory(outputPath);
    }

    // 根据不同的type类型执行对应的构建脚本
    switch (type) {
        case "h5" /* H5 */:
            buildForH5(appPath, { watch, port });
            break;
        case "weapp" /* WEAPP */:
            buildForWeapp(appPath, { watch });
            break;
        case "swan" /* SWAN */:
            buildForSwan(appPath, { watch });
            break;
        case "alipay" /* ALIPAY */:
            buildForAlipay(appPath, { watch });
            break;
        case "tt" /* TT */:
            buildForTt(appPath, { watch });
            break;
        case "rn" /* RN */:
            buildForRN(appPath, { watch });
            break;
        case "quickapp" /* QUICKAPP */:
            buildForQuickApp(appPath, { watch, port, release });
            break;
        case "qq" /* QQ */:
            buildForQQ(appPath, { watch });
            break;
        case "ui" /* UI */:
            buildForUILibrary(appPath, { watch });
            break;
        case "plugin" /* PLUGIN */:
            buildForPlugin(appPath, {
                watch,
                platform
            });
            break;
        default:
            console.log(chalk_1.default.red('输入类型错误，目前只支持 weapp/swan/alipay/tt/h5/quickapp/rn 七端类型'));
    }
}
exports.default = build;
function buildForWeapp(appPath, { watch }) {
    require('./mini').build(appPath, {
        watch,
        adapter: "weapp" /* WEAPP */
    });
}
function buildForSwan(appPath, { watch }) {
    require('./mini').build(appPath, {
        watch,
        adapter: "swan" /* SWAN */
    });
}
function buildForAlipay(appPath, { watch }) {
    require('./mini').build(appPath, {
        watch,
        adapter: "alipay" /* ALIPAY */
    });
}
function buildForTt(appPath, { watch }) {
    require('./mini').build(appPath, {
        watch,
        adapter: "tt" /* TT */
    });
}
function buildForH5(appPath, buildConfig) {
    require('./h5').build(appPath, buildConfig);
}
function buildForRN(appPath, { watch }) {
    require('./rn').build(appPath, { watch });
}
function buildForQuickApp(appPath, { watch, port, release }) {
    require('./mini').build(appPath, {
        watch,
        adapter: "quickapp" /* QUICKAPP */,
        port,
        release
    });
}
function buildForQQ(appPath, { watch }) {
    require('./mini').build(appPath, {
        watch,
        adapter: "qq" /* QQ */
    });
}
function buildForUILibrary(appPath, { watch }) {
    require('./ui').build(appPath, { watch });
}
function buildForPlugin(appPath, { watch, platform }) {
    const typeMap = {
        ["weapp" /* WEAPP */]: '微信',
        ["alipay" /* ALIPAY */]: '支付宝'
    };
    if (platform !== "weapp" /* WEAPP */ && platform !== "alipay" /* ALIPAY */) {
        console.log(chalk_1.default.red('目前插件编译仅支持 微信/支付宝 小程序！'));
        return;
    }
    console.log(chalk_1.default.green(`开始编译${typeMap[platform]}小程序插件`));
    require('./plugin').build(appPath, { watch, platform });
}
