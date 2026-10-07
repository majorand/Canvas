import { SDK } from '@rsdoctor/types';
export declare class ChunkGraph implements SDK.ChunkGraphInstance {
    private _assetMap;
    private _assetPathMap;
    private _chunkMap;
    private _entrypointMap;
    getAssets(): SDK.AssetInstance[];
    getChunks(): SDK.ChunkInstance[];
    addAsset(...assets: SDK.AssetInstance[]): void;
    addChunk(...chunks: SDK.ChunkInstance[]): void;
    getChunkById(id: string): SDK.ChunkInstance | undefined;
    getAssetByPath(path: string): SDK.AssetInstance | undefined;
    getAssetById(id: number): SDK.AssetInstance | undefined;
    getEntryPoints(): SDK.EntryPointInstance[];
    getEntryPointById(id: number): SDK.EntryPointInstance | undefined;
    addEntryPoint(...entrypoints: SDK.EntryPointInstance[]): void;
    /** output the chunk graph data */
    toData(type: SDK.ToDataType): SDK.ChunkGraphData;
    setChunks(chunks: SDK.ChunkInstance[]): void;
    setEntrypoints(entrypoints: SDK.EntryPointInstance[]): void;
    setAssets(assets: SDK.AssetInstance[]): void;
}
