import { LucideIcon } from 'lucide-react';
import Money from '@/assets/money-4.svg';

interface InfoRowProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
}

export default function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="self-stretch p-2.5 bg-[rgba(247,247,247,0.05)] rounded-[20px] inline-flex justify-start items-start gap-2.5 overflow-hidden">
      <div className="flex-1 p-2.5 flex justify-start items-center gap-2.5 overflow-hidden">
        {Icon && <img src={Money} alt="Money" className="w-4 h-4" />}
        <div className="justify-center text-[#F7F7F7] text-md font-normal font-['Lufga'] leading-none">
          {label}
        </div>
      </div>
      <div className="p-2.5 rounded-[20px] inline-flex flex-col justify-start items-start gap-2.5 overflow-hidden">
        <div className="justify-center text-[rgba(247,247,247,0.6)] text-md leading-none">
          {value}
        </div>
      </div>
    </div>
  );
}
