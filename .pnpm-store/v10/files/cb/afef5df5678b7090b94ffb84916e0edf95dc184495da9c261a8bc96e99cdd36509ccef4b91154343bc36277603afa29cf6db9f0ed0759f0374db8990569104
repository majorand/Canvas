import { Plugin } from '@rsdoctor/types';
import { InternalBasePlugin } from './base.js';
import type { Compiler as WebpackCompiler } from 'webpack';
export declare class InternalResolverPlugin<T extends Plugin.BaseCompiler> extends InternalBasePlugin<T> {
    readonly name = "resolver";
    protected resolveDataMap: Map<string, {
        startAt: number;
        startHRTime: [number, number];
        request: string;
    }>;
    apply(compiler: T): void;
    protected handleNormalModuleFactory: (normalModuleFactory: Plugin.RspackNormalModuleFactory | ReturnType<WebpackCompiler["createNormalModuleFactory"]>) => void;
}
