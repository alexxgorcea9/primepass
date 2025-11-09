import { useAuth } from '@/contexts/AuthContext';
import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsHeader from '@/components/Organizer/Settings/SettingsHeader';
import SettingsTabs from '@components/Organizer/Settings/SettingsTabs';
import TextInputLine from '@/components/Organizer/CreateEvent/Details/TextInputLine';
import LongTextInput from '@/components/Organizer/CreateEvent/Details/LongTextInput';

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // View mode: 'view' or 'edit'
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  
  // Buffered state for form fields
  const [name, setName] = useState(user?.name || '');
  const [organizerBio, setOrganizerBio] = useState(user?.organizer_bio || '');
  const [profilePicture, setProfilePicture] = useState<File | undefined>(undefined);
  const [bannerMedia, setBannerMedia] = useState<File | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  
  // Preview URLs for buffered changes
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | undefined>(undefined);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | undefined>(undefined);

  // Sync with user when it changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setOrganizerBio(user.organizer_bio || '');
    }
  }, [user]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (profilePreviewUrl) URL.revokeObjectURL(profilePreviewUrl);
      if (bannerPreviewUrl) URL.revokeObjectURL(bannerPreviewUrl);
    };
  }, [profilePreviewUrl, bannerPreviewUrl]);

  // Handle media changes from SettingsHeader
  const handleMediaChange = (profilePic?: File, banner?: File) => {
    if (profilePic) {
      // Revoke old preview URL if it exists
      if (profilePreviewUrl) {
        URL.revokeObjectURL(profilePreviewUrl);
      }
      
      setProfilePicture(profilePic);
      // Create preview URL
      const url = URL.createObjectURL(profilePic);
      setProfilePreviewUrl(url);
    }
    if (banner) {
      // Revoke old preview URL if it exists
      if (bannerPreviewUrl) {
        URL.revokeObjectURL(bannerPreviewUrl);
      }
      
      setBannerMedia(banner);
      // Create preview URL
      const url = URL.createObjectURL(banner);
      setBannerPreviewUrl(url);
    }
  };

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updateData: any = {};
      
      // Only include changed fields
      if (name !== user?.name) updateData.name = name;
      if (organizerBio !== user?.organizer_bio) updateData.organizer_bio = organizerBio;
      if (profilePicture) updateData.profile_picture = profilePicture;
      if (bannerMedia) updateData.banner_media = bannerMedia;

      console.log('Saving profile with data:', {
        name: updateData.name,
        organizer_bio: updateData.organizer_bio,
        has_profile_picture: !!updateData.profile_picture,
        has_banner_media: !!updateData.banner_media,
      });

      const updatedUser = await updateProfile(updateData);
      console.log('Profile updated successfully:', updatedUser);
      
      // Clean up preview URLs
      if (profilePreviewUrl) URL.revokeObjectURL(profilePreviewUrl);
      if (bannerPreviewUrl) URL.revokeObjectURL(bannerPreviewUrl);
      
      // Clear buffered files after successful save
      setProfilePicture(undefined);
      setBannerMedia(undefined);
      setProfilePreviewUrl(undefined);
      setBannerPreviewUrl(undefined);
      
      // Return to view mode
      setMode('view');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`Failed to update profile: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    // Reset to initial values
    setName(user?.name || '');
    setOrganizerBio(user?.organizer_bio || '');
    setProfilePicture(undefined);
    setBannerMedia(undefined);
    if (profilePreviewUrl) URL.revokeObjectURL(profilePreviewUrl);
    if (bannerPreviewUrl) URL.revokeObjectURL(bannerPreviewUrl);
    setProfilePreviewUrl(undefined);
    setBannerPreviewUrl(undefined);
    // Return to view mode
    setMode('view');
  };

  // Check if there are unsaved changes
  const hasChanges = 
    name !== (user?.name || '') ||
    organizerBio !== (user?.organizer_bio || '') ||
    profilePicture !== undefined ||
    bannerMedia !== undefined;

  return (
    <div ref={scrollContainerRef} className="fixed inset-0 bg-BG overflow-y-auto [&::-webkit-scrollbar]:hidden">
      <div className="min-h-screen flex flex-col">
        <SettingsHeader 
          scrollContainerRef={scrollContainerRef}
          onMediaChange={handleMediaChange}
          onEditProfile={() => setMode('edit')}
          isEditMode={mode === 'edit'}
          profilePreviewUrl={profilePreviewUrl}
          bannerPreviewUrl={bannerPreviewUrl}
        />
        
        {mode === 'view' ? (
          // View Mode - Original content with tabs
          <>
            {/* Description */}
            <div className="flex flex-col p-2.5 gap-2.5 w-full items-start justify-start">
              <div className="text-2xl text-white">
                {user?.name}
              </div>

              <div className="text-md text-white">
                {user?.organizer_bio}
              </div>
            </div>

            <div className="sticky">
            </div>
            
            <SettingsTabs />

            <div className="h-400">
              content
            </div>
          </>
        ) : (
          // Edit Mode - Edit Profile Form
          <div className="flex flex-col p-6 gap-6 w-full max-w-2xl mx-auto">
          <h2 className="text-2xl text-white font-semibold">Edit Profile</h2>
          
          {/* Name Input */}
          <TextInputLine
            label="Name"
            value={name}
            onChange={setName}
            placeholder="Enter your name"
            maxLength={100}
            showCharCount={true}
          />

          {/* Bio Input */}
          <LongTextInput
            value={organizerBio}
            onChange={setOrganizerBio}
            title="Bio"
            placeholder="Tell people about yourself..."
            maxLength={500}
            showCharacterCount={true}
          />

          {/* Action Buttons */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 py-3 px-6 rounded-full bg-BG-1 text-white hover:bg-BG-1/80 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="flex-1 py-3 px-6 rounded-full bg-white text-BG hover:bg-grey-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Unsaved changes indicator */}
          {hasChanges && !isSaving && (
            <div className="text-sm text-grey text-center space-y-1">
              <p>You have unsaved changes</p>
              {profilePicture && (
                <p className="text-xs">• New profile picture selected</p>
              )}
              {bannerMedia && (
                <p className="text-xs">• New banner selected</p>
              )}
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;