import { Err, Rule } from '@rsdoctor/types';
export declare class DevToolError extends Error implements Err.DevToolErrorInstance {
    static from(err: unknown, opt?: Err.DevToolErrorParams): DevToolError;
    readonly id: number;
    readonly code?: string;
    readonly category?: string;
    readonly title: string;
    readonly detail?: any;
    readonly fixData?: Err.FixData;
    readonly hint?: string;
    readonly referenceUrl?: string;
    private _codeFrame?;
    private _controller;
    private readonly _level;
    constructor(title: string, message: string, opts?: Err.DevToolErrorParams);
    get level(): keyof typeof Err.ErrorLevel;
    get path(): string | undefined;
    set path(file: string | undefined);
    get codeFrame(): Err.CodeFrameOption | undefined;
    private printCodeFrame;
    toString(): string;
    toData(): Rule.RuleStoreDataItem;
    toError(): Error;
    /**
     * for json stringify
     */
    toJSON(): {
        message: string;
        name: string;
        stack: string | undefined;
    };
    setControllerOption(opt: Err.ControllerOption): void;
    setCodeFrame(opt: Err.CodeFrameOption): void;
    isSame(error: Err.DevToolErrorInstance): boolean;
}
