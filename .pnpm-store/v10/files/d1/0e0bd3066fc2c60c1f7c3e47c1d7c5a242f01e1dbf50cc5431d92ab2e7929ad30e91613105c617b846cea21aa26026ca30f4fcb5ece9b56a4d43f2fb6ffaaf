import type { Plugin } from '@rsdoctor/types';
import { InternalBasePlugin } from './base.js';
export declare class InternalSummaryPlugin<T extends Plugin.BaseCompiler> extends InternalBasePlugin<T> {
    readonly name = "summary";
    private times;
    private preTimes;
    private postTimes;
    apply(compiler: T): void;
    private mark;
    beforeCompile: () => Promise<void>;
    afterCompile: (compilation: Plugin.BaseCompilation) => Promise<void>;
    done: (compiler: T) => Promise<void>;
    private report;
}
