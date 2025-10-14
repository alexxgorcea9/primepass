import React, { useState, useRef } from 'react';

interface BannerUploadProps {
  onImageChange: (file: File | undefined) => void;
  className?: string;
  currentImage?: string;
}

const BannerUpload: React.FC<BannerUploadProps> = ({
  onImageChange,
  className = '',
  currentImage,
}) => {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageChange(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onImageChange(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      <div className='text-base font-[Lufga] font-normal text-[#F7F7F7] leading-6'>
        Banner
      </div>
      <div
        onClick={handleClick}
        className='relative h-20 w-full cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-[rgba(217,179,226,0.3)] bg-transparent p-2.5 transition-all duration-200 hover:border-[rgba(217,179,226,0.5)]'
      >
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          onChange={handleFileChange}
          className='hidden'
        />
        
        {preview ? (
          <>
            <img
              src={preview}
              alt='Banner preview'
              className='h-full w-full object-cover rounded'
            />
            <button
              onClick={handleRemove}
              className='absolute top-2 right-2 h-6 w-6 rounded-full bg-[rgba(10,10,10,0.8)] flex items-center justify-center hover:bg-[rgba(10,10,10,0.9)] transition-colors'
            >
              <svg
                width='12'
                height='12'
                viewBox='0 0 12 12'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M9 3L3 9M3 3L9 9'
                  stroke='#F7F7F7'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </button>
          </>
        ) : (
          <div className='flex h-full w-full items-center justify-center'>
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <rect
                x='2'
                y='2'
                width='20'
                height='20'
                rx='2'
                stroke='#F7F7F7'
                strokeWidth='1.5'
              />
              <circle cx='9' cy='8' r='2' stroke='#F7F7F7' strokeWidth='1.5' />
              <path
                d='M2.67 17.05L7.5 12.22C8.39 11.33 9.84 11.33 10.73 12.22L21.33 22.82'
                stroke='#F7F7F7'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default BannerUpload;
