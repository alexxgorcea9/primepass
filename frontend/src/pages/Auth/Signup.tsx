import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Input from '../../components/Auth/Input';
import Button from '../../components/Auth/Button';
import AuthProviderButton from '../../components/Auth/AuthProviderButton';
import PasswordRequirements from '../../components/Auth/PasswordRequirements';
import { isPasswordValid } from '@utils/passwordValidation';
import ellipse from '../../assets/Ellipse 13.svg';
import warning from '../../assets/warning-2.svg';

const Signup: React.FC = () => {
  const { signup, loginWithGoogle } = useAuth(); // Auth functions from AuthContext
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<string>('guest'); // Default role can be 'guest'
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);

  // Get the selected account type from sessionStorage
  useEffect(() => {
    const selectedAccountType = sessionStorage.getItem('selectedAccountType');
    if (selectedAccountType) {
      setRole(selectedAccountType);
    }
  }, []);

  // Handling form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
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

    console.log('Submitting signup with role:', role);

    try {
      // Make the signup API request, passing email, password, and role
      const data = await signup(email, password, role);
      console.log('Signup successful, navigating to email verification');
      sessionStorage.setItem('pending_email', email);

      // Redirect to ProfileSetup after successful signup with role in state
      navigate('/verify-email', {
        replace: true,
        state: { role, email }
      });
    } catch (err) {
      console.error('Signup error details:', err);

      if (axios.isAxiosError(err) && err.response) {
        console.error('Server response:', {
          status: err.response.status,
          data: err.response.data,
        });

        // Display more specific error from the backend if available
        const backendError =
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.response?.data?.detail ||
          Object.values(err.response?.data || {})[0];

        if (backendError) {
          // Helper function to extract clean error message
          const extractErrorMessage = (error: any): string => {
            let message = '';
            if (typeof error === 'string') {
              message = error;
            } else if (Array.isArray(error)) {
              message = error[0] || 'An error occurred';
            } else if (typeof error === 'object' && error !== null) {
              message = error.message || error.detail || JSON.stringify(error);
            } else {
              message = String(error);
            }
            
            // Clean up formatting: capitalize first letter and remove trailing period
            message = message.trim();
            if (message.length > 0) {
              message = message.charAt(0).toUpperCase() + message.slice(1);
              // Remove trailing period
              if (message.endsWith('.')) {
                message = message.slice(0, -1);
              }
            }
            
            return message;
          };

          const errorString = extractErrorMessage(backendError);
          
          // Check if it's an email-related error
          if (errorString.toLowerCase().includes('email')) {
            setEmailError(errorString);
          } else if (errorString.toLowerCase().includes('password')) {
            setPasswordError(errorString);
          } else {
            setEmailError(errorString);
          }
        } else {
          setEmailError(`Signup failed: ${err.message || 'Unknown error'}`);
        }
      } else {
        setEmailError('Signup failed. Please try again.');
      }
    }
  };

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
          Signup
        </h2>

        {/* Auth provider button */}
        <div className='w-full p-[10px]'>
          <AuthProviderButton
            variant='google'
            fullWidth
            onClick={async () => {
              try {
                await loginWithGoogle();
              } catch (error) {
                console.error('Google login error:', error);
              }
            }}
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
            onChange={e => {
              setEmail(e.target.value);
              if (emailError) setEmailError(undefined);
            }}
            error={emailError}
          />

          <div className='relative'>
            <Input
              type='password'
              label='Password'
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(undefined);
              }}
              error={passwordError}
            />
            {/* Show password requirements with smooth transition */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden transform ${
              password 
                ? 'max-h-[500px] opacity-100 translate-y-0' 
                : 'max-h-0 opacity-0 -translate-y-2'
            }`}>
              <PasswordRequirements password={password} email={email} />
            </div>
          </div>

          {/* Error message section - only visible when there are errors */}
          {(emailError || passwordError) && (
            <div className='mt-2 mb-2'>
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
            </div>
          )}

          {/* Role is now set from SelectAccountType page */}

          <div className='mt-4 transition-all duration-200 ease-in-out'>
            <Button
              text='Signup'
              variant='primary'
              type='submit'
              disabled={!isPasswordValid(password, email) || !email.trim()}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default Signup;
