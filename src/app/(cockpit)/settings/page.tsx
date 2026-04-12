'use client';

import { SettingsModal } from '@/components/ui/SettingsModal';

/**
 * Full-page settings — renders the same SettingsModal content
 * in a standalone page layout (no overlay backdrop).
 */
export default function SettingsPage() {
  return (
    <div className="flex-1 bg-[#f1f5f9] -mx-6 -mt-6 px-4.5 lg:px-10 pt-6 pb-16 min-h-screen">
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <h2 className="font-display font-bold text-xl text-[#11274d]">Settings</h2>
          <p className="text-sm text-[#6a7282] mt-1">Customize your cockpit</p>
        </div>

        {/* Render the settings modal as an always-open inline panel */}
        <SettingsModal isOpen onClose={() => window.history.back()} />
      </div>
    </div>
  );
}
