import { X, Upload } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface MediaUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: File) => void;
  title: string;
  currentMedia?: string;
  accept?: string;
}

const MediaUploadDialog = ({
  isOpen,
  onClose,
  onSelect,
  title,
  currentMedia,
  accept = 'image/*,video/*',
}: MediaUploadDialogProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset preview when dialog opens
  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(currentMedia || null);
      setSelectedFile(null);
    }
  }, [isOpen, currentMedia]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Revoke old preview URL if it's a blob URL
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Check if preview is video
  const isVideoPreview = selectedFile?.type.startsWith('video/') || 
    previewUrl?.endsWith('.mp4') || 
    previewUrl?.endsWith('.webm') || 
    previewUrl?.endsWith('.mov');

  const handleSelect = () => {
    if (selectedFile) {
      onSelect(selectedFile);
      onClose();
    }
  };

  const handleCancel = () => {
    // Revoke blob URL if it exists
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(currentMedia || null);
    setSelectedFile(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="bg-BG-1 rounded-2xl p-6 w-full max-w-md mx-4 relative">
        {/* Close Button */}
        <button
          onClick={handleCancel}
          className="absolute right-4 top-4 text-grey hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        {/* Title */}
        <h2 className="text-2xl text-white mb-6">{title}</h2>

        {/* Preview Area */}
        <div
          className="w-full h-64 bg-BG rounded-xl mb-4 overflow-hidden flex items-center justify-center cursor-pointer border-2 border-dashed border-grey/30 hover:border-grey/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {previewUrl ? (
            isVideoPreview ? (
              <video
                src={previewUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="flex flex-col items-center gap-2 text-grey">
              <Upload size={48} />
              <span>Click to upload</span>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 py-3 px-4 rounded-full bg-BG text-white hover:bg-BG-1 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedFile}
            className="flex-1 py-3 px-4 rounded-full bg-white text-BG hover:bg-grey-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaUploadDialog;
