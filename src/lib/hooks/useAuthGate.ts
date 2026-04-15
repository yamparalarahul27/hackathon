'use client';

import { useCallback } from 'react';
import { useAuth, useClerk } from '@clerk/nextjs';

/**
 * Action-triggered auth gate.
 *
 * Wrap any action that requires identity. If the user is signed in, the
 * action runs immediately. If not, Clerk's sign-in modal opens; the
 * caller's action is the user's next step after sign-in (they re-click).
 *
 * Example:
 *   const gate = useAuthGate();
 *   <button onClick={() => gate(() => deposit())}>Deposit</button>
 */
export function useAuthGate() {
  const { isSignedIn, isLoaded } = useAuth();
  const { openSignIn } = useClerk();

  return useCallback(
    (action: () => void | Promise<void>) => {
      // Clerk still initializing — don't let the click go through yet.
      if (!isLoaded) return;

      if (isSignedIn) {
        void action();
        return;
      }

      // Not signed in — open Clerk's hosted sign-in modal.
      // User re-invokes the action after sign-in completes.
      const here = typeof window !== 'undefined' ? window.location.href : '/';
      openSignIn({
        fallbackRedirectUrl: here,
        signUpFallbackRedirectUrl: here,
      });
    },
    [isLoaded, isSignedIn, openSignIn]
  );
}
