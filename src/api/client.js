import axios from 'axios';
import { API_URL } from '../const/contants';

// Create configured Axios client
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true, // Crucial: Send HttpOnly cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if network error or server down
    if (!error.response) {
      console.error('Network/Server error encountered:', error);
      return Promise.reject({
        message: 'Unable to connect to security server. Please verify your connection.',
        originalError: error,
      });
    }

    const { status, data } = error.response;

    // Handle global expired session state (401)
    if (status === 401) {
      const requestUrl = error.config?.url || '';

      // OTP endpoints legitimately return 401 for wrong/expired codes.
      // Do NOT redirect — surface the error message to the screen instead.
      const isOtpEndpoint = requestUrl.includes('/auth/otp/');

      if (!isOtpEndpoint) {
        // Clear client-accessible cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        // Avoid redirecting if already on login page or if the request was to the login endpoint
        if (
          window.location.pathname !== '/login' &&
          (!error.config?.url?.includes('/auth/login')) &&
          (!error.config?.url?.includes('/auth/logout'))
        ) {
          window.location.href = '/login';
        }
      }

      // Return a structured error response that can be handled locally
      return Promise.reject({
        status,
        message: (typeof data === 'string' ? data : (data?.error || data?.message || data?.detail)) || (isOtpEndpoint ? 'Invalid or expired OTP code.' : 'Your security session has expired.'),
        code: isOtpEndpoint ? 'OTP_ERROR' : 'SESSION_EXPIRED',
        originalError: error,
      });
    }

    // Pass on other errors
    return Promise.reject({
      status,
      message: (typeof data === 'string' ? data : (data?.error || data?.message || data?.detail)) || 'An unexpected authentication error occurred.',
      originalError: error,
    });
  }
);

export default apiClient;
