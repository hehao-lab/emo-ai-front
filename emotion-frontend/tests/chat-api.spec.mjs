import test from 'node:test';
import assert from 'node:assert/strict';

import {
  API_BASE_URL,
  ChatApiError,
  createKnowledgeDocument,
  createStableUserId,
  createUiChatRecord,
  createUiMessage,
  fetchConversationMessages,
  fetchConversations,
  fetchConversationsWithMessages,
  parseSseEvents,
  pollKnowledgeJob,
  sendChatMessage,
  streamChatMessage,
  uploadKnowledgeObject,
} from '../common/chat-api.mjs';
import {
  API_BASE_URL as USER_API_BASE_URL,
  clearAuthTokens,
  fetchEmotionTrendReport,
  fetchLatestSystemVersion,
  fetchPublicSystemConfigs,
  fetchRelationshipHealthReport,
  loginUser,
  registerUser,
  request,
  sendRegisterEmailCode,
} from '../common/user-api.mjs';
import { isRemoteChatId, normalizeChatId } from '../common/chat-id.mjs';

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

test('chat id helpers normalize numeric backend ids before remote checks', () => {
  assert.equal(normalizeChatId(1001), '1001');
  assert.equal(isRemoteChatId(1001), true);
  assert.equal(isRemoteChatId('local-chat-1001'), false);
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

test('register user uses protojson auth contract with camelCase verification code', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({ userId: 3 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  await registerUser({
    username: 'new-user',
    phone: '13800138002',
    email: 'new@example.com',
    password: '123456',
    verificationCode: '337626',
  }, { fetchImpl });

  assert.equal(requests[0].url, 'http://127.0.0.1:8000/v1/users/register');
  assert.equal(requests[0].options.headers.Authorization, undefined);
  assert.equal(requests[0].options.headers['Content-Type'], 'application/protojson');
  assert.equal(requests[0].options.headers.Accept, 'application/protojson');
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    username: 'new-user',
    phone: '13800138002',
    email: 'new@example.com',
    password: '123456',
    verificationCode: '337626',
  });
});

test('request reads Kratos error reason when message is generic', async () => {
  const fetchImpl = async () => new Response(JSON.stringify({
    code: 400,
    reason: 'VERIFICATION_CODE_MISMATCH',
    message: 'Bad Request',
  }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });

  await assert.rejects(
    () => request('/v1/users/register', { method: 'POST', body: {}, fetchImpl }),
    /验证码不正确/,
  );
});

test('fetchEmotionTrendReport calls the backend trends report endpoint', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({ points: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  await fetchEmotionTrendReport({
    startDate: '2026-07-01',
    endDate: '2026-07-31',
  }, {
    baseUrl: 'http://127.0.0.1:8000',
    accessToken: 'token-1',
    fetchImpl,
  });

  assert.equal(requests[0].url, 'http://127.0.0.1:8000/v1/emotion/reports/trends?startDate=2026-07-01&endDate=2026-07-31');
  assert.equal(requests[0].options.method, 'GET');
  assert.equal(requests[0].options.headers.Authorization, 'Bearer token-1');
});

test('fetchLatestSystemVersion calls the backend versions latest endpoint', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({ version: '1.0.1' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  await fetchLatestSystemVersion({ platform: 'web' }, {
    baseUrl: 'http://127.0.0.1:8000',
    accessToken: 'token-1',
    fetchImpl,
  });

  assert.equal(requests[0].url, 'http://127.0.0.1:8000/v1/system/versions/latest?platform=web');
  assert.equal(requests[0].options.method, 'GET');
  assert.equal(requests[0].options.headers.Authorization, 'Bearer token-1');
});

test('fetchPublicSystemConfigs loads database-backed public content', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({
      configs: [{ key: 'privacy.policy', valueJson: '{"summary":"stored"}' }],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const result = await fetchPublicSystemConfigs({
    baseUrl: 'http://127.0.0.1:8000',
    accessToken: 'token-1',
    fetchImpl,
  });

  assert.equal(requests[0].url, 'http://127.0.0.1:8000/v1/system/configs/public');
  assert.equal(requests[0].options.method, 'GET');
  assert.equal(result.configs[0].key, 'privacy.policy');
});

test('fetchRelationshipHealthReport maps backend personal portrait and target reports', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({
      personal_portrait: {
        title: '个人画像',
        summary: '高敏感高投入',
        traits: ['共情', '需要确认', '这是一段很长的性格描述，应该留在正文里而不是变成标签'],
        relationship_pattern: '在不确定时会反复确认',
        risk_notes: ['容易消耗'],
        suggestions: ['先稳定节奏'],
      },
      target_reports: [
        {
          target_id: 42,
          target_name: 'Alex',
          relationship_label: '恋爱对象',
          health_score: 76,
          health_level: 'stable',
          summary: '互动稳定但需要边界',
          evidence: ['最近记录显示冲突可修复'],
          risk_notes: ['避免追问'],
          suggestions: ['用具体请求替代情绪施压'],
          generated_at: '2026-07-06T10:00:00Z',
        },
      ],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const report = await fetchRelationshipHealthReport({
    baseUrl: 'http://127.0.0.1:8000',
    accessToken: 'token-1',
    fetchImpl,
  });

  assert.equal(requests[0].url, 'http://127.0.0.1:8000/v1/emotion/reports/relationship-health');
  assert.equal(requests[0].options.method, 'GET');
  assert.equal(requests[0].options.headers.Authorization, 'Bearer token-1');
  assert.deepEqual(report, {
    personalPortrait: {
      title: '个人画像',
      summary: '高敏感高投入',
      traits: ['共情', '需要确认'],
      relationshipPattern: '在不确定时会反复确认',
      riskNotes: ['容易消耗'],
      suggestions: ['先稳定节奏'],
    },
    targetReports: [
      {
        targetId: '42',
        targetName: 'Alex',
        relationshipLabel: '恋爱对象',
        healthScore: 76,
        healthLevel: 'stable',
        summary: '互动稳定但需要边界',
        evidence: ['最近记录显示冲突可修复'],
        riskNotes: ['避免追问'],
        suggestions: ['用具体请求替代情绪施压'],
        generatedAt: '2026-07-06T10:00:00Z',
      },
    ],
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

test('fetchConversations normalizes numeric session ids to strings', async () => {
  const fetchImpl = async () => new Response(JSON.stringify({
    items: [
      {
        id: 1001,
        title: '数字会话',
        updatedAt: '2026-06-30T10:22:10',
      },
    ],
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

  const records = await fetchConversations({
    baseUrl: 'http://127.0.0.1:8000',
    accessToken: 'token-1',
    fetchImpl,
  });

  assert.equal(records[0].id, '1001');
});

test('fetchConversations maps ProtoJSON numeric timestamps to readable chat times', async () => {
  const fetchImpl = async () => new Response(JSON.stringify({
    sessions: [
      {
        id: 1001,
        title: 'Numeric timestamp chat',
        messageCount: 2,
        lastMessageAt: 1783073209,
        updatedAt: 1783071213,
      },
    ],
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

  const records = await fetchConversations({
    baseUrl: 'http://127.0.0.1:8000',
    accessToken: 'token-1',
    fetchImpl,
  });

  assert.equal(records[0].time, '07/03 18:06');
  assert.equal(records[0].updatedAt, 1783073209);
});

test('fetchConversationsWithMessages hydrates first-load sidebar previews from existing messages', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });

    if (url.endsWith('/v1/chat/sessions?page=1&pageSize=20&status=active')) {
      return new Response(JSON.stringify({
        sessions: [
          {
            id: 1001,
            title: 'Breakup advice',
            messageCount: 2,
            lastMessageAt: 1783073209,
            updatedAt: 1783071213,
          },
        ],
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      messages: [
        {
          id: 'message-1',
          role: 'user',
          content: 'Can we get back together?',
        },
        {
          id: 'message-2',
          role: 'assistant',
          content: 'Start by giving each other space.',
        },
      ],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const records = await fetchConversationsWithMessages({
    baseUrl: 'http://127.0.0.1:8000',
    accessToken: 'token-1',
    fetchImpl,
  });

  assert.equal(requests[1].url, 'http://127.0.0.1:8000/v1/chat/sessions/1001/messages?page=1&pageSize=50');
  assert.equal(records[0].preview, 'Can we get back together?');
  assert.equal(records[0].time, '07/03 18:06');
  assert.equal(records[0].messages.length, 2);
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
    client_request_id: requests[0].options.headers['Idempotency-Key'],
  });
  assert.match(requests[0].options.headers['Idempotency-Key'], /^chat-/);
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

test('parseSseEvents accepts comments, CRLF, and fields without a space', () => {
  const result = parseSseEvents(': keepalive\r\nevent:delta\r\ndata:{"content":"片段"}\r\n\r\n');

  assert.deepEqual(result.events, [{ event: 'delta', data: { content: '片段' } }]);
  assert.equal(result.remainingBuffer, '');
});

test('streamChatMessage preserves structured SSE errors', async () => {
  const encoder = new TextEncoder();
  let errorPayload = null;
  const fetchImpl = async () => new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(
        'event: error\n'
          + 'data: {"code":"MODEL_UNAVAILABLE","detail":"稍后重试","retryable":true}\n\n',
      ));
      controller.close();
    },
  }), { status: 201, headers: { 'Content-Type': 'text/event-stream' } });

  await assert.rejects(
    () => streamChatMessage({
      message: '你好',
      idempotencyKey: 'turn-error-1',
      fetchImpl,
      onError: (payload) => { errorPayload = payload; },
    }),
    (error) => error instanceof ChatApiError
      && error.code === 'MODEL_UNAVAILABLE'
      && error.retryable === true,
  );
  assert.deepEqual(errorPayload, {
    code: 'MODEL_UNAVAILABLE',
    detail: '稍后重试',
    retryable: true,
  });
});

test('streamChatMessage rejects a stream that closes without done or error', async () => {
  const encoder = new TextEncoder();
  const fetchImpl = async () => new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('event: delta\ndata: {"content":"未完成"}\n\n'));
      controller.close();
    },
  }), { status: 201, headers: { 'Content-Type': 'text/event-stream' } });

  await assert.rejects(
    () => streamChatMessage({ message: '你好', idempotencyKey: 'turn-incomplete-1', fetchImpl }),
    (error) => error instanceof ChatApiError && error.code === 'STREAM_INCOMPLETE' && error.retryable,
  );
});

test('knowledge helpers upload an object reference and poll to ready', async () => {
  const uploadRequests = [];
  const uniApi = {
    uploadFile(options) {
      uploadRequests.push(options);
      queueMicrotask(() => options.success({
        statusCode: 201,
        data: JSON.stringify({ objectReference: 's3://knowledge/user/guide.pdf', source: 'guide.pdf' }),
      }));
      return { abort() {} };
    },
  };
  const stored = await uploadKnowledgeObject({
    filePath: 'C:/tmp/guide.pdf',
    accessToken: 'token-1',
    uniApi,
  });
  assert.equal(uploadRequests[0].url, 'http://127.0.0.1:8000/v1/files/knowledge');
  assert.equal(uploadRequests[0].header.Authorization, 'Bearer token-1');
  assert.equal(stored.objectReference, 's3://knowledge/user/guide.pdf');

  const requests = [];
  let pollCount = 0;
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    if (url.endsWith('/api/v1/knowledge/documents')) {
      return new Response(JSON.stringify({ id: 'doc-1', status: 'queued', jobId: 'job-1' }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    pollCount += 1;
    return new Response(JSON.stringify({
      id: 'job-1',
      status: pollCount === 1 ? 'embedding' : 'ready',
      progress: pollCount === 1 ? 50 : 100,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const accepted = await createKnowledgeDocument({
    title: 'Guide',
    source: stored.source,
    objectReference: stored.objectReference,
  }, { fetchImpl, accessToken: 'token-1' });
  const statuses = [];
  const job = await pollKnowledgeJob(accepted.jobId, {
    fetchImpl,
    accessToken: 'token-1',
    intervalMs: 0,
    waitImpl: async () => {},
    onProgress: (payload) => statuses.push(payload.status),
  });

  assert.deepEqual(JSON.parse(requests[0].options.body), {
    title: 'Guide',
    source: 'guide.pdf',
    objectReference: 's3://knowledge/user/guide.pdf',
    metadataJson: '{}',
  });
  assert.deepEqual(statuses, ['embedding', 'ready']);
  assert.equal(job.status, 'ready');
});

test('markdown renderer converts assistant markdown into rich text nodes', async () => {
  const { renderMarkdownNodes } = await import('../common/markdown-render.mjs');
  const nodes = renderMarkdownNodes([
    '### Analysis result',
    'Please stay **calm** and answer with `short` messages.',
    '- Do not chase',
    '- Talk tomorrow',
  ].join('\n'));

  const collectNames = (items) => items.flatMap((item) => [
    item.name,
    ...collectNames(item.children || []),
  ]).filter(Boolean);
  const collectText = (items) => items.flatMap((item) => [
    item.text || '',
    ...collectText(item.children || []),
  ]).join('');
  const names = collectNames(nodes);
  const visibleText = collectText(nodes);

  assert.equal(names.includes('h3'), true);
  assert.equal(names.includes('p'), true);
  assert.equal(names.includes('strong'), true);
  assert.equal(names.includes('code'), true);
  assert.equal(names.includes('ul'), true);
  assert.equal(names.includes('li'), true);
  assert.equal(visibleText.includes('###'), false);
  assert.equal(visibleText.includes('**'), false);
  assert.equal(visibleText.includes('- Do not chase'), false);
});

test('markdown renderer identifies knowledge citations in assistant text', async () => {
  const { renderMarkdownNodes } = await import('../common/markdown-render.mjs');
  const nodes = renderMarkdownNodes('请查看这段说明 [K1] 后再决定。');
  const collectClasses = (items) => items.flatMap((item) => [
    item.attrs?.class || '',
    ...collectClasses(item.children || []),
  ]);

  assert.equal(collectClasses(nodes).includes('markdown-citation'), true);
});

test('home chat time helpers format live time and gate user message timestamps', async () => {
  const {
    CHAT_TIME_SEPARATOR_INTERVAL,
    createTimedUserMessage,
    formatClockTime,
    shouldShowMessageTime,
  } = await import('../common/chat-time.mjs');
  const firstSentAt = Date.parse('2026-07-03T09:05:00');
  const secondSentAt = firstSentAt + (10 * 60 * 1000);
  const thirdSentAt = firstSentAt + CHAT_TIME_SEPARATOR_INTERVAL;
  const firstMessage = createTimedUserMessage({
    chatId: 'chat-1',
    content: 'first',
    sentAt: firstSentAt,
  });
  const secondMessage = createTimedUserMessage({
    chatId: 'chat-1',
    content: 'second',
    sentAt: secondSentAt,
    previousUserMessage: firstMessage,
  });
  const thirdMessage = createTimedUserMessage({
    chatId: 'chat-1',
    content: 'third',
    sentAt: thirdSentAt,
    previousUserMessage: firstMessage,
  });

  assert.equal(formatClockTime(new Date('2026-07-03T09:05:00')), '09:05');
  assert.equal(shouldShowMessageTime({ sentAt: firstSentAt, previousUserMessage: null }), true);
  assert.equal(shouldShowMessageTime({ sentAt: secondSentAt, previousUserMessage: firstMessage }), false);
  assert.equal(shouldShowMessageTime({ sentAt: thirdSentAt, previousUserMessage: firstMessage }), true);
  assert.equal(firstMessage.timeLabel, '09:05');
  assert.equal(firstMessage.showTime, true);
  assert.equal(secondMessage.showTime, false);
  assert.equal(thirdMessage.timeLabel, '09:35');
  assert.equal(thirdMessage.showTime, true);
});
