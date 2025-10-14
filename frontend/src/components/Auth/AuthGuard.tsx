import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'organizer' | 'team' | 'guest'>;
}

/**
 * Universal auth guard component that protects routes with authentication and optional role checking.
 * - Always checks authentication first, redirects to login if not authenticated
 * - If allowedRoles is provided, also checks user role and silently redirects if not authorized
 * - If allowedRoles is not provided, only authentication is required
 */
const AuthGuard: React.FC<RoleProtectedRouteProps> = ({
  children, 
  allowedRoles 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0A0A0A]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Redirect to welcome page if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check if user has the required role (only if allowedRoles is specified)
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Silently redirect back to where they came from, or to home page
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  // User is authenticated and (if specified) has the required role
  return <>{children}</>;
};

export default AuthGuard;
