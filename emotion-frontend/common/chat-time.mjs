export const CHAT_TIME_SEPARATOR_INTERVAL = 30 * 60 * 1000;

export function formatClockTime(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

export function shouldShowMessageTime({ sentAt, previousUserMessage } = {}) {
  if (!previousUserMessage?.sentAt) {
    return true;
  }

  return Number(sentAt) - Number(previousUserMessage.sentAt) >= CHAT_TIME_SEPARATOR_INTERVAL;
}

export function createTimedUserMessage({
  chatId,
  content,
  sentAt = Date.now(),
  previousUserMessage = null,
} = {}) {
  const showTime = shouldShowMessageTime({ sentAt, previousUserMessage });

  return {
    id: `${chatId}-user-${sentAt}`,
    role: 'user',
    content,
    sentAt,
    timeLabel: formatClockTime(sentAt),
    showTime,
  };
}
