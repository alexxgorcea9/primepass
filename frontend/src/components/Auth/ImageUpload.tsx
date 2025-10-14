import React, { useState, useRef } from 'react';

interface ImageUploadProps {
  onImageChange: (file: File | undefined) => void;
  initialImage?: string;
  className?: string;
  variant?: 'default' | 'circular';
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageChange,
  initialImage,
  className = '',
  variant = 'default',
}) => {
  const [previewImage, setPreviewImage] = useState<string | undefined>(
    initialImage
  );
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageChange(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.match('image.*')) {
      onImageChange(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const isCircular = variant === 'circular';

  return (
    <div className={`${isCircular ? 'w-full h-full' : 'w-full'} ${className}`}>
      <div
        className={`relative flex cursor-pointer flex-col items-center justify-center border-2 border-dashed transition-all duration-200 ${
          isCircular 
            ? 'w-full h-full rounded-full' 
            : 'h-[160px] w-full rounded-[20px]'
        } ${isDragging ? 'border-[#F7F7F7] bg-[rgba(247,247,247,0.05)]' : 'border-[rgba(247,247,247,0.2)]'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        {previewImage ? (
          <div className='relative h-full w-full'>
            <img
              src={previewImage}
              alt='Profile preview'
              className={`h-full w-full object-cover ${isCircular ? 'rounded-full' : 'rounded-[18px]'}`}
            />
            <div className={`bg-opacity-30 absolute inset-0 flex items-center justify-center bg-black opacity-0 transition-opacity hover:opacity-100 ${isCircular ? 'rounded-full' : 'rounded-[18px]'}`}>
              <span className='font-[Lufga] text-xs text-white'>
                Click to change
              </span>
            </div>
          </div>
        ) : (
          <div className='flex flex-col items-center'>
            <svg
              width={isCircular ? '24' : '40'}
              height={isCircular ? '24' : '40'}
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M13 5.82843V15H11V5.82843L7.91421 8.91421L6.5 7.5L12 2L17.5 7.5L16.0858 8.91421L13 5.82843Z'
                fill='rgba(247,247,247,0.6)'
              />
              <path
                d='M4 14H6V18H18V14H20V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V14Z'
                fill='rgba(247,247,247,0.6)'
              />
            </svg>
            {!isCircular && (
              <>
                <p className='mt-2 font-[Lufga] text-xs text-[rgba(247,247,247,0.6)]'>
                  Drag & drop or click to upload
                </p>
                <p className='mt-1 font-[Lufga] text-xs text-[rgba(247,247,247,0.4)]'>
                  PNG, JPG, WEBP (max. 5MB)
                </p>
              </>
            )}
          </div>
        )}
      </div>
      <input
        type='file'
        ref={fileInputRef}
        onChange={handleFileChange}
        accept='image/*'
        className='hidden'
      />
    </div>
  );
};

export default ImageUpload;
