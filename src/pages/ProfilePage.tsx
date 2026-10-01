import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { createBlock, deleteBlock, isMemberBlocked } from '@/api/blocks.ts';
import { fetchMemberPosts, fetchMyPosts } from '@/api/feed.ts';
import { fetchFollow, setFollow } from '@/api/follow.ts';
import { isAbortError, isHttpStatusError, toErrorMessage } from '@/api/http.ts';
import { fetchMemberProfile } from '@/api/members.ts';
import { ActionMenu } from '@/components/ActionMenu.tsx';
import { ConfirmDialog } from '@/components/ConfirmDialog.tsx';
import { MediaImage } from '@/components/MediaImage.tsx';
import { MemberAvatar } from '@/components/MemberAvatar.tsx';
import { SubscriberOnlyGate } from '@/components/SubscriberOnlyGate.tsx';
import { useAuthStore } from '@/stores/useAuthStore.ts';
import { useBlockMemoryStore } from '@/stores/useBlockMemoryStore.ts';
import { useLoginPromptStore } from '@/stores/useLoginPromptStore.ts';
import type { PostFeedItem } from '@/types/feed.ts';
import type { FollowResponse } from '@/types/follow.ts';
import type { MemberResponseDto } from '@/types/member.ts';

type ProfileTab = 'public' | 'subscriber';

export interface MemberProfileState {
  name?: string;
  uniqueId?: string;
  profileImage?: string | null;
  introduction?: string | null;
}

function formatCount(value: number): string {
  if (value >= 10000) {
    const man = value / 10000;
    const text = Number.isInteger(man) ? String(man) : man.toFixed(1);
    return `${text}만`;
  }
  return value.toLocaleString('ko-KR');
}

