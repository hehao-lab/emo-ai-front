import { API_BASE_URL, getAccessToken } from './user-api.mjs';

const USER_ID_STORAGE_KEY = 'emotion-ai-user-id';

export { API_BASE_URL };

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
} = {}) {
  const requestFetch = normalizeFetch(fetchImpl);
  const response = await requestFetch(createApiUrl(path, baseUrl), {
    method,
    headers: buildJsonHeaders({ accessToken }),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(payload, response.status));
  }

  return payload;
}

function getPayloadItems(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload?.items || payload?.sessions || payload?.messages || payload?.data || [];
}

function formatConversationTime(value) {
  if (!value) {
    return '';
  }

  const normalizedValue = String(value).includes('T') ? value : String(value).replace(' ', 'T');
  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');

  return `${month}/${day} ${hour}:${minute}`;
}

export function createUiMessage(message) {
  return {
    id: message.id || message.messageId,
    role: message.role === 'assistant' ? 'ai' : message.role,
    content: message.content || '',
  };
}

export function createUiChatRecord(session, messages = []) {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user');
  const latestMessage = messages[messages.length - 1];
  const updatedAt = session.updatedAt || session.updated_at || session.createdAt || session.created_at || '';

  return {
    id: session.id || session.sessionId,
    title: session.title || '新对话',
    preview: latestUserMessage?.content || latestMessage?.content || session.preview || '暂无消息',
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

export async function sendChatMessage({
  conversationId,
  message,
  systemPrompt = null,
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
      system_prompt: systemPrompt,
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
  const normalizedBuffer = buffer.replace(/\r\n/g, '\n');
  const chunks = normalizedBuffer.split('\n\n');
  const remainingBuffer = chunks.pop() || '';
  const events = [];

  for (const rawEvent of chunks) {
    const lines = rawEvent.split('\n');
    const eventLine = lines.find((line) => line.startsWith('event: '));
    const dataLines = lines.filter((line) => line.startsWith('data: '));

    if (!eventLine || dataLines.length === 0) {
      continue;
    }

    const event = eventLine.slice('event: '.length);
    const data = parseDataLine(dataLines.map((line) => line.slice('data: '.length)).join('\n'));

    if (!data) {
      continue;
    }

    events.push({ event, data });
  }

  return { events, remainingBuffer };
}

function handleSseEvent({ event, data }, callbacks) {
  if (event === 'delta') {
    callbacks.onDelta?.(data.content || '');
    return;
  }

  if (event === 'done') {
    callbacks.onDone?.(data);
    return;
  }

  if (event === 'error') {
    callbacks.onError?.(data.detail || data.message || 'AI 服务异常');
  }
}

export async function streamChatMessage({
  conversationId,
  message,
  systemPrompt = null,
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
      },
    }),
    body: JSON.stringify({
      conversation_id: conversationId || null,
      message,
      system_prompt: systemPrompt,
    }),
  });
  const errorPayload = response.ok ? null : await readJson(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(errorPayload, response.status));
  }

  if (!response.body?.getReader) {
    throw new Error('当前运行环境不支持流式读取');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    const result = parseSseEvents(buffer);
    buffer = result.remainingBuffer;

    for (const event of result.events) {
      handleSseEvent(event, { onDelta, onDone, onError });
    }
  }

  buffer += decoder.decode();

  if (buffer.trim()) {
    const result = parseSseEvents(`${buffer}\n\n`);

    for (const event of result.events) {
      handleSseEvent(event, { onDelta, onDone, onError });
    }
  }
}
