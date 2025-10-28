import { useState } from 'react';
import { memo } from 'react';
import Money from '@/assets/money-4.svg';

type FeeOption = 'absorb' | 'guests';

interface FeeSectionProps {
  feePercentage: number;
  selectedOption?: FeeOption;
  onOptionChange?: (option: FeeOption) => void;
}

function FeeSection({ feePercentage, selectedOption = 'guests', onOptionChange }: FeeSectionProps) {
  const [selected, setSelected] = useState<FeeOption>(selectedOption);

  const handleOptionClick = (option: FeeOption) => {
    setSelected(option);
    onOptionChange?.(option);
  };

  return (
    <div className="self-stretch p-2.5 bg-[rgba(247,247,247,0.05)] rounded-[20px] flex flex-col justify-start items-start gap-2.5 overflow-hidden">
      {/* Header */}
      <div className="self-stretch inline-flex justify-between items-center overflow-hidden">
        <div className="p-2.5 flex justify-start items-center gap-2.5 overflow-hidden">
          <img src={Money} alt="Money" className="w-4 h-4" />
          <div className="justify-center text-[#F7F7F7] text-md font-normal font-['Lufga'] leading-none">
            Fee
          </div>
        </div>
        <div className="p-2.5 rounded-[20px] inline-flex flex-col justify-start items-start gap-2.5 overflow-hidden">
          <div className="justify-center text-[rgba(247,247,247,0.6)] text-md leading-none">
            {feePercentage}%
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="self-stretch px-2.5 inline-flex justify-between items-center overflow-hidden">
        <div className="flex-1 justify-center text-[rgba(247,247,247,0.6)] text-md leading-none">
          Choose who pays the processing fees on ticket sales. If you absorb them, guests pay your listed price but you receive less. If guests pay them, your payout stays full but their total cost increases at checkout.
        </div>
      </div>

      {/* Toggle Options */}
      <div className="self-stretch py-2.5 inline-flex justify-start items-center gap-2.5 overflow-hidden">
        <button
          onClick={() => handleOptionClick('absorb')}
          className={`p-2.5 rounded-[80px] flex justify-start items-center gap-2.5 overflow-hidden transition-colors ${
            selected === 'absorb'
              ? 'bg-gradient-to-r from-[rgba(217,179,226,0.30)] to-[rgba(244,192,95,0.30)]'
              : 'bg-[rgba(247,247,247,0.05)]'
          }`}
        >
          <div className="justify-center text-white text-md font-normal font-['Lufga'] leading-none">
            I'll absorb it
          </div>
        </button>
        <button
          onClick={() => handleOptionClick('guests')}
          className={`p-2.5 rounded-[80px] flex justify-start items-center gap-2.5 overflow-hidden transition-colors ${
            selected === 'guests'
              ? 'bg-gradient-to-r from-[rgba(217,179,226,0.30)] to-[rgba(244,192,95,0.30)]'
              : 'bg-[rgba(247,247,247,0.05)]'
          }`}
        >
          <div className="justify-center text-white text-md font-normal font-['Lufga'] leading-none">
            Guests pay it
          </div>
        </button>
      </div>
    </div>
  );
}

export default memo(FeeSection);
