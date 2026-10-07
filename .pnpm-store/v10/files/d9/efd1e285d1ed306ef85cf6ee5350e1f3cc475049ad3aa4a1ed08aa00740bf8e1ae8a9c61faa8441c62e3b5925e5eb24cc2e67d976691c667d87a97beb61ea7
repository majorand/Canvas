import type { SDK } from '@rsdoctor/types';
export declare class PackageDependency implements SDK.PackageDependencyInstance {
    id: number;
    dependency: SDK.PackageInstance;
    package: SDK.PackageInstance;
    refDependency: SDK.DependencyInstance;
    constructor(pack: SDK.PackageInstance, dep: SDK.PackageInstance, refDependency: SDK.DependencyInstance);
    get name(): string;
    get version(): string;
    get root(): string;
    isSame(dep: SDK.PackageDependencyInstance): boolean;
    toData(): SDK.PackageDependencyData;
}
