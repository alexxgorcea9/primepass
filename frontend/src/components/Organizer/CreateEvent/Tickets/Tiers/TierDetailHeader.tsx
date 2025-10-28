import { X } from 'lucide-react';
import Ticket from '@/assets/ticket.svg';
import ArrowLeft from '@/assets/arrow-left-red.svg';
import Add from '@/assets/add.svg';

interface TierDetailHeaderProps {
  tierName: string;
  gradientClassName: string;
  onClose: () => void;
  onAdd: () => void;
}

export default function TierDetailHeader({ tierName, onClose, onAdd }: TierDetailHeaderProps) {
  return (
    <div className="self-stretch overflow-hidden inline-flex justify-between items-center">
      {/* Left side - Tier info */}
      <div className="overflow-hidden rounded-[40px] backdrop-blur-[20px] flex justify-center items-center">
        <div
          className={`w-12 h-12 p-2.5 bg-gradient-to-r from-[rgba(217,179,226,0.30)] to-[rgba(244,192,95,0.30)] overflow-hidden rounded-full inline-flex flex-col justify-center items-center gap-2.5`}
        >
          <img src={Ticket} alt="Ticket" className="w-4 h-4" />
        </div>
        <div className="p-2.5 overflow-hidden inline-flex flex-col justify-start items-start">
          <div className="justify-center flex flex-col text-[#B4B8B3] text-sm font-normal font-['Lufga'] leading-[18px]">
            Tier
          </div>
          <div className="justify-center flex flex-col text-[#F7F7F7] text-base font-normal font-['Lufga'] leading-normal">
            {tierName}
          </div>
        </div>
      </div>

      <div className=" rounded-[40px] backdrop-blur-[20px] inline-flex justify-center items-center gap-2.5 overflow-hidden">
        {/* Back Button */}
        <button
          onClick={onClose}
          className="h-12 p-2.5 bg-red-600/20 rounded-full flex justify-center items-center gap-[5px] overflow-hidden hover:bg-red-600/30 transition-colors"
        >
          <div className="w-4 h-4 relative">
            <img
              src={ArrowLeft}
              alt="ArrowLeft"
              className="w-4 h-4 absolute left-0 top-0 stroke-warning-red"
            />
          </div>
          <div className="justify-center text-warning-red text-md font-normal font-['Lufga'] leading-none">
            Back
          </div>
        </button>

        {/* Add Button */}
        <button
          onClick={onAdd}
          className="h-12 p-2.5 bg-BG-2/20 rounded-full flex justify-center items-center gap-[5px] overflow-hidden hover:bg-BG-2/30 transition-colors"
        >
          <div className="w-4 h-4 relative">
            <img
              src={Add}
              alt="Add"
              className="w-4 h-4 absolute left-0 top-0 stroke-white"
            />
          </div>
          <div className="justify-center text-white text-md font-normal font-['Lufga'] leading-none">
            Add
          </div>
        </button>
      </div>
    </div>
  );
}