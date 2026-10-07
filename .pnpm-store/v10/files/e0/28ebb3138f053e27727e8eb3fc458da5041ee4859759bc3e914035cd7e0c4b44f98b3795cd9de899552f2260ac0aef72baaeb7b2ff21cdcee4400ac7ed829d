import { SDK } from '@rsdoctor/types';
export declare class ModuleGraphModule implements SDK.ModuleGraphModuleInstance {
    static init(): void;
    readonly module: SDK.ModuleInstance;
    private exports;
    private sideEffects;
    private variables;
    private _dynamic?;
    private _graph;
    constructor(module: SDK.ModuleInstance, graph: SDK.ModuleGraphInstance, dynamic?: boolean);
    get dynamic(): boolean;
    addExportInfo(data: SDK.ExportInstance): void;
    addSideEffect(data: SDK.SideEffectInstance): void;
    addVariable(data: SDK.VariableInstance): void;
    getExports(): SDK.ExportInstance[];
    getSideEffects(name?: string): SDK.SideEffectInstance[];
    getOwnExports(): SDK.ExportInstance[];
    getExport(name: string): SDK.ExportInstance | undefined;
    getReExports(): SDK.ExportInstance[];
    getOwnExport(name: string): SDK.ExportInstance | undefined;
    getReExport(name: string): SDK.ExportInstance | undefined;
    toData(): SDK.ModuleGraphModuleData;
}
