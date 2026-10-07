import { Plugin } from '@rsdoctor/types';
import { InternalBasePlugin } from './base.js';
export declare class InternalPluginsPlugin<T extends Plugin.BaseCompiler> extends InternalBasePlugin<T> {
    readonly name = "plugins";
    apply(compiler: Plugin.BaseCompiler): void;
    afterPlugins: (compiler: Plugin.BaseCompiler) => void;
    compilation: (compilation: Plugin.BaseCompilation) => void;
}
