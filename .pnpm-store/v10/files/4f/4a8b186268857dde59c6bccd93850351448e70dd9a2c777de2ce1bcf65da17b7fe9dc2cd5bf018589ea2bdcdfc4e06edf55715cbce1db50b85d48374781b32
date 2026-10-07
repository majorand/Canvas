import { SDK } from '@rsdoctor/types';
export declare class Asset implements SDK.AssetInstance {
    static init(): void;
    id: number;
    path: string;
    size: number;
    content: string;
    chunks: SDK.ChunkInstance[];
    gzipSize: number | undefined;
    constructor(path: string, size: number, chunks: SDK.ChunkInstance[], content: string);
    toData(types: SDK.ToDataType): SDK.AssetData;
    setChunks(chunks: SDK.ChunkInstance[]): void;
    setId(id: number): void;
    setGzipSize(content: string): void;
}
