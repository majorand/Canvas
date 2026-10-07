import { RsdoctorPluginInstance } from '../../types/index.js';
import { Linter, Plugin } from '@rsdoctor/types';
/**
 * Represents a mapping item from a source map.
 */
export interface MappingItem {
    source: string | null;
    generatedLine: number;
    generatedColumn: number;
    originalLine: number | null;
    originalColumn: number | null;
    name: string | null;
}
/**
 * Main function to generate ModuleGraph and ChunkGraph from stats and Webpack module APIs.
 * Sets up hooks to process stats, generate graphs, handle tree shaking, and collect source maps.
 * @param compiler - The Webpack or Rspack compiler instance.
 * @param _this - The Rsdoctor plugin instance.
 */
export declare const ensureModulesChunksGraphFn: (compiler: Plugin.BaseCompiler, _this: RsdoctorPluginInstance<Plugin.BaseCompiler, Linter.ExtendRuleData[]>) => void;
/**
 * Checks if source map processing is enabled and supported by the current compiler configuration.
 * Warns if eval-based source maps are used (unsupported).
 * @param compiler - The Webpack or Rspack compiler instance.
 * @returns true if source maps are enabled and supported, false otherwise.
 */
export declare const ensureDevtools: (compiler: Plugin.BaseCompiler) => boolean;
/**
 * Calculates namespace and source map filename regex for source map resolution.
 * @param compiler - The Webpack or Rspack compiler instance.
 * @returns An object containing namespace and sourceMapFilenameRegex.
 */
export declare function calculateNamespaceAndRegex(compiler: Plugin.BaseCompiler): {
    namespace: string;
    sourceMapFilenameRegex: RegExp;
};
