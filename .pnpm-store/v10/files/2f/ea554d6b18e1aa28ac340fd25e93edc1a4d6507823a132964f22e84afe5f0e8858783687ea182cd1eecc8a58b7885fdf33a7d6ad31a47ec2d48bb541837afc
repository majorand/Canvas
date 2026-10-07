import { ecmaVersion } from 'acorn';
import { Node, ECMAVersion } from './types.js';
/**
 * Is the node semantics the same?
 * @deprecated
 * - Recursively compare whether the content of the node itself is the same
 * - Ignore comments, positions, string symbols (single and double quotation marks)
 * - String templates and string addition will be considered different
 */
export declare function isSameSemantics(node1: Node.SyntaxNode, node2: Node.SyntaxNode): boolean;
/**
 * Get all default reference statements
 */
export declare function getDefaultImports(node: Node.Program): Node.ImportDeclaration[];
/** Get the literal in the text. */
export declare function getIdentifierInPattern(name: string, node: Node.Pattern): Node.Identifier | undefined;
/** Get the variable declaration statement identifier. */
export declare function getIdentifierInDeclaration(name: string, node: Node.SyntaxNode): Node.Identifier | undefined;
/** Get the reference declaration statement identifier. */
export declare function getIdentifierInImport(name: string, node: Node.SyntaxNode): Node.Identifier | undefined;
/** Get the export statement identifier. */
export declare function getIdentifierInExport(name: string, node: Node.SyntaxNode): Node.Identifier | undefined;
/** Determine that it can be resolved using the specified ECMA version */
export declare function canParse(code: string, ecmaVersion: ecmaVersion): boolean;
/** Determine whether it is all ES5 version code. */
export declare function isES5(code: string): boolean;
/** Determine whether it is all ES6 version code. */
export declare function isES6(code: string): boolean;
/** Detect ECMA version. */
export declare function detectECMAVersion(code: string): ECMAVersion;
