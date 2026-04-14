'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';

export default function VaultAnalyticsPage() {
  return (
    <div className="flex-1 bg-[#f1f5f9] -mx-6 -mt-6 px-4.5 lg:px-10 pt-6 pb-16 min-h-screen">
      <div className="max-w-[1400px] mx-auto text-center py-20">
        <Card className="p-8 max-w-lg mx-auto">
          <p className="text-lg text-[#11274d] font-ibm-plex-sans font-medium mb-2">
            Yield Analytics — Coming Soon
          </p>
          <p className="text-sm text-[#6a7282] font-ibm-plex-sans mb-4">
            Yield breakdown, impermanent loss tracking, and historical performance
            require deposit event indexing, which is not yet available.
          </p>
          <Link
            href="/vault/kamino"
            className="text-sm text-[#3B7DDD] hover:underline font-ibm-plex-sans"
          >
            ← Back to Vaults
          </Link>
        </Card>
      </div>
    </div>
  );
}
