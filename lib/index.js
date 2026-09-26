"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usage = exports.inject = exports.name = exports.apply = exports.Config = void 0;
var config_1 = require("./config");
Object.defineProperty(exports, "Config", { enumerable: true, get: function () { return config_1.Config; } });
var plugin_1 = require("./plugin");
Object.defineProperty(exports, "apply", { enumerable: true, get: function () { return plugin_1.apply; } });
exports.name = 'chatluna-image-desc-bridge';
exports.inject = {
    required: ['chatluna'],
};
exports.usage = `
## 使用说明

本插件把 multimodal-service 生成的图像描述，从 \`messageTransformer\` 的结果转发进 chatluna-character 的消息正文。

不需要修改伪装插件源码，也不要求开启 \`toolCalling\`。

### 为什么需要转发

- 伪装插件调用 \`transform()\` 后，只把结果里 \`type: "image_url"\` 的条目当作图片
- 其余内容全部丢弃，包括纯文本形式的图像描述
- 描述既不是 \`image_url\`，也不是伪装插件会读取的 \`session.content\`

所以上下文图像描述必然丢失，本插件补的就是这一段链路。

### 工作方式

\`MessageTransformer\` 按优先级**升序**执行，数字小的先跑。

- 优先级 \`-200\`：本插件记录 \`message.content\` 快照

- 优先级 \`-100\`：主插件下载图片并写 \`image\` 占位

- 优先级 \`100\`：multimodal-service 产出中文描述并追加进 \`message.content\`

- 优先级 \`200\`：本插件取出描述增量，把图片元素改写为文本元素

元素改写成立有两个前提。

- 伪装插件把同一个 \`elements\` 数组同时传给 \`transform()\` 与 \`mapElementToString()\`

- \`element.type\` 是可写属性，且 \`mapElementToString()\` 的第一个分支就是 \`type === "text"\`

### 流程判定

判据是**键是否存在**，不是值是否为空。

- 伪装插件调 \`transform()\` 时不传 message，走内部默认值，对象里没有 \`conversationId\` 这个键

- 主插件的两条路径都显式传了该键，哪怕值是 \`undefined\`

这一点很关键：主插件写的是 \`conversationId: resolved.conversation?.id\`，没解析出会话时它就是 \`undefined\`，按值判断会误判。

### 前提条件

缺一不可，任意一条不满足都会导致「已改写」计数为 0。

1. chatluna-character 开启 \`image\`

2. multimodal-service 开启 \`enableContextImageDescription\`

3. 其 \`imageModel\` 指向确实支持图片输入的模型，默认值「无」不会产出描述

4. 当前模型本身不支持图片输入，否则会被自动跳过

### 调试模式

\`debug\` 打开后按四个类别输出逐条追踪。

- \`hook\`：拦截判定与跳过原因

- \`cache\`：缓存命中、未命中与写入

- \`convert\`：元素改写与写入字数

- \`timing\`：快照到收割的耗时

\`traceKinds\` 里逐项勾选要输出的类别，取消勾选即不输出。

完整说明见插件目录下的 readme.md。
`;
//# sourceMappingURL=index.js.map