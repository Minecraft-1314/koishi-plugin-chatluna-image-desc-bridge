import { Context } from 'koishi';
import type { TraceKind, TracerSettings } from './types';
export declare class Tracer {
    private readonly settings;
    readonly counters: Record<string, number>;
    private readonly logger;
    private total;
    constructor(ctx: Context, settings: () => TracerSettings);
    get active(): boolean;
    bump(kind: string, amount?: number): number;
    sync(): void;
    write(kind: TraceKind, detail: string, ms?: number): void;
    stats(): {
        total: number;
        counters: Record<string, number>;
    };
}
//# sourceMappingURL=tracer.d.ts.map