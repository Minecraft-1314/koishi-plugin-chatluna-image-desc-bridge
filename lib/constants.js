"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STARTUP_HINT = exports.TRACE_KIND_LABELS = exports.TRACE_KINDS = exports.SKIP_LABEL_NO_URL = exports.SKIP_LABEL_VISION_MODEL = exports.SKIP_LABEL_NOT_CHARACTER = exports.SKIP_LABEL_DISABLED = exports.MIN_DESCRIPTION_LENGTH_MAX = exports.MIN_DESCRIPTION_LENGTH_MIN = exports.PRIORITY_MAX = exports.PRIORITY_MIN = exports.CACHE_ENTRIES_MAX = exports.CACHE_ENTRIES_MIN = exports.CACHE_TTL_MAX_MINUTES = exports.CACHE_TTL_MIN_MINUTES = exports.DEFAULT_CACHE_MAX_ENTRIES = exports.DEFAULT_CACHE_TTL_MINUTES = exports.DEFAULT_MIN_DESCRIPTION_LENGTH = exports.DEFAULT_HARVEST_PRIORITY = exports.DEFAULT_SNAPSHOT_PRIORITY = exports.IMAGE_MARKER_PATTERN = exports.IMAGE_INPUT_CAPABILITY = exports.LOG_KEY = void 0;
exports.LOG_KEY = 'chatluna-image-desc-bridge';
exports.IMAGE_INPUT_CAPABILITY = 'image_input';
exports.IMAGE_MARKER_PATTERN = /^\s*\[image:[^\]]*\]\s*/;
exports.DEFAULT_SNAPSHOT_PRIORITY = -200;
exports.DEFAULT_HARVEST_PRIORITY = 200;
exports.DEFAULT_MIN_DESCRIPTION_LENGTH = 0;
exports.DEFAULT_CACHE_TTL_MINUTES = 30;
exports.DEFAULT_CACHE_MAX_ENTRIES = 200;
exports.CACHE_TTL_MIN_MINUTES = 1;
exports.CACHE_TTL_MAX_MINUTES = 1440;
exports.CACHE_ENTRIES_MIN = 1;
exports.CACHE_ENTRIES_MAX = 5000;
exports.PRIORITY_MIN = -9000;
exports.PRIORITY_MAX = 9000;
exports.MIN_DESCRIPTION_LENGTH_MIN = 0;
exports.MIN_DESCRIPTION_LENGTH_MAX = 500;
exports.SKIP_LABEL_DISABLED = '插件未启用';
exports.SKIP_LABEL_NOT_CHARACTER = '非伪装插件流程';
exports.SKIP_LABEL_VISION_MODEL = '模型支持图片输入';
exports.SKIP_LABEL_NO_URL = '元素无图片地址';
exports.TRACE_KINDS = ['hook', 'cache', 'convert', 'timing'];
exports.TRACE_KIND_LABELS = {
    hook: '拦截判定与跳过原因',
    cache: '缓存命中、未命中与写入',
    convert: '元素改写与写入字数',
    timing: '快照到收割耗时',
};
exports.STARTUP_HINT = [
    '已挂载图像描述转发，请确认三处外部配置：',
    'chatluna-character 开启 image；',
    'chatluna-multimodal-service 开启 enableContextImageDescription；',
    '其 imageModel 指向确实支持图片输入的模型（默认值「无」不会产出描述）。',
].join('');
//# sourceMappingURL=constants.js.map