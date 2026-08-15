import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:5001',
  // Do NOT set a default Content-Type here — axios will automatically set
  // 'application/json' for plain objects and 'multipart/form-data' with
  // the correct boundary when the data is a FormData instance.
});

// Attach JWT token from persisted auth store on every request
apiClient.interceptors.request.use((config) => {
  const stored = localStorage.getItem('auth-storage');
  if (stored) {
    try {
      const token = JSON.parse(stored)?.state?.token;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {}
  }
  return config;
});

// Global response error handling:
//   401       → clear session and redirect to login (handles JWT expiry)
//   403       → reject with original error (user is logged in but not authorised for that resource)
//   5xx       → normalise error message to "Terjadi kesalahan, coba lagi"
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Only treat 401 as JWT expiry if the request had a Bearer token.
      // A 401 on /api/auth/login or /api/auth/register means wrong credentials,
      // not an expired token — don't clear session or redirect in those cases.
      const requestUrl = (error.config?.url ?? '') as string;
      const isAuthEndpoint =
        requestUrl.includes('/api/auth/login') ||
        requestUrl.includes('/api/auth/register');

      if (!isAuthEndpoint) {
        // JWT expired or invalid — force re-login
        localStorage.removeItem('auth-storage');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }

    if (status !== undefined && status >= 500) {
      // Normalise server errors into a user-friendly message
      const serverError = new Error('Terjadi kesalahan, coba lagi') as Error & {
        isServerError: boolean;
        originalError: unknown;
      };
      serverError.isServerError = true;
      serverError.originalError = error;
      return Promise.reject(serverError);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
