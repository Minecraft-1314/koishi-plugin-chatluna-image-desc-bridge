import { Context, Logger } from 'koishi'
import { LOG_KEY } from './constants'
import type { TraceKind, TracerSettings } from './types'

export class Tracer {
  public readonly counters: Record<string, number> = Object.create(null)

  private readonly logger: Logger
  private total = 0

  constructor(ctx: Context, private readonly settings: () => TracerSettings) {
    this.logger = ctx.logger(LOG_KEY)
  }

  get active(): boolean {
    return this.settings().debug
  }

  bump(kind: string, amount = 1): number {
    const next = (this.counters[kind] ?? 0) + amount
    this.counters[kind] = next
    return next
  }

  sync(): void {
    const target = this.settings().debug ? Logger.DEBUG : Logger.INFO
    if (this.logger.level !== target) this.logger.level = target
  }

  write(kind: TraceKind, detail: string, ms?: number): void {
    this.total++
    const { debug, traceKinds } = this.settings()
    if (!debug) return
    this.sync()
    if (!traceKinds.includes(kind)) return
    this.logger.debug('[%s] %s%s', kind, detail, ms === undefined ? '' : ` ${ms}ms`)
  }

  stats(): { total: number; counters: Record<string, number> } {
    return { total: this.total, counters: { ...this.counters } }
  }
}
