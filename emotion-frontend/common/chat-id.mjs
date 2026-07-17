const LOCAL_CHAT_ID_PREFIX = 'local-chat-';

export function normalizeChatId(value) {
  return value === undefined || value === null ? '' : String(value);
}

export function isRemoteChatId(value) {
  const chatId = normalizeChatId(value);
  return Boolean(chatId) && !chatId.startsWith(LOCAL_CHAT_ID_PREFIX);
}
