// Text formatting utilities

export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

export const capitalizeFirst = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const formatList = (items, maxItems = 10) => {
  if (items.length === 0) return 'None';

  const limitedItems = items.slice(0, maxItems);
  const formatted = limitedItems.map((item, index) => `${index + 1}. ${item}`).join('\n');

  if (items.length > maxItems) {
    formatted += `\n...and ${items.length - maxItems} more`;
  }

  return formatted;
};

export const formatProgress = (current, total) => {
  if (!total) return `${current}%`;
  return `${current}/${total} (${Math.round((current / total) * 100)}%)`;
};

export const cleanString = (str) => {
  return str.replace(/[^\w\s-]/g, '').trim();
};

export const emojiMap = {
  book: '📖',
  manga: '📚',
  webtoon: '🖼️',
  comic: '💥',
  lightnovel: '📝',
  reading: '📖',
  completed: '✅',
  paused: '⏸️',
};

export const getEmoji = (key) => {
  return emojiMap[key] || '❓';
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};
