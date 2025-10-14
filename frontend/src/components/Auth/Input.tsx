import React, { useState, InputHTMLAttributes, useRef, useEffect } from 'react';

type InputVariant = 'normal' | 'focused' | 'wrong';
type InputType = 'email' | 'text' | 'password' | 'number' | 'date' | 'card-number' | 'cvv' | 'expiry';

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  variant?: InputVariant;
  type?: InputType;
  label?: string;
  error?: string;
  hideEmptyLabel?: boolean;
  showPlaceholderOnlyWhenFocused?: boolean;
}

export const Input: React.FC<InputProps> = ({
  variant = 'normal',
  type = 'text',
  label,
  error,
  className,
  value,
  defaultValue,
  hideEmptyLabel = false,
  showPlaceholderOnlyWhenFocused = false,
  onChange,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasContent, setHasContent] = useState(
    Boolean(value || defaultValue || props.placeholder)
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Update hasContent when value changes
  useEffect(() => {
    setHasContent(Boolean(inputRef.current?.value));
  }, [value]);

  // Determine if the label should float (when focused or has content)
  const shouldFloatLabel = isFocused || hasContent;

  // Determine the correct variant state - now uses shouldFloatLabel for white border
  const currentVariant = error
    ? 'wrong'
    : shouldFloatLabel
      ? 'focused'
      : variant;

  // Base styles common to all variants
  const baseStyles =
    'w-full h-[45px] px-5 rounded-[20px] outline outline-[0.5px] flex gap-1.5 transition-all duration-200 relative';

  // Variant-specific styles
  const variantStyles = {
    normal: 'outline-[rgba(247,247,247,0.2)] bg-transparent',
    focused: 'outline-[#F7F7F7] bg-transparent',
    wrong: 'outline-warning-red bg-transparent',
  };

  // Format functions for special input types
  const formatCardNumber = (value: string): string => {
    const digitsOnly = value.replace(/\D/g, '');
    const limitedDigits = digitsOnly.substring(0, 16);
    return limitedDigits.match(/.{1,4}/g)?.join(' ') || limitedDigits;
  };

  const formatCVV = (value: string): string => {
    return value.replace(/\D/g, '').substring(0, 3);
  };

  const formatExpiry = (value: string): string => {
    let input = value.replace(/\D/g, ''); // remove non-digits

    if (input.length >= 3) {
      input = input.slice(0, 4); // limit to MMYY
      input = input.slice(0, 2) + '/' + input.slice(2);
    } else if (input.length >= 1) {
      input = input.slice(0, 2);
    }

    return input;
  };

  // Extract value for formatting
  const inputValue = value || defaultValue || '';
  
  // Format the display value based on input type
  const getDisplayValue = (): string => {
    if (!inputValue && inputValue !== 0) return '';
    const stringValue = String(inputValue);
    
    switch (type) {
      case 'card-number':
        return formatCardNumber(stringValue);
      case 'cvv':
        return formatCVV(stringValue);
      case 'expiry':
        return formatExpiry(stringValue);
      default:
        return stringValue;
    }
  };

  const displayValue = getDisplayValue();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let formattedValue = e.target.value;

    // Apply formatting based on input type
    switch (type) {
      case 'card-number':
        formattedValue = formatCardNumber(e.target.value);
        break;
      case 'cvv':
        formattedValue = formatCVV(e.target.value);
        break;
      case 'expiry':
        formattedValue = formatExpiry(e.target.value);
        break;
      default:
        formattedValue = e.target.value;
    }

    setHasContent(formattedValue.length > 0);
    
    if (onChange) {
      // Create a new event with the formatted value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: formattedValue,
          name: e.target.name,
        },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  // Password type is always hidden

  return (
    <div className='flex w-full flex-col gap-1'>
      <div
        className={`${baseStyles} ${variantStyles[currentVariant]} ${className || ''}`}
      >
        {label && (!hideEmptyLabel || shouldFloatLabel) && (
          <label
            className={`pointer-events-none absolute px-1 font-[Lufga] font-normal transition-all duration-200 ${
              shouldFloatLabel
                ? `top-0 -translate-y-1/2 text-[10px] ${currentVariant === 'wrong' ? 'text-warning-red' : 'text-[#F7F7F7]'} left-4 z-10 bg-[#0A0A0A]`
                : `top-1/2 -translate-y-1/2 text-xs ${currentVariant === 'wrong' ? 'text-warning-red' : 'text-[rgba(247,247,247,0.2)]'} left-4`
            } `}
          >
            {label}
          </label>
        )}
        <div className='flex w-full items-center'>
          <input
            ref={inputRef}
            type={type === 'cvv' ? 'password' : type === 'card-number' || type === 'expiry' ? 'text' : type}
            inputMode={type === 'card-number' || type === 'cvv' || type === 'expiry' ? 'numeric' : undefined}
            maxLength={type === 'expiry' ? 5 : type === 'cvv' ? 3 : type === 'card-number' ? 19 : undefined}
            className={`w-full bg-transparent font-[Lufga] text-base font-normal text-white outline-none placeholder:text-[rgba(247,247,247,0.2)] placeholder:text-xs`}
            style={{
              paddingTop: shouldFloatLabel ? '10px' : '0',
              lineHeight: '1.5',
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              setHasContent(Boolean(inputRef.current?.value));
            }}
            onChange={handleInputChange}
            {...props}
            value={displayValue}
            placeholder={showPlaceholderOnlyWhenFocused && !isFocused ? '' : props.placeholder}
          />
        </div>
      </div>
    </div>
  );
};

export default Input;
