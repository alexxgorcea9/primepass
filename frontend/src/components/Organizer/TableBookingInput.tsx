import { ChevronDown } from 'lucide-react';

interface TableBookingInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function TableBookingInput({ value, onChange, placeholder = "+34 488 849 383" }: TableBookingInputProps) {
  return (
    <div className="self-stretch p-2.5 inline-flex justify-start items-center gap-2.5 overflow-hidden">
      <div className="w-24 justify-center text-[#F7F7F7] text-xs font-normal font-['Lufga'] leading-none">
        Booking Number
      </div>
      <div className="flex-1 h-11 rounded-[20px] border border-[#B4B8B3] flex justify-start items-center gap-[5px] overflow-hidden">
        {/* Country selector */}
        <div className="h-11 px-2.5 rounded-tl-[20px] rounded-bl-[20px] border-r border-[#B4B8B3] flex justify-start items-center gap-[5px] overflow-hidden">
          <img 
            className="w-6 h-6 relative rounded-full" 
            src="https://placehold.co/24x24" 
            alt="Country flag"
          />
          <div className="w-7 h-4 relative origin-top-left -rotate-90">
            <ChevronDown className="w-2 h-[3.15px] absolute left-[4.48px] top-[6.67px] text-[#B4B8B3]" strokeWidth={2} />
          </div>
        </div>
        
        {/* Phone number input */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-[#F7F7F7] text-xs font-normal font-['Poppins'] leading-none placeholder:text-[rgba(247,247,247,0.20)]"
        />
      </div>
    </div>
  );
}
