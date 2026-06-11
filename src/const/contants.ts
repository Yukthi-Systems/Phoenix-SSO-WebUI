const getEnv = (key: string, defaultValue: string) => {
    if (typeof window !== 'undefined' && window._env_ && window._env_[key]) {
        return window._env_[key]
    }
    return import.meta.env[key] || defaultValue
}

export const API_URL = getEnv('API_URL', 'https://sso.yukthi.net');
export const SSO_URL = getEnv('SSO_URL', 'https://sso.yukthi.net');
export const FORGOT_PASSWORD_URL = getEnv('FORGOT_PASSWORD_URL', 'https://v3-admin-ui.test.yukthi.net/reset/admin');