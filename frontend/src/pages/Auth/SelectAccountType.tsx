import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Auth/Button';
import AccountTypeCard from '../../components/Auth/AccountTypeCard';

const SelectAccountType: React.FC = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string>('guest');

  // Handle account type selection
  const handleSelectType = (type: string) => {
    setSelectedType(type);
  };

  // Navigate to signup with the selected account type
  const handleContinue = () => {
    // Store the selected account type in session storage or context
    sessionStorage.setItem('selectedAccountType', selectedType);
    // Navigate to signup
    navigate('/signup');
  };

  // Account type descriptions
  const descriptions = {
    guest:
      "Experience the world's most exclusive events with effortless elegance. As a Guest, you'll browse curated lineups, secure premium seating, and enjoy VIP perks—all from our intuitive, luxury-grade interface.",
    organizer:
      "Create and manage high-end events with powerful tools designed for excellence. As an Organizer, you'll craft unforgettable experiences, manage guest lists, and oversee all aspects of your premium events.",
    team: 'Collaborate seamlessly on exclusive events with shared access and specialized roles. Team accounts enable efficient coordination across your organization while maintaining the premium experience.',
  };

  return (
    <div className='fixed inset-0 flex h-[100dvh] w-screen flex-col items-center justify-start overflow-hidden bg-[#0A0A0A] px-5 pt-14'>
      {/* Removed decorative elements for better mobile design */}

      {/* Heading */}
      <div className='z-10 mb-2 w-full max-w-[440px] text-center'>
        <h1 className="font-['Lufga'] text-[28px] font-normal text-white">
          Select Account Type
        </h1>
        <p className="mt-1 font-['Lufga'] text-base font-normal text-grey">
          Find the right account for you
        </p>
      </div>

      {/* Account Type Options */}
      <div className='z-10 mt-8 flex w-full max-w-[440px] flex-col gap-4'>
        <AccountTypeCard
          type='Guest'
          description={descriptions.guest}
          isSelected={selectedType === 'guest'}
          onClick={() => handleSelectType('guest')}
          gradientPosition='top'
        />

        <AccountTypeCard
          type='Organizer'
          description={descriptions.organizer}
          isSelected={selectedType === 'organizer'}
          onClick={() => handleSelectType('organizer')}
          gradientPosition='left'
        />

        <AccountTypeCard
          type='Team'
          description={descriptions.team}
          isSelected={selectedType === 'team'}
          onClick={() => handleSelectType('team')}
          gradientPosition='bottom'
        />
      </div>

      {/* Continue Button */}
      <div className='z-10 mt-auto mb-6 w-full max-w-[440px]'>
        <Button text='Continue' variant='primary' onClick={handleContinue} />
      </div>
    </div>
  );
};

export default SelectAccountType;
