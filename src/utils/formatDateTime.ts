export function formatRelativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return '방금 전';
  }
  if (diffMs < hour) {
    return `${Math.floor(diffMs / minute)}분 전`;
  }
  if (diffMs < day) {
    return `${Math.floor(diffMs / hour)}시간 전`;
  }
  if (diffMs < 7 * day) {
    return `${Math.floor(diffMs / day)}일 전`;
  }

  return formatDateTime(value);
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
