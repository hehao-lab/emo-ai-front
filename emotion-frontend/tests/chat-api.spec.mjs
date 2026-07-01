import test from 'node:test';
import assert from 'node:assert/strict';

import {
  API_BASE_URL,
  createStableUserId,
  createUiChatRecord,
  createUiMessage,
  fetchConversationMessages,
  fetchConversations,
  parseSseEvents,
  sendChatMessage,
  streamChatMessage,
} from '../common/chat-api.mjs';
import {
  API_BASE_URL as USER_API_BASE_URL,
  clearAuthTokens,
  loginUser,
  request,
  sendRegisterEmailCode,
} from '../common/user-api.mjs';

function installLocalStorage() {
  const storage = new Map();
  const previousStorage = globalThis.localStorage;

  globalThis.localStorage = {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  };

  return () => {
    clearAuthTokens();

    if (previousStorage === undefined) {
      delete globalThis.localStorage;
      return;
    }

    globalThis.localStorage = previousStorage;
  };
}

test('default API base URL points to local backend port 8000', () => {
  assert.equal(API_BASE_URL, 'http://127.0.0.1:8000');
  assert.equal(USER_API_BASE_URL, 'http://127.0.0.1:8000');
});

test('createStableUserId returns a stable ios user id when storage is available', () => {
  const storage = new Map();
  const storageApi = {
    getStorageSync: (key) => storage.get(key),
    setStorageSync: (key, value) => storage.set(key, value),
  };

  const firstUserId = createStableUserId(storageApi);
  const secondUserId = createStableUserId(storageApi);

  assert.match(firstUserId, /^ios-user-/);
  assert.equal(secondUserId, firstUserId);
  assert.equal(storage.get('emotion-ai-user-id'), firstUserId);
});

test('login stores tokens and authenticated requests send Bearer token', async () => {
  const restoreStorage = installLocalStorage();
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });

    if (url.endsWith('/v1/users/login')) {
      return new Response(JSON.stringify({
        accessToken: 'access-token-1',
        refreshToken: 'refresh-token-1',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ id: 1 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    await loginUser({
      phone: '13800138000',
      password: '123456',
    }, { fetchImpl });
    await request('/v1/users/me', { fetchImpl });

    assert.equal(requests[0].url, 'http://127.0.0.1:8000/v1/users/login');
    assert.equal(requests[0].options.headers.Authorization, undefined);
    assert.deepEqual(JSON.parse(requests[0].options.body), {
      phone: '13800138000',
      password: '123456',
    });
    assert.equal(requests[1].options.headers.Authorization, 'Bearer access-token-1');
  } finally {
    restoreStorage();
  }
});

test('register email code endpoint uses camelCase auth contract', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  await sendRegisterEmailCode('test@example.com', { fetchImpl });

  assert.equal(requests[0].url, 'http://127.0.0.1:8000/v1/users/register/email-code');
  assert.equal(requests[0].options.headers.Authorization, undefined);
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    email: 'test@example.com',
  });
});

