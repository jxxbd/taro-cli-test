"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const chokidar = require("chokidar");
const chalk_1 = require("chalk");
const constants_1 = require("../util/constants");
const util_1 = require("../util");
const compileStyle_1 = require("./compileStyle");
const compileScript_1 = require("./compileScript");
const helper_1 = require("./helper");
const entry_1 = require("./entry");
const page_1 = require("./page");
const component_1 = require("./component");
function watchFiles() {
    console.log();
    console.log(chalk_1.default.gray('监听文件修改中...'));
    console.log();
    compileStyle_1.initCompileStyles();
    compileScript_1.initCompileScripts();
    helper_1.initCopyFiles();
    const { sourceDir, outputDir, sourceDirName, projectConfig, outputFilesTypes, appConfig, nodeModulesPath, npmOutputDir, entryFileName, entryFilePath, buildAdapter, appPath } = helper_1.getBuildData();
    const dependencyTree = helper_1.getDependencyTree();
    const isQuickApp = buildAdapter === "quickapp" /* QUICKAPP */;
    const watcherPaths = [path.join(sourceDir)].concat(projectConfig.watcher || []);
    const watcher = chokidar.watch(watcherPaths, {
        ignored: /(^|[/\\])\../,
        persistent: true,
        ignoreInitial: true
    });
    watcher
        .on('addDir', dirPath => {
        console.log(dirPath);
    })
        .on('add', filePath => {
        console.log(filePath);
    })
        .on('change', (filePath) => __awaiter(this, void 0, void 0, function* () {
        const extname = path.extname(filePath);
        const componentsNamedMap = component_1.getComponentsNamedMap();
        // 编译JS文件
        if (constants_1.REG_SCRIPT.test(extname) || constants_1.REG_TYPESCRIPT.test(extname)) {
            if (entryFilePath === filePath) {
                util_1.printLog("modify" /* MODIFY */, '入口文件', `${sourceDirName}/${entryFileName}.js`);
                const config = yield entry_1.buildEntry();
                // TODO 此处待优化
                if ((util_1.checksum(JSON.stringify(config.pages)) !== util_1.checksum(JSON.stringify(appConfig.pages))) ||
                    (util_1.checksum(JSON.stringify(config.subPackages || config['subpackages'] || {})) !== util_1.checksum(JSON.stringify(appConfig.subPackages || appConfig['subpackages'] || {})))) {
                    helper_1.setAppConfig(config);
                    yield page_1.buildPages();
                }
            }
            else {
                const filePathWithoutExt = filePath.replace(extname, '');
                if (helper_1.isFileToBePage(filePath)) { // 编译页面
                    filePath = filePathWithoutExt;
                    filePath = filePath.replace(path.join(sourceDir) + path.sep, '');
                    filePath = filePath.split(path.sep).join('/');
                    util_1.printLog("modify" /* MODIFY */, '页面文件', `${sourceDirName}/${filePath}`);
                    yield page_1.buildSinglePage(filePath);
                }
                else if (helper_1.isComponentHasBeenBuilt(filePath)) { // 编译组件
                    let outoutShowFilePath = filePath.replace(appPath + path.sep, '');
                    outoutShowFilePath = outoutShowFilePath.split(path.sep).join('/');
                    util_1.printLog("modify" /* MODIFY */, '组件文件', outoutShowFilePath);
                    helper_1.deleteHasBeenBuiltComponent(filePath);
                    if (constants_1.isWindows) {
                        yield new Promise((resolve, reject) => {
                            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                                yield component_1.buildSingleComponent(Object.assign({
                                    path: filePath
                                }, componentsNamedMap.get(filePath)));
                                resolve();
                            }), 300);
                        });
                    }
                    else {
                        yield component_1.buildSingleComponent(Object.assign({
                            path: filePath
                        }, componentsNamedMap.get(filePath)));
                    }
                }
                else {
                    let isImported = false;
                    dependencyTree.forEach((dependencyTreeItem) => {
                        if (dependencyTreeItem) {
                            const scripts = dependencyTreeItem.script;
                            if (scripts.indexOf(filePath) >= 0) {
                                isImported = true;
                            }
                        }
                    });
                    let modifySource = filePath.replace(appPath + path.sep, '');
                    modifySource = modifySource.split(path.sep).join('/');
                    if (isImported) {
                        util_1.printLog("modify" /* MODIFY */, 'JS文件', modifySource);
                        yield compileScript_1.compileDepScripts([filePath], !isQuickApp);
                    }
                    else {
                        util_1.printLog("warning" /* WARNING */, 'JS文件', `${modifySource} 没有被引用到，不会被编译`);
                    }
                }
            }
        }
        else if (constants_1.REG_STYLE.test(extname)) {
            const includeStyleJSPath = [];
            dependencyTree.forEach((dependencyTreeItem, key) => {
                const styles = dependencyTreeItem['style'] || [];
                styles.forEach(item => {
                    if (item === filePath) {
                        includeStyleJSPath.push({
                            filePath: key,
                            styles
                        });
                    }
                });
            });
            if (includeStyleJSPath.length) {
                includeStyleJSPath.forEach((item) => __awaiter(this, void 0, void 0, function* () {
                    let outputWXSSPath = item.filePath.replace(path.extname(item.filePath), outputFilesTypes.STYLE);
                    let modifySource = outputWXSSPath.replace(appPath + path.sep, '');
                    modifySource = modifySource.split(path.sep).join('/');
                    util_1.printLog("modify" /* MODIFY */, '样式文件', modifySource);
                    if (constants_1.NODE_MODULES_REG.test(outputWXSSPath)) {
                        outputWXSSPath = outputWXSSPath.replace(nodeModulesPath, npmOutputDir);
                    }
                    else {
                        outputWXSSPath = outputWXSSPath.replace(sourceDir, outputDir);
                    }
                    let modifyOutput = outputWXSSPath.replace(appPath + path.sep, '');
                    modifyOutput = modifyOutput.split(path.sep).join('/');
                    if (constants_1.isWindows) {
                        yield new Promise((resolve, reject) => {
                            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                                yield compileStyle_1.compileDepStyles(outputWXSSPath, item.styles);
                                resolve();
                            }), 300);
                        });
                    }
                    else {
                        yield compileStyle_1.compileDepStyles(outputWXSSPath, item.styles);
                    }
                    util_1.printLog("generate" /* GENERATE */, '样式文件', modifyOutput);
                }));
            }
            else {
                let outputWXSSPath = filePath.replace(path.extname(filePath), outputFilesTypes.STYLE);
                let modifySource = outputWXSSPath.replace(appPath + path.sep, '');
                modifySource = modifySource.split(path.sep).join('/');
                util_1.printLog("modify" /* MODIFY */, '样式文件', modifySource);
                if (constants_1.NODE_MODULES_REG.test(outputWXSSPath)) {
                    outputWXSSPath = outputWXSSPath.replace(nodeModulesPath, npmOutputDir);
                }
                else {
                    outputWXSSPath = outputWXSSPath.replace(sourceDir, outputDir);
                }
                let modifyOutput = outputWXSSPath.replace(appPath + path.sep, '');
                modifyOutput = modifyOutput.split(path.sep).join('/');
                if (constants_1.isWindows) {
                    yield new Promise((resolve, reject) => {
                        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                            yield compileStyle_1.compileDepStyles(outputWXSSPath, [filePath]);
                            resolve();
                        }), 300);
                    });
                }
                else {
                    yield compileStyle_1.compileDepStyles(outputWXSSPath, [filePath]);
                }
                util_1.printLog("generate" /* GENERATE */, '样式文件', modifyOutput);
            }
        }
        else {
            let modifySource = filePath.replace(appPath + path.sep, '');
            modifySource = modifySource.split(path.sep).join('/');
            util_1.printLog("modify" /* MODIFY */, '文件', modifySource);
            helper_1.copyFilesFromSrcToOutput([filePath]);
        }
        compileStyle_1.initCompileStyles();
        compileScript_1.initCompileScripts();
        helper_1.initCopyFiles();
    }));
}
exports.watchFiles = watchFiles;
