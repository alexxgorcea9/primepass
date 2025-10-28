// src/routes/AuthGuard.tsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'organizer' | 'team' | 'guest'>;
  mustBeVerified?: boolean;
}

const AuthGuard: React.FC<RoleProtectedRouteProps> = ({
  children,
  allowedRoles,
  mustBeVerified = false,
}) => {
  const { user, isAuthenticated, isLoading, getVerificationStatus, markEmailVerified } = useAuth();
  const location = useLocation();
  const [checkingVerify, setCheckingVerify] = useState(false);

  // Public: /verify-email always allowed (both awaiting + link-landing modes)
  if (location.pathname.startsWith('/verify-email')) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0A0A0A]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const from = (location.state as any)?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  // If the route requires verification but client says false, double-check server
  if (mustBeVerified && !user.email_verified) {
  const justVerified = sessionStorage.getItem('pp_just_verified') === '1';
  if (justVerified) {
    // allow this navigation once; clean up the latch
    sessionStorage.removeItem('pp_just_verified');

    // in the background, confirm + hydrate so future checks are clean
    (async () => {
      try {
        const s = await getVerificationStatus();
        if (s.email_verified) {
          markEmailVerified();
          // optional: if you have a refresh here, call it
          // await refreshUserProfile(); // if exposed here
        }
      } catch {}
    })();

    return <>{children}</>;
  }

  // Make a single round-trip check
  if (!checkingVerify) {
    setCheckingVerify(true);
    (async () => {
      try {
        const s = await getVerificationStatus();
        if (s.email_verified) {
          markEmailVerified(); // update local user state so future checks pass
        }
      } catch {
        // ignore – we’ll redirect below
      } finally {
        setCheckingVerify(false);
      }
    })();
    return (
      <div className="flex h-screen items-center justify-center bg-[#0A0A0A]">
        <div className="text-white">Checking verification…</div>
      </div>
    );
  }

  // After check, if still unverified -> redirect to verify flow
  if (!user.email_verified) {
    return (
      <Navigate
        to="/verify-email"
        state={{ from: location, role: user.role, email: user.email }}
        replace
      />
    );
  }
}


  return <>{children}</>;
};

export default AuthGuard;
