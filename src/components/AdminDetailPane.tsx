import { useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';

const DEFAULT_WIDTH = 480;
const MIN_WIDTH = 360;
const MAX_WIDTH = 720;

export function AdminDetailPane({ label, children }: { label: string; children: ReactNode }) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const resizeDrag = useRef<{ pointerId: number; startX: number; startWidth: number } | null>(null);

  function startResize(event: PointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeDrag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: width,
    };
  }

  function moveResize(event: PointerEvent<HTMLButtonElement>) {
    const drag = resizeDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    // 오른쪽 패널이라 왼쪽으로 끌면 너비가 커진다.
    const next = drag.startWidth + (drag.startX - event.clientX);
    setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, next)));
  }

  function endResize(event: PointerEvent<HTMLButtonElement>) {
    if (resizeDrag.current?.pointerId === event.pointerId) {
      resizeDrag.current = null;
    }
  }

  return (
    <>
      <button
        type="button"
        aria-orientation="vertical"
        aria-label={`${label} 너비 조절`}
        aria-valuemin={MIN_WIDTH}
        aria-valuemax={MAX_WIDTH}
        aria-valuenow={width}
        onPointerDown={startResize}
        onPointerMove={moveResize}
        onPointerUp={endResize}
        onPointerCancel={endResize}
        className="group relative hidden w-3 shrink-0 cursor-col-resize touch-none self-stretch border-0 bg-transparent p-0 select-none lg:block"
      >
        <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-zinc-100 group-hover:bg-linkup" />
      </button>
      <aside
        className="linkup-scrollbar min-h-0 w-full overflow-y-auto p-6 lg:w-[var(--admin-detail-width)] lg:shrink-0"
        style={{ '--admin-detail-width': `${width}px` } as CSSProperties}
      >
        {children}
      </aside>
    </>
  );
}
