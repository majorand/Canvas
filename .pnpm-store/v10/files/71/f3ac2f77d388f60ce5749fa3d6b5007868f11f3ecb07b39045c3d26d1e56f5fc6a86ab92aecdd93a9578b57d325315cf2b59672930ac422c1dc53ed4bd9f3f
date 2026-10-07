import { Plugin } from '@rsdoctor/types';
import { InternalBasePlugin } from './base.js';
export declare class InternalBundlePlugin<T extends Plugin.BaseCompiler> extends InternalBasePlugin<T> {
    readonly name = "bundle";
    map: Map<string, {
        content: string;
    }>;
    apply(compiler: T): void;
    changeDevtoolModuleFilename(compiler: Plugin.BaseCompiler): void;
    ensureAssetContent(name: string): {
        content: string;
    };
    thisCompilation: (compilation: Plugin.BaseCompilation) => void;
    done: () => Promise<void>;
}
