import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Input from '../../components/Auth/Input';
import Button from '../../components/Auth/Button';
import ImageUpload from '../../components/Auth/ImageUpload';
import BannerUpload from '../../components/Auth/BannerUpload';
import LongTextInput from '@components/Organizer/CreateEvent/Details/LongTextInput';
import PhoneInput from '../../components/Auth/PhoneInput';
import DatePicker from '../../components/Auth/DatePicker';
import ellipse from '../../assets/Ellipse 13.svg';

interface ProfileData {
  name: string;
  profilePicture?: File;
  bannerImage?: File;
  birth_date?: string;
  organization_name?: string;
  phone?: string;
  bio?: string;
}

const ProfileSetup: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateProfile } = useAuth();
  const [role, setRole] = useState<string>('guest');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    profilePicture: undefined,
    birth_date: '',
    organization_name: '',
    phone: '',
    bio: '',
  });

  // Set user role from navigation state, query params, or user context
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const stateRole = (location.state as any)?.role;
    const userRole = stateRole || params.get('role') || user?.role || 'guest';
    // Normalize role to lowercase for consistent comparison
    const normalizedRole = userRole.toLowerCase();
    console.log('ProfileSetup - Detected role:', userRole, '-> normalized:', normalizedRole);
    setRole(normalizedRole);
  }, [location.search, location.state, user]);

  // Lock body scroll when component mounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhoneChange = (value: string) => {
    setProfileData(prev => ({
      ...prev,
      phone: value,
    }));
  };

  const handleDateChange = (value: string) => {
    setProfileData(prev => ({
      ...prev,
      birth_date: value,
    }));
  };

  const handleImageChange = (file: File | undefined) => {
    setProfileData(prev => ({
      ...prev,
      profilePicture: file,
    }));
  };

  const handleBannerChange = (file: File | undefined) => {
    setProfileData(prev => ({
      ...prev,
      bannerImage: file,
    }));
  };

  const handleBioChange = (value: string) => {
    setProfileData(prev => ({
      ...prev,
      bio: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Here you would upload the image and other data to your backend
      // For now we'll simulate a successful update

      // You'd typically first upload the image to get a URL, then update the profile
      // const imageUrl = await uploadImage(profileData.profilePicture);

      // Mock image URL for demo purposes
      const mockImageUrl = profileData.profilePicture
        ? URL.createObjectURL(profileData.profilePicture)
        : undefined;

      // Prepare the data based on role
      const updateData = {
        name: profileData.name,
        profile_picture: mockImageUrl,
        // Include role-specific fields
        ...(role === 'organizer'
          ? {
              organization_name: profileData.organization_name,
              phone: profileData.phone,
              bio: profileData.bio,
            }
          : {
              birth_date: profileData.birth_date,
            }),
      };

      console.log('Updating profile with data:', updateData);

      // Call your auth context update profile method
      await updateProfile(updateData);

      // Redirect to PaymentSetup after profile setup
      navigate('/payment-setup', { replace: true });
    } catch (err) {
      console.error('Profile setup error:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Role-specific form components
  const renderGuestTeamForm = () => (
    <>
      <div className='mb-6 flex justify-center'>
        <div className='flex flex-col items-center gap-2'>
          <p className='font-[Lufga] text-xs text-[rgba(247,247,247,0.4)]'>
            Profile Picture
          </p>
          <div className='w-[120px] h-[120px]'>
            <ImageUpload onImageChange={handleImageChange} variant='circular' />
          </div>
        </div>
      </div>

      <div className='flex flex-col gap-[20px]'>
        <Input
          type='text'
          name='name'
          label='Full Name'
          value={profileData.name}
          onChange={handleInputChange}
          required
        />

        <PhoneInput
          name='phone'
          label='Phone Number'
          value={profileData.phone}
          onChange={handlePhoneChange}
          required
        />

        <DatePicker
          name='birth_date'
          label='Birth Date'
          value={profileData.birth_date}
          onChange={handleDateChange}
          required
        />
      </div>
    </>
  );

  const renderOrganizerForm = () => (
    <>
      {/* Profile Picture and Banner Upload Row */}
      <div className='flex gap-[10px]'>
        {/* Profile Picture */}
        <div className='flex flex-col gap-2.5 flex-shrink-0'>
          <div className='text-base font-[Lufga] font-normal text-[#F7F7F7] leading-6'>
            Profile Picture
          </div>
          <div className='w-20 h-20'>
            <ImageUpload 
              onImageChange={handleImageChange} 
              variant='circular'
            />
          </div>
        </div>

        {/* Banner Upload */}
        <div className='flex-1 min-w-0'>
          <BannerUpload onImageChange={handleBannerChange} />
        </div>
      </div>

      {/* Name Input */}
      <Input
        type='text'
        name='name'
        label='Organization Name'
        value={profileData.name}
        onChange={handleInputChange}
        required
      />

      {/* Bio Section */}
      <LongTextInput
        title='Bio'
        value={profileData.bio || ''}
        onChange={handleBioChange}
        placeholder='This is a description of your organization, tell people about your events and what you do...'
        maxLength={500}
        showCharacterCount={true}
      />
    </>
  );

  // Get page title based on role
  const getPageTitle = () => {
    return 'Set up your profile';
  };

  return (
    <div className='fixed inset-0 flex h-[100dvh] flex-col items-center overflow-hidden bg-[#0A0A0A]'>
      {/* White vertical line - hidden on mobile */}
      <div className='fixed top-[60px] left-[60px] h-[180px] w-[1px] bg-[rgba(247,247,247,0.6)] z-0 hidden md:block'></div>

      {/* Ellipse background - hidden on mobile */}
      <img
        src={ellipse}
        alt=''
        className='fixed z-0 hidden md:block'
        style={{
          left: '60px',
          top: '60px',
          transform: 'translate(-50%, -50%) rotate(90deg)',
        }}
      />

      <div className='flex h-full w-full flex-col items-center justify-center overflow-y-auto px-5 py-10'>
        <form
          onSubmit={handleSubmit}
          className='z-10 w-full max-w-[440px] space-y-6 mx-auto'
        >
        <h2 className='mb-6 text-center text-xl md:text-2xl font-semibold text-white'>
          {getPageTitle()}
        </h2>

        <div className='flex flex-col gap-[20px] p-[10px]'>
          {/* Render different form fields based on role */}
          {role === 'guest' || role === 'team'
            ? renderGuestTeamForm()
            : renderOrganizerForm()}

          {role === 'organizer' ? (
            <div className='mt-6 flex gap-4 px-[1px] py-2.5'>
              <Button
                text='Skip'
                variant='secondary'
                type='button'
                onClick={() => navigate('/payment-setup', { replace: true })}
                className='flex-1'
              />
              <Button
                text={loading ? 'Setting up...' : 'Finish'}
                variant='primary'
                type='submit'
                disabled={loading}
                className='flex-1'
              />
            </div>
          ) : (
            <div className='mt-6'>
              <Button
                text={loading ? 'Setting up...' : 'Complete Setup'}
                variant='primary'
                type='submit'
                disabled={loading}
              />
            </div>
          )}

          {error && (
            <p className='pl-2 font-[Lufga] text-sm text-[#FF5151]'>{error}</p>
          )}
        </div>
      </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
