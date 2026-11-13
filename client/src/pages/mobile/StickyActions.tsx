import type { ReactNode } from 'react';

/**
 * Main buttons of a field form. On a phone they stick to the bottom of the screen
 * (thumb reach, above the home bar); on larger screens they sit inline, right-aligned.
 */
export default function StickyActions({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 grid grid-cols-[1fr_2fr] gap-2 border-t border-zinc-200 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:static sm:mx-0 sm:flex sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
      {children}
    </div>
  );
}
