import { Client, SDK } from '@rsdoctor/types';
export declare function formatAssetName(assetName: string, fileConfig?: string): string;
export declare function isAssetMatchExtension(asset: SDK.AssetData, ext: string): boolean;
export declare function isAssetMatchExtensions(asset: SDK.AssetData, exts: string[]): boolean;
export declare function filterAssetsByExtensions(assets: SDK.AssetData[], exts: string | string[]): SDK.AssetData[];
type FilterFunctionOrExtensions = string | string[] | ((asset: SDK.AssetData) => boolean);
interface GetAssetsOptions {
    /**
     * turn off it when you need not file content.
     * @default true
     */
    withFileContent?: boolean;
    /**
     * filter with assets
     */
    filterOrExtensions?: FilterFunctionOrExtensions;
}
export declare function filterAssets(assets: SDK.AssetData[], filterOrExtensions?: FilterFunctionOrExtensions): SDK.AssetData[];
export declare function getAssetsSizeInfo(assets: SDK.AssetData[], chunks: SDK.ChunkData[], options?: GetAssetsOptions): {
    count: number;
    size: number;
    files: {
        path: string;
        size: number;
        gzipSize: number | undefined;
        initial: boolean;
        content: string | undefined;
    }[];
};
export declare function isInitialAsset(asset: SDK.AssetData, chunks: SDK.ChunkData[]): boolean;
export declare function getInitialAssetsSizeInfo(assets: SDK.AssetData[], chunks: SDK.ChunkData[], options?: GetAssetsOptions): {
    count: number;
    size: number;
    files: {
        path: string;
        size: number;
        gzipSize: number | undefined;
        initial: boolean;
        content: string | undefined;
    }[];
};
export declare function getAssetsDiffResult(baseline: SDK.ChunkGraphData, current: SDK.ChunkGraphData): Client.RsdoctorClientAssetsDiffResult;
/**
 * @param bSize size of baseline
 * @param cSize size of current
 */
export declare function diffSize(bSize: number, cSize: number): {
    percent: number;
    state: Client.RsdoctorClientDiffState;
};
export declare function diffAssetsByExtensions(baseline: SDK.ChunkGraphData, current: SDK.ChunkGraphData, filterOrExtensions?: FilterFunctionOrExtensions, isInitial?: boolean): Client.RsdoctorClientAssetsDiffItem;
export declare function getAssetsSummary(assets: SDK.AssetData[], chunks: SDK.ChunkData[], options?: Omit<GetAssetsOptions, 'filterOrExtensions'>): Client.RsdoctorClientAssetsSummary;
export declare function getAssetDetails(assetPath: string, assets: SDK.AssetData[], chunks: SDK.ChunkData[], modules: SDK.ModuleData[], checkModules: (module: SDK.ModuleData) => boolean): SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetAssetDetails>;
export declare function getAllBundleData(assets: SDK.AssetData[], chunks: SDK.ChunkData[], modules: SDK.ModuleData[], filtersModules?: (keyof SDK.ModuleData)[]): SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetSummaryBundles>;
export declare function extname(filename: string): string;
export {};
