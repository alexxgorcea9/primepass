import { memo } from 'react';
import Trash from '@/assets/trash.svg';
import Add from '@/assets/add.svg';
import Ticket from '@/assets/ticket.svg';

interface FormHeaderProps {
  title: string;
  onClose: () => void;
  onAdd: () => void;
  isAddDisabled?: boolean;
}

function FormHeader({ title, onAdd, onClose, isAddDisabled = false }: FormHeaderProps) {
  return (
    <div className="w-full flex items-center gap-2">
      <div className="w-full inline-flex justify-start items-center gap-2.5 overflow-hidden">
        <div
          className="w-12 h-12 bg-gradient-to-r from-[rgba(217,179,226,0.30)] to-[rgba(244,192,95,0.30)] rounded-full inline-flex flex-col justify-center items-center gap-2.5 overflow-hidden">
          <div className="w-4 h-4 relative">
            <img src={Ticket} alt="Ticket" className="w-4 h-4 absolute left-0 top-0" />
          </div>
        </div>
        <div className="justify-center text-Ivory-White text-base font-normal font-['Lufga'] leading-normal">
          {title}
        </div>
      </div>


      <div className="w-fit inline-flex justify-center items-center gap-2.5">
        {/* Delete Button */}
        <button
          onClick={onClose}
          className="w-12 h-12 bg-red-600/20 rounded-full flex justify-center items-center overflow-hidden hover:bg-red-600/30 transition-colors shrink-0"
        >
          <img
            src={Trash}
            alt="Delete"
            className="w-4 h-4 object-contain"
          />
        </button>

        {/* Add Button */}
        <button
          onClick={onAdd}
          disabled={isAddDisabled}
          className={`w-12 h-12 rounded-full flex justify-center items-center overflow-hidden transition-colors shrink-0 ${
            isAddDisabled
              ? 'bg-BG-2/10 opacity-50 cursor-not-allowed'
              : 'bg-BG-2/20 hover:bg-BG-2/30'
          }`}
        >
          <img
            src={Add}
            alt="Add"
            className="w-4 h-4 object-contain"
          />
        </button>
      </div>
    </div>
  );
}

export default memo(FormHeader);