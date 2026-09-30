import { useEffect, useState } from 'react';
import { legacyMediaUrl, toMediaUrl } from '@/utils/mediaUrl.ts';

const PLACEHOLDER_URL = '/fallback-image.svg';

interface MediaImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function MediaImage({ src, alt, className }: MediaImageProps) {
  const preferred = src.includes('cdn.example.com') ? PLACEHOLDER_URL : toMediaUrl(src);
  const [current, setCurrent] = useState(preferred);

  useEffect(() => {
    setCurrent(preferred);
  }, [preferred]);

  return (
    <img
      src={current}
      alt={alt}
      className={className}
      onError={() => {
        if (current === PLACEHOLDER_URL) {
          return;
        }
        const legacy = legacyMediaUrl(src);
        if (current !== legacy) {
          setCurrent(legacy);
        } else if (current !== PLACEHOLDER_URL) {
          setCurrent(PLACEHOLDER_URL);
        }
      }}
    />
  );
}
