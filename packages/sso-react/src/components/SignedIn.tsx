import type { ReactNode } from 'react';
import { useSSOAuth } from '../useSSOAuth';

/** Renders its children only when the user is authenticated. */
export function SignedIn({ children }: { children: ReactNode }) {
  const { status } = useSSOAuth();
  return status === 'authenticated' ? <>{children}</> : null;
}
