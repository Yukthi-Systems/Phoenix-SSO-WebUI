import axios from 'axios';

// Create configured Axios client
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://sso.yukthi.net',
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
      // Return a structured error response that can be handled locally
      return Promise.reject({
        status,
        message: data?.error || 'Your security session has expired.',
        code: 'SESSION_EXPIRED',
        originalError: error,
      });
    }

    // Pass on other errors
    return Promise.reject({
      status,
      message: data?.error || data?.message || 'An unexpected authentication error occurred.',
      originalError: error,
    });
  }
);

export default apiClient;
