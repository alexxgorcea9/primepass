import axios from 'axios';

// Use relative URL to leverage Vite's proxy configuration
const API_BASE_URL = '/api';

// Axios instance with credentials for cookie-based auth
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important: sends cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add CSRF token to requests if available
apiClient.interceptors.request.use((config) => {
  console.log('[Axios Interceptor] Request config:', {
    url: config.url,
    method: config.method,
    dataType: config.data?.constructor?.name,
    isFormData: config.data instanceof FormData,
    headers: config.headers
  });

  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];

  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }

  // Remove Content-Type for FormData to let browser set it with boundary
  if (config.data instanceof FormData) {
    console.log('[Axios Interceptor] Detected FormData, deleting Content-Type header');
    delete config.headers['Content-Type'];
    console.log('[Axios Interceptor] Headers after deletion:', config.headers);
  }

  return config;
});

// Add response interceptor with token refresh logic
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh for token refresh endpoint itself
    if (originalRequest?.url?.includes('/token/refresh/')) {
      return Promise.reject(error);
    }

    // If 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token (cookies are sent automatically)
        const response = await apiClient.post('/api/token/refresh/', {});
        
        if (response.data?.success) {
          // Cookies are updated automatically by the backend
          processQueue(null, 'success');
          isRefreshing = false;
          
          // Retry the original request
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Clear user data and redirect to login
        const keysToRemove = ['auth_user_role', 'auth_user_data'];
        keysToRemove.forEach(key => {
          sessionStorage.removeItem(key);
          localStorage.removeItem(key);
        });
        
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export { API_BASE_URL };
export default apiClient;