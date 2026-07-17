import { request } from './user-api.mjs';

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

function normalizeId(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value);
}

function normalizeTimestamp(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'number') {
    return value > 1000000000000
      ? new Date(value).toISOString()
      : new Date(value * 1000).toISOString();
  }

  return String(value);
}

export function isTemporaryAvatarUrl(value) {
  const avatarUrl = String(value || '').trim();

  return avatarUrl.startsWith('blob:')
    || avatarUrl.startsWith('data:')
    || avatarUrl.startsWith('wxfile:')
    || avatarUrl.startsWith('http://tmp/')
    || avatarUrl.startsWith('https://tmp/');
}

function normalizeAvatarUrl(value) {
  const avatarUrl = String(value || '').trim();

  return isTemporaryAvatarUrl(avatarUrl) ? '' : avatarUrl;
}

export function createUiUserProfile(profile = {}) {
  const username = profile.username || '';
  const nickname = profile.nickname || profile.nickName || profile.nick_name || '';

  return {
    userId: normalizeId(profile.userId ?? profile.user_id),
    username,
    nickname,
    displayName: nickname || username,
    avatarUrl: normalizeAvatarUrl(profile.avatarUrl || profile.avatar_url || profile.avatar),
    phone: profile.phone || '',
    email: profile.email || '',
    roles: Array.isArray(profile.roles) ? profile.roles : [],
    createdAt: normalizeTimestamp(profile.createdAt ?? profile.created_at),
    updatedAt: normalizeTimestamp(profile.updatedAt ?? profile.updated_at),
  };
}

export function createUiPersonalProfile(profile = {}) {
  return {
    id: normalizeId(profile.id),
    userId: normalizeId(profile.userId ?? profile.user_id),
    age: Number(profile.age || 0),
    gender: profile.gender || '',
    mbti: profile.mbti || profile.MBTI || '',
    relationshipStatus: profile.relationshipStatus || profile.relationship_status || '',
    personalitySummary: profile.personalitySummary || profile.personality_summary || '',
    createdAt: normalizeTimestamp(profile.createdAt ?? profile.created_at),
    updatedAt: normalizeTimestamp(profile.updatedAt ?? profile.updated_at),
  };
}

export function createUiTargetProfile(target = {}) {
  return {
    id: normalizeId(target.id),
    userId: normalizeId(target.userId ?? target.user_id),
    personalProfileId: normalizeId(target.personalProfileId ?? target.personal_profile_id),
    name: target.name || '',
    age: Number(target.age || 0),
    gender: target.gender || '',
    mbti: target.mbti || target.MBTI || '',
    currentRelationship: target.currentRelationship || target.current_relationship || '',
    interactionFrequency: target.interactionFrequency || target.interaction_frequency || '',
    relationshipGoal: target.relationshipGoal || target.relationship_goal || '',
    personalityTraits: target.personalityTraits || target.personality_traits || '',
    recentInteraction: target.recentInteraction || target.recent_interaction || '',
    createdAt: normalizeTimestamp(target.createdAt ?? target.created_at),
    updatedAt: normalizeTimestamp(target.updatedAt ?? target.updated_at),
  };
}

export function createUiImportantRecord(record = {}) {
  return {
    id: normalizeId(record.id),
    userId: normalizeId(record.userId ?? record.user_id),
    personalProfileId: normalizeId(record.personalProfileId ?? record.personal_profile_id),
    targetProfileId: normalizeId(record.targetProfileId ?? record.target_profile_id),
    title: record.title || '',
    recordTime: record.recordTime || record.record_time || '',
    eventDescription: record.eventDescription || record.event_description || '',
    resolution: record.resolution || '',
    concernPoint: record.concernPoint || record.concern_point || '',
    satisfaction: record.satisfaction || '',
    createdAt: normalizeTimestamp(record.createdAt ?? record.created_at),
    updatedAt: normalizeTimestamp(record.updatedAt ?? record.updated_at),
  };
}

function getItems(payload, key) {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload?.[key] || payload?.items || [];
}

export async function fetchCurrentUserProfile(options = {}) {
  const payload = await request('/v1/users/me', options);
  return createUiUserProfile(payload || {});
}

export async function updateCurrentUserProfile(profile = {}, options = {}) {
  const payload = await request('/v1/users/me/profile', {
    ...options,
    method: 'PATCH',
    contentType: 'application/protojson',
    body: profile,
  });
  return createUiUserProfile(payload || {});
}

export async function updateCurrentUserAvatar(avatarUrl, options = {}) {
  const payload = await request('/v1/users/me/avatar', {
    ...options,
    method: 'PUT',
    contentType: 'application/protojson',
    body: { avatarUrl },
  });
  return createUiUserProfile(payload || {});
}

export async function fetchPersonalProfile(options = {}) {
  const payload = await request('/v1/profiles/personal', options);
  return createUiPersonalProfile(payload || {});
}

export async function savePersonalProfile(profile, options = {}) {
  const payload = await request('/v1/profiles/personal', {
    ...options,
    method: 'PUT',
    contentType: 'application/protojson',
    body: profile,
  });
  return createUiPersonalProfile(payload || {});
}

export async function fetchTargetProfiles(options = {}) {
  const payload = await request('/v1/profiles/targets', options);
  return getItems(payload, 'targets').map(createUiTargetProfile);
}

export async function saveTargetProfile(target, options = {}) {
  const id = target?.id ? String(target.id) : '';
  const body = { ...(target || {}) };

  if (!id) {
    delete body.id;
  }

  const payload = await request(id ? `/v1/profiles/targets/${id}` : '/v1/profiles/targets', {
    ...options,
    method: id ? 'PUT' : 'POST',
    contentType: 'application/protojson',
    body,
  });
  return createUiTargetProfile(payload || {});
}

export async function fetchImportantRecords({ targetId, ...options } = {}) {
  const payload = await request(`/v1/profiles/important-records${buildQuery({ targetId })}`, options);
  return getItems(payload, 'records').map(createUiImportantRecord);
}

export async function createImportantRecord(record, options = {}) {
  const body = { ...(record || {}) };

  if (!body.id) {
    delete body.id;
  }

  const payload = await request('/v1/profiles/important-records', {
    ...options,
    method: 'POST',
    contentType: 'application/protojson',
    body,
  });
  return createUiImportantRecord(payload || {});
}

export async function updateImportantRecord(recordId, record, options = {}) {
  const payload = await request(`/v1/profiles/important-records/${recordId}`, {
    ...options,
    method: 'PUT',
    contentType: 'application/protojson',
    body: record,
  });
  return createUiImportantRecord(payload || {});
}

export async function deleteImportantRecord(recordId, options = {}) {
  return request(`/v1/profiles/important-records/${recordId}`, {
    ...options,
    method: 'DELETE',
  });
}
