import { Minus, Plus } from 'lucide-react';

interface NumberCounterFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  prefix?: string;
}

export default function NumberCounterField({
                                             label,
                                             value,
                                             onChange,
                                             min = 0,
                                             max = Infinity,
                                             prefix = ''
                                           }: NumberCounterFieldProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Allow empty input for better UX while typing
    if (inputValue === '') {
      onChange(0);
      return;
    }

    const numValue = parseInt(inputValue, 10);

    // Only update if it's a valid number
    if (!isNaN(numValue)) {
      // Clamp between min and max
      const clampedValue = Math.max(min, Math.min(max, numValue));
      onChange(clampedValue);
    }
  };

  const displayValue = value === 0 ? '' : value;

  return (
    <div className="w-full p-2.5 inline-flex justify-between items-center gap-2.5 overflow-hidden">
      <div className="w-fit justify-center text-white text-sm font-normal font-['Lufga'] leading-none">
        {label}
      </div>
      <div className="flex items-center gap-2">
        {/* Decrement Button */}
        <button
          onClick={handleDecrement}
          disabled={value <= min}
          className="w-8 h-8 rounded-lg bg-[rgba(247,247,247,0.05)] border border-[rgba(247,247,247,0.20)] flex items-center justify-center hover:bg-[rgba(247,247,247,0.1)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Minus className="w-4 h-4 text-[#F7F7F7]" />
        </button>

        {/* Input Field with Prefix */}
        <div className="relative">
          {prefix && (
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#F7F7F7] text-sm font-['Lufga'] font-normal pointer-events-none">
              {prefix}
            </span>
          )}
          <input
            type="number"
            value={displayValue}
            onChange={handleInputChange}
            placeholder="0"
            min={min}
            max={max}
            className={`w-20 h-8 ${prefix ? 'pl-6 pr-2.5' : 'px-2.5'} bg-[rgba(247,247,247,0.05)] rounded-lg border border-[rgba(247,247,247,0.20)] text-[#F7F7F7] text-sm font-['Lufga'] font-normal text-center placeholder:text-[rgba(247,247,247,0.3)] focus:outline-none focus:border-[rgba(247,247,247,0.4)] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          />
        </div>

        {/* Increment Button */}
        <button
          onClick={handleIncrement}
          disabled={value >= max}
          className="w-8 h-8 rounded-lg bg-[rgba(247,247,247,0.05)] border border-[rgba(247,247,247,0.20)] flex items-center justify-center hover:bg-[rgba(247,247,247,0.1)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4 text-[#F7F7F7]" />
        </button>
      </div>
    </div>
  );
}