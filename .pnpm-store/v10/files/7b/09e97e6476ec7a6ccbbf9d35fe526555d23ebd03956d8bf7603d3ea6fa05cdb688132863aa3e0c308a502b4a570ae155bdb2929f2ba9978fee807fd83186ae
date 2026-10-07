import { Manifest } from '@rsdoctor/types';
import { RsdoctorPrimarySDK } from './primary.js';
export declare class RsdoctorSDKController {
    readonly slaves: RsdoctorPrimarySDK[];
    root: string;
    constructor(root?: string);
    get master(): RsdoctorPrimarySDK;
    getLastSdk(): RsdoctorPrimarySDK;
    hasName(name: string): boolean;
    getSeriesData(serverUrl?: boolean): Manifest.RsdoctorManifestSeriesData[];
    createSlave({ name, stage, extraConfig, type, }: Omit<ConstructorParameters<typeof RsdoctorPrimarySDK>[0], 'controller'>): RsdoctorPrimarySDK;
}
