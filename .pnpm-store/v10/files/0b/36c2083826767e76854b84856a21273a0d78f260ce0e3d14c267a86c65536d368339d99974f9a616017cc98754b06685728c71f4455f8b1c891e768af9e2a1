import { SDK } from '@rsdoctor/types';
import { Plugin } from '@rsdoctor/types';
export declare function findLoaderTotalTiming(loaders: Pick<SDK.LoaderTransformData, 'startAt' | 'endAt'>[]): {
    start: number;
    end: number;
};
export declare function getLoadersCosts(filter: (loader: Pick<SDK.LoaderTransformData, 'loader' | 'startAt' | 'endAt' | 'pid'>) => boolean, loaders: Pick<SDK.LoaderTransformData, 'loader' | 'startAt' | 'endAt' | 'pid'>[]): number;
export declare function getLoaderCosts(loader: SDK.LoaderTransformData, loaders: SDK.LoaderTransformData[]): number;
export declare function getLoaderNames(loaders: SDK.LoaderData): SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetLoaderNames>;
export declare function getLoadersTransformData(loaders: SDK.LoaderData): SDK.LoaderTransformData[];
export declare function getLoaderChartData(loaders: SDK.LoaderData): SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetLoaderChartData>;
export declare function getLoaderFileTree(loaders: SDK.LoaderData): SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetLoaderFileTree>;
export declare function getLoaderFileDetails(path: string, loaders: SDK.LoaderData): SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetLoaderFileDetails>;
export declare function getLoaderFolderStatistics(folder: string, loaders: SDK.LoaderData): SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetLoaderFolderStatistics>;
export declare function getDirectoriesLoaders(loaders: SDK.LoaderData, root?: string): {
    directory: string;
    stats: SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetLoaderFolderStatistics>;
}[];
export declare function getLoaderFileFirstInput(file: string, loaders: SDK.LoaderData): SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetLoaderFileFirstInput>;
export declare function getLoaderFileInputAndOutput(file: string, loader: string, loaderIndex: number, loaders: SDK.LoaderData): SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetLoaderFileInputAndOutput>;
export declare const LoaderInternalPropertyName = "__l__";
export declare const isVue: (compiler: Plugin.BaseCompiler) => boolean;
