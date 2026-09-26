"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = apply;
const bridge_1 = require("./bridge");
const constants_1 = require("./constants");
const settings_1 = require("./settings");
const tracer_1 = require("./tracer");
function apply(ctx, raw) {
    const settings = (0, settings_1.createSettings)(raw);
    const tracer = new tracer_1.Tracer(ctx, () => {
        const config = settings();
        return { debug: config.debug, traceKinds: config.traceKinds };
    });
    const bridge = new bridge_1.Bridge(ctx, settings, tracer);
    tracer.sync();
    if (settings().debug)
        tracer.write('hook', '调试日志已开启');
    ctx.inject(['chatluna'], () => {
        bridge.install();
        ctx.logger(constants_1.LOG_KEY).info(constants_1.STARTUP_HINT);
    });
    ctx.on('dispose', () => {
        bridge.uninstall();
    });
}
//# sourceMappingURL=plugin.js.map