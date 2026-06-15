import { atomWithStorage } from 'jotai/utils';

export const userAtom = atomWithStorage('sso_user_profile', null);
export const sessionExpirationAtom = atomWithStorage('sso_session_expiration', null);
