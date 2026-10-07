import { SDK } from '@rsdoctor/types';
export declare class ExportInfo implements SDK.ExportInstance {
    static init(): void;
    id: number;
    name: string;
    identifier?: SDK.StatementInstance;
    private from?;
    private _variable?;
    private _sideEffects;
    constructor(name: string, identifier?: SDK.StatementInstance, variable?: SDK.VariableInstance);
    get isReExport(): boolean;
    set variable(data: SDK.VariableInstance | undefined);
    get variable(): SDK.VariableInstance | undefined;
    addSideEffect(info: SDK.SideEffectInstance): void;
    getSideEffects(): SDK.SideEffectInstance[];
    setFromExport(from: SDK.ExportInstance): void;
    getRecursiveExport(depth?: number): ExportInfo;
    toData(): SDK.ExportData;
}
