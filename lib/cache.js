"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextCache = void 0;
class TextCache {
    constructor(settings) {
        this.settings = settings;
        this.store = new Map();
    }
    get size() {
        return this.store.size;
    }
    get(key, now = Date.now()) {
        const hit = this.store.get(key);
        if (hit === undefined)
            return undefined;
        if (hit.expiresAt <= now) {
            this.store.delete(key);
            return undefined;
        }
        this.store.delete(key);
        this.store.set(key, hit);
        return hit.text;
    }
    set(key, text, now = Date.now()) {
        const { ttlMs, maxEntries } = this.settings();
        this.store.delete(key);
        this.store.set(key, { text, expiresAt: now + ttlMs });
        while (this.store.size > maxEntries) {
            const oldest = this.store.keys().next();
            if (oldest.done)
                break;
            this.store.delete(oldest.value);
        }
    }
    clear() {
        this.store.clear();
    }
}
exports.TextCache = TextCache;
//# sourceMappingURL=cache.js.map