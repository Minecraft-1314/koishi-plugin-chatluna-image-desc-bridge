export interface CacheSettings {
  enable: boolean
  ttlMs: number
  maxEntries: number
}

export class TextCache {
  private readonly store = new Map<string, { text: string; expiresAt: number }>()

  constructor(private readonly settings: () => CacheSettings) {}

  get size(): number {
    return this.store.size
  }

  get(key: string, now: number = Date.now()): string | undefined {
    const hit = this.store.get(key)
    if (hit === undefined) return undefined
    if (hit.expiresAt <= now) {
      this.store.delete(key)
      return undefined
    }
    this.store.delete(key)
    this.store.set(key, hit)
    return hit.text
  }

  set(key: string, text: string, now: number = Date.now()): void {
    const { ttlMs, maxEntries } = this.settings()
    this.store.delete(key)
    this.store.set(key, { text, expiresAt: now + ttlMs })
    while (this.store.size > maxEntries) {
      const oldest = this.store.keys().next()
      if (oldest.done) break
      this.store.delete(oldest.value)
    }
  }

  clear(): void {
    this.store.clear()
  }
}
