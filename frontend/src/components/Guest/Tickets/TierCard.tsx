import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import Flash from '../../../assets/flash.svg';
import TicketIcon from '../../../assets/ticket.svg';
import CrownIcon from '../../../assets/crown.svg';
import DiamondIcon from '../../../assets/diamonds.svg';
import ShieldIcon from '../../../assets/shield.svg';
import StarIcon from '../../../assets/star.svg';
import FlashIcon from '../../../assets/flash.svg';

// Icon mapping from backend identifier to SVG path
const ICON_MAP: Record<string, string> = {
  ticket: TicketIcon,
  crown: CrownIcon,
  diamond: DiamondIcon,
  shield: ShieldIcon,
  star: StarIcon,
  flash: FlashIcon,
};

interface Privilege {
  id: number;
  title: string;
  description?: string;
}

interface TierCardProps {
  id: string | number;
  name: string;
  eventId: string | number;
  eventName: string;
  privileges?: Privilege[];
  lowestAvailablePrice?: number;
  color: string; // Color from database
  icon?: string; // Icon identifier (ticket, crown, etc.)
  gradientClassName?: string; // Gradient Tailwind classes
}

const TierCard: React.FC<TierCardProps> = ({
                                             id,
                                             name,
                                             eventId,
                                             eventName,
                                             privileges = [],
                                             lowestAvailablePrice,
                                             color,
                                             icon = 'ticket',
                                             gradientClassName = 'from-[#A8FF78] to-[#78FFD6]',
                                           }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/events/${eventId}/tiers/${id}`, {
      state: {
        id,
        name,
        eventId,
        eventName,
        privileges,
        lowestAvailablePrice,
        color,
        icon,
        gradientClassName,
      },
    });
  };

  // Helper to get icon URL
  const getIconUrl = (iconId: string): string => {
    return ICON_MAP[iconId] || TicketIcon;
  };

  return (
    <motion.div
      className='w-full h-fit flex flex-col cursor-pointer gap-5 rounded-[20px] p-[10px]'
      style={{
        background:
          'linear-gradient(328deg, rgba(10, 10, 10, 1) 0%, rgba(21, 22, 23, 1) 100%)',
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
    >
      {/* First Row: Icon + Name + Price + Arrow */}
      <div className='flex items-center justify-between p-[20px]'>
        {/* Left side: Icon + Name */}
        <div className='flex items-center gap-2.5'>
          {/* Tier Icon with gradient color using mask */}
          <div
            className='w-4 h-4 flex-shrink-0'
            style={{
              backgroundColor: color,
              WebkitMaskImage: `url(${getIconUrl(icon)})`,
              maskImage: `url(${getIconUrl(icon)})`,
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
            }}
          />

          {/* Tier Name */}
          <h2
            className="w-fit text-lg"
            style={{ color }}
          >
            {name || 'Unnamed Tier'}
          </h2>
        </div>

        {/* Right side: Arrow + Price */}
        <div className='flex items-center gap-2'>
          {lowestAvailablePrice !== undefined && (
            <div
              className="flex items-center font-['Lufga'] text-lg font-normal"
              style={{ color }}
            >
              <span>${lowestAvailablePrice.toFixed(2)}</span>
            </div>
          )}
          {/* Arrow with gradient color */}
          <svg
            width='16'
            height='16'
            viewBox='0 0 16 16'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M5.19727 11.6199L9.0006 7.81655C9.44977 7.36738 9.44977 6.63238 9.0006 6.18322L5.19727 2.37988'
              stroke={color}
              strokeOpacity='0.8'
              strokeWidth='1.5'
              strokeMiterlimit='10'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        </div>
      </div>

      {/* Second Row: First 3 Privilege Titles */}
      {privileges && privileges.length > 0 && (
        <div className="flex flex-row justify-between px-[20px] pb-[20px]">
          {privileges.slice(0, 3).map((privilege) => (
            <div key={privilege.id} className="flex flex-row gap-1">
              <img src={Flash} alt="flash" className="w-4 h-4" />
              <span className="text-sm text-grey">
                {privilege.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default TierCard;
