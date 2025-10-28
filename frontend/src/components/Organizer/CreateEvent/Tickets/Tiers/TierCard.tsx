// TierCard.tsx
import { memo, forwardRef } from 'react';
import XClose from '@/assets/xclose.svg';
import { motion } from 'framer-motion';
import Ticket from '@/assets/ticket.svg'; // fallback icon

interface TierCardProps {
  name: string;
  gradientClassName: string;
  icon?: string;
  specialRequests?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}

const TierCard = forwardRef<HTMLDivElement, TierCardProps>(({          
                    name,
                    gradientClassName,
                    icon,
                    specialRequests,
                    onClick,
                    onDelete,
                  }, ref) => {

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, filter: "blur(5px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      exit={{
        opacity: 0,
        height: 0,
        paddingTop: 0,
        paddingBottom: 0,
        marginBottom: 0,
        transition: { duration: 0.3, ease: "easeInOut" },
      }}
      style={{ overflow: "hidden", marginBottom: 10 }}
      onClick={onClick}
      className="self-stretch h-16 p-2.5 bg-[rgba(247,247,247,0.05)] rounded-[20px] flex flex-col justify-between items-start cursor-pointer hover:bg-[rgba(247,247,247,0.08)] transition-colors"
    >
      <div className="self-stretch p-2.5 inline-flex justify-between items-center">
        {/* Left side */}
        <div className="py-[3px] flex justify-center items-center gap-2.5">
          {/* Dynamic Icon */}
          <div className="w-6 h-6 bg-[rgba(247,247,247,0.20)] rounded-lg flex justify-center items-center">
            <img
              src={icon || Ticket} // fallback to Ticket if no icon provided
              alt={name}
              className="w-[12px] h-[12px]"
            />
          </div>

          {/* Gradient badge */}
          <div
            className={`w-6 h-6 bg-gradient-to-b ${gradientClassName} rounded-lg backdrop-blur-[20px]`}
          />

          {/* Tier Name */}
          <div className="py-[5px] flex flex-col justify-center items-center">
            <div className="text-[#F7F7F7] text-md font-normal font-['Lufga'] leading-none">
              {name}
            </div>
          </div>
        </div>

        {specialRequests && (
          <div className="h-fit justify-center justify-center text-accent3 text-sm leading-none">
            Special Requests
          </div>
        )}

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          className="w-6 h-6 rounded-full flex justify-center items-center hover:bg-[rgba(247,247,247,0.1)] transition-colors"
        >
          <img src={XClose} alt="Delete" className="w-[16px] h-[16px]" />
        </button>
      </div>
    </motion.div>
  );
});

TierCard.displayName = 'TierCard';

export default memo(TierCard);
