import type { SourceMapConsumer } from 'source-map';
import * as Webpack from 'webpack';
import * as Rspack from '@rspack/core';
import { Node } from '@rsdoctor/utils/ruleUtils';
import { Plugin, SDK } from '@rsdoctor/types';
export interface TransformContext {
    astCache?: Map<Webpack.NormalModule, Node.Program>;
    packagePathMap?: Map<string, string>;
    getSourceMap?(module: string): Promise<SourceMapConsumer | undefined>;
}
/**
 * Get the type of dependencies between modules.
 * This property can determine what runtime webpack has added to the modules.
 */
export declare function getModuleExportsType(module: Webpack.NormalModule | Rspack.NormalModule, moduleGraph?: Webpack.ModuleGraph, strict?: boolean): SDK.DependencyBuildMeta['exportsType'];
export declare function appendModuleGraphByCompilation(compilation: Plugin.BaseCompilation, graph: SDK.ModuleGraphInstance, features?: Plugin.RsdoctorWebpackPluginFeatures, context?: TransformContext): Promise<SDK.ModuleGraphInstance>;
