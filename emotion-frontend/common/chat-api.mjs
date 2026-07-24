import { API_BASE_URL, getAccessToken } from './user-api.mjs';
import { normalizeChatId } from './chat-id.mjs';

const USER_ID_STORAGE_KEY = 'emotion-ai-user-id';

export { API_BASE_URL };

export function createClientRequestId() {
  return `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export class ChatApiError extends Error {
  constructor(message, { status = 0, code = '', retryable = false, payload = null } = {}) {
    super(message);
    this.name = 'ChatApiError';
    this.status = status;
    this.code = code;
    this.retryable = Boolean(retryable);
    this.payload = payload;
  }
}

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function createApiUrl(path, baseUrl = API_BASE_URL) {
  return `${trimTrailingSlash(baseUrl)}${path}`;
}

function getStorageApi(storageApi) {
  if (storageApi) {
    return storageApi;
  }

  if (typeof uni !== 'undefined') {
    return uni;
  }

  return null;
}

function createRandomSuffix() {
  const randomPart = Math.random().toString(36).slice(2, 10);
  const timePart = Date.now().toString(36);

  return `${timePart}-${randomPart}`;
}

export function createStableUserId(storageApi) {
  const api = getStorageApi(storageApi);
  const fallbackUserId = `ios-user-${createRandomSuffix()}`;

  if (!api?.getStorageSync || !api?.setStorageSync) {
    return fallbackUserId;
  }

  const savedUserId = api.getStorageSync(USER_ID_STORAGE_KEY);

  if (savedUserId) {
    return savedUserId;
  }

  api.setStorageSync(USER_ID_STORAGE_KEY, fallbackUserId);
  return fallbackUserId;
}

function normalizeFetch(fetchImpl) {
  if (fetchImpl) {
    return fetchImpl;
  }

  if (typeof fetch !== 'undefined') {
    return fetch;
  }

  throw new Error('当前运行环境不支持 fetch，无法调用聊天接口');
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    query.set(key, String(value));
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

function buildJsonHeaders({ accessToken, extraHeaders = {} } = {}) {
  const token = accessToken === undefined ? getAccessToken() : accessToken;

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

async function readJson(response) {
  const text = await response.text().catch(() => '');

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

function readErrorMessage(payload, status) {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (typeof payload?.message === 'string') {
    return payload.message;
  }

  if (typeof payload?.detail === 'string') {
    return payload.detail;
  }

  if (Array.isArray(payload?.detail) && payload.detail[0]?.msg) {
    return payload.detail[0].msg;
  }

  return `请求失败，状态码 ${status}`;
}

async function requestJson(path, {
  baseUrl = API_BASE_URL,
  accessToken,
  fetchImpl,
  method = 'GET',
  body,
  signal,
} = {}) {
  const requestFetch = normalizeFetch(fetchImpl);
  const response = await requestFetch(createApiUrl(path, baseUrl), {
    method,
    headers: buildJsonHeaders({ accessToken }),
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw createApiError(payload, response.status);
  }

  return payload;
}

function getPayloadItems(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload?.items || payload?.sessions || payload?.messages || payload?.data || [];
}

function createApiError(payload, status = 0) {
  const code = payload?.reason || payload?.code || '';
  return new ChatApiError(readErrorMessage(payload, status), {
    status,
    code: String(code || ''),
    retryable: Boolean(payload?.retryable) || status >= 500,
    payload,
  });
}

function isEmptyTimestampValue(value) {
  if (value === undefined || value === null || value === '') {
    return true;
  }

  if (typeof value === 'number') {
    return !Number.isFinite(value) || value <= 0;
  }

  if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) {
    return Number(value) <= 0;
  }

  return false;
}

function pickConversationTimestamp(session) {
  return [
    session.lastMessageAt,
    session.last_message_at,
    session.updatedAt,
    session.updated_at,
    session.createdAt,
    session.created_at,
  ].find((value) => !isEmptyTimestampValue(value)) || '';
}

function createTimestampDate(value) {
  const numericValue = typeof value === 'number'
    ? value
    : (typeof value === 'string' && /^-?\d+$/.test(value.trim()) ? Number(value) : Number.NaN);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return new Date(numericValue < 100000000000 ? numericValue * 1000 : numericValue);
}

function formatConversationTime(value) {
  if (!value) {
    return '';
  }

  const timestampDate = createTimestampDate(value);
  const normalizedValue = String(value).includes('T') ? value : String(value).replace(' ', 'T');
  const date = timestampDate || new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');

  return `${month}/${day} ${hour}:${minute}`;
}

export function createUiMessage(message) {
  const uiMessage = {
    id: message.id || message.messageId,
    role: message.role === 'assistant' ? 'ai' : message.role,
    content: message.content || '',
  };
  const references = normalizeReferences(message.references || message.citations || message.referencesJson);
  const usage = normalizeUsage(message.usage || message.usageJson);

  if (message.turnStatus || message.turn_status || message.status) {
    uiMessage.status = message.turnStatus || message.turn_status || message.status;
  }
  if (references.length > 0) uiMessage.references = references;
  if (usage) uiMessage.usage = usage;
  if (message.clientRequestId || message.client_request_id) {
    uiMessage.requestId = message.clientRequestId || message.client_request_id;
  }
  if (message.model || message.modelName || message.model_name) {
    uiMessage.model = message.model || message.modelName || message.model_name;
  }
  if (message.provider) uiMessage.provider = message.provider;
  return uiMessage;
}

export function normalizeReferences(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  return [];
}

export function normalizeUsage(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  return null;
}

function getPreviewContent(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return value.content || value.text || value.message || '';
}

function getChatRecordPreview(messages, fallback = '暂无消息') {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user');
  const latestMessage = messages[messages.length - 1];

  return latestUserMessage?.content || latestMessage?.content || fallback;
}

export function createUiChatRecord(session, messages = []) {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user');
  const latestMessage = messages[messages.length - 1];
  const fallbackPreview = getPreviewContent(session.preview)
    || getPreviewContent(session.lastMessage)
    || getPreviewContent(session.last_message)
    || getPreviewContent(session.lastMessageContent)
    || getPreviewContent(session.last_message_content)
    || getPreviewContent(session.summary)
    || '暂无消息';
  const updatedAt = pickConversationTimestamp(session);

  return {
    id: normalizeChatId(session.id ?? session.sessionId),
    title: session.title || '新对话',
    preview: latestUserMessage?.content || latestMessage?.content || fallbackPreview,
    time: formatConversationTime(updatedAt),
    updatedAt,
    messages,
  };
}

export async function fetchConversations(options = {}) {
  const {
    page = 1,
    pageSize = 20,
    status = 'active',
    ...requestOptions
  } = options;
  const payload = await requestJson(`/v1/chat/sessions${buildQuery({ page, pageSize, status })}`, requestOptions);

  return getPayloadItems(payload).map((session) => createUiChatRecord(session));
}

export async function fetchConversationMessages(sessionId, options = {}) {
  const {
    page = 1,
    pageSize = 50,
    ...requestOptions
  } = options;
  const payload = await requestJson(`/v1/chat/sessions/${sessionId}/messages${buildQuery({ page, pageSize })}`, requestOptions);

  return getPayloadItems(payload).map(createUiMessage);
}

export async function fetchConversationsWithMessages(options = {}) {
  const records = await fetchConversations(options);

  return Promise.all(records.map(async (record) => {
    if (record.messages.length > 0) {
      return record;
    }

    try {
      const messages = await fetchConversationMessages(record.id, options);

      return {
        ...record,
        messages,
        preview: getChatRecordPreview(messages, record.preview),
      };
    } catch (error) {
      return record;
    }
  }));
}

export async function sendChatMessage({
  conversationId,
  message,
  baseUrl = API_BASE_URL,
  accessToken,
  fetchImpl,
} = {}) {
  return requestJson('/api/v1/chat', {
    baseUrl,
    accessToken,
    fetchImpl,
    method: 'POST',
    body: {
      conversation_id: conversationId || null,
      message,
    },
  });
}

function parseDataLine(value) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

export function parseSseEvents(buffer) {
  const normalizedBuffer = buffer.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const chunks = normalizedBuffer.split(/\n\n/);
  const remainingBuffer = chunks.pop() || '';
  const events = [];

  for (const rawEvent of chunks) {
    const lines = rawEvent.split('\n');
    let event = 'message';
    const dataLines = [];

    for (const line of lines) {
      if (!line || line.startsWith(':')) continue;
      const separatorIndex = line.indexOf(':');
      const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex);
      let value = separatorIndex === -1 ? '' : line.slice(separatorIndex + 1);
      if (value.startsWith(' ')) value = value.slice(1);
      if (field === 'event') event = value;
      if (field === 'data') dataLines.push(value);
    }

    if (dataLines.length === 0) continue;
    const data = parseDataLine(dataLines.join('\n'));

    if (data === null) continue;

    events.push({ event, data });
  }

  return { events, remainingBuffer };
}

function handleSseEvent({ event, data }, callbacks) {
  if (event === 'delta') {
    callbacks.onDelta?.(data.content || '');
    return null;
  }

  if (event === 'done') {
    callbacks.onDone?.(data);
    return { type: 'done', data };
  }

  if (event === 'error') {
    callbacks.onError?.(data);
    return { type: 'error', data };
  }

  return null;
}

export async function streamChatMessage({
  conversationId,
  message,
  idempotencyKey = createClientRequestId(),
  clientRequestId = idempotencyKey,
  traceparent,
  signal,
  baseUrl = API_BASE_URL,
  accessToken,
  fetchImpl,
  onDelta,
  onDone,
  onError,
} = {}) {
  const requestFetch = normalizeFetch(fetchImpl);
  const response = await requestFetch(createApiUrl('/api/v1/chat/stream', baseUrl), {
    method: 'POST',
    headers: buildJsonHeaders({
      accessToken,
      extraHeaders: {
        Accept: 'text/event-stream',
        'Idempotency-Key': idempotencyKey,
        ...(traceparent ? { traceparent } : {}),
      },
    }),
    body: JSON.stringify({
      conversation_id: conversationId || null,
      message,
      client_request_id: clientRequestId,
    }),
    signal,
  });
  const errorPayload = response.ok ? null : await readJson(response);

  if (!response.ok) {
    throw createApiError(errorPayload, response.status);
  }

  if (!response.body?.getReader) {
    throw new ChatApiError('当前运行环境不支持流式读取', { code: 'STREAM_UNSUPPORTED' });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let terminal = null;

  const consumeEvents = (events) => {
    for (const event of events) {
      terminal = handleSseEvent(event, { onDelta, onDone, onError }) || terminal;
      if (terminal) return;
    }
  };

  while (!terminal) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    const result = parseSseEvents(buffer);
    buffer = result.remainingBuffer;

    consumeEvents(result.events);
  }

  buffer += decoder.decode();

  if (!terminal && buffer.trim()) {
    const result = parseSseEvents(`${buffer}\n\n`);

    consumeEvents(result.events);
  }

  if (terminal?.type === 'error') {
    await reader.cancel().catch(() => {});
    throw createApiError(terminal.data, response.status);
  }

  if (!terminal) {
    throw new ChatApiError('连接提前结束，请重试', {
      status: response.status,
      code: 'STREAM_INCOMPLETE',
      retryable: true,
    });
  }

  return terminal.data;
}

export async function fetchKnowledgeDocuments({
  page = 1,
  pageSize = 50,
  status,
  query,
  cursor,
  ...requestOptions
} = {}) {
  return requestJson(`/api/v1/knowledge/documents${buildQuery({ page, pageSize, status, query, cursor })}`, requestOptions);
}

export async function createKnowledgeDocument({
  title,
  source,
  objectReference,
  content,
  metadata = {},
}, options = {}) {
  return requestJson('/api/v1/knowledge/documents', {
    ...options,
    method: 'POST',
    body: {
      title,
      ...(source ? { source } : {}),
      ...(objectReference ? { objectReference } : {}),
      ...(content ? { content } : {}),
      metadataJson: JSON.stringify(metadata || {}),
    },
  });
}

export async function fetchKnowledgeJob(jobId, options = {}) {
  return requestJson(`/api/v1/knowledge/jobs/${encodeURIComponent(jobId)}`, options);
}

export async function deleteKnowledgeDocument(documentId, options = {}) {
  return requestJson(`/api/v1/knowledge/documents/${encodeURIComponent(documentId)}`, {
    ...options,
    method: 'DELETE',
  });
}

export async function reindexKnowledgeDocument(documentId, options = {}) {
  return requestJson(`/api/v1/knowledge/documents/${encodeURIComponent(documentId)}:reindex`, {
    ...options,
    method: 'POST',
    body: {},
  });
}

export async function pollKnowledgeJob(jobId, {
  intervalMs = 1200,
  onProgress,
  signal,
  waitImpl = (delay) => new Promise((resolve) => setTimeout(resolve, delay)),
  ...requestOptions
} = {}) {
  while (true) {
    if (signal?.aborted) throw createAbortError();
    const job = await fetchKnowledgeJob(jobId, { ...requestOptions, signal });
    onProgress?.(job);
    if (job?.status === 'ready' || job?.status === 'failed') return job;
    await waitForPollInterval(intervalMs, signal, waitImpl);
  }
}

function waitForPollInterval(delay, signal, waitImpl) {
  if (!signal) return waitImpl(delay);
  if (signal.aborted) return Promise.reject(createAbortError());

  return new Promise((resolve, reject) => {
    let settled = false;
    let onAbort = () => {};
    onAbort = () => {
      if (settled) return;
      settled = true;
      reject(createAbortError());
    };
    signal.addEventListener('abort', onAbort, { once: true });
    waitImpl(delay).then(() => {
      if (settled) return;
      settled = true;
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, (error) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener('abort', onAbort);
      reject(error);
    });
  });
}

function createAbortError() {
  const error = new Error('请求已取消');
  error.name = 'AbortError';
  return error;
}

export function uploadKnowledgeObject({
  filePath,
  baseUrl = API_BASE_URL,
  accessToken,
  signal,
  uniApi = typeof uni !== 'undefined' ? uni : null,
} = {}) {
  if (!filePath) return Promise.reject(new Error('请选择知识文件'));
  if (!uniApi?.uploadFile) return Promise.reject(new Error('当前运行环境不支持文件上传'));
  const token = accessToken === undefined ? getAccessToken() : accessToken;

  return new Promise((resolve, reject) => {
    let settled = false;
    let task = null;
    let onAbort = () => {};
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', onAbort);
      callback(value);
    };
    task = uniApi.uploadFile({
      url: createApiUrl('/v1/files/knowledge', baseUrl),
      filePath,
      name: 'file',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (result) => {
        let payload = result?.data;
        try {
          payload = typeof payload === 'string' ? JSON.parse(payload) : payload;
        } catch (error) {
          finish(reject, new ChatApiError('文件服务返回了无效响应', { code: 'UPLOAD_BAD_RESPONSE' }));
          return;
        }
        if (result?.statusCode < 200 || result?.statusCode >= 300) {
          finish(reject, createApiError(payload, result?.statusCode || 0));
          return;
        }
        finish(resolve, payload);
      },
      fail: (error) => finish(reject, signal?.aborted ? createAbortError() : new Error(error?.errMsg || '文件上传失败')),
    });
    if (settled) return;
    onAbort = () => {
      task?.abort?.();
      finish(reject, createAbortError());
    };
    if (signal?.aborted) onAbort();
    else signal?.addEventListener('abort', onAbort, { once: true });
  });
}
