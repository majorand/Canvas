import { Rule, Err, Plugin } from '@rsdoctor/types';
import { InternalBasePlugin } from './base.js';
import { DevToolError } from '@rsdoctor/utils/error';
export declare class InternalErrorReporterPlugin<T extends Plugin.BaseCompiler> extends InternalBasePlugin<T> {
    readonly name = "error-reporter";
    apply(compiler: T): void;
    done: (stats: Plugin.BaseStats) => Promise<void>;
    handleWebpackError(err: Plugin.BuildError, category: Rule.RuleMessageCategory, level: keyof typeof Err.ErrorLevel): DevToolError;
    reportWarnings(warnings: Plugin.BuildError[]): Promise<void>;
    reportErrors(errors: Plugin.BuildWarning[]): Promise<void>;
}
