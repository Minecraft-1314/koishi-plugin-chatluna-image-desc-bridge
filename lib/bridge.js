"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bridge = void 0;
const chatluna_1 = require("./chatluna");
const cache_1 = require("./cache");
const constants_1 = require("./constants");
const elements_1 = require("./elements");
function createCounters() {
    return {
        seen: 0,
        skipped: 0,
        cacheHit: 0,
        cacheMiss: 0,
        converted: 0,
        empty: 0,
        error: 0,
    };
}
function hasChildren(element) {
    return Array.isArray(element?.children) && element.children.length > 0;
}
function describeError(error) {
    const message = error?.message;
    return String(message ?? error);
}
function collectDisposers(items) {
    return items.filter((item) => typeof item === 'function');
}
class Bridge {
    constructor(ctx, settings, tracer) {
        this.ctx = ctx;
        this.settings = settings;
        this.tracer = tracer;
        this.snapshots = new WeakMap();
        this.counters = createCounters();
        this.disposers = [];
        this.cache = new cache_1.TextCache(() => {
            const config = this.settings();
            return {
                enable: config.cache.enable,
                ttlMs: config.cache.ttlMinutes * 60000,
                maxEntries: config.cache.maxEntries,
            };
        });
    }
    get installed() {
        return this.disposers.length > 0;
    }
    install() {
        this.uninstall();
        const transformer = (0, chatluna_1.readTransformer)(this.ctx);
        if (!transformer?.intercept) {
            this.tracer.write('hook', 'messageTransformer 不可用，拦截器未安装');
            return false;
        }
        const config = this.settings();
        const snapshot = transformer.intercept('img', (session, element, message, model) => this.onSnapshot(element, message, model), config.snapshotPriority);
        const harvest = transformer.intercept('img', (session, element, message, model) => this.onHarvest(element, message), config.harvestPriority);
        this.disposers = collectDisposers([snapshot, harvest]);
        this.tracer.write('hook', `拦截器已安装 优先级 ${config.snapshotPriority} / ${config.harvestPriority}`);
        return true;
    }
    uninstall() {
        for (const dispose of this.disposers) {
            try {
                dispose();
            }
            catch {
                continue;
            }
        }
        this.disposers = [];
    }
    stats() {
        return { ...this.counters, cacheSize: this.cache.size };
    }
    clearCache() {
        const size = this.cache.size;
        this.cache.clear();
        return size;
    }
    skipReason(config, element, message, model) {
        if (!config.enabled)
            return constants_1.SKIP_LABEL_DISABLED;
        if (config.characterFlowOnly && !(0, elements_1.isCharacterFlow)(message))
            return constants_1.SKIP_LABEL_NOT_CHARACTER;
        if (config.skipVisionModels && (0, chatluna_1.supportsImageInput)(this.ctx, model)) {
            return constants_1.SKIP_LABEL_VISION_MODEL;
        }
        if (!(0, elements_1.readImageUrl)(element))
            return constants_1.SKIP_LABEL_NO_URL;
        return undefined;
    }
    resolveForwardText(config, raw) {
        const trimmed = raw.trim();
        if (trimmed.length === 0)
            return undefined;
        const meaningful = trimmed.replace(constants_1.IMAGE_MARKER_PATTERN, '').trim();
        if (meaningful.length === 0)
            return undefined;
        if (meaningful.length < config.minDescriptionLength)
            return undefined;
        return config.dropImageMarker ? meaningful : trimmed;
    }
    onSnapshot(element, message, model) {
        try {
            const config = this.settings();
            this.counters.seen++;
            const reason = this.skipReason(config, element, message, model);
            if (reason !== undefined) {
                this.counters.skipped++;
                this.tracer.bump('skipped');
                this.tracer.write('hook', `跳过：${reason}`);
                return false;
            }
            const url = (0, elements_1.readImageUrl)(element);
            if (config.cache.enable) {
                const hit = this.cache.get(url);
                if (hit !== undefined) {
                    const text = this.resolveForwardText(config, hit);
                    if (text === undefined) {
                        this.tracer.write('cache', '命中但内容不满足过滤条件，放弃缓存');
                    }
                    else {
                        this.counters.cacheHit++;
                        this.tracer.bump('cacheHit');
                        (0, elements_1.toTextElement)(element, text);
                        this.counters.converted++;
                        this.tracer.bump('converted');
                        this.tracer.write('cache', `命中，${text.length} 字直接写入元素`);
                        this.tracer.write('convert', '类型 img -> text，来源 缓存');
                        return !hasChildren(element);
                    }
                }
                else {
                    this.counters.cacheMiss++;
                    this.tracer.bump('cacheMiss');
                    this.tracer.write('cache', '未命中，继续等待描述产出');
                }
            }
            this.snapshots.set(element, { url, text: (0, elements_1.readTextContent)(message), start: Date.now() });
            return false;
        }
        catch (error) {
            this.counters.error++;
            this.tracer.bump('error');
            this.tracer.write('hook', `快照异常：${describeError(error)}`);
            return false;
        }
    }
    onHarvest(element, message) {
        const snapshot = this.snapshots.get(element);
        if (snapshot === undefined)
            return false;
        this.snapshots.delete(element);
        const elapsed = Date.now() - snapshot.start;
        try {
            const config = this.settings();
            const after = (0, elements_1.readTextContent)(message);
            const delta = after.startsWith(snapshot.text) ? after.slice(snapshot.text.length) : '';
            const text = this.resolveForwardText(config, delta);
            if (text === undefined) {
                this.counters.empty++;
                this.tracer.bump('empty');
                this.tracer.write('convert', '无可用描述，元素保持原样');
                this.tracer.write('timing', '快照到收割', elapsed);
                return false;
            }
            if (config.cache.enable) {
                const stored = delta.trim();
                this.cache.set(snapshot.url, stored);
                this.tracer.write('cache', `写入 ${stored.length} 字`);
            }
            (0, elements_1.toTextElement)(element, text);
            this.counters.converted++;
            this.tracer.bump('converted');
            this.tracer.write('convert', `类型 img -> text，写入 ${text.length} 字`);
            this.tracer.write('timing', '快照到收割', elapsed);
            return !hasChildren(element);
        }
        catch (error) {
            this.counters.error++;
            this.tracer.bump('error');
            this.tracer.write('convert', `改写异常：${describeError(error)}`);
            return false;
        }
    }
}
exports.Bridge = Bridge;
//# sourceMappingURL=bridge.js.map