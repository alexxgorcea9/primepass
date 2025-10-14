import React from 'react';
import apple from '../../assets/apple.svg';
import google from '../../assets/google.svg';
import instagram from '../../assets/insta.svg';

// Define the variant types for the AuthProviderButton
type ProviderVariant = 'apple' | 'google' | 'instagram';

interface AuthProviderButtonProps {
  variant: ProviderVariant;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}

const AuthProviderButton: React.FC<AuthProviderButtonProps> = ({
  variant,
  onClick,
  className = '',
  disabled = false,
  fullWidth = false,
}) => {
  // Get provider name for accessibility
  const getProviderName = () => {
    switch (variant) {
      case 'apple':
        return 'Apple';
      case 'google':
        return 'Google';
      case 'instagram':
        return 'Instagram';
      default:
        return 'Provider';
    }
  };

  // Style object with variants for the button
  const buttonStyle = fullWidth
    ? `w-full p-[10px] flex justify-center items-center gap-[10px] 
       bg-[rgba(247,247,247,0.05)] border border-[rgba(247,247,247,0.2)] 
       rounded-[20px] transition-all duration-200 cursor-pointer 
       hover:bg-[rgba(247,247,247,0.1)] active:bg-[rgba(247,247,247,0.15)] 
       ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`
    : `w-[64px] h-[64px] flex justify-center items-center 
       bg-[rgba(247,247,247,0.05)] border border-[rgba(247,247,247,0.2)] 
       rounded-lg transition-all duration-200 cursor-pointer 
       hover:bg-[rgba(247,247,247,0.1)] active:bg-[rgba(247,247,247,0.15)] 
       ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={buttonStyle}
      type='button'
      aria-label={`Sign in with ${getProviderName()}`}
    >
      {/* Provider-specific SVG icon */}
      {variant === 'apple' && (
        <img src={apple} alt='Apple logo' className='h-6 w-6' />
      )}
      {variant === 'google' && (
        <img src={google} alt='Google logo' className='h-6 w-6' />
      )}
      {variant === 'instagram' && (
        <img src={instagram} alt='Instagram logo' className='h-6 w-6' />
      )}
      
      {/* Full width variant shows text */}
      {fullWidth && (
        <div className='text-md-style text-center text-[#F7F7F7] font-medium'>
          Continue with {getProviderName()}
        </div>
      )}
    </button>
  );
};

export default AuthProviderButton;
