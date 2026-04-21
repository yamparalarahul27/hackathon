'use client';

import { SettingsModal } from '@/components/ui/SettingsModal';

/**
 * Full-page settings — renders the same SettingsModal content
 * in a standalone page layout (no overlay backdrop).
 */
export default function SettingsPage() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h2 className="font-satoshi font-bold text-xl text-[#11274d]">Settings</h2>
        <p className="text-sm text-[#6a7282] mt-1">Customize your cockpit</p>
      </div>

      {/* Render the settings modal as an always-open inline panel */}
      <SettingsModal isOpen onClose={() => window.history.back()} />
    </div>
  );
}
