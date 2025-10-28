import axios from 'axios';
import { getCSRFToken } from '../utils/csrf';

// Use empty base URL to use relative paths
// This leverages Vite's proxy configuration in development
// and allows the app to work with any domain in production
const BASE_URL = '';

// Create axios instance with cookie-based authentication
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Important: send cookies with requests
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 15000,
});

// Helper function to clear user data from storage
const clearUserData = () => {
  const keysToRemove = [
    'auth_user_role',
    'auth_user_data',
  ];
  keysToRemove.forEach(key => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
};

// Add request interceptor to include CSRF token
axiosInstance.interceptors.request.use(
  config => {
    // Add CSRF token for state-changing methods
    const method = config.method?.toUpperCase();
    if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const csrfToken = getCSRFToken();
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      } else {
        console.warn('CSRF token not available for', method, 'request to', config.url);
      }
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor for 401 and 403 handling
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      clearUserData();

      // Redirect to login for protected routes
      const isPublicEndpoint =
        error.config?.url?.includes('/api/events/') ||
        error.config?.url?.includes('/api/health');

      if (
        !isPublicEndpoint &&
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/'
      ) {
        window.location.href = '/login';
      }
    }

    // Handle 403 Forbidden (likely CSRF failure)
    if (error.response?.status === 403) {
      console.error('CSRF validation failed. This might be a CSRF token issue.');
      
      // Check if it's a CSRF error
      const errorDetail = error.response?.data?.detail || '';
      if (errorDetail.toLowerCase().includes('csrf')) {
        console.error('CSRF token missing or invalid. Reloading to fetch new token...');
        // Optionally reload the page to fetch a fresh CSRF token
        // window.location.reload();
      }
    }

    return Promise.reject(error);
  }
);

// Export BASE_URL for use in other modules
export { BASE_URL };

export const api = {
  get: (endpoint: string) => axiosInstance.get(endpoint),
  post: (endpoint: string, data: any) => axiosInstance.post(endpoint, data),
  put: (endpoint: string, data: any) => axiosInstance.put(endpoint, data),
  delete: (endpoint: string) => axiosInstance.delete(endpoint),
};

// Table API functions
export const tableApi = {
  // Get all tables for a specific tier within an event
  getTierTables: async (eventId: string | number, tierId: string | number) => {
    const response = await api.get(
      `/api/events/${eventId}/tiers/${tierId}/tables/`
    );
    return response.data;
  },

  // Reserve a table
  reserveTable: async (tableId: string | number) => {
    const response = await api.post(`/api/tables/${tableId}/reserve/`, {});
    return response.data;
  },

  // Unreserve a table
  unreserveTable: async (tableId: string | number) => {
    const response = await api.post(`/api/tables/${tableId}/unreserve/`, {});
    return response.data;
  },
};

// Add-On API functions
export const addOnApi = {
  // Get all add-ons for a specific tier
  getTierAddOns: async (tierId: string | number) => {
    const response = await api.get(`/api/tiers/${tierId}/add-ons/`);
    return response.data;
  },

  // Add an add-on to cart/selection
  addToCart: async (addOnId: string | number, quantity: number = 1) => {
    const response = await api.post(`/api/add-ons/${addOnId}/add/`, {
      quantity,
    });
    return response.data;
  },

  // Remove an add-on from cart/selection
  removeFromCart: async (addOnId: string | number) => {
    const response = await api.post(`/api/add-ons/${addOnId}/remove/`, {});
    return response.data;
  },
};
