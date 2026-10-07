import { SDK } from '@rsdoctor/types';
export declare class Statement implements SDK.StatementInstance {
    static getDefaultStatement(module: SDK.ModuleInstance): Statement;
    readonly position: SDK.StatementPosition;
    readonly module: SDK.ModuleInstance;
    constructor(module: SDK.ModuleInstance, position: SDK.StatementPosition);
    isSame(statement: SDK.StatementInstance): boolean;
    getSourcePosition(): SDK.SourceRange | undefined;
    getLineCode(): string | undefined;
    toData(): SDK.StatementData;
}
