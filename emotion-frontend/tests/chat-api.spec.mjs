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
  streamChatMessage,
} from '../common/chat-api.mjs';

test('default API base URL points to the configured LAN backend', () => {
  assert.equal(API_BASE_URL, 'http://192.168.31.155:8000');
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

test('fetchConversations sends X-User-Id and maps backend conversations to chat records', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({
      items: [
        {
          id: 'conversation-1',
          title: '测试会话',
          created_at: '2026-06-30T10:20:30',
          updated_at: '2026-06-30T10:22:10',
        },
      ],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const records = await fetchConversations({
    baseUrl: 'http://127.0.0.1:8000',
    userId: 'ios-user-1',
    fetchImpl,
  });

  assert.equal(requests[0].url, 'http://127.0.0.1:8000/api/v1/conversations');
  assert.equal(requests[0].options.method, 'GET');
  assert.equal(requests[0].options.headers['X-User-Id'], 'ios-user-1');
  assert.deepEqual(records, [
    {
      id: 'conversation-1',
      title: '测试会话',
      preview: '暂无消息',
      time: '06/30 10:22',
      updatedAt: '2026-06-30T10:22:10',
      messages: [],
    },
  ]);
});

test('fetchConversationMessages maps assistant role to the existing ai UI role', async () => {
  const fetchImpl = async () => new Response(JSON.stringify({
    items: [
      {
        id: 'message-1',
        conversation_id: 'conversation-1',
        role: 'user',
        content: '你好',
        sequence: 1,
        model_name: null,
        created_at: '2026-06-30T10:20:30',
      },
      {
        id: 'message-2',
        conversation_id: 'conversation-1',
        role: 'assistant',
        content: '你好，有什么可以帮你？',
        sequence: 2,
        model_name: 'gpt-5.5',
        created_at: '2026-06-30T10:20:35',
      },
    ],
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

  const messages = await fetchConversationMessages('conversation-1', {
    baseUrl: 'http://127.0.0.1:8000',
    userId: 'ios-user-1',
    fetchImpl,
  });

  assert.deepEqual(messages, [
    { id: 'message-1', role: 'user', content: '你好' },
    { id: 'message-2', role: 'ai', content: '你好，有什么可以帮你？' },
  ]);
});

test('parseSseEvents keeps incomplete trailing chunks for the next read', () => {
  const result = parseSseEvents(
    'event: delta\ndata: {"content":"这是"}\n\n'
      + 'event: done\ndata: {"conversation_id":"conversation-1"',
  );

  assert.deepEqual(result.events, [
    { event: 'delta', data: { content: '这是' } },
  ]);
  assert.equal(result.remainingBuffer, 'event: done\ndata: {"conversation_id":"conversation-1"');
});

test('streamChatMessage posts to /chat/stream and emits delta and done callbacks', async () => {
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
            + 'data: {"conversation_id":"conversation-1","assistant_message_id":"assistant-1","content":"你好呀"}\n\n',
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
    userId: 'ios-user-1',
    fetchImpl,
    onDelta: (content) => deltas.push(content),
    onDone: (payload) => {
      donePayload = payload;
    },
  });

  assert.equal(requests[0].url, 'http://127.0.0.1:8000/api/v1/chat/stream');
  assert.equal(requests[0].options.method, 'POST');
  assert.equal(requests[0].options.headers.Accept, 'text/event-stream');
  assert.equal(requests[0].options.headers['X-User-Id'], 'ios-user-1');
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    conversation_id: null,
    message: '你好',
    system_prompt: null,
  });
  assert.deepEqual(deltas, ['你好', '呀']);
  assert.deepEqual(donePayload, {
    conversation_id: 'conversation-1',
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
    id: 'conversation-1',
    title: '标题',
    updated_at: '2026-06-30T10:22:10',
  }), {
    id: 'conversation-1',
    title: '标题',
    preview: '暂无消息',
    time: '06/30 10:22',
    updatedAt: '2026-06-30T10:22:10',
    messages: [],
  });
});
