import React, { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import Input from '../../components/Auth/Input';
import Button from '../../components/Auth/Button';
import AuthProviderButton from '../../components/Auth/AuthProviderButton';
import { useMutation } from '@tanstack/react-query';
import ellipse from '../../assets/Ellipse 13.svg';
import warning from '../../assets/warning-2.svg';
import { getRedirectPath } from '@/utils/pathUtils';

const Login: React.FC = () => {
  const auth = useAuth();
  const { login } = auth;
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [passwordError, setPasswordError] = useState<string | undefined>(
    undefined
  );

  const loginMutation = useMutation<
    any,
    Error,
    { email: string; password: string }
  >({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      return login(email, password);
    },
    onSuccess: data => {
      // Determine redirect path based on role
      let redirectPath = '/events'; // Default for guest

      if (data.user && data.user.role) {
        // If user has a name, use it for the slug
        if (data.user.name) {
          redirectPath = getRedirectPath(data.user.role, data.user.name);
        } else {
          // Fallback for organizers/team without a name - use email slug
          const emailSlug = data.user.email.split('@')[0].toLowerCase();
          redirectPath = getRedirectPath(data.user.role, emailSlug);
        }
      }

      // Only use location.state.from if the user was redirected from a protected page
      const from = location.state?.from?.pathname || redirectPath;
      navigate(from, { replace: true });
    },
    onError: error => {
      // Clear both errors initially
      setEmailError(undefined);
      setPasswordError(undefined);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorData = error.response?.data;

        // Handle the specific error types from our backend
        if (errorData && errorData.error) {
          switch (errorData.error) {
            case 'invalid_credentials':
              // Generic error for security (prevents user enumeration)
              // Show error on both fields since we don't know which is wrong
              const message = errorData.message || 'Invalid email or password.';
              setEmailError(message);
              setPasswordError(message);
              break;
            case 'account_locked':
              setEmailError(errorData.message || 'Account locked due to too many failed attempts.');
              break;
            case 'rate_limited':
              setEmailError(errorData.message || 'Too many login attempts. Please try again later.');
              break;
            case 'account_disabled':
              setEmailError(errorData.message || 'This account has been disabled.');
              break;
            default:
              // Fallback for other errors
              setEmailError('Login failed. Please try again.');
              break;
          }
        } else {
          // Fallback for legacy error handling
          if (status === 401) {
            // Generic error - highlight both fields
            const message = 'Invalid email or password.';
            setEmailError(message);
            setPasswordError(message);
          } else if (status === 403) {
            setEmailError('Account locked or disabled.');
          } else if (status === 429) {
            setEmailError('Too many attempts. Please try again later.');
          } else {
            setEmailError('Login failed. Please try again.');
          }
        }
      } else {
        // Generic error handling for non-axios errors
        setEmailError('Login failed. Please try again.');
      }
    },
  });

  // Memorize the submit handler to prevent re-creation on each render
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Clear previous error states
      setEmailError(undefined);
      setPasswordError(undefined);

      // Validate empty fields
      if (!email.trim()) {
        setEmailError('Email is required');
        return;
      }

      if (!password.trim()) {
        setPasswordError('Password is required');
        return;
      }

      // Use the mutation instead of direct login
      loginMutation.mutate({ email, password });
    },
    [email, password, loginMutation]
  );

  return (
    <div className='relative flex h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#0A0A0A] px-5'>
      {/* White vertical line */}
      <div className='absolute top-[60px] left-[60px] h-[180px] w-[1px] bg-[rgba(247,247,247,0.6)]'></div>

      {/* Ellipse background */}
      <img
        src={ellipse}
        alt=''
        className='absolute z-0'
        style={{
          left: '60px',
          top: '60px',
          transform: 'translate(-50%, -50%) rotate(90deg)',
        }}
      />

      <form
        onSubmit={handleSubmit}
        className='z-10 mt-[260px] w-full max-w-[440px] space-y-6'
      >
        <h2 className='mb-6 text-center text-2xl font-semibold text-white'>
          Login
        </h2>

        {/* Auth provider button */}
        <div className='w-full p-[10px]'>
          <AuthProviderButton
            variant='google'
            fullWidth
            onClick={useCallback(async () => {
              try {
                await auth.loginWithGoogle();
              } catch (error) {
                console.error('Google login error:', error);
              }
            }, [auth])}
          />

          <p className='mt-3 text-center font-[Lufga] text-xs font-normal text-[rgba(247,247,247,0.2)]'>
            or continue with
          </p>
        </div>

        <div className='flex flex-col gap-[20px] p-[10px]'>
          <Input
            type='email'
            label='Email'
            value={email}
            onChange={useCallback(
              (e: React.ChangeEvent<HTMLInputElement>) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(undefined); // Clear error on change
              },
              [emailError]
            )}
            error={emailError} // Pass the actual error message
          />

          <Input
            type='password'
            label='Password'
            value={password}
            onChange={useCallback(
              (e: React.ChangeEvent<HTMLInputElement>) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(undefined); // Clear error on change
              },
              [passwordError]
            )}
            error={passwordError} // Pass the actual error message
          />

          {/* Error message section - only visible when there are errors */}
          {(emailError || passwordError) && (
            <div className='mt-2 mb-2'>
              {/* Show single error if both errors are the same */}
              {emailError && passwordError && emailError === passwordError ? (
                <div className='flex items-start space-x-2 text-sm text-warning-red'>
                  <img
                    src={warning}
                    alt='warning'
                    className='mt-[2px] h-4 w-4'
                  />
                  <span>{emailError}</span>
                </div>
              ) : (
                <>
                  {/* Email error */}
                  {emailError && (
                    <div className='flex items-start space-x-2 text-sm text-warning-red'>
                      <img
                        src={warning}
                        alt='warning'
                        className='mt-[2px] h-4 w-4'
                      />
                      <span>{emailError}</span>
                    </div>
                  )}

                  {/* Password error */}
                  {passwordError && (
                    <div className='mt-1 flex items-start space-x-2 text-sm text-warning-red'>
                      <img
                        src={warning}
                        alt='warning'
                        className='mt-[2px] h-4 w-4'
                      />
                      <span>{passwordError}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div>
            <Button
              text='Login'
              variant='primary'
              type='submit'
              disabled={loginMutation.isPending}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default Login;
