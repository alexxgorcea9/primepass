import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import axios from 'axios';
import organizerService from '../services/organizerService';

type VerificationStatus = {
  email_verified: boolean;
  state: 'is_waiting' | 'verified';
  next_step?: string | null;
  resend_available_in?: number;
};

type VerifyEmailResponse = {
  message?: string;
  email_verified: boolean;
};

// Define the shape of your user data
export interface User {
  id: number;
  email: string;
  role: 'organizer' | 'team' | 'guest';
  name: string;
  profile_picture: string;
  email_verified?: boolean;
}

export interface AuthResponse {
  user: User;
}

// Storage keys (only for user data, tokens are in HTTP-only cookies)
const USER_ROLE_KEY = 'auth_user_role';
const USER_DATA_KEY = 'auth_user_data';
const ensureCsrf = async () => {
  try {
    await axiosInstance.get('/api/v1/csrf/');
  } catch {
    // no-op; if CSRF endpoint isn’t there you’ll still be fine for GETs
  }
};

// Define the context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<AuthResponse>;
  signup: (email: string, password: string, role: string) => Promise<AuthResponse>;
  logout: () => void;

  userRole: string | null;
  updateProfile: (profileData: any) => Promise<User>;
  checkEmailExists: (email: string) => Promise<boolean>;

  // OAuth
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

  // Email verification
  verifyEmailToken: (token: string, email?: string) => Promise<VerifyEmailResponse>;
  resendVerificationEmail: (email: string) => Promise<void>;
  getVerificationStatus: () => Promise<VerificationStatus>;
  markEmailVerified: () => void;

  // NEW: for email-link flow to hydrate this tab/session
  refreshUserProfile: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Create an axios instance with proper configuration
