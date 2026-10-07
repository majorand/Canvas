import { SDK } from '@rsdoctor/types';
import { ParseBundle } from '../../types/transform.js';
export type ParsedModuleSizeData = {
    [x: string]: {
        size: number;
        sizeConvert: string;
        content: string;
    };
};
/**
 * The following code is modified based on
 * https://github.com/webpack-contrib/webpack-bundle-analyzer/blob/8a3d3f0f40010f2b41ccd28519eda5a44e13da3e/src/analyzer.js#L20
 *
 * MIT Licensed
 * Author th0r
 * Copyright JS Foundation and other contributors.
 * https://github.com/webpack-contrib/webpack-bundle-analyzer/blob/44bd8d0f9aa3b098e271af220096ea70cc44bc9e/LICENSE
 */
export declare function getAssetsModulesData(moduleGraph: SDK.ModuleGraphInstance, chunkGraph: SDK.ChunkGraphInstance, bundleDir: string, opts: {
    parseBundle?: ParseBundle;
}, sourceMapSets?: Map<string, string>, assetsWithoutSourceMap?: Set<string>): Promise<void>;
export declare function transformAssetsModulesData(parsedModulesData: ParsedModuleSizeData, moduleGraph: SDK.ModuleGraphInstance): void;
