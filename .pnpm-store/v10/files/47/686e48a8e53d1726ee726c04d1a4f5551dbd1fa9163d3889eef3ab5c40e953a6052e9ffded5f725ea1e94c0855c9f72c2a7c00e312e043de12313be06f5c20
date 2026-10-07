import { Common, Manifest, SDK } from '@rsdoctor/types';
import { RsdoctorSDKOptions, DataWithUrl } from './types.js';
export declare abstract class SDKCore<T extends RsdoctorSDKOptions> implements SDK.RsdoctorSDKInstance {
    protected _name: string;
    protected hash: string;
    extraConfig: SDK.SDKOptionsType | undefined;
    readonly root: string;
    readonly pid: number;
    readonly hooks: SDK.Hooks;
    protected _envinfo: SDK.EnvInfo;
    private _clientRoutes;
    private _outputDir;
    diskManifestPath: string;
    cloudData?: Manifest.RsdoctorManifestWithShardingFiles;
    constructor({ name, root }: T);
    get outputDir(): string;
    get name(): string;
    bootstrap(): Promise<void>;
    dispose(): Promise<void>;
    setOutputDir(outputDir: string): void;
    setName(name: string): void;
    setHash(hash: string): void;
    getHash(): string;
    getClientRoutes(): Manifest.RsdoctorManifestClientRoutes[];
    addClientRoutes(routes: Manifest.RsdoctorManifestClientRoutes[]): void;
    /** Upload analysis data pieces */
    protected writePieces(storeData: Common.PlainObject, _options?: SDK.WriteStoreOptionsType): Promise<void>;
    /** Upload manifest file */
    protected writeManifest(): Promise<string>;
    saveManifest(data: Common.PlainObject, options: SDK.WriteStoreOptionsType): Promise<string>;
    protected writeToFolder(jsonStr: string, dir: string, key: string, index?: number): Promise<DataWithUrl>;
    abstract onDataReport(): void | Promise<void>;
}
