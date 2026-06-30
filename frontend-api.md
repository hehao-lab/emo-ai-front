# Mobile AI Chat Backend 接口文档

面向前端接入的后端接口说明。当前后端是 FastAPI 服务，默认本地地址为：

```text
http://127.0.0.1:8000
```

API 统一前缀：

```text
/api/v1
```

Swagger 文档：

```text
http://127.0.0.1:8000/docs
```

## 1. 通用约定

### 请求格式

除 SSE 流式接口外，请求和响应默认都是 JSON。

```http
Content-Type: application/json
```

### 用户标识

当前 MVP 版本没有 JWT 登录，所有业务接口通过请求头区分用户：

```http
X-User-Id: ios-user-1
```

前端需要为每个用户保存一个稳定的用户 ID，并在每次请求中带上该 header。

如果缺少 `X-User-Id` 或值为空，后端返回：

```json
{
  "detail": "Missing X-User-Id header"
}
```

状态码：`401`

### 时间格式

所有时间字段为 ISO datetime 字符串，例如：

```json
"2026-06-30T10:20:30"
```

### 常见错误

| 状态码 | 含义 | 常见场景 |
|---|---|---|
| `400` | 请求内容不合法 | 创建知识库文档时内容为空 |
| `401` | 缺少用户标识 | 未传 `X-User-Id` |
| `404` | 资源不存在或无权限 | 读取其他用户的会话 |
| `422` | 参数校验失败 | 消息为空、标题超长 |
| `502` | AI 上游服务异常 | 模型服务不可用 |

FastAPI 参数校验错误一般形如：

```json
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "message"],
      "msg": "String should have at least 1 character",
      "input": ""
    }
  ]
}
```

## 2. 数据结构

### Conversation

```ts
type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};
```

### Message

```ts
type Message = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system" | string;
  content: string;
  sequence: number;
  model_name: string | null;
  created_at: string;
};
```

实际聊天接口里前端主要会看到 `user` 和 `assistant`。

### KnowledgeDocument

```ts
type KnowledgeDocument = {
  id: string;
  title: string;
  source: string | null;
  chunk_count: number;
  created_at: string;
};
```

## 3. 健康检查

### GET `/health`

不需要 `X-User-Id`。

#### 响应

```json
{
  "status": "ok"
}
```

状态码：`200`

## 4. 会话接口

### 4.1 创建会话

```http
POST /api/v1/conversations
X-User-Id: ios-user-1
Content-Type: application/json
```

#### 请求体

```json
{
  "title": "测试会话"
}
```

字段说明：

| 字段 | 类型 | 必填 | 限制 |
|---|---|---|---|
| `title` | string | 是 | 1 到 200 字符 |

#### 响应

```json
{
  "id": "2f071c49-5c2d-4b75-9c2a-65f8d8e5c4a4",
  "title": "测试会话",
  "created_at": "2026-06-30T10:20:30",
  "updated_at": "2026-06-30T10:20:30"
}
```

状态码：`201`

### 4.2 获取会话列表

```http
GET /api/v1/conversations
X-User-Id: ios-user-1
```

#### 响应

```json
{
  "items": [
    {
      "id": "2f071c49-5c2d-4b75-9c2a-65f8d8e5c4a4",
      "title": "测试会话",
      "created_at": "2026-06-30T10:20:30",
      "updated_at": "2026-06-30T10:22:10"
    }
  ]
}
```

状态码：`200`

说明：列表按最近更新时间倒序返回。

### 4.3 获取会话消息

```http
GET /api/v1/conversations/{conversation_id}/messages
X-User-Id: ios-user-1
```

#### 路径参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `conversation_id` | string | 会话 ID |

#### 响应

```json
{
  "items": [
    {
      "id": "14909d76-22e5-42cc-8fd8-8dd98b7ffb9f",
      "conversation_id": "2f071c49-5c2d-4b75-9c2a-65f8d8e5c4a4",
      "role": "user",
      "content": "你好",
      "sequence": 1,
      "model_name": null,
      "created_at": "2026-06-30T10:20:30"
    },
    {
      "id": "bd6df7f5-8224-421c-9f43-bd33faac1246",
      "conversation_id": "2f071c49-5c2d-4b75-9c2a-65f8d8e5c4a4",
      "role": "assistant",
      "content": "你好，有什么可以帮你？",
      "sequence": 2,
      "model_name": "gpt-5.5",
      "created_at": "2026-06-30T10:20:35"
    }
  ]
}
```

