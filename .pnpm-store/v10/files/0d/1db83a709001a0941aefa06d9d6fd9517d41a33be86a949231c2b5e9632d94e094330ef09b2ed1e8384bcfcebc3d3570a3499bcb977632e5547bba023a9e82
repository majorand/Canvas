import type yargs from "yargs";
/**
 * Apply common options for all commands
 */
export declare const commonOptions: (yargs: yargs.Argv) => yargs.Argv<yargs.Omit<{}, "nodeEnv" | "config" | "configName" | "configLoader"> & yargs.InferredOptionTypes<{
    config: {
        g: boolean;
        type: "string";
        describe: string;
        alias: string;
    };
    configName: {
        type: "array";
        string: true;
        describe: string;
    };
    configLoader: {
        type: "string";
        default: string;
        describe: string;
    };
    nodeEnv: {
        string: true;
        describe: string;
    };
}>>;
/**
 * Apply common options for `build` and `serve` commands
 */
export declare const commonOptionsForBuildAndServe: (yargs: yargs.Argv) => yargs.Argv<yargs.Omit<{}, "entry" | "devtool" | "mode" | "watch" | "env" | "outputPath"> & yargs.InferredOptionTypes<{
    entry: {
        type: "array";
        string: true;
        describe: string;
    };
    outputPath: {
        type: "string";
        describe: string;
        alias: string;
    };
    mode: {
        type: "string";
        describe: string;
        alias: string;
    };
    watch: {
        type: "boolean";
        default: boolean;
        describe: string;
        alias: string;
    };
    env: {
        type: "array";
        string: true;
        describe: string;
    };
    devtool: {
        type: "string";
        describe: string;
        alias: string;
        coerce: (arg: any) => string | boolean;
    };
}>>;
export declare function normalizeEnv(argv: yargs.Arguments): void;
/**
 * set builtin env from cli - like `WEBPACK_BUNDLE=true`. also for `RSPACK_` prefixed.
 * @param env the `argv.env` object
 * @param envNameSuffix the added env will be `WEBPACK_${envNameSuffix}` and `RSPACK_${envNameSuffix}`
 * @param value
 */
export declare function setBuiltinEnvArg(env: Record<string, any>, envNameSuffix: string, value: any): void;
/**
 * infer `argv.env` as an object for it was transformed from array to object after `normalizeEnv` middleware
 * @returns the reference of `argv.env` object
 */
export declare function ensureEnvObject<T extends Record<string, unknown>>(options: yargs.Arguments): T;
export declare function setDefaultNodeEnv(options: yargs.Arguments, defaultEnv: string): void;
