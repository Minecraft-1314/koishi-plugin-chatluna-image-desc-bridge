import { Schema } from 'koishi'
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
  TRACE_KIND_LABELS,
  TRACE_KINDS,
} from './constants'
import type { Config as ConfigType } from './types'

export type Config = ConfigType

const BasicSchema = Schema.object({
  enabled: Schema.boolean()
    .default(true)
    .description('启用图像描述转发，关闭后插件不再挂载拦截器'),
  characterFlowOnly: Schema.boolean()
    .default(true)
    .description('仅作用于伪装插件流程，主插件自身的对话不接管'),
  skipVisionModels: Schema.boolean()
    .default(true)
    .description('模型本身支持图片输入时跳过，模型自己看图不需要描述'),
}).description('基础设置')

const ContentSchema = Schema.object({
  dropImageMarker: Schema.boolean()
    .default(false)
    .description('转发时去掉 image 占位，只保留描述正文'),
  minDescriptionLength: Schema.number()
    .default(DEFAULT_MIN_DESCRIPTION_LENGTH)
    .min(MIN_DESCRIPTION_LENGTH_MIN)
    .max(MIN_DESCRIPTION_LENGTH_MAX)
    .description('最短有效描述字数，低于此长度视为无描述不改写，0 表示不限制'),
}).description('转发内容')

const CacheSchema = Schema.object({
  cache: Schema.object({
    enable: Schema.boolean()
      .default(true)
      .description('启用描述缓存，命中时不再下载图片也不再调用描述模型'),
    ttlMinutes: Schema.number()
      .default(DEFAULT_CACHE_TTL_MINUTES)
      .min(CACHE_TTL_MIN_MINUTES)
      .max(CACHE_TTL_MAX_MINUTES)
      .description('缓存有效期（分钟），1 到 1440'),
    maxEntries: Schema.number()
      .default(DEFAULT_CACHE_MAX_ENTRIES)
      .min(CACHE_ENTRIES_MIN)
      .max(CACHE_ENTRIES_MAX)
      .description('缓存条数上限，超出后按最近最少使用淘汰，1 到 5000'),
  })
    .collapse()
    .description('缓存设置'),
}).description('描述缓存')

const PrioritySchema = Schema.object({
  snapshotPriority: Schema.number()
    .default(DEFAULT_SNAPSHOT_PRIORITY)
    .min(PRIORITY_MIN)
    .max(PRIORITY_MAX)
    .description('快照拦截器优先级，数字小的先执行，需小于收割优先级'),
  harvestPriority: Schema.number()
    .default(DEFAULT_HARVEST_PRIORITY)
    .min(PRIORITY_MIN)
    .max(PRIORITY_MAX)
    .description('收割拦截器优先级，需大于主插件与 multimodal-service 的优先级'),
}).description('拦截器优先级')

const DebugSchema = Schema.object({
  debug: Schema.boolean()
    .default(false)
    .description('调试模式只需要解释输出调试日志'),
  traceKinds: Schema.array(
    Schema.union(
      TRACE_KINDS.map((kind) => Schema.const(kind).description(TRACE_KIND_LABELS[kind])),
    ),
  )
    .role('checkbox')
    .default([...TRACE_KINDS])
    .description('追踪项，逐个勾选要输出的类别，取消勾选即不输出'),
}).description('调试模式')

export const Config: Schema<ConfigType> = Schema.intersect([
  BasicSchema,
  ContentSchema,
  CacheSchema,
  PrioritySchema,
  DebugSchema,
]) as Schema<ConfigType>
