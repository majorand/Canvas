import type { SourceRange, ModuleInstance } from './module';
import type { NonFunctionProperties } from '../common';
/** Statement position */
export interface StatementPosition {
    /**
     * Source code location
     * - Because sourceMap may not exist, there may not be a value here
     * There are many reasons why sourceMap does not exist, it may be a parsing failure, or it may be ignored during the loader conversion process
     */
    source?: SourceRange;
    /** Converted code position */
    transformed: SourceRange;
}
/** statement category */
export declare enum StatementKind {
    /**
     * Import by default
     * @example
     * ```ts
     * import defaultName from 'name';
     * ```
     */
    ImportDefault = 100,
    /**
     * Named import
     * @example
     * ```ts
     * import { name1, name as name2 } from 'name';
     * ```
     */
    ImportNamed = 101,
    /**
     * Default and named import
     * @example
     * ```ts
     * import defaultName, { name1 } from 'name';
     * ```
     */
    ImportDefaultWithNamed = 102,
    /**
     * Default and Namespace import
     * @example
     * ```ts
     * import defaultName, * as name from 'name';
     * ```
     */
    ImportDefaultWithNamespace = 103,
    /**
     * Namespace import
     * @example
     * ```ts
     * import * as namespaceName from 'name';
     * ```
     */
    ImportNamespace = 104,
    /**
     * Side effects import
     * @example
     * ```ts
     * import 'name';
     * ```
     */
    ImportSideEffect = 105,
    /**
     * Dynamic import
     * @example
     * ```ts
     * import('name');
     * ```
     */
    ImportDynamic = 106,
    /**
     * Declare export
     * @example
     * ```ts
     * export const name = '123';
     * ```
     */
    ExportDeclaration = 200,
    /**
     * List export
     * @example
     * ```ts
     * export { item1, item as item2 };
     * ```
     */
    ExportList = 201,
    /**
     * Default export
     * @example
     * ```ts
     * export default name;
     * ```
     */
    ExportDefault = 202,
    /**
     * Re-export
     * @example
     * ```ts
     * export { default as defaultName, item1, item as item2 } from 'name';
     * ```
     */
    ExportAggregating = 203,
    /**
     * Re-export to Namespace
     * @example
     * ```ts
     * export * as namespaceName from 'name';
     * ```
     */
    ExportNamespace = 204,
    /**
     * CJS module import
     * @example
     * ```ts
     * require('name');
     * ```
     */
    RequireCall = 300,
    /**
     * CJS named import
     * @example
     * ```ts
     * require('name').name
     * ```
     */
    RequireName = 301,
    /**
     * Overall export
     * @example
     * ```ts
     * module.exports = {};
     * ```
     */
    RequireExports = 302,
    /**
     * CJS re-export
     * @example
     * ```ts
     * module.exports = require('name');
     * ```
     */
    RequireExportAggregating = 303,
    /**
     * Named export
     * @example
     * ```ts
     * export.name = '123';
     * ```
     */
    RequireExportName = 304,
    /**
     * Unknown statement
     */
    Unknown = 999
}
/** Statement class */
export interface StatementInstance {
    /** Current statement position */
    readonly position: StatementPosition;
    /** Module where the statement is located */
    readonly module: ModuleInstance;
    /** Is it the same statement */
    isSame(statement: StatementInstance): boolean;
    /**
     * Get original location
     * - When running for the first time and the Module contains sourceMap, it will be calculated
     */
    getSourcePosition(): SourceRange | undefined;
    /** Output data */
    toData(): StatementData;
    getLineCode(): string | undefined;
}
/** statement data */
export interface StatementData extends Omit<NonFunctionProperties<StatementInstance>, 'module'> {
    /** Module number where the statement is located */
    module: number;
}
