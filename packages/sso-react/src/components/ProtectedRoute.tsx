import type { ReactNode } from 'react';
import { useSSOAuth } from '../useSSOAuth';

export interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * Rendered when the user is not authenticated. Deliberately not a redirect
   * path — this package doesn't assume any particular router. Pass your own
   * router's redirect element here, e.g. `<Navigate to="/login" replace />`.
   */
  fallback: ReactNode;
  /** Rendered while the initial session check is in flight. Default: null. */
  loading?: ReactNode;
}

/** Gates its children behind SSO authentication status. */
export function ProtectedRoute({ children, fallback, loading = null }: ProtectedRouteProps) {
  const { status } = useSSOAuth();

  if (status === 'checking') return <>{loading}</>;
  if (status !== 'authenticated') return <>{fallback}</>;
  return <>{children}</>;
}
