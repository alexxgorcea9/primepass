import React from 'react';

interface ButtonProps {
  text: string;
  variant: 'primary' | 'secondary';
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  text,
  variant,
  onClick,
  className = '',
  type = 'button',
  disabled = false,
}) => {
  const baseClasses =
    'w-full h-[45px] p-2.5 overflow-hidden rounded-[20px] flex justify-center items-center gap-[5px] cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-[#F7F7F7] text-[#0A0A0A] hover:bg-[rgba(247,247,247,0.9)]', // Ivory White background with Onyx Black text
    secondary:
      'bg-gradient-to-r from-[rgba(10,10,10,0.3)] to-[rgba(10,10,10,0.15)]' +
      ' text-[#F7F7F7]' +
      ' outline outline-[1px] outline-[#F7F7F733] outline-offset-[-0.5px]' +
      ' backdrop-blur-[50px] hover:bg-[rgba(247,247,247,0.05)]', // Gradient background with blur and Ivory White text
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      <div className='flex flex-col justify-center text-center font-lufga text-md leading-[18px] font-normal break-words'>
        {text}
      </div>
    </button>
  );
};

export default Button;
