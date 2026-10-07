export declare class FileSharding {
    protected content: string;
    protected limitBytes: number;
    protected encoding: BufferEncoding;
    constructor(content: string, limitBytes?: number, encoding?: BufferEncoding);
    /**
     * @param ext the extension name of the output file (must starts with ".")
     */
    createVirtualShardingFiles(ext?: string, index?: number): {
        filename: string;
        content: Buffer<ArrayBufferLike>;
    }[];
    /**
     * @param folder absolute path of folder which used to save string sharding files.
     * @param ext the extension name of the output file (must starts with ".")
     */
    writeStringToFolder(folder: string, ext?: string, index?: number): Promise<{
        filename: string;
        content: Buffer<ArrayBufferLike>;
    }[]>;
}
