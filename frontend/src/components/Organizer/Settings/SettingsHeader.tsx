import { RefObject, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import ArrowLeft from '@/assets/arrow-left.svg';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import MediaUploadDialog from './MediaUploadDialog';

interface SettingsHeaderProps {
  scrollContainerRef: RefObject<HTMLDivElement>;
  onMediaChange?: (profilePicture?: File, banner?: File) => void;
  onEditProfile?: () => void;
  isEditMode?: boolean;
  profilePreviewUrl?: string;
  bannerPreviewUrl?: string;
  onLogout?: () => void;
}

const FALLBACK_BANNER = 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop';
const FALLBACK_PROFILE = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop';
const HEADER_HEIGHT = 236;
const STICKY_TOP = -148;
const BLUR_START = 0; // Start blur immediately when scrolling
const BLUR_END = 150; // End blur after 150px of scroll
const MAX_BLUR = 8;

// Profile picture animation constants
const PROFILE_SIZE_MAX = 80; // Maximum size in pixels
const PROFILE_SIZE_MIN = 50; // Minimum size in pixels
const PROFILE_SCROLL_START = 0; // Start shrinking immediately
const PROFILE_SCROLL_END = 200; // Finish shrinking at 200px scroll
const PROFILE_Z_START = 45; // Start above header (z-40)
const PROFILE_Z_END = 35; // End below header

// Name and events info animation constants
const INFO_SCROLL_START = 235; // Start appearing after 50px scroll
const INFO_SCROLL_END = 254;// Fully visible and fixed at 150px scroll
const INFO_Y_START = 40; // Start position (below, clipped)
const INFO_Y_END = 0; // End position (fixed at top)
const INFO_FIXED_TOP = 26; // Fixed top position in pixels

const SettingsHeader = ({ scrollContainerRef, onMediaChange, onEditProfile, isEditMode, profilePreviewUrl, bannerPreviewUrl, onLogout }: SettingsHeaderProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showBannerDialog, setShowBannerDialog] = useState(false);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
      navigate('/login');
    }
  };

  // Track scroll of the specific container (updated every frame)
  const { scrollY } = useScroll({
    container: scrollContainerRef,
  });

  // Apply smooth spring physics to eliminate jitter
  const smoothScrollY = useSpring(scrollY, {
    stiffness: 300,
    damping: 30,
    mass: 0.5
  });

  // Transform scroll to blur value (starts after sticky, increases with scroll)
  const blurIntensity = useTransform(
    smoothScrollY,
    [BLUR_START, BLUR_END],
    [0, MAX_BLUR]
  );

  // Profile picture animations based on scroll
  const profileSize = useTransform(
    smoothScrollY,
    [PROFILE_SCROLL_START, PROFILE_SCROLL_END],
    [PROFILE_SIZE_MAX, PROFILE_SIZE_MIN]
  );

  const profileZIndex = useTransform(
    smoothScrollY,
    [PROFILE_SCROLL_START, PROFILE_SCROLL_END],
    [PROFILE_Z_START, PROFILE_Z_END]
  );

  // Name and events info animations based on scroll
  const infoOpacity = useTransform(
    smoothScrollY,
    [INFO_SCROLL_START, INFO_SCROLL_END],
    [0, 1]
  );

  const infoY = useTransform(
    smoothScrollY,
    [INFO_SCROLL_START, INFO_SCROLL_END],
    [INFO_Y_START, INFO_Y_END]
  );

  // Get banner media URL with fallback (use preview if available)
  const bannerUrl = bannerPreviewUrl || user?.banner_media || FALLBACK_BANNER;
  
  // Determine if banner is video or image based on file extension
  const bannerIsVideo = bannerUrl && (bannerUrl.endsWith('.mp4') || bannerUrl.endsWith('.webm') || bannerUrl.endsWith('.mov'));

  // Get profile image URL with fallback (use preview if available)
  const profileUrl = profilePreviewUrl || user?.profile_picture || FALLBACK_PROFILE;

  // Handle profile picture change
  const handleProfilePictureChange = (file: File) => {
    if (onMediaChange) {
      onMediaChange(file, undefined);
    }
  };

  // Handle banner change
  const handleBannerChange = (file: File) => {
    if (onMediaChange) {
      onMediaChange(undefined, file);
    }
  };

  return (
    <>
      {/* Logout Button (view mode) / Change Banner Button (edit mode) */}
      {isEditMode ? (
        <button 
          onClick={() => setShowBannerDialog(true)}
          className="fixed right-2.5 top-[26px] bg-BG-1 w-fit h-fit p-2.5 rounded-[8px] z-50 hover:bg-BG transition-colors"
        >
          <div className="text-sm text-white">
            Change Banner
          </div>
        </button>
      ) : (
        <button 
          onClick={handleLogout}
          className="fixed right-2.5 top-[26px] bg-BG-1 w-fit h-fit p-2.5 rounded-[8px] z-50 hover:bg-BG transition-colors"
        >
          <div className="text-sm text-white">
            Logout
          </div>
        </button>
      )}

      {/* Back Button - Fixed position, independent of header */}
      <button className="fixed left-2.5 top-[26px] bg-BG-1 w-12 h-12 rounded-full flex justify-center items-center z-50"
      onClick={() => navigate(-1)}>
        <img src={ArrowLeft} alt="ArrowLeft" className="w-4 h-4" />
      </button>

      <motion.header
        className="sticky left-0 right-0 z-40 overflow-hidden will-change-transform"
        style={{ 
          height: HEADER_HEIGHT,
          top: STICKY_TOP,
        }}
      >
        {/* Background Media Layer */}
        <motion.div 
          className="absolute inset-0 will-change-transform overflow-hidden"
          style={{
            filter: useTransform(blurIntensity, (blur) => `blur(${blur}px)`),
          }}
        >
          {bannerIsVideo ? (
            <video
              key={bannerUrl}
              src={bannerUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              key={bannerUrl}
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${bannerUrl})` }}
            />
          )}
        </motion.div>

        {/* Bottom Gradient Overlay - Fade to background */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none" />

        {/* Left Gradient Overlay - Fade to background */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#0A0A0A] to-transparent pointer-events-none" />
      </motion.header>

      {/* Subheader with Profile Picture and Edit Button */}
      <div className="relative px-8 -mt-0 pb-6">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          {/* Profile Picture - Shrinks and changes z-index on scroll */}
          <motion.div
            className={`relative rounded-full overflow-hidden border-4 border-[#0A0A0A] bg-[#0A0A0A] ${
              isEditMode ? 'cursor-pointer group' : ''
            }`}
            style={{
              width: profileSize,
              height: profileSize,
              zIndex: profileZIndex,
            }}
            onClick={() => isEditMode && setShowProfileDialog(true)}
          >
            <img
              key={profileUrl}
              src={profileUrl}
              alt="Profile"
              className={`w-full h-full object-cover transition-opacity ${
                isEditMode ? 'opacity-85 group-hover:opacity-70' : 'opacity-100'
              }`}
            />
            {/* Camera Icon Overlay - Only in edit mode */}
            {isEditMode && (
              <div className="absolute inset-0 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white" />
              </div>
            )}
          </motion.div>

          {/* Edit Profile Button - Only show in view mode */}
          {!isEditMode && onEditProfile && (
            <button
              onClick={onEditProfile}
              className="bg-white px-4 py-2.5 rounded-full text-BG text-sm hover:bg-grey-light transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Name and Events Info - Fixed position, appears after scroll threshold */}
      <motion.div
        className="fixed left-16 top-[26px] z-50 pointer-events-none"
        style={{
          opacity: infoOpacity,
        }}
      >
        <div className="flex flex-col">
          <h1 className="text-white text-lg">
            {user?.name || 'John Organizer'}
          </h1>
          <p className="text-grey text-sm">
            12 Events
          </p>
        </div>
      </motion.div>

      {/* Media Upload Dialogs */}
      <MediaUploadDialog
        isOpen={showProfileDialog}
        onClose={() => setShowProfileDialog(false)}
        onSelect={handleProfilePictureChange}
        title="Change Profile Picture"
        currentMedia={profileUrl}
        accept="image/*"
      />
      
      <MediaUploadDialog
        isOpen={showBannerDialog}
        onClose={() => setShowBannerDialog(false)}
        onSelect={handleBannerChange}
        title="Change Banner"
        currentMedia={bannerUrl}
        accept="image/*,video/*"
      />
    </>
  );
};

export default SettingsHeader;