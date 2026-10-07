import type { ServerResponse } from 'http';
import { Common, SDK, Thirdparty } from '@rsdoctor/types';
import { BaseAPI } from './apis/base.js';
interface RouterOptions {
    apis: Common.Constructor<typeof BaseAPI>[];
    sdk: SDK.RsdoctorBuilderSDKInstance;
    server: SDK.RsdoctorServerInstance;
}
export declare class Router {
    protected options: RouterOptions;
    static routes: {
        /**
         * - `key` is the constructor of object which used to match the API class
         */
        get: Map<Function, [apiKey: PropertyKey, pathname: string][]>;
        post: Map<Function, [apiKey: PropertyKey, pathname: string][]>;
    };
    static get(pathname: string): MethodDecorator;
    static post(pathname: string): MethodDecorator;
    constructor(options: RouterOptions);
    setup(): Promise<void>;
    wrapAPIFunction<T extends BaseAPI>(api: T, key: PropertyKey): (req: Thirdparty.connect.IncomingMessage, res: ServerResponse) => Promise<any>;
}
export {};
