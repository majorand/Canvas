import node_fs from "node:fs";
import node_path from "node:path";
function _define_property(obj, key, value) {
    if (key in obj) Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
    });
    else obj[key] = value;
    return obj;
}
class BrowserslistError extends Error {
    constructor(message){
        super(message), _define_property(this, "browserslist", void 0);
        this.name = 'BrowserslistError';
        this.browserslist = true;
        if (Error.captureStackTrace) Error.captureStackTrace(this, BrowserslistError);
    }
}
const isFileCache = {};
function isFile(file) {
    if (file in isFileCache) return isFileCache[file];
    const result = node_fs.existsSync(file) && node_fs.statSync(file).isFile();
    isFileCache[file] = result;
    return result;
}
function check(section) {
    const FORMAT = 'Browserslist config should be a string or an array of strings with browser queries';
    if (Array.isArray(section)) {
        for(let i = 0; i < section.length; i++)if ('string' != typeof section[i]) throw new BrowserslistError(FORMAT);
    } else if ('string' != typeof section) throw new BrowserslistError(FORMAT);
}
function parsePackage(file) {
    const config = JSON.parse(node_fs.readFileSync(file).toString().replace(/^\uFEFF/m, ''));
    if (config.browserlist && !config.browserslist) throw new BrowserslistError(`\`browserlist\` key instead of \`browserslist\` in ${file}`);
    let list = config.browserslist;
    if (Array.isArray(list)) list = {
        defaults: list
    };
    if ('string' == typeof list) list = parseConfig(list);
    for(const i in list)check(list[i]);
    return list;
}
const IS_SECTION = /^\s*\[(.+)]\s*$/;
function parseConfig(string) {
    const result = {
        defaults: []
    };
    let sections = [
        'defaults'
    ];
    string.toString().replace(/#[^\n]*/g, '').split(/\n|,/).map((line)=>line.trim()).filter((line)=>'' !== line).forEach((line)=>{
        const matched = line.match(IS_SECTION);
        if (matched) {
            sections = matched[1].trim().split(' ');
            sections.forEach((section)=>{
                if (result[section]) throw new BrowserslistError(`Duplicate section ${section} in Browserslist config`);
                result[section] = [];
            });
        } else sections.forEach((section)=>{
            result[section].push(line);
        });
    });
    return result;
}
function readConfig(file) {
    if (!isFile(file)) throw new BrowserslistError(`Can't read ${file} config`);
    return parseConfig(node_fs.readFileSync(file, 'utf-8'));
}
function parsePackageOrReadConfig(file) {
    if ('package.json' === node_path.basename(file)) return parsePackage(file);
    return readConfig(file);
}
function pickEnv(config, opts) {
    if ('object' != typeof config) return config;
    let name;
    name = 'string' == typeof opts.env ? opts.env : process.env.BROWSERSLIST_ENV ? process.env.BROWSERSLIST_ENV : process.env.NODE_ENV ? process.env.NODE_ENV : 'production';
    return config[name] || config.defaults;
}
function eachParent(file, callback) {
    const dir = isFile(file) ? node_path.dirname(file) : file;
    let loc = node_path.resolve(dir);
    do {
        const result = callback(loc);
        if (void 0 !== result) return result;
    }while (loc !== (loc = node_path.dirname(loc)));
}
function findConfigFile(from) {
    return eachParent(from, (dir)=>{
        const config = node_path.join(dir, 'browserslist');
        const pkg = node_path.join(dir, 'package.json');
        const rc = node_path.join(dir, '.browserslistrc');
        let pkgBrowserslist;
        if (isFile(pkg)) try {
            pkgBrowserslist = parsePackage(pkg);
        } catch (e) {
            if (e instanceof BrowserslistError) throw e;
            console.warn(`[Browserslist] Could not parse ${pkg}. Ignoring it.`);
        }
        if (isFile(config) && pkgBrowserslist) throw new BrowserslistError(`${dir} contains both browserslist and package.json with browsers`);
        if (isFile(rc) && pkgBrowserslist) throw new BrowserslistError(`${dir} contains both .browserslistrc and package.json with browsers`);
        if (isFile(config) && isFile(rc)) throw new BrowserslistError(`${dir} contains both .browserslistrc and browserslist`);
        if (isFile(config)) return config;
        if (isFile(rc)) return rc;
        if (pkgBrowserslist) return pkg;
    });
}
const configCache = {};
function findConfig(from) {
    from = node_path.resolve(from);
    const fromDir = isFile(from) ? node_path.dirname(from) : from;
    if (fromDir in configCache) return configCache[fromDir];
    let resolved;
    const configFile = findConfigFile(from);
    if (configFile) resolved = parsePackageOrReadConfig(configFile);
    const configDir = configFile && node_path.dirname(configFile);
    eachParent(from, (dir)=>{
        if (resolved) configCache[dir] = resolved;
        if (dir === configDir) return null;
    });
    return resolved;
}
function loadConfig(opts) {
    if (opts.config) return pickEnv(parsePackageOrReadConfig(opts.config), opts);
    if (opts.path) {
        const config = findConfig(opts.path);
        if (!config) return;
        return pickEnv(config, opts);
    }
}
export { findConfig, loadConfig };
