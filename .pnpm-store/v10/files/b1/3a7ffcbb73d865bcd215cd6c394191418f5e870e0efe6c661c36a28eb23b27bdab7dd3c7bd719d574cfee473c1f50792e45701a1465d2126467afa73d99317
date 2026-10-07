import { Data } from '@rsdoctor/utils/common';
import { Manifest, SDK } from '@rsdoctor/types';
export declare class BaseAPI implements Manifest.ManifestDataLoader {
    [key: string | symbol]: any;
    readonly ctx: SDK.ServerAPI.APIContext;
    protected dataLoader: Data.APIDataLoader;
    constructor(sdk: SDK.RsdoctorSDKInstance, server: SDK.RsdoctorServerInstance);
    loadManifest(): Promise<Manifest.RsdoctorManifestWithShardingFiles>;
    loadData<T extends Manifest.RsdoctorManifestMappingKeys>(key: T): Promise<Manifest.InferManifestDataValue<T>>;
    loadData(key: string): Promise<void>;
}
