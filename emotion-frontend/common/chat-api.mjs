const USER_ID_STORAGE_KEY = 'emotion-ai-user-id';
const DEFAULT_API_BASE_URL = 'http://192.168.31.155:8000';
const viteEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

export const API_BASE_URL = viteEnv.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
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

function buildJsonHeaders(userId, extraHeaders = {}) {
  return {
    'Content-Type': 'application/json',
    'X-User-Id': userId,
    ...extraHeaders,
  };
}

async function readErrorMessage(response) {
  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    return `请求失败：${response.status}`;
  }

  if (typeof payload?.detail === 'string') {
    return payload.detail;
  }

  if (Array.isArray(payload?.detail) && payload.detail[0]?.msg) {
    return payload.detail[0].msg;
  }

  return `请求失败：${response.status}`;
}

async function requestJson(path, { baseUrl = API_BASE_URL, userId, fetchImpl, method = 'GET', body } = {}) {
  const requestFetch = normalizeFetch(fetchImpl);
  const response = await requestFetch(createApiUrl(path, baseUrl), {
    method,
    headers: buildJsonHeaders(userId),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

function formatConversationTime(value) {
  if (!value) {
    return '';
  }

  const normalizedValue = value.includes('T') ? value : value.replace(' ', 'T');
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
    id: message.id,
    role: message.role === 'assistant' ? 'ai' : message.role,
    content: message.content,
  };
}

export function createUiChatRecord(conversation, messages = []) {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user');
  const latestMessage = messages[messages.length - 1];

  return {
    id: conversation.id,
    title: conversation.title || '新对话',
    preview: latestUserMessage?.content || latestMessage?.content || '暂无消息',
    time: formatConversationTime(conversation.updated_at || conversation.created_at),
    updatedAt: conversation.updated_at || conversation.created_at || '',
    messages,
  };
}

export async function fetchConversations(options = {}) {
  const payload = await requestJson('/api/v1/conversations', options);

  return (payload.items || []).map((conversation) => createUiChatRecord(conversation));
}

export async function fetchConversationMessages(conversationId, options = {}) {
  const payload = await requestJson(`/api/v1/conversations/${conversationId}/messages`, options);

  return (payload.items || []).map(createUiMessage);
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
    callbacks.onError?.(data.detail || 'AI 服务异常');
  }
}

export async function streamChatMessage({
  conversationId,
  message,
  systemPrompt = null,
  baseUrl = API_BASE_URL,
  userId,
  fetchImpl,
  onDelta,
  onDone,
  onError,
} = {}) {
  const requestFetch = normalizeFetch(fetchImpl);
  const response = await requestFetch(createApiUrl('/api/v1/chat/stream', baseUrl), {
    method: 'POST',
    headers: buildJsonHeaders(userId, {
      Accept: 'text/event-stream',
    }),
    body: JSON.stringify({
      conversation_id: conversationId || null,
      message,
      system_prompt: systemPrompt,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
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
