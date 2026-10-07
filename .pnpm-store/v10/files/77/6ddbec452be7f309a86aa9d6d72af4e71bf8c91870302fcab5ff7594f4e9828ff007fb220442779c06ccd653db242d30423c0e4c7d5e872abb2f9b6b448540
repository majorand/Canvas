import { SDK } from '@rsdoctor/types';
import { Package } from './package.js';
export { readPackageJson } from './utils.js';
export declare class PackageGraph implements SDK.PackageGraphInstance {
    static fromModuleGraph(graph: SDK.ModuleGraphInstance, root: string, getPackageFile?: SDK.GetPackageFile): PackageGraph;
    private _root;
    private _dependencies;
    private _packages;
    private _pkgNameMap;
    private _pkgFileMap;
    constructor(root: string);
    getPackages(): SDK.PackageInstance[];
    getPackageByModule(module: SDK.ModuleInstance, readFile?: SDK.GetPackageFile): SDK.PackageInstance | Package | undefined;
    getPackageByFile(file: string): SDK.PackageInstance | undefined;
    getPackageContainFile(file: string): SDK.PackageInstance | undefined;
    getPackagesByName(name: string): SDK.PackageInstance[];
    getPackageByData(data: SDK.PackageBasicData): SDK.PackageInstance | undefined;
    addPackage(pkg: SDK.PackageInstance): void;
    setDuplicates(module: SDK.ModuleInstance, pkg: SDK.PackageInstance): void;
    getDependenciesFromPackage(pkg: SDK.PackageInstance): SDK.PackageDependencyInstance[];
    addDependency(dep: SDK.PackageDependencyInstance): void;
    getDependenciesFromOrigin(): SDK.PackageDependencyInstance[];
    getDuplicatePackages(): SDK.PackageInstance[][];
    toData(): SDK.PackageGraphData;
}
