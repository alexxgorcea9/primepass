import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getRedirectPath } from '@/utils/pathUtils';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const hasProcessed = React.useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasProcessed.current) {
      return;
    }
    hasProcessed.current = true;

    const processCallback = async () => {
      try {
        // Extract provider from the path
        const pathParts = location.pathname.split('/');
        const providerIndex = pathParts.indexOf('oauth') + 1;
        const provider = pathParts[providerIndex];

        if (!provider) {
          throw new Error('Provider not specified');
        }

        // Get OAuth parameters from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        
        // For Apple, also get id_token from URL (Apple uses form_post, but can also be in URL)
        const idToken = searchParams.get('id_token');

        if (!code || !state) {
          throw new Error('Missing OAuth parameters');
        }

        // For Apple, also get the user data if provided (only on first sign-in)
        const userData = searchParams.get('user');
        const parsedUserData = userData ? JSON.parse(userData) : undefined;

        // Handle the OAuth callback
        const response = await handleOAuthCallback(
          provider,
          code,
          state,
          parsedUserData,
          idToken || undefined
        );

        console.log('OAuth login successful:', response);

        // Check if it's a new user
        const isNewUser = (response as any).is_new_user;

        if (isNewUser) {
          // Redirect to profile setup for new users
          navigate('/profile-setup', { replace: true });
        } else {
          // Redirect based on role for existing users
          let redirectPath = '/events';
          
          if (response.user.role) {
            // If user has a name, use it for the slug
            if (response.user.name) {
              redirectPath = getRedirectPath(response.user.role, response.user.name);
            } else {
              // Fallback for organizers/team without a name - use email slug
              const emailSlug = response.user.email.split('@')[0].toLowerCase();
              redirectPath = getRedirectPath(response.user.role, emailSlug);
            }
          }

          navigate(redirectPath, { replace: true });
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to authenticate. Please try again.'
        );
        setIsProcessing(false);

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    processCallback();
  }, [location, searchParams, handleOAuthCallback, navigate]);

  if (error) {
    return (
      <div className='fixed inset-0 flex h-[100dvh] flex-col items-center justify-center bg-[#0A0A0A]'>
        <div className='max-w-md rounded-lg bg-[rgba(247,247,247,0.05)] p-8 text-center'>
          <div className='mb-4 text-4xl'>⚠️</div>
          <h2 className='mb-4 text-xl font-semibold text-white'>
            Authentication Failed
          </h2>
          <p className='mb-4 text-sm text-[rgba(247,247,247,0.6)]'>{error}</p>
          <p className='text-xs text-[rgba(247,247,247,0.4)]'>
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='fixed inset-0 flex h-[100dvh] flex-col items-center justify-center bg-[#0A0A0A]'>
      <div className='max-w-md rounded-lg bg-[rgba(247,247,247,0.05)] p-8 text-center'>
        <div className='mb-6 flex justify-center'>
          <div className='h-12 w-12 animate-spin rounded-full border-4 border-[rgba(247,247,247,0.2)] border-t-white'></div>
        </div>
        <h2 className='mb-2 text-xl font-semibold text-white'>
          Completing Sign In
        </h2>
        <p className='text-sm text-[rgba(247,247,247,0.6)]'>
          Please wait while we authenticate your account...
        </p>
      </div>
    </div>
  );
};

export default OAuthCallback;
