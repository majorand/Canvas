import { SDK } from '@rsdoctor/types';
export declare class Variable implements SDK.VariableInstance {
    static init(): void;
    readonly id: number;
    readonly name: string;
    readonly module: SDK.ModuleInstance;
    readonly usedInfo: string;
    readonly identifier: SDK.StatementInstance;
    private _exported?;
    constructor(name: string, module: SDK.ModuleInstance, usedInfo: string, identifier: SDK.StatementInstance);
    get isUsed(): boolean;
    setExportInfo(info: SDK.ExportInstance): void;
    getExportInfo(): SDK.ExportInstance | undefined;
    toData(): SDK.VariableData;
}
