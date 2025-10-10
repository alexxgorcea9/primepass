import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Auth/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface AccountTypeProps {
  type: string;
  description?: string;
  isSelected: boolean;
  onClick: () => void;
  gradientPosition: 'top' | 'left' | 'bottom';
}

const AccountTypeCard: React.FC<AccountTypeProps> = ({
  type,
  description,
  isSelected,
  onClick,
  gradientPosition,
}) => {
  // Define gradient positions based on Figma
  const gradientStyles: Record<string, React.CSSProperties> = {
    top: {
      width: '219px',
      height: '322px',
      left: '100px',
      top: '-100px',
      position: 'absolute',
      background:
        'linear-gradient(180deg, rgba(217, 179, 226, 0.40) 0%, rgba(244, 192, 95, 0.40) 100%)',
      filter: 'blur(50px)',
      willChange: 'transform',
      transform: 'translateZ(0)',
    },
    left: {
      width: '219px',
      height: '322px',
      left: '-75px',
      top: '-90px',
      position: 'absolute',
      background:
        'linear-gradient(180deg, rgba(217, 179, 226, 0.40) 0%, rgba(244, 192, 95, 0.40) 100%)',
      filter: 'blur(50px)',
      willChange: 'transform',
      transform: 'translateZ(0)',
    },
    bottom: {
      width: '233px',
      height: '348px',
      right: '5px',
      bottom: '-250px',
      position: 'absolute',
      transform: 'rotate(-80deg) translateZ(0)',
      background:
        'linear-gradient(180deg, rgba(217, 179, 226, 0.50) 0%, rgba(244, 192, 95, 0.50) 100%)',
      filter: 'blur(50px)',
      willChange: 'transform',
    },
  };

  return (
    <motion.div
      className={`relative w-full cursor-pointer overflow-hidden rounded-[20px] outline outline-[0.5px] outline-BG-2`}
      onClick={onClick}
      style={{
        willChange: 'height',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
      }}
      animate={{
        height: isSelected ? 300 : 64,
        transition: { 
          duration: 0.3, 
          ease: [0.4, 0.0, 0.2, 1],
        },
      }}
    >
      {/* Gradient background */}
      <div style={gradientStyles[gradientPosition]}></div>

      {/* Content */}
      <div className='relative z-10 p-5'>
        <h3 className="font-['Lufga'] text-[20px] leading-6 font-normal text-white">
          {type}
        </h3>

        <AnimatePresence>
          {isSelected && description && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ 
                duration: 0.25,
                ease: [0.4, 0.0, 0.2, 1],
              }}
              style={{
                willChange: 'opacity, transform',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'translateZ(0)',
              }}
              className="mt-[14px] max-w-[340px] font-['Lufga'] text-[12px] leading-[18px] font-normal text-grey"
            >
              {description}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

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
