import { Parser as AcornParser, Options, Position } from 'acorn';
import * as walk from 'acorn-walk';
import * as utils from './utils.js';
import type { Node } from './types.js';
export type { Options as ParseOptions } from 'acorn';
export interface ParseError extends Error {
    loc?: Position;
    pos: number;
    raisedAt: number;
}
export declare const parser: {
    /** AST iterator */
    walk: typeof walk;
    /**
     * Compile code
     * - Output root node is `Node.Program`
     */
    parse: (input: string, options: Options) => Node.Program;
    /**
     * Compile the next first expression
     * - The output root node is `Node.ExpressionStatement`
     */
    parseExpressionAt: (input: string, pos: number, options: Options) => Node.ExpressionStatement;
    /**
     * add plugins for acorn
     */
    extend(...args: Parameters<typeof AcornParser.extend>): typeof AcornParser;
    /** Set of assertions */
    asserts: {
        readonly isProgram: (node: unknown) => node is Node.Program;
        readonly isEmptyStatement: (node: unknown) => node is Node.EmptyStatement;
        readonly isBlockStatement: (node: unknown) => node is Node.BlockStatement;
        readonly isStaticBlock: (node: unknown) => node is Node.StaticBlock;
        readonly isExpressionStatement: (node: unknown) => node is Node.ExpressionStatement;
        readonly isIfStatement: (node: unknown) => node is Node.IfStatement;
        readonly isLabeledStatement: (node: unknown) => node is Node.LabeledStatement;
        readonly isBreakStatement: (node: unknown) => node is Node.BreakStatement;
        readonly isContinueStatement: (node: unknown) => node is Node.ContinueStatement;
        readonly isWithStatement: (node: unknown) => node is Node.WithStatement;
        readonly isSwitchStatement: (node: unknown) => node is Node.SwitchStatement;
        readonly isReturnStatement: (node: unknown) => node is Node.ReturnStatement;
        readonly isThrowStatement: (node: unknown) => node is Node.ThrowStatement;
        readonly isTryStatement: (node: unknown) => node is Node.TryStatement;
        readonly isWhileStatement: (node: unknown) => node is Node.WhileStatement;
        readonly isDoWhileStatement: (node: unknown) => node is Node.DoWhileStatement;
        readonly isForStatement: (node: unknown) => node is Node.ForStatement;
        readonly isForInStatement: (node: unknown) => node is Node.ForInStatement;
        readonly isForOfStatement: (node: unknown) => node is Node.ForOfStatement;
        readonly isDebuggerStatement: (node: unknown) => node is Node.DebuggerStatement;
        readonly isFunctionDeclaration: (node: unknown) => node is Node.FunctionDeclaration;
        readonly isVariableDeclaration: (node: unknown) => node is Node.VariableDeclaration;
        readonly isVariableDeclarator: (node: unknown) => node is Node.VariableDeclarator;
        readonly isChainExpression: (node: unknown) => node is Node.ChainExpression;
        readonly isThisExpression: (node: unknown) => node is Node.ThisExpression;
        readonly isArrayExpression: (node: unknown) => node is Node.ArrayExpression;
        readonly isObjectExpression: (node: unknown) => node is Node.ObjectExpression;
        readonly isPrivateIdentifier: (node: unknown) => node is Node.PrivateIdentifier;
        readonly isProperty: (node: unknown) => node is Node.Property;
        readonly isPropertyDefinition: (node: unknown) => node is Node.PropertyDefinition;
        readonly isFunctionExpression: (node: unknown) => node is Node.FunctionExpression;
        readonly isSequenceExpression: (node: unknown) => node is Node.SequenceExpression;
        readonly isUnaryExpression: (node: unknown) => node is Node.UnaryExpression;
        readonly isBinaryExpression: (node: unknown) => node is Node.BinaryExpression;
        readonly isAssignmentExpression: (node: unknown) => node is Node.AssignmentExpression;
        readonly isUpdateExpression: (node: unknown) => node is Node.UpdateExpression;
        readonly isLogicalExpression: (node: unknown) => node is Node.LogicalExpression;
        readonly isConditionalExpression: (node: unknown) => node is Node.ConditionalExpression;
        readonly isNewExpression: (node: unknown) => node is Node.NewExpression;
        readonly isSwitchCase: (node: unknown) => node is Node.SwitchCase;
        readonly isCatchClause: (node: unknown) => node is Node.CatchClause;
        readonly isIdentifier: (node: unknown) => node is Node.Identifier;
        readonly isLiteral: (node: unknown) => node is Node.Literal;
        readonly isSuper: (node: unknown) => node is Node.Super;
        readonly isSpreadElement: (node: unknown) => node is Node.SpreadElement;
        readonly isArrowFunctionExpression: (node: unknown) => node is Node.ArrowFunctionExpression;
        readonly isYieldExpression: (node: unknown) => node is Node.YieldExpression;
        readonly isTemplateLiteral: (node: unknown) => node is Node.TemplateLiteral;
        readonly isTaggedTemplateExpression: (node: unknown) => node is Node.TaggedTemplateExpression;
        readonly isTemplateElement: (node: unknown) => node is Node.TemplateElement;
        readonly isObjectPattern: (node: unknown) => node is Node.ObjectPattern;
        readonly isArrayPattern: (node: unknown) => node is Node.ArrayPattern;
        readonly isRestElement: (node: unknown) => node is Node.RestElement;
        readonly isAssignmentPattern: (node: unknown) => node is Node.AssignmentPattern;
        readonly isClassBody: (node: unknown) => node is Node.ClassBody;
        readonly isClassDeclaration: (node: unknown) => node is Node.ClassDeclaration;
        readonly isClassExpression: (node: unknown) => node is Node.ClassExpression;
        readonly isMetaProperty: (node: unknown) => node is Node.MetaProperty;
        readonly isImportDeclaration: (node: unknown) => node is Node.ImportDeclaration;
        readonly isImportSpecifier: (node: unknown) => node is Node.ImportSpecifier;
        readonly isImportExpression: (node: unknown) => node is Node.ImportExpression;
        readonly isImportDefaultSpecifier: (node: unknown) => node is Node.ImportDefaultSpecifier;
        readonly isImportNamespaceSpecifier: (node: unknown) => node is Node.ImportNamespaceSpecifier;
        readonly isExportNamedDeclaration: (node: unknown) => node is Node.ExportNamedDeclaration;
        readonly isExportSpecifier: (node: unknown) => node is Node.ExportSpecifier;
        readonly isExportDefaultDeclaration: (node: unknown) => node is Node.ExportDefaultDeclaration;
        readonly isExportAllDeclaration: (node: unknown) => node is Node.ExportAllDeclaration;
        readonly isAwaitExpression: (node: unknown) => node is Node.AwaitExpression;
        readonly isMethodDefinition: (node: unknown) => node is Node.MethodDefinition;
        readonly isMemberExpression: (node: unknown) => node is Node.MemberExpression;
        readonly isComment: (node: unknown) => node is Node.Comment;
        readonly isDirective: (node: unknown) => node is Node.Directive;
        readonly isSimpleCallExpression: (node: unknown) => node is Node.SimpleCallExpression;
        readonly isAssignmentProperty: (node: unknown) => node is Node.AssignmentProperty;
        readonly isSimpleLiteral: (node: unknown) => node is Node.SimpleLiteral;
        readonly isRegExpLiteral: (node: unknown) => node is Node.RegExpLiteral;
        readonly isBigIntLiteral: (node: unknown) => node is Node.BigIntLiteral;
        readonly isExportStatement: (node: unknown) => node is Node.ExportStatement;
    };
    utils: typeof utils;
    /**
     * @internal
     * parser for internal packages
     */
    internal: {
        parse: (input: string, options: Options) => Node.Program;
        parseExpressionAt: (input: string, pos: number, options: Options) => Node.ExpressionStatement;
    };
};
