import { Plus } from 'lucide-react';

interface PaymentMethodCardProps {
  lastFourDigits?: string;
  expiryDate?: string;
  onAddCard?: () => void;
  onChangeCard?: () => void;
}

export default function PaymentMethodCard({ lastFourDigits, expiryDate, onAddCard, onChangeCard }: PaymentMethodCardProps) {
  const isMissing = !lastFourDigits;

  return (
    <div className="h-fit w-full p-2.5 bg-BG-1 rounded-[20px] inline-flex justify-between items-center overflow-hidden">
      {/* Card Info */}
      <div className="h-fit flex justify-center items-center overflow-hidden">
        <div className={`w-12 h-12 p-2.5 rounded-full inline-flex flex-col justify-center items-center gap-2.5 overflow-hidden ${
          isMissing ? 'bg-red-500/10' : 'bg-[#F7F7F7]'
        }`}>
          <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
            <path d="M1.83398 5.66992H15.1673" stroke={isMissing ? '#FF4444' : '#0A0A0A'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4.5 11.0034H5.83333" stroke={isMissing ? '#FF4444' : '#0A0A0A'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7.5 11.0034H10.1667" stroke={isMissing ? '#FF4444' : '#0A0A0A'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12.2007 2.33643C14.574 2.33643 15.1673 2.92309 15.1673 5.26309V10.7364C15.1673 13.0764 14.574 13.6631 12.2073 13.6631H4.79398C2.42732 13.6698 1.83398 13.0831 1.83398 10.7431V5.26309C1.83398 2.92309 2.42732 2.33643 4.79398 2.33643H12.2007Z" stroke={isMissing ? '#FF4444' : '#0A0A0A'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className=" p-2.5 inline-flex flex-col justify-center overflow-hidden">
          <div className={`text-md font-normal font-['Lufga'] leading-4 ${
            isMissing ? 'text-[#FF4444]' : 'text-[#B4B8B3]'
          }`}>
            {isMissing ? 'Payment Method' : `Exp ${expiryDate}`}
          </div>
          <div className={`text-2xl font-bold font-['Lufga'] leading-8 ${
            isMissing ? 'text-[#FF4444]' : 'text-[#F7F7F7]'
          }`}>
            {isMissing ? 'Missing' : `****${lastFourDigits}`}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={isMissing ? onAddCard : onChangeCard}
        className="p-2.5 bg-[#F7F7F7] rounded-[40px] backdrop-blur-[20px] flex justify-center items-center gap-[5px] overflow-hidden hover:bg-[rgba(247,247,247,0.9)] transition-colors"
      >
        <div className="inline-flex flex-col justify-center items-center gap-2.5 overflow-hidden">
          <div className="self-stretch justify-center text-[#0A0A0A] text-md leading-none">
            {isMissing ? 'Add Card' : 'Change Card'}
          </div>
        </div>
        {isMissing && <Plus className="w-4 h-4 text-[#0A0A0A]" strokeWidth={1.5} />}
      </button>
    </div>
  );
}
