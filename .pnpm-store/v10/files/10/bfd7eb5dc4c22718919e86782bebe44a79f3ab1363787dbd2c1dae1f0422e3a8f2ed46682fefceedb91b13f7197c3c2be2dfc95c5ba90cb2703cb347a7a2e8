import type { SDK } from '@rsdoctor/types';
export declare class Package implements SDK.PackageInstance {
    id: number;
    root: string;
    name: string;
    version: string;
    duplicates: SDK.CrossChunksPackageType[];
    private _modules;
    private _dependencies;
    private _imported;
    constructor(name: string, root: string, version: string);
    setDuplicates(data: SDK.CrossChunksPackageType): void;
    getModules(): SDK.ModuleInstance[];
    getDependencies(): SDK.PackageDependencyInstance[];
    getImported(): SDK.PackageInstance[];
    addModule(module: SDK.ModuleInstance): void;
    addDependency(dep: SDK.PackageDependencyInstance): void;
    getDependenciesChain(graph: SDK.PackageGraphInstance): SDK.PackageDependencyInstance[];
    addImported(pkg: SDK.PackageInstance): void;
    contain(file: string): boolean;
    isSame(pkg: SDK.PackageInstance): boolean;
    getSize(): SDK.ModuleSize;
    toData(): SDK.PackageData;
}
