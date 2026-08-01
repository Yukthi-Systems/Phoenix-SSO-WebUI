import { createContext } from 'react';
import type { SSOAuthContextValue } from './types';

export const SSOContext = createContext<SSOAuthContextValue | null>(null);
