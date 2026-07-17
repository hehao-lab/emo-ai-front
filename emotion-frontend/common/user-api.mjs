const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000';
const ACCESS_TOKEN_STORAGE_KEY = 'emotion-ai-access-token';
const REFRESH_TOKEN_STORAGE_KEY = 'emotion-ai-refresh-token';

export const API_BASE_URL = DEFAULT_API_BASE_URL;

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function createApiUrl(path, baseUrl = API_BASE_URL) {
  return `${trimTrailingSlash(baseUrl)}${path}`;
}

function getStorageApi() {
  if (typeof localStorage !== 'undefined') {
    return {
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
      removeItem: (key) => localStorage.removeItem(key),
    };
  }

  if (typeof uni !== 'undefined') {
    return {
      getItem: (key) => uni.getStorageSync?.(key) || null,
      setItem: (key, value) => uni.setStorageSync?.(key, value),
      removeItem: (key) => uni.removeStorageSync?.(key),
    };
  }

  return null;
}

function normalizeFetch(fetchImpl) {
  if (fetchImpl) {
    return fetchImpl;
  }

  if (typeof fetch !== 'undefined') {
    return fetch;
  }

  throw new Error('当前运行环境不支持 fetch，无法调用后端接口');
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

  const reasonMessages = {
    INVALID_ARGUMENT: '请检查填写内容后再提交',
    INVALID_CREDENTIALS: '账号或密码不正确',
    USERNAME_EXISTS: '用户名已被使用',
    PHONE_EXISTS: '手机号已被注册',
    EMAIL_EXISTS: '邮箱已被注册',
    VERIFICATION_CODE_EXPIRED: '验证码已过期，请重新获取',
    VERIFICATION_CODE_MISMATCH: '验证码不正确',
  };
  const reasonMessage = reasonMessages[payload?.reason];

  if (reasonMessage) {
    return reasonMessage;
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

function readToken(payload, key) {
  if (!payload) {
    return '';
  }

  if (payload[key]) {
    return payload[key];
  }

  const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  return payload[snakeKey] || '';
}

function normalizeId(value) {
  return value === undefined || value === null ? '' : String(value);
}

function normalizeTextList(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))];
  }

  if (typeof value === 'string' && value.trim()) {
    return [...new Set(value.split(/\n+|[;；]/).map((item) => item.trim()).filter(Boolean))];
  }

  return [];
}

function normalizeShortTextList(value, maxLength = 16) {
  return normalizeTextList(value).filter((item) => item.length <= maxLength);
}

function createUiPersonalPortraitReport(portrait = {}) {
  return {
    title: portrait.title || '',
    summary: portrait.summary || '',
    traits: normalizeShortTextList(portrait.traits),
    relationshipPattern: portrait.relationshipPattern || portrait.relationship_pattern || '',
    riskNotes: normalizeTextList(portrait.riskNotes || portrait.risk_notes),
    suggestions: normalizeTextList(portrait.suggestions),
  };
}

function createUiTargetRelationshipHealthReport(report = {}) {
  return {
    targetId: normalizeId(report.targetId ?? report.target_id),
    targetName: report.targetName || report.target_name || '',
    relationshipLabel: report.relationshipLabel || report.relationship_label || '',
    healthScore: Number(report.healthScore ?? report.health_score ?? 0),
    healthLevel: report.healthLevel || report.health_level || '',
    summary: report.summary || '',
    evidence: normalizeTextList(report.evidence),
    riskNotes: normalizeTextList(report.riskNotes || report.risk_notes),
    suggestions: normalizeTextList(report.suggestions),
    generatedAt: report.generatedAt || report.generated_at || '',
  };
}

function createUiRelationshipHealthReport(report = {}) {
  const targetReports = report.targetReports || report.target_reports || [];

  return {
    personalPortrait: createUiPersonalPortraitReport(report.personalPortrait || report.personal_portrait),
    targetReports: Array.isArray(targetReports)
      ? targetReports.map(createUiTargetRelationshipHealthReport)
      : [],
  };
}

function saveAuthTokens(payload = {}) {
  const accessToken = readToken(payload, 'accessToken');
  const refreshToken = readToken(payload, 'refreshToken');
  const storage = getStorageApi();

  if (!storage) {
    return;
  }

  if (accessToken) {
    storage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
  }

  if (refreshToken) {
    storage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  }
}

export function getAccessToken() {
  return getStorageApi()?.getItem(ACCESS_TOKEN_STORAGE_KEY) || '';
}

