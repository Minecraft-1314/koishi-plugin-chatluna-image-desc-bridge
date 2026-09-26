export interface CacheConfig {
    enable: boolean;
    ttlMinutes: number;
    maxEntries: number;
}
export type TraceKind = 'hook' | 'cache' | 'convert' | 'timing';
export interface Config {
    enabled: boolean;
    characterFlowOnly: boolean;
    skipVisionModels: boolean;
    dropImageMarker: boolean;
    minDescriptionLength: number;
    snapshotPriority: number;
    harvestPriority: number;
    cache: CacheConfig;
    debug: boolean;
    traceKinds: TraceKind[];
}
export interface TracerSettings {
    debug: boolean;
    traceKinds: readonly TraceKind[];
}
export interface TransformMessage {
    content?: unknown;
    name?: string;
    conversationId?: string | null;
    additional_kwargs?: Record<string, unknown>;
}
export interface TransformElement {
    type: string;
    attrs?: Record<string, any>;
    children?: unknown[];
}
export interface ModelInfoLike {
    capabilities?: readonly string[];
}
export interface MessageTransformerLike {
    intercept?: (type: string, handler: (session: any, element: any, message: any, model: any) => unknown, priority?: number) => (() => void) | void;
}
export interface PlatformLike {
    findModel?: (model: string) => {
        value?: ModelInfoLike | null;
    } | undefined;
}
export interface ChatLunaLike {
    messageTransformer?: MessageTransformerLike;
    platform?: PlatformLike;
}
export interface Snapshot {
    url: string;
    text: string;
    start: number;
}
export interface BridgeCounters {
    seen: number;
    skipped: number;
    cacheHit: number;
    cacheMiss: number;
    converted: number;
    empty: number;
    error: number;
}
export interface BridgeStats extends BridgeCounters {
    cacheSize: number;
}
//# sourceMappingURL=types.d.ts.map