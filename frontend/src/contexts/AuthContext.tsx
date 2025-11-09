import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import axios from 'axios';
import apiClient from '../api/axios'; // Import configured axios with interceptors
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
  profile_picture?: string;
  banner_media?: string;
  phone_number?: string;
  birth_date?: string;
  organizer_bio?: string;
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

// Add request interceptor to handle FormData properly
axiosInstance.interceptors.request.use((config) => {
  console.log('[AuthContext Interceptor] Request config:', {
    url: config.url,
    method: config.method,
    dataType: config.data?.constructor?.name,
    isFormData: config.data instanceof FormData,
    contentType: config.headers['Content-Type']
  });

  // Remove Content-Type for FormData to let browser set it with boundary
  if (config.data instanceof FormData) {
    console.log('[AuthContext Interceptor] Detected FormData, deleting Content-Type header');
    delete config.headers['Content-Type'];
    console.log('[AuthContext Interceptor] Headers after deletion:', config.headers);
  }

  return config;
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
          // Only log refresh errors if we have a user (expected to be authenticated)
          if (user) {
            console.log('Session expired, please log in again');
          }
          // If refresh fails, clear auth data silently
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
    
    // Transform camelCase response to snake_case for User interface
    const userData: User = {
      id: res.data.id,
      email: res.data.email,
      role: res.data.role,
      name: res.data.name,
      profile_picture: res.data.profilePicture || res.data.profile_picture,
      banner_media: res.data.bannerMedia || res.data.banner_media,
      organizer_bio: res.data.organizerBio || res.data.organizer_bio,
      email_verified: res.data.emailVerified || res.data.email_verified,
      phone_number: res.data.phoneNumber || res.data.phone_number,
      birth_date: res.data.birthDate || res.data.birth_date,
    };

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

      // Check if we have cached user data first
      const cachedUserRaw =
        sessionStorage.getItem(USER_DATA_KEY) || localStorage.getItem(USER_DATA_KEY);
      const cachedUser = cachedUserRaw ? JSON.parse(cachedUserRaw) : null;

      // Only attempt session verification if we have cached user data
      if (cachedUser) {
        setUser(cachedUser);
        setUserRole(cachedUser.role);

        // Verify the session is still valid
        let sessionOk = false;
        try {
          await getVerificationStatus();
          sessionOk = true;
        } catch (error: any) {
          // Session expired or invalid - clear auth data
          console.log('Session validation failed, clearing auth data');
          sessionOk = false;
        }

        if (sessionOk) {
          // Attempt full refresh (will succeed only if verified)
          try {
            await refreshUserProfile();
          } catch {
            // ignored — likely unverified; user stays in waiting state
          }
        } else {
          clearAuthData();
        }
      } else {
        // No cached user, clear any stale data
        clearAuthData();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
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

      // Transform camelCase to snake_case
      const userData: User = {
        id: res.data.user.id,
        email: res.data.user.email,
        role: res.data.user.role,
        name: res.data.user.name,
        profile_picture: res.data.user.profilePicture || res.data.user.profile_picture,
        banner_media: res.data.user.bannerMedia || res.data.user.banner_media,
        organizer_bio: res.data.user.organizerBio || res.data.user.organizer_bio,
        email_verified: res.data.user.emailVerified || res.data.user.email_verified,
        phone_number: res.data.user.phoneNumber || res.data.user.phone_number,
        birth_date: res.data.user.birthDate || res.data.user.birth_date,
      };

      // Set user data
      setUser(userData);
      setUserRole(userData.role);

      // Store user data
      sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      sessionStorage.setItem(USER_ROLE_KEY, userData.role);
      localStorage.setItem(USER_ROLE_KEY, userData.role);

      // If the user is an organizer, immediately fetch and store organizer data
      if (userData.role === 'organizer' && userData.id) {
        try {
          const organizerData = await organizerService.getOrganizerByUserId(
            userData.id
          );
          if (organizerData) {
            organizerService.storeOrganizerInSession(organizerData);
          }
        } catch (organizerError) {
          console.error('Error fetching organizer data during login:', organizerError);
        }
      }

      return { user: userData };
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

      // Transform camelCase to snake_case
      const userData: User = {
        id: res.data.user.id,
        email: res.data.user.email,
        role: res.data.user.role,
        name: res.data.user.name,
        profile_picture: res.data.user.profilePicture || res.data.user.profile_picture,
        banner_media: res.data.user.bannerMedia || res.data.user.banner_media,
        organizer_bio: res.data.user.organizerBio || res.data.user.organizer_bio,
        email_verified: res.data.user.emailVerified || res.data.user.email_verified,
        phone_number: res.data.user.phoneNumber || res.data.user.phone_number,
        birth_date: res.data.user.birthDate || res.data.user.birth_date,
      };

      // Set user data
      setUser(userData);
      setUserRole(userData.role);

      // Store user data
      sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      sessionStorage.setItem(USER_ROLE_KEY, userData.role);
      localStorage.setItem(USER_ROLE_KEY, userData.role);

      return { user: userData };
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
      await primeCsrf();
      
      // Create FormData for multipart/form-data if there are files
      const hasFiles = profileData.profile_picture instanceof File || profileData.banner_media instanceof File;
      
      let requestData: any;
      
      if (hasFiles) {
        const formData = new FormData();
        
        // Add text fields
        if (profileData.name !== undefined) formData.append('name', profileData.name);
        if (profileData.organizer_bio !== undefined) formData.append('organizer_bio', profileData.organizer_bio);
        
        // Add files
        if (profileData.profile_picture instanceof File) {
          formData.append('profile_picture', profileData.profile_picture);
          console.log('Adding profile_picture to FormData:', profileData.profile_picture.name);
        }
        if (profileData.banner_media instanceof File) {
          formData.append('banner_media', profileData.banner_media);
          console.log('Adding banner_media to FormData:', profileData.banner_media.name);
        }
        
        requestData = formData;
        console.log('Sending FormData with files to /api/update-profile/');
        console.log('requestData type:', requestData instanceof FormData ? 'FormData' : typeof requestData);
        console.log('requestData:', requestData);
        // Don't set Content-Type manually - axios will set it with the correct boundary
      } else {
        // JSON request for text-only updates
        requestData = profileData;
        console.log('Sending JSON data to /api/update-profile/:', requestData);
      }
      
      console.log('About to send request. RequestData instanceof FormData?', requestData instanceof FormData);
      
      const res = await axiosInstance.patch('/api/update-profile/', requestData);
      console.log('Update profile response:', res.data);
      
      // Transform camelCase response to snake_case for User interface
      const updatedUser: User = {
        id: res.data.id,
        email: res.data.email,
        role: res.data.role,
        name: res.data.name,
        profile_picture: res.data.profilePicture || res.data.profile_picture,
        banner_media: res.data.bannerMedia || res.data.banner_media,
        organizer_bio: res.data.organizerBio || res.data.organizer_bio,
        email_verified: res.data.emailVerified || res.data.email_verified,
        phone_number: res.data.phoneNumber || res.data.phone_number,
        birth_date: res.data.birthDate || res.data.birth_date,
      };

      console.log('Transformed user data:', updatedUser);

      // Update state and storage
      setUser(updatedUser);
      sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));

      return updatedUser;
    } catch (error) {
      console.error('Error updating profile:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
      }
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

      // Transform camelCase to snake_case
      const transformedUser: User = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        name: data.user.name,
        profile_picture: data.user.profilePicture || data.user.profile_picture,
        banner_media: data.user.bannerMedia || data.user.banner_media,
        organizer_bio: data.user.organizerBio || data.user.organizer_bio,
        email_verified: data.user.emailVerified || data.user.email_verified,
        phone_number: data.user.phoneNumber || data.user.phone_number,
        birth_date: data.user.birthDate || data.user.birth_date,
      };

      setUser(transformedUser);
      setUserRole(transformedUser.role);

      sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(transformedUser));
      sessionStorage.setItem(USER_ROLE_KEY, transformedUser.role);
      localStorage.setItem(USER_ROLE_KEY, transformedUser.role);

      return { user: transformedUser };
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
