import type { ComponentProps, MouseEvent } from 'react';
import { Link } from 'react-router';
import { useLoginPromptStore } from '@/stores/useLoginPromptStore.ts';

type MemberProfileLinkProps = Omit<ComponentProps<typeof Link>, 'to'> & {
  memberId: number;
};

// 다른 회원 프로필은 로그인 정보가 있어야 불러올 수 있어서, 비로그인 클릭은 이동 대신 로그인 팝업을 띄운다.
export function MemberProfileLink({ memberId, onClick, ...props }: MemberProfileLinkProps) {
  const promptIfLoggedOut = useLoginPromptStore((state) => state.promptIfLoggedOut);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (promptIfLoggedOut()) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return <Link to={`/members/${memberId}`} onClick={handleClick} {...props} />;
}
