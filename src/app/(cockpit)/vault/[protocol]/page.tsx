'use client';

import { VaultDashboard } from '@/components/features/VaultDashboard';
import { useRouter } from 'next/navigation';
import { use } from 'react';

interface Props {
  params: Promise<{ protocol: string }>;
}

export default function VaultPositionsPage({ params }: Props) {
  const { protocol } = use(params);
  const router = useRouter();

  const handleVaultSelect = (vaultAddress: string) => {
    router.push(`/vault/${protocol}/deposit?vault=${vaultAddress}`);
  };

  return <VaultDashboard onVaultSelect={handleVaultSelect} />;
}
