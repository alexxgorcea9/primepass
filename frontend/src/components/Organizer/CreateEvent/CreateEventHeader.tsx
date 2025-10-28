import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CreateEventHeader() {
  const navigate = useNavigate();

  return (
    <div className="w-full py-2.5 overflow-hidden flex items-center gap-2.5">
      <div className="overflow-hidden rounded-[40px] backdrop-blur-[20px] flex justify-center items-center gap-2.5">
        <button
          onClick={() => navigate(-1)}
          className="w-12 h-12 p-2.5 bg-[rgba(247,247,247,0.05)] overflow-hidden rounded-full flex justify-center items-center gap-2.5 hover:bg-[rgba(247,247,247,0.1)] transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-[#F7F7F7]" strokeWidth={2} />
        </button>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col justify-between items-start">
        <div className="w-full flex-1 overflow-hidden flex flex-col justify-between items-start">
          <div className="w-full overflow-hidden rounded-[20px] flex items-start gap-2.5">
            <div className="flex flex-col justify-center text-white text-xl font-['Lufga'] font-bold leading-6">
              New Event
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