const axiosInstance = axios.create({
  baseURL: '', // Use relative URLs to work with your dev proxy
  withCredentials: true, // Important: send cookies with requests
  xsrfCookieName: 'csrftoken', // Django default
  xsrfHeaderName: 'X-CSRFToken',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Start with no user - will be populated after backend verification
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [userRole, setUserRole] = useState<string | null>(() => {
    return (
      sessionStorage.getItem(USER_ROLE_KEY) ||
      localStorage.getItem(USER_ROLE_KEY)
    );
  });
const markEmailVerified = () => {
  setUser(prev => (prev ? { ...prev, email_verified: true } : prev));
};
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
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Try to refresh the token (cookies are sent automatically)
          const res = await axiosInstance.post('/api/token/refresh/', {});
          if (res.data?.success) {
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

  // Helper: clear all local auth data (cookies are managed by backend)
  const clearAuthData = () => {
    setUser(null);
    setUserRole(null);
    [USER_ROLE_KEY, USER_DATA_KEY].forEach(key => {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    });
  };

  // Helper: prime CSRF cookie so POST/PUT/DELETE succeed
  const primeCsrf = async () => {
    try {
      await axiosInstance.get('/api/v1/csrf/');
    } catch (e) {
      // non-fatal in dev
    }
  };

  // Fetch user profile from API and update state/storage
  const refreshUserProfile = async (): Promise<User | null> => {
  try {
    await ensureCsrf();
    const res = await axiosInstance.get('/api/user-profile/');
    const userData = res.data as User;

    setUser(userData);
    setUserRole(userData.role);

    sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    sessionStorage.setItem(USER_ROLE_KEY, userData.role);
    localStorage.setItem(USER_ROLE_KEY, userData.role);

    return userData;
  } catch (err) {
    setUser(null);       // clear stale client state if the call fails
    setUserRole(null);
    return null;
  }
};

  // Enhanced token validation on app initialization
  useEffect(() => {
  const checkAuthStatus = async () => {
    try {
      await primeCsrf();

      // Try to confirm session via verification endpoint (works even when unverified)
      let sessionOk = false;
      try {
        await getVerificationStatus();
        sessionOk = true;
      } catch {
        sessionOk = false;
      }

      if (sessionOk) {
        // If we have a cached user (from signup/login), keep it;
        // If verified now, refresh full profile; if not verified, skip gracefully.
        const cachedUserRaw =
          sessionStorage.getItem(USER_DATA_KEY) || localStorage.getItem(USER_DATA_KEY);
        const cachedUser = cachedUserRaw ? JSON.parse(cachedUserRaw) : null;

        if (cachedUser) {
          setUser(cachedUser);
          setUserRole(cachedUser.role);
        }

        // Attempt full refresh (will succeed only if verified)
        try {
          await refreshUserProfile();
        } catch {
          // ignored — likely unverified; user stays in waiting state
        }
      } else {
        clearAuthData();
      }
    } catch {
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  checkAuthStatus();
}, []);

  const login = async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    try {
      await primeCsrf();
      const res = await axiosInstance.post('/api/login/', { email, password });

      // Backend sets cookies and returns user data
      if (!res.data?.user) {
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
        try {
          const organizerData = await organizerService.getOrganizerByUserId(
            res.data.user.id
          );
          if (organizerData) {
            organizerService.storeOrganizerInSession(organizerData);
          }
        } catch (organizerError) {
          console.error('Error fetching organizer data during login:', organizerError);
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
      await primeCsrf();
      // Ensure role is lowercase (organizer, guest, team)
      const normalizedRole = role.toLowerCase();

      // Send only the necessary data (email, password, role) to the backend
      const res = await axiosInstance.post('/api/signup/', {
        email,
        password,
        role: normalizedRole,
      });

      // Ensure proper structure in response
      if (!res.data?.user) {
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
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    axiosInstance
      .post(
        '/api/logout/',
        {},
        {
          headers: { 'Skip-Auth-Intercept': 'true' },
        }
      )
      .catch(err => console.error('Error during logout:', err))
      .finally(() => {
        setIsLoggingOut(false);
        clearAuthData();
      });
  };

  // Check if an email exists in the database
  const checkEmailExists = async (email: string): Promise<boolean> => {
    console.log('Checking if email exists:', email);

    try {
      // Try dedicated endpoint if present
      try {
        const response = await axiosInstance.post('/api/check-email/', { email });
        if (response.data?.exists !== undefined) {
          return response.data.exists === true;
        }
      } catch {
        // ignore and fallback
      }

      // Fallback: attempt login (validate_only)
      try {
        await axiosInstance.post('/api/login/', {
          email,
          password: 'check_email_exists_dummy_password',
          validate_only: true,
        });
        return true; // unusual but possible
      } catch (loginError: any) {
        if (axios.isAxiosError(loginError)) {
          const status = loginError.response?.status;
          const errorData = loginError.response?.data;

          if (
            status === 404 ||
            (errorData &&
              (errorData.code === 'user_not_found' ||
                errorData.error === 'user_not_found' ||
                (typeof errorData === 'string' &&
                  errorData.toLowerCase().includes('not found'))))
          ) {
            return false;
          }
          if (status === 401 || status === 403) {
            return true;
          }
        }
      }

      // Dev default: assume exists if uncertain
      return true;
    } catch (error) {
      console.error('Error checking email existence:', error);
      return true;
    }
  };

  // Update user profile information
  const updateProfile = async (profileData: any): Promise<User> => {
    if (!user) {
      throw new Error('User must be logged in to update profile');
    }

    try {
      // Replace with real API when ready
      const updatedUser = { ...user, ...profileData };

      // Update local storage + state
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
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
      const response = await axiosInstance.get('/api/auth/google/');
      const authUrl = response.data.authUrl || response.data.auth_url;
      if (!authUrl) throw new Error('No auth URL received from backend');
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
      const response = await axiosInstance.get('/api/auth/instagram/');
      const authUrl = response.data.authUrl || response.data.auth_url;
      if (!authUrl) throw new Error('No auth URL received from backend');
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating Instagram login:', error);
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
      const response = await axiosInstance.get('/api/auth/apple/');
      const authUrl = response.data.authUrl || response.data.auth_url;
      if (!authUrl) throw new Error('No auth URL received from backend');
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
      const response = await axiosInstance.post(
        `/api/auth/${provider}/callback/`,
        { code, state, user: userData, id_token: idToken }
      );

      const data = response.data;

      setUser(data.user);
      setUserRole(data.user.role);

      sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
      sessionStorage.setItem(USER_ROLE_KEY, data.user.role);
      localStorage.setItem(USER_ROLE_KEY, data.user.role);

      return data;
    } catch (error) {
      console.error(`Error handling ${provider} OAuth callback:`, error);
      throw error;
    }
  };

  //Email verification helpers
 const verifyEmailToken = async (token: string, email?: string) => {
  await ensureCsrf();
  const body = { token, email }; // backend expects both
  const res = await axiosInstance.post('/api/verify-email/', body);
  return {
    email_verified: !!res.data?.email_verified || res.status === 200,
    message: res.data?.message,
  };
};

const resendVerificationEmail = async (email: string): Promise<void> => {
  await ensureCsrf();
  await axiosInstance.post('/api/resend-verification-email/', { email });
};

const getVerificationStatus = async () => {
  const { data } = await axiosInstance.get('/api/verification-status/');
  return {
    email_verified: !!data?.email_verified,
    state: data?.state || (data?.email_verified ? 'verified' : 'is_waiting'),
    next_step: data?.next_step ?? null,
    resend_available_in:
      typeof data?.resend_available_in === 'number' ? data.resend_available_in : 0,
  };
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
        verifyEmailToken,
        resendVerificationEmail,
        getVerificationStatus,
        refreshUserProfile,
        markEmailVerified,
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
