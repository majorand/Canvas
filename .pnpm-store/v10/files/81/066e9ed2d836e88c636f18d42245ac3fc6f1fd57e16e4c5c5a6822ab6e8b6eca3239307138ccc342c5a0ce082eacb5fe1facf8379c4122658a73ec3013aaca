"use strict";
var __webpack_modules__ = {
    "@rspack/core": function(module) {
        module.exports = require("@rspack/core");
    },
    "node:fs": function(module) {
        module.exports = require("node:fs");
    },
    "node:path": function(module) {
        module.exports = require("node:path");
    },
    "@discoveryjs/json-ext": function(module) {
        module.exports = import("@discoveryjs/json-ext").then(function(module) {
            return module;
        });
    },
    "@rspack/dev-server": function(module) {
        module.exports = import("@rspack/dev-server").then(function(module) {
            return module;
        });
    },
    "exit-hook": function(module) {
        module.exports = import("exit-hook").then(function(module) {
            return module;
        });
    },
    "webpack-bundle-analyzer": function(module) {
        module.exports = import("webpack-bundle-analyzer").then(function(module) {
            return module;
        });
    }
};
var __webpack_module_cache__ = {};
function __webpack_require__(moduleId) {
    var cachedModule = __webpack_module_cache__[moduleId];
    if (void 0 !== cachedModule) return cachedModule.exports;
    var module = __webpack_module_cache__[moduleId] = {
        exports: {}
    };
    __webpack_modules__[moduleId](module, module.exports, __webpack_require__);
    return module.exports;
}
__webpack_require__.m = __webpack_modules__;
(()=>{
    __webpack_require__.n = (module)=>{
        var getter = module && module.__esModule ? ()=>module['default'] : ()=>module;
        __webpack_require__.d(getter, {
            a: getter
        });
        return getter;
    };
})();
(()=>{
    __webpack_require__.d = (exports1, definition)=>{
        for(var key in definition)if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports1, key)) Object.defineProperty(exports1, key, {
            enumerable: true,
            get: definition[key]
        });
    };
})();
(()=>{
    __webpack_require__.f = {};
    __webpack_require__.e = (chunkId)=>Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key)=>{
            __webpack_require__.f[key](chunkId, promises);
            return promises;
        }, []));
})();
(()=>{
    __webpack_require__.u = (chunkId)=>"" + chunkId + ".js";
})();
(()=>{
    __webpack_require__.o = (obj, prop)=>Object.prototype.hasOwnProperty.call(obj, prop);
})();
(()=>{
    __webpack_require__.r = (exports1)=>{
        if ('undefined' != typeof Symbol && Symbol.toStringTag) Object.defineProperty(exports1, Symbol.toStringTag, {
            value: 'Module'
        });
        Object.defineProperty(exports1, '__esModule', {
            value: true
        });
    };
})();
(()=>{
    var installedChunks = {
        410: 1
    };
    var installChunk = (chunk)=>{
        var moreModules = chunk.modules, chunkIds = chunk.ids, runtime = chunk.runtime;
        for(var moduleId in moreModules)if (__webpack_require__.o(moreModules, moduleId)) __webpack_require__.m[moduleId] = moreModules[moduleId];
        if (runtime) runtime(__webpack_require__);
        for(var i = 0; i < chunkIds.length; i++)installedChunks[chunkIds[i]] = 1;
    };
    __webpack_require__.f.require = (chunkId, promises)=>{
        if (!installedChunks[chunkId]) installChunk(require("./" + __webpack_require__.u(chunkId)));
    };
})();
var __webpack_exports__ = {};
(()=>{
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
        defineConfig: ()=>defineConfig,
        definePlugin: ()=>definePlugin,
        RspackCLI: ()=>RspackCLI
    });
    var external_node_path_ = __webpack_require__("node:path");
    var external_node_path_default = /*#__PURE__*/ __webpack_require__.n(external_node_path_);
    const external_node_util_namespaceObject = require("node:util");
    var external_node_util_default = /*#__PURE__*/ __webpack_require__.n(external_node_util_namespaceObject);
    var core_ = __webpack_require__("@rspack/core");
    const external_colorette_namespaceObject = require("colorette");
    const external_yargs_namespaceObject = require("yargs");
    var external_yargs_default = /*#__PURE__*/ __webpack_require__.n(external_yargs_namespaceObject);
    const helpers_namespaceObject = require("yargs/helpers");
    var external_node_fs_ = __webpack_require__("node:fs");
    var external_node_fs_default = /*#__PURE__*/ __webpack_require__.n(external_node_fs_);
    const commonOptions = (yargs)=>yargs.options({
            config: {
                g: true,
                type: "string",
                describe: "config file",
                alias: "c"
            },
            configName: {
                type: "array",
                string: true,
                describe: "Name of the configuration to use."
            },
            configLoader: {
                type: "string",
                default: "register",
                describe: "Specify the loader to load the config file, can be `native` or `register`."
            },
            nodeEnv: {
                string: true,
                describe: "sets `process.env.NODE_ENV` to be specified value"
            }
        });
    const commonOptionsForBuildAndServe = (yargs)=>yargs.options({
            entry: {
                type: "array",
                string: true,
                describe: "entry file"
            },
            outputPath: {
                type: "string",
                describe: "output path dir",
                alias: "o"
            },
            mode: {
                type: "string",
                describe: "mode",
                alias: "m"
            },
            watch: {
                type: "boolean",
                default: false,
                describe: "watch",
                alias: "w"
            },
            env: {
                type: "array",
                string: true,
                describe: "env passed to config function"
            },
            devtool: {
                type: "string",
                describe: "Specify a developer tool for debugging. Defaults to `cheap-module-source-map` in development and `source-map` in production.",
                alias: "d",
                coerce: (arg)=>{
                    if ("true" === arg) return "source-map";
                    if ("false" === arg || "" === arg.trim()) return false;
                    return arg;
                }
            }
        }).alias({
            v: "version",
            h: "help"
        });
    function normalizeEnv(argv) {
        function parseValue(previous, value) {
            const [allKeys, val] = value.split(/=(.+)/, 2);
            const splitKeys = allKeys.split(/\.(?!$)/);
            let prevRef = previous;
            splitKeys.forEach((key, index)=>{
                let someKey = key;
                if (someKey.endsWith("=")) {
                    someKey = someKey.slice(0, -1);
                    prevRef[someKey] = void 0;
                    return;
                }
                if (!prevRef[someKey] || "string" == typeof prevRef[someKey]) prevRef[someKey] = {};
                if (index === splitKeys.length - 1) if ("string" == typeof val) prevRef[someKey] = val;
                else prevRef[someKey] = true;
                prevRef = prevRef[someKey];
            });
            return previous;
        }
        const envObj = (argv.env ?? []).reduce(parseValue, {});
        argv.env = envObj;
    }
    function setBuiltinEnvArg(env, envNameSuffix, value) {
        const envNames = [
            `RSPACK_${envNameSuffix}`
        ];
        for (const envName of envNames)if (!(envName in env)) env[envName] = value;
    }
    function ensureEnvObject(options) {
        if (Array.isArray(options.env)) normalizeEnv(options);
        options.env = options.env || {};
        return options.env;
    }
    function setDefaultNodeEnv(options, defaultEnv) {
        if (void 0 !== process.env.NODE_ENV) return;
        process.env.NODE_ENV = "string" == typeof options.nodeEnv ? options.nodeEnv : defaultEnv;
    }
    class BuildCommand {
        async apply(cli) {
            cli.program.command([
                "build",
                "$0",
                "bundle",
                "b"
            ], "run the rspack build", (yargs)=>{
                commonOptionsForBuildAndServe(commonOptions(yargs)).options({
                    analyze: {
                        type: "boolean",
                        default: false,
                        describe: "analyze"
                    },
                    json: {
                        describe: "emit stats json"
                    },
                    profile: {
                        type: "boolean",
                        default: false,
                        describe: "capture timing information for each module"
                    }
                });
            }, async (options)=>{
                setDefaultNodeEnv(options, "production");
                const env = ensureEnvObject(options);
                if (options.watch) setBuiltinEnvArg(env, "WATCH", true);
                else {
                    setBuiltinEnvArg(env, "BUNDLE", true);
                    setBuiltinEnvArg(env, "BUILD", true);
                }
                const logger = cli.getLogger();
                let createJsonStringifyStream;
                if (options.json) {
                    const jsonExt = await Promise.resolve().then(__webpack_require__.bind(__webpack_require__, "@discoveryjs/json-ext"));
                    createJsonStringifyStream = jsonExt.default.stringifyStream;
                }
                const errorHandler = (error, stats)=>{
                    if (error) {
                        logger.error(error);
                        process.exit(2);
                    }
                    if (stats?.hasErrors()) process.exitCode = 1;
                    if (!compiler || !stats) return;
                    const statsOptions = cli.isMultipleCompiler(compiler) ? {
                        children: compiler.compilers.map((compiler)=>compiler.options ? compiler.options.stats : void 0)
                    } : compiler.options ? compiler.options.stats : void 0;
                    if (options.json && createJsonStringifyStream) {
                        const handleWriteError = (error)=>{
                            logger.error(error);
                            process.exit(2);
                        };
                        if (true === options.json) createJsonStringifyStream(stats.toJson(statsOptions)).on("error", handleWriteError).pipe(process.stdout).on("error", handleWriteError).on("close", ()=>process.stdout.write("\n"));
                        else if ("string" == typeof options.json) createJsonStringifyStream(stats.toJson(statsOptions)).on("error", handleWriteError).pipe(external_node_fs_.createWriteStream(options.json)).on("error", handleWriteError).on("close", ()=>{
                            process.stderr.write(`[rspack-cli] ${cli.colors.green(`stats are successfully stored as json to ${options.json}`)}\n`);
                        });
                    } else {
                        const printedStats = stats.toString(statsOptions);
                        if (printedStats) logger.raw(printedStats);
                    }
                };
                const rspackOptions = {
                    ...options,
                    argv: {
                        ...options
                    }
                };
                const compiler = await cli.createCompiler(rspackOptions, "build", errorHandler);
                if (!compiler || cli.isWatch(compiler)) return;
                compiler.run((error, stats)=>{
                    compiler.close((closeErr)=>{
                        if (closeErr) logger.error(closeErr);
                        errorHandler(error, stats);
                    });
                });
            });
        }
    }
    const previewOptions = (yargs)=>{
        yargs.positional("dir", {
            type: "string",
            describe: "directory want to preview"
        });
        return commonOptions(yargs).options({
            publicPath: {
                type: "string",
                describe: "static resource server path"
            },
            port: {
                type: "number",
                describe: "preview server port"
            },
            host: {
                type: "string",
                describe: "preview server host"
            },
            open: {
                type: "boolean",
                describe: "open browser"
            },
            server: {
                type: "string",
                describe: "Configuration items for the server."
            }
        });
    };
    const defaultRoot = "dist";
    class PreviewCommand {
        async apply(cli) {
            cli.program.command([
                "preview [dir]",
                "preview",
                "p"
            ], "run the rspack server for build output", previewOptions, async (options)=>{
                setDefaultNodeEnv(options, "production");
                const rspackOptions = {
                    ...options,
                    argv: {
                        ...options
                    }
                };
                const { RspackDevServer } = await Promise.resolve().then(__webpack_require__.bind(__webpack_require__, "@rspack/dev-server"));
                let { config } = await cli.loadConfig(rspackOptions);
                config = await getPreviewConfig(config, options);
                if (!Array.isArray(config)) config = [
                    config
                ];
                config = config.find((item)=>item.devServer) || config[0];
                const devServerOptions = config.devServer;
                try {
                    const compiler = (0, core_.rspack)({
                        entry: {}
                    });
                    if (!compiler) return;
                    const server = new RspackDevServer(devServerOptions, compiler);
                    await server.start();
                } catch (error) {
                    const logger = cli.getLogger();
                    logger.error(error);
                    process.exit(2);
                }
            });
        }
    }
    async function getPreviewConfig(item, options) {
        const internalPreviewConfig = async (item)=>{
            item.devServer = {
                static: {
                    directory: options.dir ? external_node_path_default().join(item.context ?? process.cwd(), options.dir) : item.output?.path ?? external_node_path_default().join(item.context ?? process.cwd(), defaultRoot),
                    publicPath: options.publicPath ?? "/"
                },
                port: options.port ?? 8080,
                proxy: item.devServer?.proxy,
                host: options.host ?? item.devServer?.host,
                open: options.open ?? item.devServer?.open,
                server: options.server ?? item.devServer?.server,
                historyApiFallback: item.devServer?.historyApiFallback
            };
            return item;
        };
        if (Array.isArray(item)) return Promise.all(item.map(internalPreviewConfig));
        return internalPreviewConfig(item);
    }
    class ServeCommand {
        async apply(cli) {
            cli.program.command([
                "serve",
                "server",
                "s",
                "dev"
            ], "run the rspack dev server.", (yargs)=>commonOptionsForBuildAndServe(commonOptions(yargs)).options({
                    hot: {
                        coerce: (arg)=>{
                            if ("boolean" == typeof arg || "only" === arg) return arg;
                            if ("false" === arg) return false;
                            return true;
                        },
                        describe: "enables hot module replacement"
                    },
                    port: {
                        type: "number",
                        coerce: (arg)=>Number.isInteger(arg) ? arg : void 0,
                        describe: "allows to specify a port to use"
                    },
                    host: {
                        type: "string",
                        describe: "allows to specify a hostname to use"
                    }
                }), async (options)=>{
                setDefaultNodeEnv(options, "development");
                setBuiltinEnvArg(ensureEnvObject(options), "SERVE", true);
                const rspackOptions = {
                    ...options,
                    argv: {
                        ...options
                    }
                };
                const { RspackDevServer } = await Promise.resolve().then(__webpack_require__.bind(__webpack_require__, "@rspack/dev-server"));
                const compiler = await cli.createCompiler(rspackOptions, "serve");
                if (!compiler) return;
                const compilers = cli.isMultipleCompiler(compiler) ? compiler.compilers : [
                    compiler
                ];
                const possibleCompilers = compilers.filter((compiler)=>compiler.options.devServer);
                const usedPorts = [];
                const servers = [];
                const compilerForDevServer = possibleCompilers.length > 0 ? possibleCompilers[0] : compilers[0];
                for (const compiler of compilers){
                    const devServer = compiler.options.devServer ??= {};
                    devServer.hot = options.hot ?? devServer.hot ?? true;
                    if (false !== devServer.client) {
                        if (true === devServer.client || null == devServer.client) devServer.client = {};
                        devServer.client = {
                            overlay: {
                                errors: true,
                                warnings: false
                            },
                            ...devServer.client
                        };
                    }
                }
                const result = compilerForDevServer.options.devServer ??= {};
                const setupMiddlewares = result.setupMiddlewares;
                const lazyCompileMiddleware = core_.rspack.experiments.lazyCompilationMiddleware(compiler);
                result.setupMiddlewares = (middlewares, server)=>{
                    let finalMiddlewares = middlewares;
                    if (setupMiddlewares) finalMiddlewares = setupMiddlewares(finalMiddlewares, server);
                    return [
                        ...finalMiddlewares,
                        lazyCompileMiddleware
                    ];
                };
                result.hot = options.hot ?? result.hot ?? true;
                result.host = options.host || result.host;
                result.port = options.port || result.port;
                if (false !== result.client) {
                    if (true === result.client || null == result.client) result.client = {};
                    result.client = {
                        overlay: {
                            errors: true,
                            warnings: false
                        },
                        ...result.client
                    };
                }
                const devServerOptions = result;
                if (devServerOptions.port) {
                    const portNumber = Number(devServerOptions.port);
                    if (!Number.isNaN(portNumber)) {
                        if (usedPorts.find((port)=>portNumber === port)) throw new Error("Unique ports must be specified for each devServer option in your rspack configuration. Alternatively, run only 1 devServer config using the --config-name flag to specify your desired config.");
                        usedPorts.push(portNumber);
                    }
                }
                try {
                    const server = new RspackDevServer(devServerOptions, compiler);
                    await server.start();
                    servers.push(server);
                } catch (error) {
                    const logger = cli.getLogger();
                    logger.error(error);
                    process.exit(2);
                }
            });
        }
    }
    const external_pirates_namespaceObject = require("pirates");
    const external_node_url_namespaceObject = require("node:url");
    const readPackageUp = (cwd = process.cwd())=>{
        let currentDir = external_node_path_default().resolve(cwd);
        let packageJsonPath = external_node_path_default().join(currentDir, "package.json");
        while(!external_node_fs_default().existsSync(packageJsonPath)){
            const parentDir = external_node_path_default().dirname(currentDir);
            if (parentDir === currentDir) return null;
            currentDir = parentDir;
            packageJsonPath = external_node_path_default().join(currentDir, "package.json");
        }
        try {
            return JSON.parse(external_node_fs_default().readFileSync(packageJsonPath, "utf8"));
        } catch  {
            return null;
        }
    };
    const utils_readPackageUp = readPackageUp;
    const isEsmFile = (filePath, cwd = process.cwd())=>{
        const ext = external_node_path_default().extname(filePath);
        if (/\.(mjs|mts)$/.test(ext)) return true;
        if (/\.(cjs|cts)/.test(ext)) return false;
        const packageJson = utils_readPackageUp(external_node_path_default().dirname(filePath));
        return packageJson?.type === "module";
    };
    const utils_isEsmFile = isEsmFile;
    const crossImport = async (path, cwd = process.cwd())=>{
        if (utils_isEsmFile(path, cwd)) {
            const url = (0, external_node_url_namespaceObject.pathToFileURL)(path).href;
            const { default: config } = await import(url);
            return config;
        }
        let result = require(path);
        if (result && "object" == typeof result && "default" in result) result = result.default || {};
        return result;
    };
    const DEFAULT_EXTENSIONS = [
        ".js",
        ".ts",
        ".mjs",
        ".mts",
        ".cjs",
        ".cts"
    ];
    const findConfig = (basePath)=>DEFAULT_EXTENSIONS.map((ext)=>basePath + ext).find(external_node_fs_default().existsSync);
    const utils_findConfig = findConfig;
    const TS_EXTENSION = [
        ".ts",
        ".cts",
        ".mts"
    ];
    const isTsFile_isTsFile = (configPath)=>{
        const ext = external_node_path_default().extname(configPath);
        return TS_EXTENSION.includes(ext);
    };
    const isTsFile = isTsFile_isTsFile;
    const injectInlineSourceMap = ({ filename, code, map })=>{
        if (map) {
            const base64Map = Buffer.from(map, "utf8").toString("base64");
            const sourceMapContent = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${base64Map}`;
            return `${code}\n${sourceMapContent}`;
        }
        return code;
    };
    function compile(sourcecode, filename) {
        const { code, map } = core_.experiments.swc.transformSync(sourcecode, {
            jsc: {
                parser: {
                    syntax: "typescript",
                    tsx: false,
                    decorators: true,
                    dynamicImport: true
                }
            },
            filename: filename,
            module: {
                type: "commonjs"
            },
            sourceMaps: true,
            isModule: true
        });
        return injectInlineSourceMap({
            filename,
            code,
            map
        });
    }
    const loadConfig_DEFAULT_CONFIG_NAME = "rspack.config";
    const registerLoader = (configPath)=>{
        if (utils_isEsmFile(configPath) && isTsFile(configPath)) return;
        if (!isTsFile(configPath)) throw new Error(`config file "${configPath}" is not supported.`);
        (0, external_pirates_namespaceObject.addHook)((code, filename)=>{
            try {
                return compile(code, filename);
            } catch (err) {
                throw new Error(`Failed to transform file "${filename}" when loading TypeScript config file:\n ${err instanceof Error ? err.message : String(err)}`);
            }
        }, {
            exts: TS_EXTENSION
        });
    };
    const checkIsMultiRspackOptions = (config)=>Array.isArray(config);
    async function loadExtendedConfig(config, configPath, cwd, options) {
        if (checkIsMultiRspackOptions(config)) {
            const resultPathMap = new WeakMap();
            const extendedConfigs = await Promise.all(config.map(async (item)=>{
                const { config, pathMap } = await loadExtendedConfig(item, configPath, cwd, options);
                resultPathMap.set(config, pathMap.get(config));
                return config;
            }));
            extendedConfigs.parallelism = config.parallelism;
            return {
                config: extendedConfigs,
                pathMap: resultPathMap
            };
        }
        const pathMap = new WeakMap();
        pathMap.set(config, [
            configPath
        ]);
        if (!("extends" in config) || !config.extends) return {
            config,
            pathMap
        };
        const extendsList = Array.isArray(config.extends) ? config.extends : [
            config.extends
        ];
        const { extends: _, ...configWithoutExtends } = config;
        const baseDir = external_node_path_default().dirname(configPath);
        let resultConfig = configWithoutExtends;
        pathMap.set(resultConfig, [
            configPath
        ]);
        for (const extendPath of extendsList){
            let resolvedPath;
            if (extendPath.startsWith(".") || extendPath.startsWith("/") || extendPath.includes(":\\")) {
                resolvedPath = external_node_path_default().resolve(baseDir, extendPath);
                if (!external_node_path_default().extname(resolvedPath)) {
                    const foundConfig = utils_findConfig(resolvedPath);
                    if (foundConfig) resolvedPath = foundConfig;
                    else throw new Error(`Extended configuration file "${resolvedPath}" not found.`);
                }
            } else try {
                resolvedPath = require.resolve(extendPath, {
                    paths: [
                        baseDir,
                        cwd
                    ]
                });
            } catch  {
                throw new Error(`Cannot find module '${extendPath}' to extend from.`);
            }
            if (!external_node_fs_default().existsSync(resolvedPath)) throw new Error(`Extended configuration file "${resolvedPath}" not found.`);
            if (isTsFile(resolvedPath) && "register" === options.configLoader) registerLoader(resolvedPath);
            let loadedConfig = await crossImport(resolvedPath, cwd);
            if ("function" == typeof loadedConfig) {
                loadedConfig = loadedConfig(options.argv?.env, options.argv);
                if ("function" == typeof loadedConfig.then) loadedConfig = await loadedConfig;
            }
            const { config: extendedConfig, pathMap: extendedPathMap } = await loadExtendedConfig(loadedConfig, resolvedPath, cwd, options);
            const configPaths = [
                ...pathMap.get(resultConfig) || [],
                ...extendedPathMap.get(extendedConfig) || []
            ];
            resultConfig = core_.util.cleverMerge(extendedConfig, resultConfig);
            pathMap.set(resultConfig, configPaths);
        }
        return {
            config: resultConfig,
            pathMap
        };
    }
    async function loadRspackConfig(options, cwd = process.cwd()) {
        let configPath = "";
        if (options.config) {
            configPath = external_node_path_default().resolve(cwd, options.config);
            if (!external_node_fs_default().existsSync(configPath)) throw new Error(`config file "${configPath}" not found.`);
        } else {
            const defaultConfig = utils_findConfig(external_node_path_default().resolve(cwd, loadConfig_DEFAULT_CONFIG_NAME));
            if (!defaultConfig) return null;
            configPath = defaultConfig;
        }
        if (isTsFile(configPath) && "register" === options.configLoader) registerLoader(configPath);
        const loadedConfig = await crossImport(configPath, cwd);
        return {
            loadedConfig,
            configPath
        };
    }
    class RspackCLI {
        colors;
        program;
        constructor(){
            this.colors = this.createColors();
            this.program = external_yargs_default()();
        }
        async createCompiler(options, rspackCommand, callback) {
            process.env.RSPACK_CONFIG_VALIDATE ??= "loose";
            let { config, pathMap } = await this.loadConfig(options);
            config = await this.buildConfig(config, pathMap, options, rspackCommand);
            const isWatch = Array.isArray(config) ? config.some((i)=>i.watch) : config.watch;
            let compiler;
            try {
                compiler = (0, core_.rspack)(config, isWatch ? callback : void 0);
            } catch (e) {
                if (e instanceof core_.ValidationError) {
                    this.getLogger().error(e.message);
                    process.exit(2);
                } else if (e instanceof Error) {
                    if ("function" == typeof callback) callback(e);
                    else this.getLogger().error(e);
                    return null;
                }
                throw e;
            }
            return compiler;
        }
        createColors(useColor) {
            const shouldUseColor = useColor || external_colorette_namespaceObject.isColorSupported;
            return {
                ...(0, external_colorette_namespaceObject.createColors)({
                    useColor: shouldUseColor
                }),
                isColorSupported: shouldUseColor
            };
        }
        getLogger() {
            return {
                error: (val)=>console.error(`[rspack-cli] ${this.colors.red(external_node_util_default().format(val))}`),
                warn: (val)=>console.warn(`[rspack-cli] ${this.colors.yellow(val)}`),
                info: (val)=>console.info(`[rspack-cli] ${this.colors.cyan(val)}`),
                success: (val)=>console.log(`[rspack-cli] ${this.colors.green(val)}`),
                log: (val)=>console.log(`[rspack-cli] ${val}`),
                raw: (val)=>console.log(val)
            };
        }
        async run(argv) {
            this.program.showHelpOnFail(false);
            this.program.usage("[options]");
            this.program.scriptName("rspack");
            this.program.strictCommands(true).strict(true);
            this.program.middleware(normalizeEnv);
            this.registerCommands();
            await this.program.parseAsync((0, helpers_namespaceObject.hideBin)(argv));
        }
        async registerCommands() {
            const builtinCommands = [
                new BuildCommand(),
                new ServeCommand(),
                new PreviewCommand()
            ];
            for (const command of builtinCommands)command.apply(this);
        }
        async buildConfig(item, pathMap, options, command) {
            const isBuild = "build" === command;
            const isServe = "serve" === command;
            const internalBuildConfig = async (item)=>{
                if (options.entry) item.entry = {
                    main: options.entry.map((x)=>external_node_path_default().resolve(process.cwd(), x))[0]
                };
                item.output = item.output || {};
                if (options.outputPath) item.output.path = external_node_path_default().resolve(process.cwd(), options.outputPath);
                if (options.analyze) {
                    const { BundleAnalyzerPlugin } = await Promise.resolve().then(__webpack_require__.bind(__webpack_require__, "webpack-bundle-analyzer"));
                    (item.plugins ??= []).push({
                        name: "rspack-bundle-analyzer",
                        apply (compiler) {
                            new BundleAnalyzerPlugin({
                                generateStatsFile: true
                            }).apply(compiler);
                        }
                    });
                }
                if (options.profile) item.profile = true;
                if (process.env.RSPACK_PROFILE) {
                    const { applyProfile } = await __webpack_require__.e("361").then(__webpack_require__.bind(__webpack_require__, "./src/utils/profile.ts"));
                    await applyProfile(process.env.RSPACK_PROFILE, process.env.RSPACK_TRACE_LAYER, process.env.RSPACK_TRACE_OUTPUT);
                }
                if (options.watch) item.watch = options.watch;
                if (!item.mode) item.mode = isBuild ? "production" : "development";
                if (options.mode) item.mode = options.mode;
                if (void 0 === item.devtool) item.devtool = isBuild ? "source-map" : "cheap-module-source-map";
                if (void 0 !== options.devtool) item.devtool = options.devtool;
                if (isServe) {
                    const installed = (item.plugins ||= []).find((item)=>item instanceof core_.ProgressPlugin);
                    if (!installed) (item.plugins ??= []).push(new core_.ProgressPlugin());
                }
                const cacheOptions = item.experiments?.cache;
                if ("object" == typeof cacheOptions && "persistent" === cacheOptions.type) {
                    const configPaths = pathMap.get(item);
                    if (configPaths) cacheOptions.buildDependencies = [
                        ...configPaths,
                        ...cacheOptions.buildDependencies || []
                    ];
                }
                if (void 0 === item.stats) item.stats = {
                    preset: "errors-warnings",
                    timings: true
                };
                else if ("boolean" == typeof item.stats) item.stats = item.stats ? {
                    preset: "normal"
                } : {
                    preset: "none"
                };
                else if ("string" == typeof item.stats) item.stats = {
                    preset: item.stats
                };
                if (this.colors.isColorSupported && void 0 === item.stats.colors) item.stats.colors = true;
                return item;
            };
            if (Array.isArray(item)) return Promise.all(item.map(internalBuildConfig));
            return internalBuildConfig(item);
        }
        async loadConfig(options) {
            const config = await loadRspackConfig(options);
            if (!config) return {
                config: this.filterConfig(options, {}),
                pathMap: new WeakMap()
            };
            let { loadedConfig, configPath } = config;
            if ("function" == typeof loadedConfig) {
                let functionResult = loadedConfig(options.argv?.env, options.argv);
                if ("function" == typeof functionResult.then) functionResult = await functionResult;
                loadedConfig = functionResult;
            }
            const { config: extendedConfig, pathMap } = await loadExtendedConfig(loadedConfig, configPath, process.cwd(), options);
            return {
                config: this.filterConfig(options, extendedConfig),
                pathMap
            };
        }
        filterConfig(options, config) {
            if (options.configName) {
                const notFoundConfigNames = [];
                config = options.configName.map((configName)=>{
                    let found;
                    found = Array.isArray(config) ? config.find((options)=>options.name === configName) : config.name === configName ? config : void 0;
                    if (!found) notFoundConfigNames.push(configName);
                    return found;
                });
                if (notFoundConfigNames.length > 0) {
                    this.getLogger().error(notFoundConfigNames.map((configName)=>`Configuration with the name "${configName}" was not found.`).join(" "));
                    process.exit(2);
                }
            }
            return config;
        }
        isMultipleCompiler(compiler) {
            return Boolean(compiler.compilers);
        }
        isWatch(compiler) {
            return Boolean(this.isMultipleCompiler(compiler) ? compiler.compilers.some((compiler)=>compiler.options.watch) : compiler.options.watch);
        }
    }
    function defineConfig(config) {
        return config;
    }
    function definePlugin(plugin) {
        return plugin;
    }
})();
exports.RspackCLI = __webpack_exports__.RspackCLI;
exports.defineConfig = __webpack_exports__.defineConfig;
exports.definePlugin = __webpack_exports__.definePlugin;
for(var __webpack_i__ in __webpack_exports__)if (-1 === [
    "RspackCLI",
    "defineConfig",
    "definePlugin"
].indexOf(__webpack_i__)) exports[__webpack_i__] = __webpack_exports__[__webpack_i__];
Object.defineProperty(exports, '__esModule', {
    value: true
});
