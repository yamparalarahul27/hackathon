'use client';

import { use } from 'react';
import Link from 'next/link';
import { LendingMarketTable } from '@/components/features/LendingMarketTable';
import { useKaminoLend } from '@/lib/hooks/useKaminoLend';

interface Props {
  params: Promise<{ protocol: string }>;
}

export default function LendPage({ params }: Props) {
  const { protocol } = use(params);
  const { snapshot, loading, error } = useKaminoLend();

  if (protocol !== 'kamino') {
    return (
      <div className="flex-1 bg-[#f1f5f9] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-[#11274d] font-ibm-plex-sans mb-2">Unsupported lending protocol</p>
          <p className="text-sm text-[#6a7282] font-ibm-plex-sans mb-4">{protocol}</p>
          <Link href="/lend/kamino" className="text-sm text-[#3B7DDD] hover:underline">
            ← Go to Kamino Lending
          </Link>
        </div>
      </div>
    );
  }

  return <LendingMarketTable snapshot={snapshot} loading={loading} error={error} />;
}
