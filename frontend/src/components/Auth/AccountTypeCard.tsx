import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AccountTypeCardProps {
  type: string;
  description?: string;
  isSelected: boolean;
  onClick: () => void;
  gradientPosition?: 'top' | 'left' | 'bottom';
  className?: string;
}

const AccountTypeCard: React.FC<AccountTypeCardProps> = ({
  type,
  description,
  isSelected,
  onClick,
  gradientPosition = 'top',
  className = '',
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
      className={`relative w-full cursor-pointer overflow-hidden rounded-[20px] outline outline-[0.5px] outline-BG-2 ${className}`}
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

export default AccountTypeCard;