export function getRefreshToken() {
  return getStorageApi()?.getItem(REFRESH_TOKEN_STORAGE_KEY) || '';
}

export function clearAuthTokens() {
  const storage = getStorageApi();

  if (!storage) {
    return;
  }

  storage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  storage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

function buildJsonHeaders({ accessToken = getAccessToken(), contentType = 'application/json', extraHeaders = {} } = {}) {
  return {
    'Content-Type': contentType,
    Accept: contentType,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...extraHeaders,
  };
}

export async function request(path, {
  baseUrl = API_BASE_URL,
  accessToken,
  fetchImpl,
  method = 'GET',
  body,
  headers = {},
  contentType,
} = {}) {
  const requestFetch = normalizeFetch(fetchImpl);
  const response = await requestFetch(createApiUrl(path, baseUrl), {
    method,
    headers: buildJsonHeaders({ accessToken, contentType, extraHeaders: headers }),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(payload, response.status));
  }

  return payload;
}

export async function sendRegisterEmailCode(email, options = {}) {
  return request('/v1/users/register/email-code', {
    ...options,
    method: 'POST',
    accessToken: null,
    body: { email },
  });
}

export async function registerUser({
  username,
  phone,
  email,
  password,
  verificationCode,
}, options = {}) {
  return request('/v1/users/register', {
    ...options,
    method: 'POST',
    accessToken: null,
    contentType: 'application/protojson',
    body: {
      username,
      phone,
      email,
      password,
      verificationCode,
    },
  });
}

export async function loginUser({ phone, password }, options = {}) {
  const payload = await request('/v1/users/login', {
    ...options,
    method: 'POST',
    accessToken: null,
    body: { phone, password },
  });

  saveAuthTokens(payload);
  return payload;
}

export async function logoutAuth(options = {}) {
  const payload = await request('/v1/auth/logout', {
    ...options,
    method: 'POST',
    body: {
      refreshToken: getRefreshToken(),
    },
  });

  clearAuthTokens();
  return payload;
}

export function fetchMoodTags(options = {}) {
  return request('/v1/mood-tags', options);
}

export function fetchDiaries(params = {}, options = {}) {
  return request(`/v1/diaries${buildQuery(params)}`, options);
}

export function fetchDiary(diaryId, options = {}) {
  return request(`/v1/diaries/${diaryId}`, options);
}

export function createDiary(payload, options = {}) {
  return request('/v1/diaries', {
    ...options,
    method: 'POST',
    body: payload,
  });
}

export function updateDiary(diaryId, payload, options = {}) {
  return request(`/v1/diaries/${diaryId}`, {
    ...options,
    method: 'PUT',
    body: payload,
  });
}

export function deleteDiary(diaryId, options = {}) {
  return request(`/v1/diaries/${diaryId}`, {
    ...options,
    method: 'DELETE',
  });
}

export function fetchChatSessions(params = {}, options = {}) {
  return request(`/v1/chat/sessions${buildQuery(params)}`, options);
}

export function fetchEmotionOverviewReport(params = {}, options = {}) {
  return request(`/v1/emotion/reports/overview${buildQuery(params)}`, options);
}

export function fetchEmotionTrendReport(params = {}, options = {}) {
  return request(`/v1/emotion/reports/trends${buildQuery(params)}`, options);
}

export function fetchEmotionCalendarReport(params = {}, options = {}) {
  return request(`/v1/emotion/reports/calendar${buildQuery(params)}`, options);
}

export async function fetchRelationshipHealthReport(options = {}) {
  const payload = await request('/v1/emotion/reports/relationship-health', options);
  return createUiRelationshipHealthReport(payload || {});
}

export function fetchLoginLogs(params = {}, options = {}) {
  return request(`/v1/security/login-logs${buildQuery(params)}`, options);
}

export function fetchSecurityTokens(options = {}) {
  return request('/v1/security/tokens', options);
}

export function fetchSecurityEvents(params = {}, options = {}) {
  return request(`/v1/security/events${buildQuery(params)}`, options);
}

export function fetchSystemAbout(options = {}) {
  return request('/v1/system/about', options);
}

export function fetchLatestSystemVersion(params = {}, options = {}) {
  return request(`/v1/system/versions/latest${buildQuery(params)}`, options);
}

export function fetchSystemAnnouncements(params = {}, options = {}) {
  return request(`/v1/system/announcements${buildQuery(params)}`, options);
}