状态码：`200`

如果会话不存在，或当前用户无权访问：

```json
{
  "detail": "Conversation not found"
}
```

状态码：`404`

## 5. 聊天接口

### 5.1 非流式发送消息

用于不需要边生成边展示的场景。后端会等待 AI 完整回答后一次性返回。

```http
POST /api/v1/chat
X-User-Id: ios-user-1
Content-Type: application/json
```

#### 请求体

```json
{
  "conversation_id": "2f071c49-5c2d-4b75-9c2a-65f8d8e5c4a4",
  "message": "继续详细说",
  "system_prompt": null
}
```

字段说明：

| 字段 | 类型 | 必填 | 限制 | 说明 |
|---|---|---|---|---|
| `message` | string | 是 | 1 到 8000 字符，不能为空白字符串 | 用户本轮输入 |
| `conversation_id` | string \| null | 否 | - | 不传则自动创建新会话 |
| `system_prompt` | string \| null | 否 | 最多 4000 字符 | 可选系统提示词；一般前端不需要传 |

#### 响应

```json
{
  "conversation": {
    "id": "2f071c49-5c2d-4b75-9c2a-65f8d8e5c4a4",
    "title": "你好",
    "created_at": "2026-06-30T10:20:30",
    "updated_at": "2026-06-30T10:21:00"
  },
  "user_message": {
    "id": "14909d76-22e5-42cc-8fd8-8dd98b7ffb9f",
    "conversation_id": "2f071c49-5c2d-4b75-9c2a-65f8d8e5c4a4",
    "role": "user",
    "content": "继续详细说",
    "sequence": 3,
    "model_name": null,
    "created_at": "2026-06-30T10:21:00"
  },
  "assistant_message": {
    "id": "bd6df7f5-8224-421c-9f43-bd33faac1246",
    "conversation_id": "2f071c49-5c2d-4b75-9c2a-65f8d8e5c4a4",
    "role": "assistant",
    "content": "这是 AI 的完整回答。",
    "sequence": 4,
    "model_name": "gpt-5.5",
    "created_at": "2026-06-30T10:21:10"
  }
}
```

状态码：`201`

### 5.2 流式发送消息 SSE

用于移动端或 Web 端边生成边展示。后端使用 Server-Sent Events 返回增量内容。

```http
POST /api/v1/chat/stream
X-User-Id: ios-user-1
Content-Type: application/json
Accept: text/event-stream
```

#### 请求体

和非流式接口相同：

```json
{
  "conversation_id": "2f071c49-5c2d-4b75-9c2a-65f8d8e5c4a4",
  "message": "请用三点说明",
  "system_prompt": null
}
```

状态码：`201`

响应头：

```http
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-store
```

#### SSE 事件格式

每个事件格式如下：

```text
event: delta
data: {"content":"这是"}

event: delta
data: {"content":" AI 回答的一部分"}

event: done
data: {"conversation_id":"2f071c49-5c2d-4b75-9c2a-65f8d8e5c4a4","assistant_message_id":"bd6df7f5-8224-421c-9f43-bd33faac1246","content":"这是 AI 回答的一部分"}
```

事件类型：

| event | data | 说明 |
|---|---|---|
| `delta` | `{ "content": string }` | 增量文本片段，前端应追加展示 |
| `done` | `{ "conversation_id": string, "assistant_message_id": string, "content": string }` | 完整回答已生成并落库 |
| `error` | `{ "detail": "AI service unavailable" }` | AI 上游异常 |

#### 前端处理建议

如果使用浏览器原生 `EventSource`，需要注意 `EventSource` 默认是 GET，不适合当前 POST 接口。推荐使用 `fetch` 读取 `ReadableStream`，或使用支持 POST SSE 的客户端库。

伪代码：

