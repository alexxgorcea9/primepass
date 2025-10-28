import React, { useState, useRef, useEffect } from 'react';

interface BioTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  title?: string;
  placeholder?: string;
  maxLength?: number;
  showCharacterCount?: boolean;
  showIcon?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const LongTextInput: React.FC<BioTextAreaProps> = ({
  value,
  onChange,
  title = 'Bio',
  placeholder = 'Write a bio for your profile...',
  maxLength = 500,
  showCharacterCount = true,
  showIcon = true,
  icon,
  className = '',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`w-full overflow-hidden rounded-[20px] bg-gradient-to-r from-[rgba(217,179,226,0.3)] to-[rgba(247,247,247,0.3)] p-2.5 transition-all duration-200 ${
          isFocused ? 'from-[rgba(217,179,226,0.4)] to-[rgba(247,247,247,0.4)]' : ''
        }`}
      >
        {/* Header with icon and label */}
        {(showIcon || title) && (
          <div className='flex items-center gap-2.5 px-2.5 py-2.5'>
            {showIcon && (
              icon || (
                <svg
                  width='16'
                  height='16'
                  viewBox='0 0 16 16'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    d='M2 3H14'
                    stroke='#F7F7F7'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                  />
                  <path
                    d='M2 6.33H8.31'
                    stroke='#F7F7F7'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                  />
                  <path
                    d='M2 9.67H14'
                    stroke='#F7F7F7'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                  />
                  <path
                    d='M2 13H8.31'
                    stroke='#F7F7F7'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                  />
                </svg>
              )
            )}
            {title && <div className='text-md text-[#F7F7F7]'>{title}</div>}
          </div>
        )}

        {/* Textarea */}
        <div className='overflow-hidden rounded-[20px] p-2.5'>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className='w-full resize-none bg-transparent font-[Lufga] text-md font-normal leading-[18px] text-white outline-none placeholder:text-[rgba(247,247,247,0.4)]'
            rows={3}
            style={{ minHeight: '54px' }}
          />
          {showCharacterCount && maxLength && (
            <div className='mt-1 text-right text-[10px] font-[Lufga] text-[rgba(247,247,247,0.4)]'>
              {value.length}/{maxLength}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LongTextInput;
