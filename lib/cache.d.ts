export interface CacheSettings {
    enable: boolean;
    ttlMs: number;
    maxEntries: number;
}
export declare class TextCache {
    private readonly settings;
    private readonly store;
    constructor(settings: () => CacheSettings);
    get size(): number;
    get(key: string, now?: number): string | undefined;
    set(key: string, text: string, now?: number): void;
    clear(): void;
}
//# sourceMappingURL=cache.d.ts.map