import { InternalBasePlugin } from './base.js';
import { Plugin } from '@rsdoctor/types';
export declare class InternalRulesPlugin extends InternalBasePlugin<Plugin.BaseCompiler> {
    readonly name = "rules";
    apply(compiler: Plugin.BaseCompiler): void;
    done: (stats: Plugin.BaseStats) => Promise<void>;
    protected lint(compilation: Plugin.BaseCompilation): Promise<void>;
}