export function ProfilePage() {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setProfile = useAuthStore((state) => state.setProfile);
  const routeMemberId = Number(params.memberId);
  const isMemberProfile = Number.isInteger(routeMemberId) && routeMemberId > 0;
  const profileState = location.state as MemberProfileState | null;
  const [tab, setTab] = useState<ProfileTab>('public');
  const [member, setMember] = useState<MemberResponseDto | null>(null);
  const [publicPosts, setPublicPosts] = useState<PostFeedItem[]>([]);
  const [posts, setPosts] = useState<PostFeedItem[]>([]);
  const [follow, setFollowState] = useState<FollowResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [confirmUnblock, setConfirmUnblock] = useState(false);
  const [blockPending, setBlockPending] = useState(false);
  const promptIfLoggedOut = useLoginPromptStore((state) => state.promptIfLoggedOut);

  const memberId = isMemberProfile ? routeMemberId : (profile?.id ?? null);
  const isOwnView = !isMemberProfile || profile?.id === routeMemberId;
  const owner =
    publicPosts[0] && (memberId === null || publicPosts[0].memberId === memberId)
      ? publicPosts[0]
      : undefined;
  const name = member?.name ?? owner?.memberName ?? profileState?.name ?? profile?.nickname ?? '회원';
  const uniqueId =
    member?.uniqueId ?? owner?.uniqueId ?? profileState?.uniqueId ?? profile?.uniqueId ?? '';
  const imageUrl =
    member?.profileImage ??
    owner?.profileImageUrl ??
    profileState?.profileImage ??
    profile?.profileImage ??
    null;
  const introduction =
    member?.introduction ?? (profileState?.introduction?.trim() || null);
  const postCount = member?.postCount ?? publicPosts.length;
  const followerCount = member?.followerCount ?? follow?.followerCount ?? null;
  const followingCount = member?.followingCount ?? follow?.followingCount ?? null;

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      setLocked(false);
      try {
        const nextPosts = isMemberProfile
          ? await fetchMemberPosts(routeMemberId, tab === 'subscriber', controller.signal)
          : await fetchMyPosts(tab === 'subscriber', controller.signal);
        setPosts(nextPosts);
        if (tab === 'public') {
          setPublicPosts(nextPosts);
        }
      } catch (caught: unknown) {
        if (isAbortError(caught)) {
          return;
        }
        // 다른 사람 구독자 전용 탭의 403/401은 에러가 아니라 구독 유도 화면으로 본다.
        if (
          tab === 'subscriber' &&
          !isOwnView &&
          (isHttpStatusError(caught, 403) || isHttpStatusError(caught, 401))
        ) {
          setPosts([]);
          setLocked(true);
          return;
        }
        setError(toErrorMessage(caught));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [isMemberProfile, isOwnView, routeMemberId, tab]);

  // 헤더는 게시글이 아니라 GET /api/v1/member/{memberId} 를 기준으로 그린다.
  useEffect(() => {
    if (memberId === null) {
      return;
    }
    const targetId = memberId;
    const controller = new AbortController();

    async function loadMember() {
      try {
        const nextMember = await fetchMemberProfile(targetId, controller.signal);
        setMember(nextMember);
        const currentProfile = useAuthStore.getState().profile;
        if (isOwnView && nextMember.uniqueId && currentProfile && !currentProfile.uniqueId) {
          setProfile({ ...currentProfile, uniqueId: nextMember.uniqueId });
        }
      } catch (caught: unknown) {
        if (!isAbortError(caught)) {
          setMember(null);
        }
      }
    }

    setMember(null);
    void loadMember();
    return () => controller.abort();
  }, [isOwnView, memberId, setProfile]);

  useEffect(() => {
    if (memberId === null) {
      return;
    }
    const targetId = memberId;
    const controller = new AbortController();

    async function loadFollow() {
      try {
        const follow = await fetchFollow(targetId, controller.signal);
        setFollowState(follow);
      } catch (caught: unknown) {
        if (!isAbortError(caught)) {
          setFollowState(null);
        }
      }
    }

    void loadFollow();
    return () => controller.abort();
  }, [memberId]);

  useEffect(() => {
    if (isOwnView || !accessToken || memberId === null) {
      setBlocked(false);
      return;
    }

    const targetId = memberId;
    const token = accessToken;
    const controller = new AbortController();

    async function loadBlocked() {
      try {
        const nextBlocked = await isMemberBlocked(targetId, token, controller.signal);
        if (!controller.signal.aborted) {
          setBlocked(nextBlocked);
        }
      } catch (caught: unknown) {
        if (!isAbortError(caught) && !controller.signal.aborted) {
          setBlocked(false);
        }
      }
    }

    void loadBlocked();
    return () => controller.abort();
  }, [accessToken, isOwnView, memberId]);

  async function toggleFollow() {
    if (promptIfLoggedOut() || !accessToken || memberId === null || !follow) {
      return;
    }
    const next = !follow.isFollowing;
    try {
      await setFollow(memberId, next, accessToken);
      setFollowState({
        ...follow,
        isFollowing: next,
        followerCount: follow.followerCount + (next ? 1 : -1),
      });
      if (member !== null && member.followerCount !== null) {
        setMember({
          ...member,
          followerCount: Math.max(0, member.followerCount + (next ? 1 : -1)),
        });
      }
    } catch (caught: unknown) {
      setNotice(toErrorMessage(caught));
    }
  }

  function requestBlock() {
    if (promptIfLoggedOut()) {
      return;
    }
    setNotice(null);
    setConfirmBlock(true);
  }

  async function confirmBlockAction() {
    if (!accessToken || memberId === null) {
      return;
    }
    setBlockPending(true);
    setNotice(null);
    try {
      await createBlock(memberId, accessToken);
      useBlockMemoryStore.getState().markBlocked(memberId);
      setBlocked(true);
      setConfirmBlock(false);
    } catch (caught: unknown) {
      setNotice(toErrorMessage(caught));
    } finally {
      setBlockPending(false);
    }
  }

  async function unblockMember() {
    if (promptIfLoggedOut() || !accessToken || memberId === null) {
      return;
    }
    setBlockPending(true);
    setNotice(null);
    try {
      await deleteBlock(memberId, accessToken);
      useBlockMemoryStore.getState().markUnblocked(memberId);
      setBlocked(false);
      setConfirmUnblock(false);
    } catch (caught: unknown) {
      setNotice(toErrorMessage(caught));
    } finally {
      setBlockPending(false);
    }
  }

  function goBack() {
    const idx = (window.history.state as { idx?: number } | null)?.idx;
    if (typeof idx === 'number' && idx > 0) {
      void navigate(-1);
      return;
    }
    void navigate('/');
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      {isMemberProfile && (
        <div className="shrink-0 border-b border-zinc-100 px-5 py-3">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-linkup"
          >
            <ArrowLeft className="size-4" aria-hidden />
            뒤로
          </button>
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
      <div className="flex flex-wrap items-center gap-5">
        <MemberAvatar name={name} imageUrl={imageUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-zinc-900">
            {name}
            {uniqueId && <span className="ml-2 text-sm font-normal text-zinc-400">@{uniqueId}</span>}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-500">
            {introduction ?? '소개가 없습니다.'}
          </p>
        </div>
        {!isOwnView && (
          <div className="flex items-center gap-2">
            {blocked ? (
              <button
                type="button"
                disabled={blockPending}
                onClick={() => {
                  if (promptIfLoggedOut()) {
                    return;
                  }
                  setConfirmUnblock(true);
                }}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 disabled:opacity-60"
              >
                차단 해제
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void toggleFollow()}
                  className={
                    follow?.isFollowing
                      ? 'rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600'
                      : 'rounded-xl bg-linkup px-4 py-2 text-sm font-semibold text-white'
                  }
                >
                  {follow?.isFollowing ? '팔로잉' : '팔로우'}
                </button>
                <button
                  type="button"
                  disabled
                  title="구독 등록 API 준비 중"
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-400"
                >
                  구독
                </button>
              </>
            )}
            <ActionMenu
              label="프로필 메뉴"
              items={
                blocked
                  ? [
                      {
                        label: '차단 해제',
                        onSelect: () => {
                          if (promptIfLoggedOut()) {
                            return;
                          }
                          setConfirmUnblock(true);
                        },
                      },
                    ]
                  : [{ label: '차단하기', danger: true, onSelect: requestBlock }]
              }
            />
          </div>
        )}
      </div>

      <dl className="mt-5 flex gap-8 text-center">
        <div>
          <dt className="text-xs text-zinc-400">게시글</dt>
          <dd className="text-lg font-semibold text-zinc-900">{formatCount(postCount)}</dd>
        </div>
        {memberId === null ? (
          <>
            <div>
              <dt className="text-xs text-zinc-400">팔로워</dt>
              <dd className="text-lg font-semibold text-zinc-900">
                {followerCount === null ? '-' : formatCount(followerCount)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-400">팔로잉</dt>
              <dd className="text-lg font-semibold text-zinc-900">
                {followingCount === null ? '-' : formatCount(followingCount)}
              </dd>
            </div>
          </>
        ) : (
          <>
            <Link to={`/members/${memberId}/follows`} className="hover:text-linkup">
              <dt className="text-xs text-zinc-400">팔로워</dt>
              <dd className="text-lg font-semibold text-zinc-900">
                {followerCount === null ? '-' : formatCount(followerCount)}
              </dd>
            </Link>
            <Link to={`/members/${memberId}/follows`} className="hover:text-linkup">
              <dt className="text-xs text-zinc-400">팔로잉</dt>
              <dd className="text-lg font-semibold text-zinc-900">
                {followingCount === null ? '-' : formatCount(followingCount)}
              </dd>
            </Link>
          </>
        )}
      </dl>

      {isOwnView && (
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to="/profile/edit"
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            프로필 수정
          </Link>
          <span className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-400">
            크리에이터 페이지
          </span>
          <Link
            to="/subscriptions"
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            내가 구독한 크리에이터
          </Link>
        </div>
      )}
      {notice && <p className="mt-3 text-sm text-red-500">{notice}</p>}

      {blocked && !isOwnView ? (
        <p className="mt-8 text-sm text-zinc-400">차단한 사용자입니다. 게시글이 보이지 않습니다.</p>
      ) : (
        <>
      <div className="mt-6 flex gap-5 border-b border-zinc-100">
        <button
          type="button"
          onClick={() => setTab('public')}
          className={
            tab === 'public'
              ? 'border-b-2 border-linkup py-3 text-sm font-semibold text-linkup'
              : 'py-3 text-sm font-medium text-zinc-400'
          }
        >
          전체공개
        </button>
        <button
          type="button"
          onClick={() => setTab('subscriber')}
          className={
            tab === 'subscriber'
              ? 'border-b-2 border-linkup py-3 text-sm font-semibold text-linkup'
              : 'py-3 text-sm font-medium text-zinc-400'
          }
        >
          구독자 전용
        </button>
      </div>

      {loading && <p className="py-8 text-sm text-zinc-400">게시글을 불러오는 중...</p>}
      {!loading && locked && (
        <SubscriberOnlyGate creatorName={name} loggedIn={Boolean(accessToken)} />
      )}
      {error && !locked && <p className="py-8 text-sm text-red-500">{error}</p>}
      {!loading && !error && !locked && posts.length === 0 && (
        <p className="py-8 text-sm text-zinc-400">표시할 게시글이 없습니다.</p>
      )}
      {!loading && !error && !locked && posts.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {posts.map((post) => (
            <li key={post.postId}>
              <Link
                to={`/posts/${post.postId}`}
                state={{ fromMemberId: memberId, authorMemberId: memberId }}
                className="block overflow-hidden rounded-2xl bg-zinc-100"
              >
                {post.mainImageUrl ? (
                  <MediaImage src={post.mainImageUrl} alt="" className="aspect-square w-full object-cover" />
                ) : (
                  <span className="flex aspect-square items-center p-3 text-xs text-zinc-400">
                    {post.content}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
        </>
      )}
      </div>

      {confirmBlock && (
        <ConfirmDialog
          message={`${name} 님을 차단할까요?`}
          confirmLabel="차단"
          pending={blockPending}
          danger
          onClose={() => setConfirmBlock(false)}
          onConfirm={() => void confirmBlockAction()}
        />
      )}
      {confirmUnblock && (
        <ConfirmDialog
          message={`${name} 님의 차단을 해제할까요?`}
          confirmLabel="차단 해제"
          pending={blockPending}
          onClose={() => setConfirmUnblock(false)}
          onConfirm={() => void unblockMember()}
        />
      )}
    </section>
  );
}
