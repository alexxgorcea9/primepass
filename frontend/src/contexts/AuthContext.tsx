import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import axios from 'axios';
import organizerService from '../services/organizerService';

// Define the shape of your user data
export interface User {
  id: number;
  email: string;
  role: 'organizer' | 'team' | 'guest';
  name: string;
  profile_picture: string;
}

export interface AuthResponse {
  user: User;
}

// Storage keys (only for user data, tokens are in HTTP-only cookies)
const USER_ROLE_KEY = 'auth_user_role';
const USER_DATA_KEY = 'auth_user_data';

// Define the context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  signup: (
    email: string,
    password: string,
    role: string
  ) => Promise<AuthResponse>;
  logout: () => void;
  userRole: string | null;
  updateProfile: (profileData: any) => Promise<User>;
  checkEmailExists: (email: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  loginWithInstagram: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  handleOAuthCallback: (
    provider: string,
    code: string,
    state: string,
    userData?: any,
    idToken?: string
  ) => Promise<AuthResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Create an axios instance with proper configuration
const axiosInstance = axios.create({
  baseURL: '', // Use relative URLs to work with the Vite proxy
  withCredentials: true, // Important: send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Start with no user - will be populated after backend verification
  // This prevents stale cached data from appearing as authenticated
  const [user, setUser] = useState<User | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [userRole, setUserRole] = useState<string | null>(() => {
    return (
      sessionStorage.getItem(USER_ROLE_KEY) ||
      localStorage.getItem(USER_ROLE_KEY)
    );
  });

  // Flag to prevent recursive logout calls
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  // Authentication is determined by having a user (tokens are in HTTP-only cookies)
  const isAuthenticated = !!user;

  // Intercept 401 responses to handle token expiration
  axiosInstance.interceptors.response.use(
    response => response,
    async error => {
      const originalRequest = error.config;

      // Skip auth intercept for logout requests, refresh requests, or if we're already logging out
      if (
        originalRequest?.headers?.['Skip-Auth-Intercept'] ||
        originalRequest?.url?.includes('/token/refresh/') ||
        isLoggingOut
      ) {
        return Promise.reject(error);
      }

      // If the error is 401 and we haven't tried refreshing yet
      if (
        error.response?.status === 401 &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;

        try {
          // Try to refresh the token (cookies are sent automatically)
          const res = await axiosInstance.post('/api/token/refresh/', {});

          if (res.data.success) {
            // Cookies are updated automatically, just retry the request
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // If refresh fails, clear auth data and logout
          clearAuthData();
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  // Helper function to clear all auth data
  const clearAuthData = () => {
    setUser(null);
    setUserRole(null);

    // Clear user data from storage (tokens are in cookies and cleared by backend)
    const keysToRemove = [
      USER_ROLE_KEY,
      USER_DATA_KEY,
    ];
    keysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    });
  };

  // Enhanced token validation on app initialization
  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedUser =
        sessionStorage.getItem(USER_DATA_KEY) ||
        localStorage.getItem(USER_DATA_KEY);
      const storedRole =
        sessionStorage.getItem(USER_ROLE_KEY) ||
        localStorage.getItem(USER_ROLE_KEY);

      // Always verify with backend before trusting cached data
      // This prevents stale cached data from appearing as authenticated
      try {
        // Try to fetch user profile - this will validate the session
        await fetchUserProfile();
      } catch (error) {
        console.warn('Session validation failed:', error);
        // Clear any stale cached data
        clearAuthData();
      }
      
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Fetch user profile from API
  const fetchUserProfile = async () => {
    try {
      const res = await axiosInstance.get('/api/user-profile/');
      const userData = res.data;

      setUser(userData);
      setUserRole(userData.role);

      // Store user data in session storage
      sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      sessionStorage.setItem(USER_ROLE_KEY, userData.role);

      // Also in local storage for persistence
      localStorage.setItem(USER_ROLE_KEY, userData.role);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    try {
      const res = await axiosInstance.post('/api/login/', { email, password });

      // Backend sets cookies and returns user data
      if (!res.data.user) {
        throw new Error('Invalid response format from server');
      }

      // Set user data
      setUser(res.data.user);
      setUserRole(res.data.user.role);

      // Store user data
      sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(res.data.user));
      sessionStorage.setItem(USER_ROLE_KEY, res.data.user.role);
      localStorage.setItem(USER_ROLE_KEY, res.data.user.role);

      // If the user is an organizer, immediately fetch and store organizer data
      if (res.data.user.role === 'organizer' && res.data.user.id) {
        console.log(
          'User is an organizer. Fetching organizer data immediately after login...'
        );
        try {
          const organizerData = await organizerService.getOrganizerByUserId(
            res.data.user.id
          );
          if (organizerData) {
            // Store in session
            organizerService.storeOrganizerInSession(organizerData);
            console.log(
              'Successfully fetched and stored organizer data during login:',
              organizerData
            );
          } else {
            console.error('Failed to fetch organizer data during login');
          }
        } catch (organizerError) {
          console.error(
            'Error fetching organizer data during login:',
            organizerError
          );
          // We don't rethrow this error as it shouldn't block the login process
        }
      }

      return res.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (
    email: string,
    password: string,
    role: string
  ): Promise<AuthResponse> => {
    try {
      // Ensure role is lowercase (organizer, guest, team)
      const normalizedRole = role.toLowerCase();
      
      // Send only the necessary data (email, password, role) to the backend
      const res = await axiosInstance.post('/api/signup/', {
        email,
        password,
        role: normalizedRole,
      });

      // Ensure proper structure in response
      if (!res.data.user) {
        throw new Error('Invalid response format from server');
      }

      // Set user data
      setUser(res.data.user);
      setUserRole(res.data.user.role);

      // Store user data
      sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(res.data.user));
      sessionStorage.setItem(USER_ROLE_KEY, res.data.user.role);
      localStorage.setItem(USER_ROLE_KEY, res.data.user.role);

      return res.data;
    } catch (error) {
      console.error('Signup error:', error);

      // Log detailed error response data for debugging
      if (axios.isAxiosError(error) && error.response) {
        console.error('Signup error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
        });
      }

      throw error;
    }
  };

  const logout = () => {
    // Prevent recursive logout calls
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    // Call the logout API to clear cookies on the backend
    axiosInstance
      .post(
        '/api/logout/',
        {},
        {
          // Prevent this request from triggering the 401 interceptor
          headers: {
            'Skip-Auth-Intercept': 'true',
          },
        }
      )
      .catch(err => console.error('Error during logout:', err))
      .finally(() => {
        setIsLoggingOut(false);
        // Clear all auth data
        clearAuthData();
      });
  };

  // Check if an email exists in the database
  const checkEmailExists = async (email: string): Promise<boolean> => {
    console.log('Checking if email exists:', email);

    try {
      // First try the dedicated endpoint if it exists
      try {
        const response = await axiosInstance.post('/api/check-email/', {
          email,
        });
        console.log('Check email response:', response.data);

        if (response.data?.exists !== undefined) {
          return response.data.exists === true;
        }
      } catch (apiError) {
        console.log('API endpoint not available, using fallback method');
        // Continue to fallback if endpoint doesn't exist
      }

      // FALLBACK: Try a preliminary login request
      try {
        // Use a dummy password that's almost certainly wrong
        await axiosInstance.post('/api/login/', {
          email,
          password: 'check_email_exists_dummy_password',
          validate_only: true,
        });

        // If no error thrown, user likely exists (unusual case)
        return true;
      } catch (loginError: any) {
        if (axios.isAxiosError(loginError)) {
          const status = loginError.response?.status;
          const errorData = loginError.response?.data;

          console.log('Login check status:', status);
          console.log('Login check error data:', errorData);

          // Most APIs return 404 for user not found, 401/403 for password wrong
          if (
            status === 404 ||
            (errorData &&
              (errorData.code === 'user_not_found' ||
                errorData.error === 'user_not_found' ||
                (typeof errorData === 'string' &&
                  errorData.toLowerCase().includes('not found'))))
          ) {
            return false; // Email doesn't exist
          }

          // If we get auth errors, the user exists but password is wrong
          if (status === 401 || status === 403) {
            return true; // Email exists
          }
        }
      }

      // TEMPORARY: For testing only - assume email exists for now
      console.log('Using temporary fallback - assuming email exists');
      return true;
    } catch (error) {
      console.error('Error checking email existence:', error);
      console.log('Error occurred - defaulting to assume email exists');
      return true;
    }
  };

  // Update user profile information
  const updateProfile = async (profileData: any): Promise<User> => {
    if (!user) {
      throw new Error('User must be logged in to update profile');
    }

    try {
      // Make the API call to update the profile
      // This is a mock implementation - replace with your actual API endpoint
      // const response = await axiosInstance.put(`/api/users/${user.id}/profile`, profileData);

      // For now, simulate a successful response by updating the local user data
      const updatedUser = { ...user, ...profileData };

      // Update local storage
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));

      // Update state
      setUser(updatedUser);

      return updatedUser;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // OAuth login methods
  const loginWithGoogle = async (): Promise<void> => {
    try {
      console.log('Requesting Google OAuth URL from backend...');
      // Request authorization URL from backend
      const response = await axiosInstance.get('/api/auth/google/');
      console.log('Backend response:', response.data);
      
      // Backend returns camelCase (authUrl) due to DRF camelCase serializer
      const authUrl = response.data.authUrl || response.data.auth_url;
      
      if (!authUrl) {
        throw new Error('No auth URL received from backend');
      }
      
      console.log('Redirecting to Google OAuth URL:', authUrl);
      // Redirect to Google OAuth consent screen
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating Google login:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      throw error;
    }
  };

  const loginWithInstagram = async (): Promise<void> => {
    try {
      // Request authorization URL from backend
      const response = await axiosInstance.get('/api/auth/instagram/');
      const authUrl = response.data.authUrl || response.data.auth_url;

      if (!authUrl) {
        throw new Error('No auth URL received from backend');
      }

      // Redirect to Instagram OAuth consent screen
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating Instagram login:', error);
      
      // Check if it's a configuration error
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;
        if (errorData.error === 'not_configured' || error.response.status === 503) {
          alert('Instagram login is not yet configured. Please use Google or Apple Sign In instead.');
          return;
        }
      }
      
      throw error;
    }
  };

  const loginWithApple = async (): Promise<void> => {
    try {
      // Request authorization URL from backend
      const response = await axiosInstance.get('/api/auth/apple/');
      const authUrl = response.data.authUrl || response.data.auth_url;

      if (!authUrl) {
        throw new Error('No auth URL received from backend');
      }

      // Redirect to Apple OAuth consent screen
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating Apple login:', error);
      throw error;
    }
  };

  // Handle OAuth callback from any provider
  const handleOAuthCallback = async (
    provider: string,
    code: string,
    state: string,
    userData?: any,
    idToken?: string
  ): Promise<AuthResponse> => {
    try {
      // Call appropriate backend endpoint based on provider
      const response = await axiosInstance.post(
        `/api/auth/${provider}/callback/`,
        {
          code,
          state,
          user: userData, // Only used by Apple
          id_token: idToken, // For Apple Sign In
        }
      );

      const data = response.data;

      // Update local state
      setUser(data.user);
      setUserRole(data.user.role);

      // Store user data
      sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
      sessionStorage.setItem(USER_ROLE_KEY, data.user.role);
      localStorage.setItem(USER_ROLE_KEY, data.user.role);

      return data;
    } catch (error) {
      console.error(`Error handling ${provider} OAuth callback:`, error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        signup,
        logout,
        userRole,
        updateProfile,
        checkEmailExists,
        loginWithGoogle,
        loginWithInstagram,
        loginWithApple,
        handleOAuthCallback,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
