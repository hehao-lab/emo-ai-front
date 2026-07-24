import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createDiary,
  normalizeDiaryOccurredOn,
  updateDiary,
} from '../common/user-api.mjs';

test('diary dates normalize backend timestamps to calendar date keys', () => {
  assert.equal(normalizeDiaryOccurredOn('2026-07-24T00:00:00+08:00'), '2026-07-24');
  assert.equal(normalizeDiaryOccurredOn('2026-07-24'), '2026-07-24');
  assert.equal(normalizeDiaryOccurredOn(''), '');
});

test('diary create and update requests match the backend HTTP contract', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({
      id: 9,
      content: 'stored diary',
      occurredOn: '2026-07-24',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  const payload = {
    title: '2026-07-24 心情日记',
    content: 'stored diary',
    occurredOn: '2026-07-24',
    visibility: 'private',
  };

  await createDiary(payload, {
    baseUrl: 'http://127.0.0.1:8000',
    accessToken: 'token-1',
    fetchImpl,
  });
  await updateDiary(9, payload, {
    baseUrl: 'http://127.0.0.1:8000',
    accessToken: 'token-1',
    fetchImpl,
  });

  assert.equal(requests[0].url, 'http://127.0.0.1:8000/v1/diaries');
  assert.equal(requests[0].options.method, 'POST');
  assert.equal(requests[0].options.headers['Content-Type'], 'application/protojson');
  assert.equal(requests[1].url, 'http://127.0.0.1:8000/v1/diaries/9');
  assert.equal(requests[1].options.method, 'PATCH');
  assert.equal(requests[1].options.headers['Content-Type'], 'application/protojson');
  assert.deepEqual(JSON.parse(requests[1].options.body), payload);
});
