import { useEffect, useRef, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DynamicQRIsland from './DynamicQRIsland';

interface QRScannerProps {
  onClose: () => void;
  onScan: (data: string) => void;
}

const QRScanner = ({ onClose, onScan }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        // Request camera access with rear camera preference
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' }, // Prefer rear camera
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });

        setStream(mediaStream);
        streamRef.current = mediaStream;

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Unable to access camera. Please check permissions.');
      }
    };

    startCamera();

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Stop stream when component unmounts or when closing
  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 p-2.5"
      >
        {/* Video background */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay UI */}
        <div className="absolute inset-0 flex flex-col">
          {/* Header with back button */}
          <div className="relative z-10 p-6 flex items-center justify-between">
            <button
              onClick={handleClose}
              className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <h2 className="text-white text-xl font-semibold">Scan QR Code</h2>
            <div className="w-12" /> {/* Spacer for alignment */}
          </div>

          {/* Scanning area with frame - fixed position */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/3">
            <div className="relative w-72 aspect-square">
              {/* Scanning frame corners */}
              <div
                className="absolute inset-0 rounded-[40px] border-4 border-grey"
                style={{
                  borderStyle: 'dashed',
                  borderSpacing: '80px', // Controls gap size
                }}
              />
            </div>
          </div>

          {/* Dynamic Island - stuck to bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <DynamicQRIsland />
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-24 left-6 right-6"
            >
              <div className="bg-red-500/90 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-white flex-shrink-0" />
                <p className="text-white text-sm">{error}</p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QRScanner;
