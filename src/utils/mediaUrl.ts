const directoryMap = [
  ['assets/postImages/', 'uploads/posts/'],
  ['posts/images/', 'uploads/posts/'],
  ['assets/files/', 'uploads/files/'],
  ['posts/files/', 'uploads/files/'],
] as const;

function isCdnHost(hostname: string): boolean {
  return (
    hostname === 'linkup.likelion.shop' ||
    hostname.endsWith('.cloudfront.net') ||
    hostname.endsWith('.s3.amazonaws.com') ||
    hostname.includes('.s3.') && hostname.endsWith('.amazonaws.com')
  );
}

function toLocalMediaPath(value: string): string {
  try {
    if (/^https?:\/\//.test(value)) {
      const url = new URL(value);
      if (isCdnHost(url.hostname)) {
        return `${url.pathname}${url.search}`;
      }
    }
  } catch {
    return value;
  }
  return value;
}

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
  return withRoot(remapDirectory(toLocalMediaPath(value)));
}

export function legacyMediaUrl(value: string): string {
  return withRoot(toLocalMediaPath(value));
}
