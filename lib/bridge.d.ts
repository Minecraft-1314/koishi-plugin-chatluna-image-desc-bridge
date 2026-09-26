import type { Context } from 'koishi';
import type { Tracer } from './tracer';
import type { BridgeStats, Config } from './types';
export declare class Bridge {
    private readonly ctx;
    private readonly settings;
    private readonly tracer;
    private readonly snapshots;
    private readonly cache;
    private readonly counters;
    private disposers;
    constructor(ctx: Context, settings: () => Config, tracer: Tracer);
    get installed(): boolean;
    install(): boolean;
    uninstall(): void;
    stats(): BridgeStats;
    clearCache(): number;
    private skipReason;
    private resolveForwardText;
    private onSnapshot;
    private onHarvest;
}
//# sourceMappingURL=bridge.d.ts.map