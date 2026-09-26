export const LOG_KEY = 'chatluna-image-desc-bridge'

export const IMAGE_INPUT_CAPABILITY = 'image_input'

export const IMAGE_MARKER_PATTERN = /^\s*\[image:[^\]]*\]\s*/

export const DEFAULT_SNAPSHOT_PRIORITY = -200
export const DEFAULT_HARVEST_PRIORITY = 200
export const DEFAULT_MIN_DESCRIPTION_LENGTH = 0

export const DEFAULT_CACHE_TTL_MINUTES = 30
export const DEFAULT_CACHE_MAX_ENTRIES = 200

export const CACHE_TTL_MIN_MINUTES = 1
export const CACHE_TTL_MAX_MINUTES = 1440
export const CACHE_ENTRIES_MIN = 1
export const CACHE_ENTRIES_MAX = 5000

export const PRIORITY_MIN = -9000
export const PRIORITY_MAX = 9000

export const MIN_DESCRIPTION_LENGTH_MIN = 0
export const MIN_DESCRIPTION_LENGTH_MAX = 500

export const SKIP_LABEL_DISABLED = '插件未启用'
export const SKIP_LABEL_NOT_CHARACTER = '非伪装插件流程'
export const SKIP_LABEL_VISION_MODEL = '模型支持图片输入'
export const SKIP_LABEL_NO_URL = '元素无图片地址'

export const TRACE_KINDS = ['hook', 'cache', 'convert', 'timing'] as const

export const TRACE_KIND_LABELS: Record<string, string> = {
  hook: '拦截判定与跳过原因',
  cache: '缓存命中、未命中与写入',
  convert: '元素改写与写入字数',
  timing: '快照到收割耗时',
}

export const STARTUP_HINT = [
  '已挂载图像描述转发，请确认三处外部配置：',
  'chatluna-character 开启 image；',
  'chatluna-multimodal-service 开启 enableContextImageDescription；',
  '其 imageModel 指向确实支持图片输入的模型（默认值「无」不会产出描述）。',
].join('')
