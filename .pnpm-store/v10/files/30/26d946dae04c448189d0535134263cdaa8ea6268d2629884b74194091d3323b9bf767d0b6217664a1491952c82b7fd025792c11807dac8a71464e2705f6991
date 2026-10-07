import { Linter as LinterType, SDK } from '@rsdoctor/types';
export { LinterType };
export declare class Linter<Rules extends LinterType.ExtendRuleData[]> {
    private rules;
    constructor({ rules, extends: extendRules, level, }?: LinterType.Options<Rules>);
    private getRules;
    validate(context: SDK.RuntimeContext): Promise<LinterType.ValidateResult>;
    afterValidate(context: LinterType.InternalRuleCheckerContextForCheckEnd): Promise<void>;
}
