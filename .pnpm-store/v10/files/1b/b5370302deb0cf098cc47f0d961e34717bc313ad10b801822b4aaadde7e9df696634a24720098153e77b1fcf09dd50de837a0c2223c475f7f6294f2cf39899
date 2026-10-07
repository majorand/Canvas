import { SDK } from '@rsdoctor/types';
interface DependencyData {
    type?: string;
}
/** Determine whether it is the import statement itself */
export declare function isImportDependency({ type }: DependencyData): boolean;
export declare function getImportKind(dep: DependencyData): SDK.DependencyKind;
/**
 * Remove the css module without connection
 *   - This will happen when the user uses the mini-css plug-in.
 */
export declare function removeNoImportStyle(graph: SDK.ModuleGraphInstance): void;
export {};
