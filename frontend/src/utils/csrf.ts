/**
 * CSRF Protection Utilities
 * 
 * This module handles CSRF token management for cookie-based authentication.
 * Django's CSRF protection requires a token to be sent with state-changing requests.
 */

const CSRF_COOKIE_NAME = 'csrftoken';
const CSRF_HEADER_NAME = 'X-CSRFToken';

/**
 * Get CSRF token from cookies
 * 
 * @returns CSRF token string or null if not found
 */
export function getCSRFToken(): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${CSRF_COOKIE_NAME}=`);
  
  if (parts.length === 2) {
    const token = parts.pop()?.split(';').shift();
    return token || null;
  }
  
  return null;
}

/**
 * Initialize CSRF protection by fetching a token from the backend
 * 
 * This should be called when the application starts to ensure
 * a CSRF token is available for subsequent requests.
 * 
 * Uses relative URL to leverage Vite's proxy configuration.
 * 
 * @returns Promise that resolves when CSRF token is fetched
 */
export async function initCSRF(): Promise<void> {
  try {
    const response = await fetch('/api/v1/csrf/', {
      method: 'GET',
      credentials: 'include', // Important: Include cookies
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch CSRF token:', response.status);
      return;
    }

    const data = await response.json();
    console.log('CSRF token initialized:', data.detail);
  } catch (error) {
    console.error('Error initializing CSRF token:', error);
    // Don't throw - app should continue even if CSRF init fails
  }
}

/**
 * Check if a CSRF token is currently available
 * 
 * @returns true if CSRF token exists in cookies
 */
export function hasCSRFToken(): boolean {
  return getCSRFToken() !== null;
}

/**
 * Get the CSRF header name used by Django
 * 
 * @returns The header name for CSRF tokens
 */
export function getCSRFHeaderName(): string {
  return CSRF_HEADER_NAME;
}

/**
 * Check if an HTTP method requires CSRF protection
 * 
 * @param method - HTTP method (GET, POST, PUT, etc.)
 * @returns true if method requires CSRF token
 */
export function requiresCSRF(method: string): boolean {
  const safeMethoda = ['GET', 'HEAD', 'OPTIONS', 'TRACE'];
  return !safeMethoda.includes(method.toUpperCase());
}

/**
 * Get CSRF headers object for a request
 * 
 * Returns an object with the CSRF header if a token is available
 * and the request method requires CSRF protection.
 * 
 * @param method - HTTP method
 * @returns Object with CSRF header or empty object
 */
export function getCSRFHeaders(method: string = 'GET'): Record<string, string> {
  if (!requiresCSRF(method)) {
    return {};
  }

  const token = getCSRFToken();
  if (!token) {
    console.warn('CSRF token not available for', method, 'request');
    return {};
  }

  return {
    [CSRF_HEADER_NAME]: token,
  };
}
