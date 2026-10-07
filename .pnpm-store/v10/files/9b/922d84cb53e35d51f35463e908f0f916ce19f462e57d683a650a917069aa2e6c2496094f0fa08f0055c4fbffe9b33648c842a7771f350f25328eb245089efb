import { Plugin } from '@rsdoctor/types';
export type IHook = Plugin.BaseCompiler['hooks'][keyof Plugin.BaseCompiler['hooks']];
export declare function shouldInterceptPluginHook<T extends IHook>(hook: T): boolean;
export declare function interceptCompilerHooks(compiler: Plugin.BaseCompiler, interceptor: (name: string, hook: IHook, scope: 'compiler') => void): void;
export declare function interceptCompilationHooks(compilation: Plugin.BaseCompilation, interceptor: (name: string, hook: IHook, scope: 'compilation') => void): void;
