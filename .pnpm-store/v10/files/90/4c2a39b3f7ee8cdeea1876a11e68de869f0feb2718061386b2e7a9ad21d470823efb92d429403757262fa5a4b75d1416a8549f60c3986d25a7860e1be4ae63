import { Config, Plugin, SDK } from '@rsdoctor/types';
import type { RuleSetCondition as RspackRuleSetCondition, RuleSetRule as RspackRuleSetRule } from '@rspack/core';
import { RuleSetCondition as WebpackRuleSetCondition, RuleSetConditionAbsolute as WebpackRuleSetConditionAbsolute, RuleSetRule as WebpackRuleSetRule } from 'webpack';
/**
 * Process mode-specific configurations with priority logic
 */
export declare function processModeConfigurations(finalMode: keyof typeof SDK.IMode, output: Config.IOutput<'brief' | 'normal'>, brief: Config.BriefConfig | undefined): {
    finalBrief: {};
    finalNormalOptions: Config.NormalModeOptions;
};
/**
 * Process brief mode configuration with priority logic
 * Priority: output.options.briefOptions > output.brief > default
 */
export declare function processBriefHtmlModeConfig(output: Config.BriefModeConfig, brief: Config.BriefConfig | undefined): Config.BriefModeOptions;
/**
 * Convert reportCodeType object to NewReportCodeType enum value
 */
export declare function convertReportCodeTypeObject(reportCodeType: any): Config.NewReportCodeType | undefined;
/**
 * This function recursively processes rule set conditions to ensure they can be
 * properly serialized to JSON.
 *
 * @param item - The rule set condition to make serializable. Can be:
 *   - RspackRuleSetCondition: Rspack-specific rule conditions
 *   - WebpackRuleSetConditionAbsolute: Webpack absolute rule conditions
 *   - WebpackRuleSetCondition: Webpack rule conditions
 *   - void: Undefined or null values
 *
 * @example
 * ```typescript
 * const condition = /\.js$/;
 * JSON.stringify(condition); // Error: Converting circular structure to JSON
 *
 * makeRuleSetSerializable(condition);
 * JSON.stringify(condition); // '"/\\.js$/"'
 * ```
 */
export declare function makeRuleSetSerializable(item: RspackRuleSetCondition | WebpackRuleSetConditionAbsolute | WebpackRuleSetCondition | void): void;
export declare function makeRulesSerializable(rules: Plugin.RuleSetRule[] | RspackRuleSetRule['oneOf'] | WebpackRuleSetRule['oneOf']): void;