test('fetchConversations sends Bearer token and maps chat sessions to records', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({
      items: [
        {
          id: 'session-1',
          title: '测试会话',
          createdAt: '2026-06-30T10:20:30',
          updatedAt: '2026-06-30T10:22:10',
        },
      ],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const records = await fetchConversations({
    baseUrl: 'http://127.0.0.1:8000',
    accessToken: 'token-1',
    fetchImpl,
  });

  assert.equal(requests[0].url, 'http://127.0.0.1:8000/v1/chat/sessions?page=1&pageSize=20&status=active');
  assert.equal(requests[0].options.method, 'GET');
  assert.equal(requests[0].options.headers.Authorization, 'Bearer token-1');
  assert.deepEqual(records, [
    {
      id: 'session-1',
      title: '测试会话',
      preview: '暂无消息',
      time: '06/30 10:22',
      updatedAt: '2026-06-30T10:22:10',
      messages: [],
    },
  ]);
});

test('fetchConversationMessages maps assistant role to the existing ai UI role', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({
      items: [
        {
          id: 'message-1',
          role: 'user',
          content: '你好',
        },
        {
          id: 'message-2',
          role: 'assistant',
          content: '你好，有什么可以帮你？',
        },
      ],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const messages = await fetchConversationMessages('session-1', {
    baseUrl: 'http://127.0.0.1:8000',
    accessToken: 'token-1',
    fetchImpl,
  });

  assert.equal(requests[0].url, 'http://127.0.0.1:8000/v1/chat/sessions/session-1/messages?page=1&pageSize=50');
  assert.deepEqual(messages, [
    { id: 'message-1', role: 'user', content: '你好' },
    { id: 'message-2', role: 'ai', content: '你好，有什么可以帮你？' },
  ]);
});

test('sendChatMessage posts to ordinary chat endpoint', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({
      conversation_id: 'session-1',
      content: '普通回复',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  await sendChatMessage({
    conversationId: 'session-1',
    message: '你好',
    baseUrl: 'http://127.0.0.1:8000',
    accessToken: 'token-1',
    fetchImpl,
  });

  assert.equal(requests[0].url, 'http://127.0.0.1:8000/api/v1/chat');
  assert.equal(requests[0].options.headers.Authorization, 'Bearer token-1');
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    conversation_id: 'session-1',
    message: '你好',
    system_prompt: null,
  });
});

test('parseSseEvents keeps incomplete trailing chunks for the next read', () => {
  const result = parseSseEvents(
    'event: delta\ndata: {"content":"这是"}\n\n'
      + 'event: done\ndata: {"conversation_id":"session-1"',
  );

  assert.deepEqual(result.events, [
    { event: 'delta', data: { content: '这是' } },
  ]);
  assert.equal(result.remainingBuffer, 'event: done\ndata: {"conversation_id":"session-1"');
});

test('streamChatMessage posts to /api/v1/chat/stream and emits delta and done callbacks', async () => {
  const encoder = new TextEncoder();
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event: delta\ndata: {"content":"你好"}\n\n'));
        controller.enqueue(encoder.encode('event: delta\ndata: {"content":"呀"}\n\n'));
        controller.enqueue(encoder.encode(
          'event: done\n'
            + 'data: {"conversation_id":"session-1","assistant_message_id":"assistant-1","content":"你好呀"}\n\n',
        ));
        controller.close();
      },
    }), {
      status: 201,
      headers: { 'Content-Type': 'text/event-stream' },
    });
  };
  const deltas = [];
  let donePayload = null;

  await streamChatMessage({
    conversationId: null,
    message: '你好',
    baseUrl: 'http://127.0.0.1:8000',
    accessToken: 'token-1',
    fetchImpl,
    onDelta: (content) => deltas.push(content),
    onDone: (payload) => {
      donePayload = payload;
    },
  });

  assert.equal(requests[0].url, 'http://127.0.0.1:8000/api/v1/chat/stream');
  assert.equal(requests[0].options.method, 'POST');
  assert.equal(requests[0].options.headers.Accept, 'text/event-stream');
  assert.equal(requests[0].options.headers.Authorization, 'Bearer token-1');
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    conversation_id: null,
    message: '你好',
    system_prompt: null,
  });
  assert.deepEqual(deltas, ['你好', '呀']);
  assert.deepEqual(donePayload, {
    conversation_id: 'session-1',
    assistant_message_id: 'assistant-1',
    content: '你好呀',
  });
});

test('chat api helpers expose UI record and message mappers for the page shell', () => {
  assert.deepEqual(createUiMessage({
    id: 'assistant-1',
    role: 'assistant',
    content: '回答',
  }), {
    id: 'assistant-1',
    role: 'ai',
    content: '回答',
  });

  assert.deepEqual(createUiChatRecord({
    id: 'session-1',
    title: '标题',
    updatedAt: '2026-06-30T10:22:10',
  }), {
    id: 'session-1',
    title: '标题',
    preview: '暂无消息',
    time: '06/30 10:22',
    updatedAt: '2026-06-30T10:22:10',
    messages: [],
  });
});
