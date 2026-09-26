"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tracer = void 0;
const koishi_1 = require("koishi");
const constants_1 = require("./constants");
class Tracer {
    constructor(ctx, settings) {
        this.settings = settings;
        this.counters = Object.create(null);
        this.total = 0;
        this.logger = ctx.logger(constants_1.LOG_KEY);
    }
    get active() {
        return this.settings().debug;
    }
    bump(kind, amount = 1) {
        const next = (this.counters[kind] ?? 0) + amount;
        this.counters[kind] = next;
        return next;
    }
    sync() {
        const target = this.settings().debug ? koishi_1.Logger.DEBUG : koishi_1.Logger.INFO;
        if (this.logger.level !== target)
            this.logger.level = target;
    }
    write(kind, detail, ms) {
        this.total++;
        const { debug, traceKinds } = this.settings();
        if (!debug)
            return;
        this.sync();
        if (!traceKinds.includes(kind))
            return;
        this.logger.debug('[%s] %s%s', kind, detail, ms === undefined ? '' : ` ${ms}ms`);
    }
    stats() {
        return { total: this.total, counters: { ...this.counters } };
    }
}
exports.Tracer = Tracer;
//# sourceMappingURL=tracer.js.map