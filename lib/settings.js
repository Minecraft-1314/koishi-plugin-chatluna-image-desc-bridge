"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeConfig = normalizeConfig;
exports.createSettings = createSettings;
const constants_1 = require("./constants");
function readBoolean(value, fallback) {
    return typeof value === 'boolean' ? value : fallback;
}
function readInteger(value, fallback, min, max) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed))
        return fallback;
    return Math.min(max, Math.max(min, Math.round(parsed)));
}
function readTraceKinds(value) {
    if (!Array.isArray(value))
        return [...constants_1.TRACE_KINDS];
    const allowed = new Set(constants_1.TRACE_KINDS);
    return constants_1.TRACE_KINDS.filter((kind) => value.some((item) => item === kind && allowed.has(kind)));
}
function resolvePriorities(snapshot, harvest) {
    if (snapshot < harvest)
        return [snapshot, harvest];
    const raised = Math.min(constants_1.PRIORITY_MAX, snapshot + 1);
    if (raised > snapshot)
        return [snapshot, raised];
    const lowered = Math.max(constants_1.PRIORITY_MIN, harvest - 1);
    if (lowered < harvest)
        return [lowered, harvest];
    return [constants_1.DEFAULT_SNAPSHOT_PRIORITY, constants_1.DEFAULT_HARVEST_PRIORITY];
}
function resolveCache(raw) {
    const source = raw ?? {};
    return {
        enable: readBoolean(source.enable, true),
        ttlMinutes: readInteger(source.ttlMinutes, constants_1.DEFAULT_CACHE_TTL_MINUTES, constants_1.CACHE_TTL_MIN_MINUTES, constants_1.CACHE_TTL_MAX_MINUTES),
        maxEntries: readInteger(source.maxEntries, constants_1.DEFAULT_CACHE_MAX_ENTRIES, constants_1.CACHE_ENTRIES_MIN, constants_1.CACHE_ENTRIES_MAX),
    };
}
function normalizeConfig(raw) {
    const source = raw ?? {};
    const [snapshotPriority, harvestPriority] = resolvePriorities(readInteger(source.snapshotPriority, constants_1.DEFAULT_SNAPSHOT_PRIORITY, constants_1.PRIORITY_MIN, constants_1.PRIORITY_MAX), readInteger(source.harvestPriority, constants_1.DEFAULT_HARVEST_PRIORITY, constants_1.PRIORITY_MIN, constants_1.PRIORITY_MAX));
    return {
        enabled: readBoolean(source.enabled, true),
        characterFlowOnly: readBoolean(source.characterFlowOnly, true),
        skipVisionModels: readBoolean(source.skipVisionModels, true),
        dropImageMarker: readBoolean(source.dropImageMarker, false),
        minDescriptionLength: readInteger(source.minDescriptionLength, constants_1.DEFAULT_MIN_DESCRIPTION_LENGTH, constants_1.MIN_DESCRIPTION_LENGTH_MIN, constants_1.MIN_DESCRIPTION_LENGTH_MAX),
        snapshotPriority,
        harvestPriority,
        cache: resolveCache(source.cache),
        debug: readBoolean(source.debug, false),
        traceKinds: readTraceKinds(source.traceKinds),
    };
}
function createSettings(raw) {
    return () => normalizeConfig(raw);
}
//# sourceMappingURL=settings.js.map