export declare function findConfig(from: string): Record<string, string[]> | undefined;
export type LoadConfigOptions = {
    /**
     * Specify the path to the configuration file
     * If both `config` and `path` are provided, `config` will be used
     */
    config?: string;
    /**
     * Specify the directory where the configuration file is located
     */
    path?: string;
    /**
     * Specify the environment to load
     * @default "production"
     */
    env?: string;
};
export declare function loadConfig(opts: LoadConfigOptions): string[] | undefined;
