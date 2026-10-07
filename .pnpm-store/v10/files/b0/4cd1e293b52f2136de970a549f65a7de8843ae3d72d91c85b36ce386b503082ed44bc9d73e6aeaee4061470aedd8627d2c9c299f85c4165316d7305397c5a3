import type { Common, Plugin } from '@rsdoctor/types';
export declare function parsePathQueryFragment(str: string): {
    path: string;
    query: string;
    fragment: string;
};
export declare function loadLoaderModule(loaderPath: string, cwd?: string): {
    default: Plugin.LoaderDefinition<Common.PlainObject, {}>;
    pitch: Plugin.PitchLoaderDefinitionFunction;
    raw: boolean | void;
};
export declare function extractLoaderName(loaderPath: string, cwd?: string): string;
export declare function mapEachRules<T extends Plugin.BuildRuleSetRule>(rules: T[], callback: (rule: T) => T): T[];
export declare function isESMLoader(r: Plugin.BuildRuleSetRule): boolean;
export declare function getLoaderNameMatch(r: Plugin.BuildRuleSetRule, loaderName: string, strict?: boolean): boolean;
export declare function addProbeLoader2Rules<T extends Plugin.BuildRuleSetRule>(rules: T[], compiler: Plugin.BaseCompiler, fn: (r: Plugin.BuildRuleSetRule) => boolean): T[];
export declare function createLoaderContextTrap(this: Plugin.LoaderContext<Common.PlainObject>, final: (err: Error | null | undefined, res: string | Buffer | null, sourceMap?: Plugin.SourceMapInput) => void): Plugin.LoaderContext<Common.PlainObject<any>>;
export declare function parseQuery(query: string): {
    [k: string]: string;
};
