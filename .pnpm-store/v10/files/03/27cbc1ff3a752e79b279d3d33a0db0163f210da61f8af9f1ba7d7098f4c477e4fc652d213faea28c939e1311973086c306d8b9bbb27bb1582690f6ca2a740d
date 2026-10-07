import { Node, Range } from '@rsdoctor/utils/ruleUtils';
import type { SDK, Linter } from '@rsdoctor/types';
export declare function getDefaultImportByRequest(node: Node.Program, request: string): Node.ImportDeclaration | undefined;
/**
 * Determine that it contains the same left value assignment expression in the enumeration.
 */
export declare function hasSameLeftInAssignStatement(node: Node.Program, compare: Node.SyntaxNode[]): Node.Pattern | undefined;
export declare function importDeclarationToString(node: Node.ImportDeclaration): string;
export declare function getFixData(module: SDK.ModuleInstance, node: Node.ImportDeclaration, originalRange: Range): Linter.FixData;
export declare function getSourceRangeFromTransformedOffset(module: SDK.ModuleInstance, node: Node.SyntaxNode): Linter.ReportDocument | undefined;
