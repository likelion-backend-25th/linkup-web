export interface CreatorHint {
  role?: string | null;
  creatorStatus?: string | null;
  isCreator?: boolean | null;
}

function normalize(value: string | null | undefined): string {
  return value?.trim().toUpperCase() ?? '';
}

export function isCreatorAccount(profile: CreatorHint | null | undefined): boolean {
  if (!profile) {
    return false;
  }
  if (profile.isCreator === true) {
    return true;
  }
  if (normalize(profile.role).includes('CREATOR')) {
    return true;
  }
  const status = normalize(profile.creatorStatus);
  return ['APPROVED', 'ACTIVE', 'ACCEPTED', 'CREATOR', 'VERIFIED', 'YES'].includes(status);
}

export function roleFromAccessToken(accessToken: string): string | null {
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) {
      return null;
    }
    const base64 = payload.replaceAll('-', '+').replaceAll('_', '/');
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const claims = JSON.parse(atob(normalized)) as unknown;
    if (typeof claims !== 'object' || claims === null || !('role' in claims)) {
      return null;
    }
    const role = (claims as { role?: unknown }).role;
    return typeof role === 'string' ? role : null;
  } catch {
    return null;
  }
}
