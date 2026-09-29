export function toMediaUrl(value: string): string {
  if (/^(https?:|blob:|data:)/.test(value) || value.startsWith('/')) {
    return value;
  }
  return `/${value}`;
}
