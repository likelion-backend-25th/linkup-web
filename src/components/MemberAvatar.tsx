import { useState } from 'react';

interface MemberAvatarProps {
  name: string;
  imageUrl: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export function MemberAvatar({ name, imageUrl, size = 'md' }: MemberAvatarProps) {
  const [failed, setFailed] = useState(false);
  const box =
    size === 'lg' ? 'size-20 text-2xl' : size === 'sm' ? 'size-8 text-xs' : 'size-11 text-sm';

  if (!imageUrl || failed) {
    return (
      <span
        className={`flex ${box} shrink-0 items-center justify-center rounded-full bg-linkup-soft font-semibold text-linkup`}
      >
        {name.slice(0, 1)}
      </span>
    );
  }

  return (
    <img
      src={imageUrl}
      alt=""
      onError={() => setFailed(true)}
      className={`${box} shrink-0 rounded-full object-cover`}
    />
  );
}
