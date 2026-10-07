import type { CheckSyntaxOptions as BaseCheckSyntaxOptions, CheckSyntaxExclude, ECMASyntaxError, EcmaVersion, SyntaxErrorKey } from './types.js';
export declare const JS_REGEX: RegExp;
type CheckSyntaxOptions = BaseCheckSyntaxOptions & {
    rootPath?: string;
} & (Required<Pick<BaseCheckSyntaxOptions, 'targets'>> | Required<Pick<BaseCheckSyntaxOptions, 'ecmaVersion'>>);
export declare class CheckSyntax {
    errors: ECMASyntaxError[];
    ecmaVersion: EcmaVersion;
    targets?: string[];
    rootPath: string;
    exclude?: CheckSyntaxExclude;
    excludeOutput?: CheckSyntaxExclude;
    excludeErrorMessage?: CheckSyntaxExclude;
    excludeErrorLogs: SyntaxErrorKey[];
    constructor(options: CheckSyntaxOptions);
    check(filepath: string, code?: string): Promise<void>;
    tryParse(filepath: string, code: string): Promise<void>;
}
export {};
