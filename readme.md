# koishi-plugin-chatluna-image-desc-bridge

## 项目介绍 (Project Introduction)

### 中文
这是一个为 Koishi 机器人框架开发的 **ChatLuna 图像描述转发插件**。它把 [koishi-plugin-chatluna-multimodal-service](https://www.npmjs.com/package/koishi-plugin-chatluna-multimodal-service) 生成的图像描述，从 `messageTransformer` 的结果转发进 [koishi-plugin-chatluna-character](https://www.npmjs.com/package/koishi-plugin-chatluna-character) 的消息正文。

伪装插件拿到 `transform()` 的结果后，只把 `type: "image_url"` 的条目当作图片，其余内容全部丢弃。而上下文图像描述产出的是**纯文本**，既不是 `image_url`，也不是伪装插件会读取的 `session.content`，于是必然被丢掉。本插件补的就是这一段链路，**不需要修改伪装插件源码，也不要求开启 `toolCalling`**。

### English
A **image description bridge plugin** for Koishi. It forwards the image descriptions produced by `koishi-plugin-chatluna-multimodal-service` from the `messageTransformer` result into the message body consumed by `koishi-plugin-chatluna-character`, without patching that plugin and without requiring `toolCalling`.

## 生效范围 (Availability)

| 使用场景 (Scenario) | 接入方式 (How) | 说明 (Description) |
|-------------------|----------------|--------------------|
| 伪装插件 + 非多模态模型 | 开启全部配置 | 描述转写为文本，进入消息正文 |
| 伪装插件 + 多模态模型 | 自动跳过 | `skipVisionModels` 生效，模型自己看图 |
| 主插件自身的对话 | 自动跳过 | 按 `conversationId` 键判定，不重复注入 |
| 描述为空或过短 | 自动跳过 | 保持原元素，交回伪装插件原有逻辑 |
| 表情包 sticker | 随图片处理 | 非多模态模型下只拿得到文字描述 |

## 依赖声明 (Dependencies)

插件只声明一个服务依赖。

| 服务 (Service) | 声明 (Declared) | 原因 (Reason) |
|----------------|----------------|---------------|
| `chatluna` | `inject.required` | 唯一被直接访问的服务，读它的 `messageTransformer` 与 `platform.findModel` |

`chatluna-character` 与 `chatluna-multimodal-service` **不声明为服务依赖**，因为插件从不调用它们的任何 API。它们是协作方：各自在同一个 `messageTransformer` 上注册自己的拦截器，靠优先级排序汇合到一条链上。

这带来两个结果。

- 拦截器链是每次 transform 时从注册表按优先级现取并排序的，所以**安装与加载顺序无关**。multimodal-service 什么时候装都生效，不需要重装本插件。

- 缺少协作方时插件**照常挂载**，只是空转：没有描述产出就不改写元素。配置页始终可用，不会出现插件静默不加载的情况。

主插件自身的对话流程不会二次注入：它把 `transform()` 的结果直接赋给 `context.options.inputMessage`，从不重新序列化元素，所以元素改写在那里没有读取方。

## 工作原理 (How It Works)

`MessageTransformer` 按优先级**升序**执行，数字小的先跑。本插件在同一条链上挂两个拦截器。

| 优先级 (Priority) | 位置 (Stage) | 行为 (Behaviour) |
|-------------------|---------------|------------------|
| `-200` | 全链路最前 | 记录 `message.content` 快照；命中缓存时直接改写元素并终止链 |
| `-100` | 主插件 | 下载图片、写 `image` 占位（主插件自身行为） |
| `100` | multimodal-service | 产出中文描述，追加进 `message.content` |
| `200` | 全链路最后 | 比对快照取出描述增量，把图片元素就地改写为文本元素 |

元素改写之所以可行，有两个前提：**伪装插件把同一个 `elements` 数组同时传给 `transform()` 与 `mapElementToString()`**；而 `element.type` 是可写属性，`mapElementToString()` 的第一个分支就是 `type === "text"`。因此描述会直接进入伪装插件拼出的消息正文。

### 流程判定 (Flow Detection)

伪装插件调用 `transform(session, elements, model)` 时不传 message 对象，走的是 `transform()` 内部的默认值 `{ content, name, additional_kwargs }`，**根本没有 `conversationId` 这个键**。主插件的两条路径都显式传了该键，哪怕值是 `undefined`。

所以判据是**键是否存在**，而不是值是否为空。这一点很关键：主插件的 `transform_chat_message` 里写的是 `conversationId: resolved.conversation?.id`，在没有解析出会话时它就是 `undefined`，按值判断会误判。

### 过滤规则 (Filter Rules)

描述增量会先剥掉开头的 `image` 占位再判断：

| 情况 (Case) | 处理 (Action) |
|-------------|---------------|
| 剥掉占位后仍有内容，且长度达标 | 改写元素 |
| 剥掉占位后为空 | 不改写，交回伪装插件原有逻辑 |
| 内容短于 `minDescriptionLength` | 不改写 |
| 剥掉占位后为空且 `minDescriptionLength` 为 0 | 仍不改写，避免只把占位当正文 |

## 输出样式 (Sample Output)

模型在消息正文里看到的内容：

```text
[image:3f9a2b71]<img>这是一张图片的描述: 一只橘猫趴在键盘上，屏幕上是聊天窗口。</img>
```

| 字段 (Field) | 来源 (Source) |
|--------------|---------------|
| `[image:哈希]` | 主插件的 `image` 占位，`dropImageMarker` 开启后被去掉 |
| `<img>...</img>` | multimodal-service 的 `imageInsertPrompt` 包裹的描述正文 |

开启 `dropImageMarker` 后：

```text
<img>这是一张图片的描述: 一只橘猫趴在键盘上，屏幕上是聊天窗口。</img>
```

## 前提条件 (Prerequisites)

服务层面的依赖见上一节。下面三条属于**外部插件的配置**，无法用依赖声明表达，缺一不可。

插件挂载成功时会在日志里打一行提示，提醒核对这三条。三条都不满足时插件照样挂载，只是每次收到图都判定为「无可用描述」而保持原元素。

| 序号 (No.) | 条件 (Requirement) | 说明 (Description) |
|------------|--------------------|--------------------|
| 1 | `chatluna-character` 开启 `image` | 关闭时 `transform()` 根本不会被调用 |
| 2 | `chatluna-multimodal-service` 开启 `enableContextImageDescription` | 默认关闭，不开则没有描述产出 |
| 3 | 其 `imageModel` 指向支持图片输入的模型 | 默认值是「无」，不配只会打一条 warn |
| 4 | 当前模型不支持图片输入 | 支持时 `skipVisionModels` 会自动跳过 |

## 配置项说明 (Configuration)

### 基础设置 (Basic)
| 配置项 (Config) | 类型 (Type) | 默认值 (Default) | 说明 (Description) |
|----------------|-------------|-------------------|---------------------|
| `enabled` | boolean | true | 启用图像描述转发 |
| `characterFlowOnly` | boolean | true | 仅作用于伪装插件流程 |
| `skipVisionModels` | boolean | true | 模型支持图片输入时跳过 |

### 转发内容 (Forwarding)
| 配置项 (Config) | 类型 (Type) | 默认值 (Default) | 说明 (Description) |
|----------------|-------------|-------------------|---------------------|
| `dropImageMarker` | boolean | false | 去掉 `image` 占位，只留描述正文 |
| `minDescriptionLength` | number | 0 | 最短有效描述字数，0 表示不限制 |

### 描述缓存 (Cache)
| 配置项 (Config) | 类型 (Type) | 默认值 (Default) | 说明 (Description) |
|----------------|-------------|-------------------|---------------------|
| `cache.enable` | boolean | true | 命中时不再下载也不再调用描述模型 |
| `cache.ttlMinutes` | number | 30 | 缓存有效期（分钟），1 到 1440 |
| `cache.maxEntries` | number | 200 | 缓存条数上限，LRU 淘汰，1 到 5000 |

缓存按图片 URL 命中，存的是**未剥离占位的原始文本**。所以改了 `dropImageMarker` 或 `minDescriptionLength` 之后，命中缓存的结果会跟着新配置重新计算，不需要清缓存。

### 拦截器优先级 (Priority)
| 配置项 (Config) | 类型 (Type) | 默认值 (Default) | 说明 (Description) |
|----------------|-------------|-------------------|---------------------|
| `snapshotPriority` | number | -200 | 快照优先级，需小于收割优先级 |
| `harvestPriority` | number | 200 | 收割优先级，需大于 100 |

两个值都会被夹到 -9000 到 9000，并且**强制保持升序**。填反了会被自动纠正而不是静默失效。

### 调试模式 (Debug Mode)
| 配置项 (Config) | 类型 (Type) | 默认值 (Default) | 说明 (Description) |
|----------------|-------------|-------------------|---------------------|
| `debug` | boolean | false | 输出调试日志 |
| `traceKinds` | array | 全部勾选 | 追踪项，逐项勾选要输出的类别 |

`traceKinds` 是一个 checkbox 数组，把原先四个独立开关合并成一项，但每一类仍可单独开关。

| 取值 (Value) | 覆盖内容 (Coverage) |
|---------------|---------------------|
| `hook` | 拦截判定与跳过原因 |
| `cache` | 缓存命中、未命中与写入 |
| `convert` | 元素改写与写入字数 |
| `timing` | 快照到收割的耗时 |

```text
[hook]    拦截器已安装 优先级 -200 / 200
[hook]    跳过：模型支持图片输入
[cache]   未命中，继续等待描述产出
[convert] 类型 img -> text，写入 33 字
[timing]  快照到收割 128ms
```

## 项目贡献者 (Contributors)

| 贡献者 (Contributor) | 贡献内容 (Contribution) |
|----------------------|--------------------------|
| Minecraft-1314 | 插件完整开发 (Complete plugin development) |

（欢迎通过 Issues 或 PR 加入贡献者列表）  
(Welcome to join the contributor list via Issues or PR)

## 许可协议 (License)

本项目采用 MIT 许可证。
This project is licensed under the MIT License.

## 支持我们 (Support Us)

如果这个项目对您有帮助，欢迎点亮右上角的 Star ⭐ 支持我们！
If this project is helpful to you, please feel free to star it in the upper right corner ⭐ to support us!
