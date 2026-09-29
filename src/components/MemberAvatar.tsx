import { useState } from 'react';
import { toMediaUrl } from '@/utils/mediaUrl.ts';

interface MemberAvatarProps {
  name: string;
  imageUrl: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export function MemberAvatar({ name, imageUrl, size = 'md' }: MemberAvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const box =
    size === 'lg' ? 'size-20 text-2xl' : size === 'sm' ? 'size-8 text-xs' : 'size-11 text-sm';

  if (!imageUrl || failedUrl === imageUrl) {
    return (
      <img
        src="/default-avatar.svg"
        alt={`${name} 기본 프로필`}
        className={`${box} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <img
      src={toMediaUrl(imageUrl)}
      alt=""
      onError={() => setFailedUrl(imageUrl)}
      className={`${box} shrink-0 rounded-full object-cover`}
    />
  );
}
