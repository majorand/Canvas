import { SDK } from '@rsdoctor/types';
export declare const RspackLoaderInternalPropertyName = "__l__";
export declare enum RspackSummaryCostsDataName {
    Bootstrap = "bootstrap->rspack:beforeCompile",
    Compile = "rspack:beforeCompile->afterCompile",
    Done = "rspack:afterCompile->done",
    Minify = "rspack:minify(rspack:optimizeChunkAssets)"
}
/**
 * Check if the compiler configuration supports source maps
 * @param configs - Array of compiler configurations
 * @returns Object containing compiler type and source map support status
 */
export declare function checkSourceMapSupport(configs: SDK.WebpackConfigData[]): {
    isRspack: boolean;
    hasSourceMap: boolean;
};