```ts
const res = await fetch("/api/v1/chat/stream", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Accept": "text/event-stream",
    "X-User-Id": userId,
  },
  body: JSON.stringify({
    conversation_id: conversationId,
    message: input,
  }),
});

const reader = res.body!.getReader();
const decoder = new TextDecoder("utf-8");
let buffer = "";

while (true) {
  const { value, done } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });

  const events = buffer.split("\n\n");
  buffer = events.pop() ?? "";

  for (const rawEvent of events) {
    const eventLine = rawEvent.split("\n").find((line) => line.startsWith("event: "));
    const dataLine = rawEvent.split("\n").find((line) => line.startsWith("data: "));
    if (!eventLine || !dataLine) continue;

    const event = eventLine.slice("event: ".length);
    const data = JSON.parse(dataLine.slice("data: ".length));

    if (event === "delta") {
      appendAssistantText(data.content);
    }
    if (event === "done") {
      markAssistantMessageSaved(data.assistant_message_id);
    }
    if (event === "error") {
      showError(data.detail);
    }
  }
}
```

#### 流式接口注意事项

- 用户消息会在调用 AI 前先落库。
- `done` 事件发出时，assistant 消息已经落库。
- 如果收到 `error`，说明本次 assistant 消息没有成功落库；前端可以提示用户重试。
- 如果请求的 `conversation_id` 不存在或不是当前用户的，会在开始流式响应前返回 `404` JSON 错误。

## 6. 知识库接口

知识库按 `X-User-Id` 隔离。聊天时后端会自动检索当前用户的知识库片段，并注入模型上下文，前端不需要在聊天请求中手动传知识库内容。

### 6.1 创建知识库文档

```http
POST /api/v1/knowledge/documents
X-User-Id: ios-user-1
Content-Type: application/json
```

#### 请求体

```json
{
  "title": "Product manual",
  "content": "Knowledge text to retrieve later.",
  "source": "manual"
}
```

字段说明：

| 字段 | 类型 | 必填 | 限制 | 说明 |
|---|---|---|---|---|
| `title` | string | 是 | 1 到 200 字符，不能为空白字符串 | 文档标题 |
| `content` | string | 是 | 1 到 200000 字符，不能为空白字符串 | 文档正文 |
| `source` | string \| null | 否 | 最多 200 字符 | 来源说明，例如文件名、URL、manual |

#### 响应

```json
{
  "id": "2bc3c40c-5b38-4905-88f6-8c796652402d",
  "title": "Product manual",
  "source": "manual",
  "chunk_count": 3,
  "created_at": "2026-06-30T10:30:00"
}
```

状态码：`201`

说明：后端会自动分块并生成 embedding，`chunk_count` 是分块数量。

### 6.2 获取知识库文档列表

```http
GET /api/v1/knowledge/documents
X-User-Id: ios-user-1
```

#### 响应

```json
{
  "items": [
    {
      "id": "2bc3c40c-5b38-4905-88f6-8c796652402d",
      "title": "Product manual",
      "source": "manual",
      "chunk_count": 3,
      "created_at": "2026-06-30T10:30:00"
    }
  ]
}
```

状态码：`200`

## 7. 前端接入建议

### 推荐聊天流程

1. 用户首次输入时，调用 `POST /api/v1/chat/stream`，不传 `conversation_id`。
2. 从 `done` 事件或后续会话列表中拿到 `conversation_id`。
3. 后续追问时继续调用 `POST /api/v1/chat/stream`，传入该 `conversation_id`。
4. 页面刷新后，用 `GET /api/v1/conversations` 获取会话列表。
5. 进入会话详情页时，用 `GET /api/v1/conversations/{conversation_id}/messages` 拉取历史消息。

### 消息展示

- 用户点击发送后，可以立即把用户输入以本地临时消息展示出来。
- 收到 `delta` 后创建或更新一条 assistant 临时消息。
- 收到 `done` 后，把 assistant 临时消息替换为后端返回的 `assistant_message_id`。
- 收到 `error` 后，保留用户消息并展示重试入口。

### 知识库接入

- 上传文本类知识时调用 `POST /api/v1/knowledge/documents`。
- 上传成功后可调用 `GET /api/v1/knowledge/documents` 刷新列表。
- 当前版本没有删除、修改、文件上传、入库进度查询接口。

## 8. 当前限制

- 当前认证只是 `X-User-Id`，后续可能替换为 JWT。
- 流式接口是 POST SSE，浏览器原生 `EventSource` 不适用。
- 知识库创建是同步接口；大文档会等待 embedding 完成后才返回。
- 当前没有分页参数，会话列表、消息列表、知识库列表都一次性返回。
- 当前没有删除会话、删除知识库文档、重命名会话接口。
