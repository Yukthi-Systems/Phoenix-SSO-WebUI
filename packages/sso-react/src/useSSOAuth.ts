import { useContext } from 'react';
import { SSOContext } from './SSOContext';
import type { SSOAuthContextValue } from './types';

/** Consumes the SSO auth state. Must be used within an `<SSOProvider>`. */
export function useSSOAuth(): SSOAuthContextValue {
  const context = useContext(SSOContext);
  if (!context) {
    throw new Error('useSSOAuth must be used within an <SSOProvider>.');
  }
  return context;
}
