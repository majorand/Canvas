import type { RsdoctorMultiplePluginOptions } from '@rsdoctor/core/types';
import { type Linter } from '@rsdoctor/types';
import type { Compiler } from '@rspack/core';
import { RsdoctorRspackPlugin } from './plugin.js';
export declare class RsdoctorRspackMultiplePlugin<Rules extends Linter.ExtendRuleData[]> extends RsdoctorRspackPlugin<Rules> {
    private controller;
    constructor(options?: RsdoctorMultiplePluginOptions<Rules>);
    apply(compiler: Compiler): void;
}
