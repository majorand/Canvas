import type { RsdoctorRspackPluginInstance, RsdoctorRspackPluginOptions, RsdoctorRspackPluginOptionsNormalized } from '@rsdoctor/core/types';
import { RsdoctorPrimarySDK } from '@rsdoctor/sdk';
import { Linter, Plugin, SDK } from '@rsdoctor/types';
export declare class RsdoctorRspackPlugin<Rules extends Linter.ExtendRuleData[]> implements RsdoctorRspackPluginInstance<Rules> {
    readonly name = "RsdoctorRspackPlugin";
    readonly sdk: SDK.RsdoctorBuilderSDKInstance | RsdoctorPrimarySDK;
    readonly isRsdoctorPlugin: boolean;
    _bootstrapTask: Promise<unknown>;
    protected browserIsOpened: boolean;
    modulesGraph: SDK.ModuleGraphInstance;
    options: RsdoctorRspackPluginOptionsNormalized<Rules>;
    outsideInstance: boolean;
    constructor(options?: RsdoctorRspackPluginOptions<Rules>);
    apply(compiler: unknown): unknown;
    /**
     * @description Generate ModuleGraph and ChunkGraph from stats and webpack module apis;
     * @param {Compiler} compiler
     * @return {*}
     * @memberof RsdoctorWebpackPlugin
     */
    ensureModulesChunksGraphApplied(compiler: Plugin.BaseCompilerType<'rspack'>): void;
    afterPlugins: (compiler: Plugin.BaseCompilerType<"rspack">) => void;
    done: (compiler: Plugin.BaseCompilerType<"rspack">) => Promise<void>;
    getRspackConfig(compiler: Plugin.BaseCompilerType<'rspack'>): void;
}
