import { memo, forwardRef } from 'react';
import { motion } from 'framer-motion';
import Ticket from '@/assets/ticket.svg';
import XClose from '@/assets/xclose.svg';

interface WaveCardProps {
  name: string;
  ticketCount: number;
  price: number;
  isActive?: boolean;
  onDelete?: () => void;
}

const WaveCard = forwardRef<HTMLDivElement, WaveCardProps>(
  ({ name, ticketCount, price, onDelete }, ref) => {
    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete?.();
    };

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, filter: 'blur(5px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        exit={{
          opacity: 0,
          height: 0,
          paddingTop: 0,
          paddingBottom: 0,
          marginBottom: 0,
          transition: { duration: 0.3, ease: 'easeInOut' },
        }}
        style={{ overflow: 'hidden', marginBottom: 10 }}
        className="self-stretch py-[20px] px-2.5 bg-gradient-to-r from-[rgba(217,179,226,0.30)] to-[rgba(247,247,247,0.30)] rounded-[20px] flex flex-col justify-between items-center"
      >
        <div className="self-stretch px-2.5 overflow-hidden inline-flex justify-between items-center">
          {/* Wave Name */}
          <div className="flex-1 overflow-hidden flex justify-start items-center gap-2.5">
            <div className="py-[5px] overflow-hidden inline-flex flex-col justify-center items-center gap-2.5">
              <div className="self-stretch justify-center flex flex-col text-[#F7F7F7] text-md font-normal font-['Lufga'] leading-[18px]">
                {name}
              </div>
            </div>
          </div>

          {/* Ticket Count */}
          <div className="flex-1 overflow-hidden rounded-[40px] flex justify-start items-center gap-2.5">
            <img src={Ticket} alt="Ticket" className="w-4 h-4" />
            <div className="py-[5px] overflow-hidden inline-flex flex-col justify-center items-center gap-2.5">
              <div className="self-stretch justify-center flex flex-col text-[#F7F7F7] text-md font-normal font-['Lufga'] leading-[18px]">
                {ticketCount}
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="flex-1 overflow-hidden rounded-full flex-col justify-center items-start gap-2.5 inline-flex">
            <div className="justify-center flex flex-col text-[#F4C05F] text-md font-normal font-['Lufga'] leading-[18px]">
              ${price.toFixed(2)}
            </div>
          </div>

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="w-6 h-6 overflow-hidden rounded-full flex justify-center items-center gap-2.5 hover:bg-[rgba(247,247,247,0.1)] transition-colors"
          >
            <img src={XClose} alt="Delete" className="w-[16px] h-[16px]" />
          </button>
        </div>
      </motion.div>
    );
  }
);

WaveCard.displayName = 'WaveCard';

export default memo(WaveCard);