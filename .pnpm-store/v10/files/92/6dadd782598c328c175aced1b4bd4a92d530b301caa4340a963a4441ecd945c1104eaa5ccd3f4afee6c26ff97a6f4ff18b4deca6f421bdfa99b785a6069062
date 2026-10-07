"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatementKind = void 0;
/** statement category */
var StatementKind;
(function (StatementKind) {
    /**
     * Import by default
     * @example
     * ```ts
     * import defaultName from 'name';
     * ```
     */
    StatementKind[StatementKind["ImportDefault"] = 100] = "ImportDefault";
    /**
     * Named import
     * @example
     * ```ts
     * import { name1, name as name2 } from 'name';
     * ```
     */
    StatementKind[StatementKind["ImportNamed"] = 101] = "ImportNamed";
    /**
     * Default and named import
     * @example
     * ```ts
     * import defaultName, { name1 } from 'name';
     * ```
     */
    StatementKind[StatementKind["ImportDefaultWithNamed"] = 102] = "ImportDefaultWithNamed";
    /**
     * Default and Namespace import
     * @example
     * ```ts
     * import defaultName, * as name from 'name';
     * ```
     */
    StatementKind[StatementKind["ImportDefaultWithNamespace"] = 103] = "ImportDefaultWithNamespace";
    /**
     * Namespace import
     * @example
     * ```ts
     * import * as namespaceName from 'name';
     * ```
     */
    StatementKind[StatementKind["ImportNamespace"] = 104] = "ImportNamespace";
    /**
     * Side effects import
     * @example
     * ```ts
     * import 'name';
     * ```
     */
    StatementKind[StatementKind["ImportSideEffect"] = 105] = "ImportSideEffect";
    /**
     * Dynamic import
     * @example
     * ```ts
     * import('name');
     * ```
     */
    StatementKind[StatementKind["ImportDynamic"] = 106] = "ImportDynamic";
    /**
     * Declare export
     * @example
     * ```ts
     * export const name = '123';
     * ```
     */
    StatementKind[StatementKind["ExportDeclaration"] = 200] = "ExportDeclaration";
    /**
     * List export
     * @example
     * ```ts
     * export { item1, item as item2 };
     * ```
     */
    StatementKind[StatementKind["ExportList"] = 201] = "ExportList";
    /**
     * Default export
     * @example
     * ```ts
     * export default name;
     * ```
     */
    StatementKind[StatementKind["ExportDefault"] = 202] = "ExportDefault";
    /**
     * Re-export
     * @example
     * ```ts
     * export { default as defaultName, item1, item as item2 } from 'name';
     * ```
     */
    StatementKind[StatementKind["ExportAggregating"] = 203] = "ExportAggregating";
    /**
     * Re-export to Namespace
     * @example
     * ```ts
     * export * as namespaceName from 'name';
     * ```
     */
    StatementKind[StatementKind["ExportNamespace"] = 204] = "ExportNamespace";
    /**
     * CJS module import
     * @example
     * ```ts
     * require('name');
     * ```
     */
    StatementKind[StatementKind["RequireCall"] = 300] = "RequireCall";
    /**
     * CJS named import
     * @example
     * ```ts
     * require('name').name
     * ```
     */
    StatementKind[StatementKind["RequireName"] = 301] = "RequireName";
    /**
     * Overall export
     * @example
     * ```ts
     * module.exports = {};
     * ```
     */
    StatementKind[StatementKind["RequireExports"] = 302] = "RequireExports";
    /**
     * CJS re-export
     * @example
     * ```ts
     * module.exports = require('name');
     * ```
     */
    StatementKind[StatementKind["RequireExportAggregating"] = 303] = "RequireExportAggregating";
    /**
     * Named export
     * @example
     * ```ts
     * export.name = '123';
     * ```
     */
    StatementKind[StatementKind["RequireExportName"] = 304] = "RequireExportName";
    /**
     * Unknown statement
     */
    StatementKind[StatementKind["Unknown"] = 999] = "Unknown";
})(StatementKind || (exports.StatementKind = StatementKind = {}));
