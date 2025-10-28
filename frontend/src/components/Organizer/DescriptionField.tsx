import { AlignLeft } from 'lucide-react';

interface DescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function DescriptionField({ value, onChange, placeholder = 'Enter description...' }: DescriptionFieldProps) {
  return (
    <div className="self-stretch p-2.5 bg-gradient-to-r from-[rgba(217,179,226,0.30)] to-[rgba(247,247,247,0.30)] rounded-[20px] flex flex-col justify-start items-start overflow-hidden">
      <div className="self-stretch p-2.5 inline-flex justify-start items-center gap-2.5 overflow-hidden">
        <AlignLeft className="w-4 h-4 text-[#F7F7F7]" strokeWidth={1.5} />
        <div className="justify-center text-[#F7F7F7] text-md leading-none">
          Description
        </div>
      </div>
      <div className="self-stretch h-16 p-2.5 rounded-[20px] flex flex-col justify-start items-start gap-2.5 overflow-hidden">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="self-stretch flex-1 bg-transparent outline-none resize-none text-[rgba(247,247,247,0.6)] text-md leading-none placeholder:text-[rgba(247,247,247,0.3)]"
        />
      </div>
    </div>
  );
}
