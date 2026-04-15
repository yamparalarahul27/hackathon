'use client';

import { Bell } from 'lucide-react';

/**
 * NotificationBell — parked for future notifications feature.
 *
 * Not currently mounted in the Navbar because the notifications feature
 * is out of scope. Drop `<NotificationBell />` back into
 * `src/components/layout/Navbar.tsx` (near the UserButton) when ready.
 */
export function NotificationBell() {
  return (
    <button
      type="button"
      aria-label="Notifications"
      className="flex items-center justify-center h-7 px-2 rounded-sm transition-colors duration-150 bg-white border border-[#cbd5e1] text-[#11274d] hover:bg-[#e2e8f0]"
    >
      <Bell size={14} />
    </button>
  );
}
