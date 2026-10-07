import { Manifest } from '@rsdoctor/types';
export declare function isShardingData(data: unknown): data is string[];
export declare function fetchShardingData(shardingFiles: string[], fetchImplement: (url: string) => Promise<string>): Promise<any>;
export declare function fetchShardingFiles(data: Manifest.RsdoctorManifestWithShardingFiles['data'], fetchImplement: (url: string) => Promise<string>, filterKeys?: Array<keyof Manifest.RsdoctorManifestData>): Promise<Manifest.RsdoctorManifestData>;
