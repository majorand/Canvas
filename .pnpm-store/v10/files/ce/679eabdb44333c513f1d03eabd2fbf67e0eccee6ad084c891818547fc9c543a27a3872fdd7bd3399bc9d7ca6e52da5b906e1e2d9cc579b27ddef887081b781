import { RsdoctorPluginInstance } from '../../types/index.js';
import { Linter, Plugin } from '@rsdoctor/types';
export declare const UNASSIGNED = "[unassigned]";
/**
 * Options for handling source map assets.
 * @param compilation - The current compilation object.
 * @param pluginInstance - The Rsdoctor plugin instance.
 * @param sourceMapFilenameRegex - Regex to extract file paths from source map sources.
 * @param namespace - Optional namespace for resolving sources.
 */
interface SourceMapAssetOptions {
    compilation: Plugin.BaseCompilation;
    pluginInstance: RsdoctorPluginInstance<Plugin.BaseCompiler, Linter.ExtendRuleData<any, string>[]>;
    sourceMapFilenameRegex: RegExp;
    namespace?: string;
}
/**
 * Binds a context cache to a source path resolver.
 * @param context - The base context directory.
 * @param namespace - Optional namespace for resolving sources.
 * @param cache - The cache map to store resolved paths.
 * @param sourceMapDir - The directory containing source maps.
 * @param sourceRoot - The source root directory.
 * @returns A function that resolves source paths based on the given context.
 */
export declare function bindContextCache(context: string, namespace?: string, cache?: Map<string, string>, sourceMapDir?: string, sourceRoot?: string): (source: string, sourceMapFilenameRegex?: RegExp) => string;
/**
 * Collects and processes source map information for a given asset.
 * Groups mappings by line, sorts them, and reconstructs the original source code segments.
 * @param map - The raw source map object.
 * @param assetLinesCodeList - The code lines of the asset.
 * @param _compilation - The current compilation object.
 * @param _this - The Rsdoctor plugin instance.
 * @param sourceMapFilenameRegex - Regex to extract file paths from source map sources.
 * @param namespace - Optional namespace for resolving sources.
 */
export declare function collectSourceMaps(map: any, assetLinesCodeList: string[], _compilation: Plugin.BaseCompilation, _this: RsdoctorPluginInstance<Plugin.BaseCompiler, Linter.ExtendRuleData[]>, sourceMapFilenameRegex?: RegExp, namespace?: string, skipSources?: Set<string>, sourceMapPath?: string): Promise<void>;
/**
 * Handles the afterEmit event for assets to collect source map information.
 * @param compilation - The current compilation object.
 * @param _this - The Rsdoctor plugin instance.
 * @param sourceMapFilenameRegex - Regex to extract file paths from source map sources.
 * @param namespace - Optional namespace for resolving sources.
 */
export declare function handleAfterEmitAssets(compilation: Plugin.BaseCompilation, _this: RsdoctorPluginInstance<Plugin.BaseCompiler, Linter.ExtendRuleData<any, string>[]>, sourceMapFilenameRegex?: RegExp, namespace?: string): Promise<void>;
/**
 * Handles the emit event for assets to collect source map information.
 * @param options - The options for handling source map assets.
 * @returns A promise that resolves when the source map information is collected.
 */
export declare function handleEmitAssets(options: SourceMapAssetOptions): Promise<void>;
export {};
