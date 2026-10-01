import { fetchApiJson } from '@/api/http.ts';
import { fetchMemberProfile } from '@/api/members.ts';
import type { BlockedMember } from '@/types/block.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function parseBlockedMember(value: unknown): BlockedMember | null {
  if (!isRecord(value)) {
    return null;
  }

  const nested = [value.blockedMember, value.member, value.target, value.blocked].find(isRecord);
  const source = nested ?? value;
  const memberId =
    asNumber(value.blockedId) ??
    asNumber(value.blockedMemberId) ??
    asNumber(source.blockedId) ??
    asNumber(source.memberId) ??
    asNumber(source.id);
  if (memberId === null) {
    return null;
  }

  const name = asString(source.name) ?? asString(source.nickname) ?? asString(source.memberName) ?? '';
  const uniqueId = asString(source.uniqueId) ?? asString(source.unique_id) ?? '';
  const profileImage =
    asString(source.profileImage) ?? asString(source.profileImageUrl) ?? asString(source.imageUrl);

  return {
    memberId,
    name: name.trim(),
    uniqueId: uniqueId.trim(),
    profileImage,
  };
}

function parseBlockedMembers(value: unknown): BlockedMember[] | null {
  const rawList = Array.isArray(value)
    ? value
    : isRecord(value)
      ? [value.members, value.content, value.blocks, value.blockedMembers, value.items].find(
          Array.isArray,
        )
      : undefined;
  if (!rawList) {
    return null;
  }

  const members: BlockedMember[] = [];
  for (const item of rawList) {
    const member = parseBlockedMember(item);
    if (member === null) {
      return null;
    }
    members.push(member);
  }
  return members;
}

async function hydrateMissingProfiles(
  members: BlockedMember[],
  signal?: AbortSignal,
): Promise<BlockedMember[]> {
  return Promise.all(
    members.map(async (member) => {
      if (member.name !== '') {
        return member;
      }
      try {
        const profile = await fetchMemberProfile(member.memberId, signal);
        return {
          memberId: member.memberId,
          name: profile.name,
          uniqueId: profile.uniqueId ?? '',
          profileImage: profile.profileImage,
        };
      } catch {
        return member;
      }
    }),
  );
}

async function loadBlockedMembers(
  accessToken: string,
  signal?: AbortSignal,
): Promise<BlockedMember[]> {
  const data = await fetchApiJson('/api/v1/member/blocks', {
    accessToken,
    signal,
  });
  const members = parseBlockedMembers(data);
  if (members === null) {
    throw new Error('차단 목록 형식이 올바르지 않습니다.');
  }
  return members;
}

export async function fetchBlockedMembers(
  accessToken: string,
  signal?: AbortSignal,
): Promise<BlockedMember[]> {
  const members = await loadBlockedMembers(accessToken, signal);
  return hydrateMissingProfiles(members, signal);
}

export async function isMemberBlocked(
  memberId: number,
  accessToken: string,
  signal?: AbortSignal,
): Promise<boolean> {
  const members = await loadBlockedMembers(accessToken, signal);
  return members.some((member) => member.memberId === memberId);
}

export async function createBlock(memberId: number, accessToken: string): Promise<void> {
  await fetchApiJson(`/api/v1/member/${memberId}/block`, {
    method: 'POST',
    accessToken,
  });
}

export async function deleteBlock(memberId: number, accessToken: string): Promise<void> {
  await fetchApiJson(`/api/v1/member/${memberId}/block`, {
    method: 'DELETE',
    accessToken,
  });
}
