const directoryMap = [
  ['posts/images/', 'assets/postImages/'],
  ['posts/files/', 'assets/files/'],
] as const;

function withRoot(value: string): string {
  if (/^(https?:|blob:|data:)/.test(value) || value.startsWith('/')) {
    return value;
  }
  return `/${value}`;
}

function remapDirectory(value: string): string {
  for (const [from, to] of directoryMap) {
    const rooted = `/${from}`;
    if (value.startsWith(rooted)) {
      return `/${to}${value.slice(rooted.length)}`;
    }
    if (value.startsWith(from)) {
      return `${to}${value.slice(from.length)}`;
    }
  }
  return value;
}

export function toMediaUrl(value: string): string {
  return withRoot(remapDirectory(value));
}

export function legacyMediaUrl(value: string): string {
  return withRoot(value);
}
