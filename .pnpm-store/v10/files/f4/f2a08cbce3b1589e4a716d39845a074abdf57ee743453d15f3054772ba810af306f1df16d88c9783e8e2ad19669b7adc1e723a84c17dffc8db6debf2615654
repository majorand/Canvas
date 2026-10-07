import { SDK } from '@rsdoctor/types';
import type { Plugin } from '@rsdoctor/types';
import { InternalBasePlugin } from './base.js';
export declare class InternalProgressPlugin<T extends Plugin.BaseCompilerType<'webpack'>> extends InternalBasePlugin<T> {
    readonly name = "progress";
    protected currentProgress: SDK.ServerAPI.InferResponseType<SDK.ServerAPI.APIExtends.GetCompileProgress>;
    apply(compiler: T): void;
}
