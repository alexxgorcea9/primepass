import { memo } from 'react';
import Ticket from '@/assets/ticket.svg'
import Card from '@/assets/card-white.svg'
import XClose from '@/assets/xclose.svg'
import { motion } from 'framer-motion';

interface TableCardProps {
  name: string;
  seats: number;
  minimumSpend: number;
  count: number;
  isActive?: boolean;
  onDelete?: () => void
}

function TableCard({ name, seats, minimumSpend, count, isActive = false, onDelete }: TableCardProps) {

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, filter: "blur(5px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      exit={{
        opacity: 0,
        height: 0,
        paddingTop: 0,
        paddingBottom: 0,
        marginBottom:0,
        transition: { duration: 0.3, ease: "easeInOut" },
      }}
      style={{ overflow: "hidden", marginBottom: 10 }}
      className="w-full p-2.5 bg-gradient-to-r from-[rgba(217,179,226,0.30)] to-[rgba(247,247,247,0.30)] rounded-[20px] flex flex-col justify-end items-start overflow-hidden">
      {/* Header with name and status */}
      <div className="self-stretch inline-flex justify-between items-center overflow-hidden">
        <div className="p-2.5 rounded-[80px] flex justify-start items-center gap-2.5 overflow-hidden">
          <div className="w-6 h-6 relative">
            <div className="w-2 h-[4.84px] absolute left-[8.38px] top-[9.58px] border-[1.5px] border-[#F4C05F]" />
          </div>
          <div className="justify-center text-[#F4C05F] text-base font-normal font-['Lufga'] leading-normal">
            {name}
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="w-6 h-6 overflow-hidden rounded-full flex justify-center items-center gap-2.5 hover:bg-[rgba(247,247,247,0.1)] transition-colors"
        >
          <img src={XClose} alt="Delete" className="w-[16px] h-[16px]" />
        </button>
      </div>

      {/* Details Section */}
      <div className="self-stretch px-2.5 rounded-[20px] inline-flex justify-start items-start gap-2.5 overflow-hidden">
        {/* Seats */}
        <div className="rounded-[80px] flex justify-start items-center overflow-hidden">
          <div className="w-9 h-9 p-2.5 bg-[rgba(247,247,247,0.20)] rounded-[80px] flex justify-center items-center gap-2.5 overflow-hidden">
            <img src={Ticket} alt="Ticket" className="w-4 h-4" />
          </div>
          <div className="p-2.5 rounded-[80px] inline-flex flex-col justify-center items-start overflow-hidden">
            <div className="justify-center text-[#B4B8B3] text-md font-normal font-['Lufga'] leading-none">
              Seats
            </div>
            <div className="justify-center text-[#F7F7F7] text-md font-normal font-['Lufga'] leading-none">
              {seats}
            </div>
          </div>
        </div>

        {/* Minimum Spend */}
        <div className=" flex justify-start items-center overflow-hidden">
          <div className="w-9 h-9 p-2.5 bg-[rgba(247,247,247,0.20)] rounded-[80px] flex justify-center items-center gap-2.5 overflow-hidden">
            <img src={Card} alt="Card" className="w-4 h-4" />
          </div>
          <div className="p-2.5 flex-col justify-center items-start overflow-hidden">
            <div className="justify-center text-[#B4B8B3] text-md font-normal font-['Lufga'] leading-none whitespace-nowrap">
              Minimum spend
            </div>
            <div className="justify-center text-[#F7F7F7] text-md font-normal font-['Lufga'] leading-none">
              ${minimumSpend.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Count */}
        <div className="rounded-[80px] flex justify-start items-center overflow-hidden">
          <div className="w-9 h-9 p-2.5 bg-[rgba(247,247,247,0.20)] rounded-[80px] flex justify-center items-center gap-2.5 overflow-hidden">
            <img src={Ticket} alt="Ticket" className="w-4 h-4" />
          </div>
          <div className="p-2.5 rounded-[80px] inline-flex flex-col justify-center items-start overflow-hidden">
            <div className="justify-center text-[#B4B8B3] text-md font-normal font-['Lufga'] leading-none">
              Count
            </div>
            <div className="justify-center text-[#F7F7F7] text-md font-normal font-['Lufga'] leading-none">
              {count}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default memo(TableCard);
