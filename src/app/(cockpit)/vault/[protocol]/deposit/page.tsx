'use client';

import { DepositFlow } from '@/components/features/DepositFlow';
import { useSearchParams } from 'next/navigation';

export default function VaultDepositPage() {
  const searchParams = useSearchParams();
  const preSelectedVault = searchParams.get('vault');

  return <DepositFlow preSelectedVaultAddress={preSelectedVault} />;
}
