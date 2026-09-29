import { useEffect, useRef, useState } from 'react';
import { Ellipsis } from 'lucide-react';

export interface ActionMenuItem {
  label: string;
  onSelect: () => void;
  danger?: boolean;
}

interface ActionMenuProps {
  label: string;
  items: ActionMenuItem[];
}

export function ActionMenu({ label, items }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
      >
        <Ellipsis className="size-4" aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-20 mt-1 w-32 rounded-xl border border-zinc-100 bg-white py-1 shadow-md"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={
                item.danger
                  ? 'block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50'
                  : 'block w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50'
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
