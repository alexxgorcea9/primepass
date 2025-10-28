import { memo } from 'react';
import XClose from '@/assets/xclose.svg';
import { motion } from 'framer-motion';

interface PrivilegeCardProps {
  name: string;
  description: string;
  isActive?: boolean;
  handleDelete?: () => void;
  onDelete?: () => void;
}

function PrivilegeCard({
  name,
  description,
  isActive = false,
  onDelete,
}: PrivilegeCardProps) {

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
      className="self-stretch p-2.5 bg-gradient-to-r from-[rgba(217,179,226,0.30)] to-[rgba(247,247,247,0.30)] rounded-[20px] flex flex-col justify-end items-start overflow-hidden">
      {/* Header with name and status */}
      <div className="self-stretch p-2.5 inline-flex justify-between items-center overflow-hidden">
        <div className="rounded-[100px] inline-flex flex-col justify-center items-center gap-2.5 overflow-hidden">
          <div className="justify-center text-[#F7F7F7] text-base font-normal font-['Lufga'] leading-normal">
            {name}
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

      {/* Description */}
      <div className="self-stretch p-2.5 rounded-[20px] flex flex-col justify-start items-start gap-2.5 overflow-hidden">
        <div className="self-stretch justify-center text-[rgba(247,247,247,0.6)] text-sm font-normal leading-none">
          {description}
        </div>
      </div>
    </motion.div>
  );
}

export default memo(PrivilegeCard);
