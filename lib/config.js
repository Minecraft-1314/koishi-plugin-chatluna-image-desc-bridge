"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const koishi_1 = require("koishi");
const constants_1 = require("./constants");
const BasicSchema = koishi_1.Schema.object({
    enabled: koishi_1.Schema.boolean()
        .default(true)
        .description('启用图像描述转发，关闭后插件不再挂载拦截器'),
    characterFlowOnly: koishi_1.Schema.boolean()
        .default(true)
        .description('仅作用于伪装插件流程，主插件自身的对话不接管'),
    skipVisionModels: koishi_1.Schema.boolean()
        .default(true)
        .description('模型本身支持图片输入时跳过，模型自己看图不需要描述'),
}).description('基础设置');
const ContentSchema = koishi_1.Schema.object({
    dropImageMarker: koishi_1.Schema.boolean()
        .default(false)
        .description('转发时去掉 image 占位，只保留描述正文'),
    minDescriptionLength: koishi_1.Schema.number()
        .default(constants_1.DEFAULT_MIN_DESCRIPTION_LENGTH)
        .min(constants_1.MIN_DESCRIPTION_LENGTH_MIN)
        .max(constants_1.MIN_DESCRIPTION_LENGTH_MAX)
        .description('最短有效描述字数，低于此长度视为无描述不改写，0 表示不限制'),
}).description('转发内容');
const CacheSchema = koishi_1.Schema.object({
    cache: koishi_1.Schema.object({
        enable: koishi_1.Schema.boolean()
            .default(true)
            .description('启用描述缓存，命中时不再下载图片也不再调用描述模型'),
        ttlMinutes: koishi_1.Schema.number()
            .default(constants_1.DEFAULT_CACHE_TTL_MINUTES)
            .min(constants_1.CACHE_TTL_MIN_MINUTES)
            .max(constants_1.CACHE_TTL_MAX_MINUTES)
            .description('缓存有效期（分钟），1 到 1440'),
        maxEntries: koishi_1.Schema.number()
            .default(constants_1.DEFAULT_CACHE_MAX_ENTRIES)
            .min(constants_1.CACHE_ENTRIES_MIN)
            .max(constants_1.CACHE_ENTRIES_MAX)
            .description('缓存条数上限，超出后按最近最少使用淘汰，1 到 5000'),
    })
        .collapse()
        .description('缓存设置'),
}).description('描述缓存');
const PrioritySchema = koishi_1.Schema.object({
    snapshotPriority: koishi_1.Schema.number()
        .default(constants_1.DEFAULT_SNAPSHOT_PRIORITY)
        .min(constants_1.PRIORITY_MIN)
        .max(constants_1.PRIORITY_MAX)
        .description('快照拦截器优先级，数字小的先执行，需小于收割优先级'),
    harvestPriority: koishi_1.Schema.number()
        .default(constants_1.DEFAULT_HARVEST_PRIORITY)
        .min(constants_1.PRIORITY_MIN)
        .max(constants_1.PRIORITY_MAX)
        .description('收割拦截器优先级，需大于主插件与 multimodal-service 的优先级'),
}).description('拦截器优先级');
const DebugSchema = koishi_1.Schema.object({
    debug: koishi_1.Schema.boolean()
        .default(false)
        .description('调试模式只需要解释输出调试日志'),
    traceKinds: koishi_1.Schema.array(koishi_1.Schema.union(constants_1.TRACE_KINDS.map((kind) => koishi_1.Schema.const(kind).description(constants_1.TRACE_KIND_LABELS[kind]))))
        .role('checkbox')
        .default([...constants_1.TRACE_KINDS])
        .description('追踪项，逐个勾选要输出的类别，取消勾选即不输出'),
}).description('调试模式');
exports.Config = koishi_1.Schema.intersect([
    BasicSchema,
    ContentSchema,
    CacheSchema,
    PrioritySchema,
    DebugSchema,
]);
//# sourceMappingURL=config.js.map