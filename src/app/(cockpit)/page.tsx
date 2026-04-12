'use client';

import { redirect } from 'next/navigation';

// Dashboard content TBD — for now redirect to Vaults
export default function DashboardPage() {
  redirect('/vault/kamino');
}
