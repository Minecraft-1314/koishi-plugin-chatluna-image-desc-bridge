import type { Context } from 'koishi'
import { readTransformer, supportsImageInput } from './chatluna'
import { TextCache } from './cache'
import {
  IMAGE_MARKER_PATTERN,
  SKIP_LABEL_DISABLED,
  SKIP_LABEL_NO_URL,
  SKIP_LABEL_NOT_CHARACTER,
  SKIP_LABEL_VISION_MODEL,
} from './constants'
import { isCharacterFlow, readImageUrl, readTextContent, toTextElement } from './elements'
import type { Tracer } from './tracer'
import type {
  BridgeCounters,
  BridgeStats,
  Config,
  Snapshot,
  TransformElement,
  TransformMessage,
} from './types'

function createCounters(): BridgeCounters {
  return {
    seen: 0,
    skipped: 0,
    cacheHit: 0,
    cacheMiss: 0,
    converted: 0,
    empty: 0,
    error: 0,
  }
}

function hasChildren(element: TransformElement | undefined | null): boolean {
  return Array.isArray(element?.children) && element.children.length > 0
}

function describeError(error: unknown): string {
  const message = (error as Error)?.message
  return String(message ?? error)
}

function collectDisposers(items: unknown[]): (() => void)[] {
  return items.filter((item): item is () => void => typeof item === 'function')
}

export class Bridge {
  private readonly snapshots = new WeakMap<object, Snapshot>()
  private readonly cache: TextCache
  private readonly counters: BridgeCounters = createCounters()
  private disposers: (() => void)[] = []

  constructor(
    private readonly ctx: Context,
    private readonly settings: () => Config,
    private readonly tracer: Tracer,
  ) {
    this.cache = new TextCache(() => {
      const config = this.settings()
      return {
        enable: config.cache.enable,
        ttlMs: config.cache.ttlMinutes * 60000,
        maxEntries: config.cache.maxEntries,
      }
    })
  }

  get installed(): boolean {
    return this.disposers.length > 0
  }

  install(): boolean {
    this.uninstall()
    const transformer = readTransformer(this.ctx)
    if (!transformer?.intercept) {
      this.tracer.write('hook', 'messageTransformer 不可用，拦截器未安装')
      return false
    }
    const config = this.settings()
    const snapshot = transformer.intercept(
      'img',
      (session, element, message, model) => this.onSnapshot(element, message, model),
      config.snapshotPriority,
    )
    const harvest = transformer.intercept(
      'img',
      (session, element, message, model) => this.onHarvest(element, message),
      config.harvestPriority,
    )
    this.disposers = collectDisposers([snapshot, harvest])
    this.tracer.write(
      'hook',
      `拦截器已安装 优先级 ${config.snapshotPriority} / ${config.harvestPriority}`,
    )
    return true
  }

  uninstall(): void {
    for (const dispose of this.disposers) {
      try {
        dispose()
      } catch {
        continue
      }
    }
    this.disposers = []
  }

  stats(): BridgeStats {
    return { ...this.counters, cacheSize: this.cache.size }
  }

  clearCache(): number {
    const size = this.cache.size
    this.cache.clear()
    return size
  }

  private skipReason(
    config: Config,
    element: TransformElement,
    message: TransformMessage,
    model: unknown,
  ): string | undefined {
    if (!config.enabled) return SKIP_LABEL_DISABLED
    if (config.characterFlowOnly && !isCharacterFlow(message)) return SKIP_LABEL_NOT_CHARACTER
    if (config.skipVisionModels && supportsImageInput(this.ctx, model)) {
      return SKIP_LABEL_VISION_MODEL
    }
    if (!readImageUrl(element)) return SKIP_LABEL_NO_URL
    return undefined
  }

  private resolveForwardText(config: Config, raw: string): string | undefined {
    const trimmed = raw.trim()
    if (trimmed.length === 0) return undefined
    const meaningful = trimmed.replace(IMAGE_MARKER_PATTERN, '').trim()
    if (meaningful.length === 0) return undefined
    if (meaningful.length < config.minDescriptionLength) return undefined
    return config.dropImageMarker ? meaningful : trimmed
  }

  private onSnapshot(
    element: TransformElement,
    message: TransformMessage,
    model: unknown,
  ): boolean {
    try {
      const config = this.settings()
      this.counters.seen++
      const reason = this.skipReason(config, element, message, model)
      if (reason !== undefined) {
        this.counters.skipped++
        this.tracer.bump('skipped')
        this.tracer.write('hook', `跳过：${reason}`)
        return false
      }
      const url = readImageUrl(element) as string
      if (config.cache.enable) {
        const hit = this.cache.get(url)
        if (hit !== undefined) {
          const text = this.resolveForwardText(config, hit)
          if (text === undefined) {
            this.tracer.write('cache', '命中但内容不满足过滤条件，放弃缓存')
          } else {
            this.counters.cacheHit++
            this.tracer.bump('cacheHit')
            toTextElement(element, text)
            this.counters.converted++
            this.tracer.bump('converted')
            this.tracer.write('cache', `命中，${text.length} 字直接写入元素`)
            this.tracer.write('convert', '类型 img -> text，来源 缓存')
            return !hasChildren(element)
          }
        } else {
          this.counters.cacheMiss++
          this.tracer.bump('cacheMiss')
          this.tracer.write('cache', '未命中，继续等待描述产出')
        }
      }
      this.snapshots.set(element, { url, text: readTextContent(message), start: Date.now() })
      return false
    } catch (error) {
      this.counters.error++
      this.tracer.bump('error')
      this.tracer.write('hook', `快照异常：${describeError(error)}`)
      return false
    }
  }

  private onHarvest(element: TransformElement, message: TransformMessage): boolean {
    const snapshot = this.snapshots.get(element)
    if (snapshot === undefined) return false
    this.snapshots.delete(element)
    const elapsed = Date.now() - snapshot.start
    try {
      const config = this.settings()
      const after = readTextContent(message)
      const delta = after.startsWith(snapshot.text) ? after.slice(snapshot.text.length) : ''
      const text = this.resolveForwardText(config, delta)
      if (text === undefined) {
        this.counters.empty++
        this.tracer.bump('empty')
        this.tracer.write('convert', '无可用描述，元素保持原样')
        this.tracer.write('timing', '快照到收割', elapsed)
        return false
      }
      if (config.cache.enable) {
        const stored = delta.trim()
        this.cache.set(snapshot.url, stored)
        this.tracer.write('cache', `写入 ${stored.length} 字`)
      }
      toTextElement(element, text)
      this.counters.converted++
      this.tracer.bump('converted')
      this.tracer.write('convert', `类型 img -> text，写入 ${text.length} 字`)
      this.tracer.write('timing', '快照到收割', elapsed)
      return !hasChildren(element)
    } catch (error) {
      this.counters.error++
      this.tracer.bump('error')
      this.tracer.write('convert', `改写异常：${describeError(error)}`)
      return false
    }
  }
}
