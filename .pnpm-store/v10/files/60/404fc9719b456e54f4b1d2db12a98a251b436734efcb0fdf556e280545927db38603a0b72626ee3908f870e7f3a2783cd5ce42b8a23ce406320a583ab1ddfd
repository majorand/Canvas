import { Plugin } from '@rsdoctor/types';
import { InternalBasePlugin } from './base.js';
export declare class InternalLoaderPlugin<T extends Plugin.BaseCompiler> extends InternalBasePlugin<T> {
    readonly name = "loader";
    readonly internalLoaderPath: string;
    apply(compiler: T): void;
    afterPlugins: (compiler: T) => void;
    compilation(compiler: T, compilation: Plugin.BaseCompilation): void;
    getInterceptRules(compiler: T, rules: Plugin.BuildRuleSetRules): Plugin.BuildRuleSetRule[];
}
