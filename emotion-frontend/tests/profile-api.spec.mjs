import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createUiUserProfile,
  createImportantRecord,
  fetchCurrentUserProfile,
  fetchImportantRecords,
  fetchPersonalProfile,
  fetchTargetProfiles,
  savePersonalProfile,
  saveTargetProfile,
  updateCurrentUserAvatar,
  updateCurrentUserProfile,
  uploadCurrentUserAvatar,
  updateImportantRecord,
} from '../common/profile-api.mjs';

test('profile api fetches and updates current user display name and avatar', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });

    if (url.endsWith('/v1/users/me') && options.method === 'GET') {
      return new Response(JSON.stringify({
        user_id: 7,
        username: 'account-name',
        avatar_url: '/avatars/old.png',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.endsWith('/v1/users/me/profile') && options.method === 'PATCH') {
      return new Response(JSON.stringify({
        user_id: 7,
        username: 'account-name',
        nickname: 'new-name',
        avatar_url: '/avatars/old.png',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.endsWith('/v1/users/me/avatar') && options.method === 'PUT') {
      return new Response(JSON.stringify({
        user_id: 7,
        username: 'account-name',
        nickname: 'new-name',
        avatar_url: '/avatars/new.png',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({}), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const profile = await fetchCurrentUserProfile({
    baseUrl: 'http://127.0.0.1:8000',
    accessToken: 'token-1',
    fetchImpl,
  });
  const renamedProfile = await updateCurrentUserProfile({ nickname: 'new-name' }, {
    baseUrl: 'http://127.0.0.1:8000',
    accessToken: 'token-1',
    fetchImpl,
  });
  const avatarProfile = await updateCurrentUserAvatar('/avatars/new.png', {
    baseUrl: 'http://127.0.0.1:8000',
    accessToken: 'token-1',
    fetchImpl,
  });

  assert.equal(requests[0].url, 'http://127.0.0.1:8000/v1/users/me');
  assert.equal(requests[0].options.method, 'GET');
  assert.equal(requests[0].options.headers.Authorization, 'Bearer token-1');
  assert.equal(profile.displayName, 'account-name');
  assert.equal(profile.avatarUrl, '/avatars/old.png');

  assert.equal(requests[1].url, 'http://127.0.0.1:8000/v1/users/me/profile');
  assert.equal(requests[1].options.method, 'PATCH');
  assert.equal(requests[1].options.headers['Content-Type'], 'application/protojson');
  assert.deepEqual(JSON.parse(requests[1].options.body), { nickname: 'new-name' });
  assert.equal(renamedProfile.displayName, 'new-name');

  assert.equal(requests[2].url, 'http://127.0.0.1:8000/v1/users/me/avatar');
  assert.equal(requests[2].options.method, 'PUT');
  assert.equal(requests[2].options.headers['Content-Type'], 'application/protojson');
  assert.deepEqual(JSON.parse(requests[2].options.body), { avatarUrl: '/avatars/new.png' });
  assert.equal(avatarProfile.avatarUrl, '/avatars/new.png');
});

test('profile api drops temporary blob avatar urls before rendering user profile', () => {
  const profile = createUiUserProfile({
    user_id: 7,
    username: 'account-name',
    avatar_url: 'blob:http://localhost:5173/117f9eff-6f97-4d20-9e0f-3aa448d82e7e',
  });

  assert.equal(profile.avatarUrl, '');
});

test('profile api uploads a selected avatar before saving its public URL', async () => {
  let uploadOptions;
  const uploaded = await uploadCurrentUserAvatar('wxfile://avatar.png', {
    baseUrl: 'http://127.0.0.1:8000',
    accessToken: 'token-1',
    uploadFileImpl: (options) => {
      uploadOptions = options;
      options.success({
        statusCode: 201,
        data: JSON.stringify({
          provider: 'minio',
          objectKey: 'avatars/7/20260723/avatar.png',
          publicUrl: 'http://127.0.0.1:9000/emotion-avatars/avatars/7/20260723/avatar.png',
        }),
      });
    },
  });

  assert.equal(uploadOptions.url, 'http://127.0.0.1:8000/v1/files/avatar');
  assert.equal(uploadOptions.filePath, 'wxfile://avatar.png');
  assert.equal(uploadOptions.name, 'file');
  assert.equal(uploadOptions.header.Authorization, 'Bearer token-1');
  assert.equal(uploaded.provider, 'minio');
});

test('profile api saves personal profile through authenticated profile endpoint', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({
      id: '11',
      userId: '7',
      age: 26,
      gender: 'female',
      mbti: 'INFP',
      relationshipStatus: 'dating',
      personalitySummary: 'sensitive',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const profile = await savePersonalProfile({
    age: 26,
    gender: 'female',
    mbti: 'INFP',
    relationshipStatus: 'dating',
    personalitySummary: 'sensitive',
  }, {
    baseUrl: 'http://127.0.0.1:8000',
    accessToken: 'token-1',
    fetchImpl,
  });

  assert.equal(requests[0].url, 'http://127.0.0.1:8000/v1/profiles/personal');
  assert.equal(requests[0].options.method, 'PUT');
  assert.equal(requests[0].options.headers['Content-Type'], 'application/protojson');
  assert.equal(requests[0].options.headers.Authorization, 'Bearer token-1');
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    age: 26,
    gender: 'female',
    mbti: 'INFP',
    relationshipStatus: 'dating',
    personalitySummary: 'sensitive',
  });
  assert.equal(profile.id, '11');
  assert.equal(profile.userId, '7');
});

test('profile api exposes target profiles and important records bound to a target', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });

    if (url.endsWith('/v1/profiles/personal')) {
      return new Response(JSON.stringify({ id: '11', age: 26 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.endsWith('/v1/profiles/targets') && options.method === 'GET') {
      return new Response(JSON.stringify({
        targets: [{ id: '21', personalProfileId: '11', name: 'Alex', mbti: 'INFJ' }],
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.endsWith('/v1/profiles/targets') && options.method === 'POST') {
      return new Response(JSON.stringify({
        id: '22',
        personalProfileId: '11',
        name: 'Taylor',
        mbti: 'ENFP',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.endsWith('/v1/profiles/important-records?targetId=22') && options.method === 'GET') {
      return new Response(JSON.stringify({
        records: [{ id: '31', targetProfileId: '22', title: 'first talk' }],
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.endsWith('/v1/profiles/important-records') && options.method === 'POST') {
      return new Response(JSON.stringify({
        id: '32',
        personalProfileId: '11',
        targetProfileId: '22',
        title: 'conflict',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.endsWith('/v1/profiles/important-records/32') && options.method === 'PUT') {
      return new Response(JSON.stringify({
        id: '32',
        personalProfileId: '11',
        targetProfileId: '22',
        title: 'conflict updated',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({}), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const personal = await fetchPersonalProfile({ fetchImpl });
  const targets = await fetchTargetProfiles({ fetchImpl });
  const target = await saveTargetProfile({ name: 'Taylor', mbti: 'ENFP' }, { fetchImpl });
  const records = await fetchImportantRecords({ targetId: target.id, fetchImpl });
  const created = await createImportantRecord({
    targetProfileId: target.id,
    title: 'conflict',
  }, { fetchImpl });
  const updated = await updateImportantRecord(created.id, {
    targetProfileId: target.id,
    title: 'conflict updated',
  }, { fetchImpl });

  assert.equal(personal.id, '11');
  assert.equal(targets[0].id, '21');
  assert.equal(targets[0].mbti, 'INFJ');
  assert.equal(target.id, '22');
  assert.equal(target.mbti, 'ENFP');
  assert.equal(records[0].targetProfileId, '22');
  assert.equal(created.personalProfileId, '11');
  assert.equal(updated.title, 'conflict updated');
  assert.equal(requests[2].options.headers['Content-Type'], 'application/protojson');
  assert.deepEqual(JSON.parse(requests[2].options.body), {
    name: 'Taylor',
    mbti: 'ENFP',
  });
  assert.equal(requests[4].options.headers['Content-Type'], 'application/protojson');
  assert.deepEqual(JSON.parse(requests[4].options.body), {
    targetProfileId: '22',
    title: 'conflict',
  });
  assert.equal(requests[5].options.headers['Content-Type'], 'application/protojson');
  assert.equal(requests[3].url, 'http://127.0.0.1:8000/v1/profiles/important-records?targetId=22');
});

test('profile api omits empty target id when creating a target profile', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({
      id: '23',
      name: 'Jordan',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  await saveTargetProfile({
    id: '',
    name: 'Jordan',
    age: 29,
    gender: 'female',
    mbti: 'INTJ',
  }, { fetchImpl });

  assert.equal(requests[0].url, 'http://127.0.0.1:8000/v1/profiles/targets');
  assert.equal(requests[0].options.method, 'POST');
  assert.equal(requests[0].options.headers['Content-Type'], 'application/protojson');
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    name: 'Jordan',
    age: 29,
    gender: 'female',
    mbti: 'INTJ',
  });
});

test('profile api omits empty record id when creating an important record', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({
      id: '33',
      targetProfileId: '22',
      title: 'new record',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  await createImportantRecord({
    id: '',
    targetProfileId: '22',
    title: 'new record',
    eventDescription: 'details',
  }, { fetchImpl });

  assert.equal(requests[0].url, 'http://127.0.0.1:8000/v1/profiles/important-records');
  assert.equal(requests[0].options.method, 'POST');
  assert.equal(requests[0].options.headers['Content-Type'], 'application/protojson');
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    targetProfileId: '22',
    title: 'new record',
    eventDescription: 'details',
  });
});
