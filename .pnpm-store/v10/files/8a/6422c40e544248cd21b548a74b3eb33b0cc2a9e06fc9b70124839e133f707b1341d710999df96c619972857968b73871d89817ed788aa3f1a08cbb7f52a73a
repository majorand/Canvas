import { SDK, Manifest } from '@rsdoctor/types';
/**
 * this class will run at both browser and node environment.
 */
export declare class APIDataLoader {
    protected loader: Manifest.ManifestDataLoader;
    constructor(loader: Manifest.ManifestDataLoader);
    log(...args: unknown[]): void;
    loadAPI<T extends SDK.ServerAPI.API, B extends SDK.ServerAPI.InferRequestBodyType<T> = SDK.ServerAPI.InferRequestBodyType<T>, R extends SDK.ServerAPI.InferResponseType<T> = SDK.ServerAPI.InferResponseType<T>>(...args: B extends void ? [api: T] : [api: T, body: B]): Promise<SDK.ServerAPI.InferResponseType<T>>;
}
