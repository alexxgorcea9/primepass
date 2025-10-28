import { memo } from 'react';
import XClose from '@/assets/xclose.svg';
import { motion } from 'framer-motion';

interface AddOnCardProps {
  price: number;
  name: string;
  description: string;
  availability: number | 'Unlimited';
  onDelete?: () => void;
}

function AddOnCard({ price, name, description, availability, onDelete }: AddOnCardProps) {

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
      className="self-stretch h-20 p-2.5 bg-gradient-to-r from-[rgba(217,179,226,0.30)] to-[rgba(247,247,247,0.30)] rounded-[20px] inline-flex justify-start items-center gap-2.5 overflow-hidden">
      {/* Price */}
      <div className="px-2.5 rounded-[100px] inline-flex flex-col justify-center items-center gap-2.5 overflow-hidden">
        <div className="justify-center text-[#F4C05F] text-base font-normal font-['Lufga'] leading-normal">
          ${price.toFixed(0)}
        </div>
      </div>

      {/* Name and Description */}
      <div className="flex-1 self-stretch inline-flex flex-col justify-center items-start overflow-hidden">
        <div className="self-stretch inline-flex justify-start items-center gap-2.5 overflow-hidden">
          <div className="justify-center text-[#F7F7F7] text-md font-normal font-['Lufga'] leading-none">
            {name}
          </div>
        </div>
        <div className="self-stretch flex flex-col justify-start items-start gap-2.5 overflow-hidden">
          <div className="self-stretch justify-center text-[#B4B8B3] text-sm leading-none">
            {description}
          </div>
        </div>
      </div>

      {/* Availability Count */}
      <div className="p-2.5 bg-[rgba(247,247,247,0.20)] rounded-[80px] flex justify-start items-center gap-2.5 overflow-hidden">
        <div className="justify-center text-white text-md leading-none">
          {availability === 'Unlimited' ? availability : availability}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        className="w-6 h-6 overflow-hidden rounded-full flex justify-center items-center gap-2.5 hover:bg-[rgba(247,247,247,0.1)] transition-colors"
      >
        <img src={XClose} alt="Delete" className="w-[16px] h-[16px]" />
      </button>
    </motion.div>


  );
}

export default memo(AddOnCard);
