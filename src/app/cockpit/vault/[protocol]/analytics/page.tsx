'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';

export default function VaultAnalyticsPage() {
  return (
    <div className="text-center py-20">
      <Card className="p-8 max-w-lg mx-auto">
        <p className="text-lg text-[#11274d] font-ibm-plex-sans font-medium mb-2">
          Yield Analytics — Coming Soon
        </p>
        <p className="text-sm text-[#6a7282] font-ibm-plex-sans mb-4">
          Yield breakdown, impermanent loss tracking, and historical performance
          require deposit event indexing, which is not yet available.
        </p>
        <Link
          href="/cockpit/vault/kamino"
          className="text-sm text-[#3B7DDD] hover:underline font-ibm-plex-sans"
        >
          ← Back to Vaults
        </Link>
      </Card>
    </div>
  );
}
