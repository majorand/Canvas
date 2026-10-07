import type { Linter, Plugin, SDK } from '@rsdoctor/types';
import type { InternalPlugin, RsdoctorPluginInstance } from '../../types/index.js';
export declare abstract class InternalBasePlugin<T extends Plugin.BaseCompiler> implements InternalPlugin<T, Linter.ExtendRuleData[]> {
    readonly scheduler: RsdoctorPluginInstance<T, Linter.ExtendRuleData[]>;
    abstract name: string;
    constructor(scheduler: RsdoctorPluginInstance<T, Linter.ExtendRuleData[]>);
    abstract apply(compiler: T): void;
    get options(): Plugin.RsdoctorPluginOptionsNormalized<Linter.ExtendRuleData<any, string>[]>;
    get sdk(): SDK.RsdoctorBuilderSDKInstance;
    get tapPostOptions(): import("tapable").Tap;
    get tapPreOptions(): import("tapable").Tap;
}
