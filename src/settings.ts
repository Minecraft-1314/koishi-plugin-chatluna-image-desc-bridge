import {
  CACHE_ENTRIES_MAX,
  CACHE_ENTRIES_MIN,
  CACHE_TTL_MAX_MINUTES,
  CACHE_TTL_MIN_MINUTES,
  DEFAULT_CACHE_MAX_ENTRIES,
  DEFAULT_CACHE_TTL_MINUTES,
  DEFAULT_HARVEST_PRIORITY,
  DEFAULT_MIN_DESCRIPTION_LENGTH,
  DEFAULT_SNAPSHOT_PRIORITY,
  MIN_DESCRIPTION_LENGTH_MAX,
  MIN_DESCRIPTION_LENGTH_MIN,
  PRIORITY_MAX,
  PRIORITY_MIN,
  TRACE_KINDS,
} from './constants'
import type { CacheConfig, Config, TraceKind } from './types'

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function readInteger(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, Math.round(parsed)))
}

function readTraceKinds(value: unknown): TraceKind[] {
  if (!Array.isArray(value)) return [...TRACE_KINDS]
  const allowed = new Set<string>(TRACE_KINDS)
  return TRACE_KINDS.filter((kind) => value.some((item) => item === kind && allowed.has(kind)))
}

function resolvePriorities(snapshot: number, harvest: number): [number, number] {
  if (snapshot < harvest) return [snapshot, harvest]
  const raised = Math.min(PRIORITY_MAX, snapshot + 1)
  if (raised > snapshot) return [snapshot, raised]
  const lowered = Math.max(PRIORITY_MIN, harvest - 1)
  if (lowered < harvest) return [lowered, harvest]
  return [DEFAULT_SNAPSHOT_PRIORITY, DEFAULT_HARVEST_PRIORITY]
}

function resolveCache(raw: Record<string, any>): CacheConfig {
  const source = raw ?? {}
  return {
    enable: readBoolean(source.enable, true),
    ttlMinutes: readInteger(
      source.ttlMinutes,
      DEFAULT_CACHE_TTL_MINUTES,
      CACHE_TTL_MIN_MINUTES,
      CACHE_TTL_MAX_MINUTES,
    ),
    maxEntries: readInteger(
      source.maxEntries,
      DEFAULT_CACHE_MAX_ENTRIES,
      CACHE_ENTRIES_MIN,
      CACHE_ENTRIES_MAX,
    ),
  }
}

export function normalizeConfig(raw: Record<string, any> | undefined | null): Config {
  const source = raw ?? {}
  const [snapshotPriority, harvestPriority] = resolvePriorities(
    readInteger(
      source.snapshotPriority,
      DEFAULT_SNAPSHOT_PRIORITY,
      PRIORITY_MIN,
      PRIORITY_MAX,
    ),
    readInteger(
      source.harvestPriority,
      DEFAULT_HARVEST_PRIORITY,
      PRIORITY_MIN,
      PRIORITY_MAX,
    ),
  )
  return {
    enabled: readBoolean(source.enabled, true),
    characterFlowOnly: readBoolean(source.characterFlowOnly, true),
    skipVisionModels: readBoolean(source.skipVisionModels, true),
    dropImageMarker: readBoolean(source.dropImageMarker, false),
    minDescriptionLength: readInteger(
      source.minDescriptionLength,
      DEFAULT_MIN_DESCRIPTION_LENGTH,
      MIN_DESCRIPTION_LENGTH_MIN,
      MIN_DESCRIPTION_LENGTH_MAX,
    ),
    snapshotPriority,
    harvestPriority,
    cache: resolveCache(source.cache),
    debug: readBoolean(source.debug, false),
    traceKinds: readTraceKinds(source.traceKinds),
  }
}

export function createSettings(raw: Record<string, any>): () => Config {
  return () => normalizeConfig(raw)
}
