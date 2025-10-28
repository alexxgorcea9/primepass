import { useState, useEffect } from 'react';
import { X, Image } from 'lucide-react';

interface ImageUploadZoneProps {
  onUpload?: (file: File) => void;
  onRemove?: () => void;
  initialPreview?: string; // Add this to support controlled state
}

export default function ImageUploadZone({ onUpload, onRemove, initialPreview }: ImageUploadZoneProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreview || null);

  // Sync with parent state if initialPreview changes
  useEffect(() => {
    setPreviewUrl(initialPreview || null);
  }, [initialPreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Call parent callback
      if (onUpload) {
        onUpload(file);
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Cleanup old URL (only if it's a blob URL)
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);

    if (onRemove) {
      onRemove();
    }
  };

  // Show preview if image is uploaded
  if (previewUrl) {
    return (
      <div className="w-full aspect-square relative rounded-[20px] overflow-hidden">
        <img
          src={previewUrl}
          alt="Upload preview"
          className="w-full h-full object-cover"
        />
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 w-10 h-10 p-2 bg-[rgba(10,10,10,0.60)] backdrop-blur-[20px] rounded-full flex justify-center items-center hover:bg-[rgba(10,10,10,0.80)] transition-colors"
          aria-label="Remove image"
        >
          <X className="w-4 h-4 text-[#F7F7F7]" strokeWidth={1.5} />
        </button>
      </div>
    );
  }

  // Show upload zone if no image
  return (
    <div className="w-full aspect-square p-[5px] rounded-[20px] bg-gradient-to-r from-[rgba(217,179,226,0.30)] to-[rgba(244,192,95,0.30)] hover:from-[rgba(217,179,226,0.5)] hover:to-[rgba(244,192,95,0.5)] transition-all cursor-pointer">
      <label className="w-full h-full rounded-[15px] bg-[#0A0A0A] flex flex-col justify-center items-center cursor-pointer">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="w-12 h-12 relative">
          <Image className="w-12 h-12 text-gray-400" strokeWidth={1.5} />
        </div>
      </label>
    </div>
  );
}