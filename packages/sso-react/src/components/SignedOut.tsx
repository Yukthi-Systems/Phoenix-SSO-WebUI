import type { ReactNode } from 'react';
import { useSSOAuth } from '../useSSOAuth';

/** Renders its children only when the user is not authenticated (and the initial check has finished). */
export function SignedOut({ children }: { children: ReactNode }) {
  const { status } = useSSOAuth();
  return status === 'unauthenticated' ? <>{children}</> : null;
}
