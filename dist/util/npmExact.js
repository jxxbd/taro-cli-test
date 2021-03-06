"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const resolve_npm_files_1 = require("./resolve_npm_files");
const constants_1 = require("./constants");
const index_1 = require("./index");
const notExistNpmList = new Set();
function getNpmOutputDir(outputDir, configDir, npmConfig) {
    let npmOutputDir;
    if (!npmConfig.dir) {
        npmOutputDir = path.join(outputDir, npmConfig.name);
    }
    else {
        npmOutputDir = path.join(path.resolve(configDir, '..', npmConfig.dir), npmConfig.name);
    }
    return npmOutputDir;
}
exports.getNpmOutputDir = getNpmOutputDir;
function getExactedNpmFilePath({ npmName, sourceFilePath, filePath, isProduction, npmConfig, buildAdapter, root, npmOutputDir, compileInclude, env, uglify, babelConfig }) {
    try {
        const nodeModulesPath = index_1.recursiveFindNodeModules(path.join(root, constants_1.NODE_MODULES));
        const npmInfo = resolve_npm_files_1.resolveNpmFilesPath({
            pkgName: npmName,
            isProduction,
            npmConfig,
            buildAdapter,
            root,
            rootNpm: nodeModulesPath,
            npmOutputDir,
            compileInclude,
            env,
            uglify,
            babelConfig
        });
        const npmInfoMainPath = npmInfo.main;
        let outputNpmPath;
        if (constants_1.REG_STYLE.test(npmInfoMainPath)
            || constants_1.REG_FONT.test(npmInfoMainPath)
            || constants_1.REG_MEDIA.test(npmInfoMainPath)
            || constants_1.REG_IMAGE.test(npmInfoMainPath)) {
            outputNpmPath = npmInfoMainPath;
            filePath = sourceFilePath;
        }
        else {
            outputNpmPath = npmInfoMainPath.replace(nodeModulesPath, npmOutputDir);
        }
        if (buildAdapter === "alipay" /* ALIPAY */) {
            outputNpmPath = outputNpmPath.replace(/@/g, '_');
        }
        const relativePath = path.relative(filePath, outputNpmPath);
        return index_1.promoteRelativePath(relativePath);
    }
    catch (err) {
        console.log(err);
        notExistNpmList.add(npmName);
        return npmName;
    }
}
exports.getExactedNpmFilePath = getExactedNpmFilePath;
function getNotExistNpmList() {
    return notExistNpmList;
}
exports.getNotExistNpmList = getNotExistNpmList;
