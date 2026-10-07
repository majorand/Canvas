import { SDK } from '@rsdoctor/types';
export declare class SideEffect implements SDK.SideEffectInstance {
    static init(): void;
    /** Name import tags */
    static NamespaceSymbol: symbol;
    readonly id: number;
    readonly name: string;
    readonly originName?: string;
    readonly module: SDK.ModuleInstance;
    readonly identifier: SDK.StatementInstance;
    readonly isNameSpace: boolean;
    readonly fromDependency?: SDK.DependencyInstance;
    private _exports;
    private _variable?;
    constructor(name: string, module: SDK.ModuleInstance, identifier: SDK.StatementInstance, fromRequest?: string, originName?: string | symbol);
    get variable(): SDK.VariableInstance | undefined;
    get exports(): SDK.ExportInstance[];
    setModuleExport(mgm: SDK.ModuleGraphModuleInstance): void;
    setExportInfo(info: SDK.ExportInstance): void;
    toData(): SDK.SideEffectData;
}
