import { Linter, SDK, Rule as RuleTypes } from '@rsdoctor/types';
import { LinterType } from './linter.js';
type DefaultRuleConfig = Linter.DefaultRuleConfig;
export declare class Rule<Config = DefaultRuleConfig> implements Linter.RuleMeta<Config> {
    static from<C>(data: Linter.ExtendRuleData<C>): Rule<C>;
    readonly meta: Linter.RuleMeta<Config>;
    private check;
    /**
     * execute when check end
     */
    private onCheckEnd;
    private _severity;
    private _config?;
    constructor(data: Linter.RuleData<Config>);
    get code(): RuleTypes.RuleMessageCode;
    get title(): string;
    get severity(): Linter.Severity;
    get config(): Config | undefined;
    get category(): "compile" | "bundle" | RuleTypes.RuleMessageCategory | "emo";
    setOption(opt: Linter.RuleConfigItem): void;
    match(level: Linter.Severity): boolean;
    validate(context: SDK.RuntimeContext): Promise<Linter.ValidateResult>;
    afterValidate({ hooks, validateResult, data, }: LinterType.InternalRuleCheckerContextForCheckEnd<Config>): Promise<void>;
}
export declare function defineRule<Title extends Linter.DefaultRuleTitle, T = Linter.DefaultRuleConfig>(ruleCreator: Linter.ExtendRuleConstructor<Title, T>): Linter.ExtendRuleData<T, Title>;
export declare function defineRule<Title extends Linter.DefaultRuleTitle, T = Linter.DefaultRuleConfig>(ruleCreator: Linter.RuleConstructor<Title, T>): Linter.RuleData<T, Title>;
export {};
