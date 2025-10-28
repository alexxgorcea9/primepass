import { motion, transform, useAnimate } from 'framer-motion';
import { useEffect } from 'react';

interface EventInputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  showCharCount?: boolean;
}

export default function TextInputLine({
  label,
  value,
  onChange,
  placeholder = '',
  maxLength,
  showCharCount = false,
}: EventInputFieldProps) {
  const charactersRemaining = maxLength ? maxLength - value.length : 0;
  const [counterRef, animate] = useAnimate();
  
  // Map remaining characters to color (pink when low, grey when high)
  const mapRemainingToColor = transform([2, 6], ["#ff008c", "#B4B8B3"]);
  const counterColor = mapRemainingToColor(charactersRemaining);
  
  // Spring animation when character count is low
  useEffect(() => {
    if (charactersRemaining > 6 || !counterRef.current) return;

    const mapRemainingToSpringVelocity = transform([0, 5], [50, 0]);

    animate(
      counterRef.current,
      { scale: 1 },
      {
        type: "spring",
        velocity: mapRemainingToSpringVelocity(charactersRemaining),
        stiffness: 700,
        damping: 80,
      }
    );
  }, [animate, charactersRemaining, counterRef]);

  return (
    <div className="w-full p-2.5 overflow-hidden flex items-center gap-2.5">
      <div className="w-[100px] flex flex-col justify-center text-[#F7F7F7] text-sm font-['Lufga'] font-normal leading-[18px]">
        {label}
      </div>
      <div className="flex-1 relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full p-2.5 bg-[rgba(247,247,247,0.05)] overflow-hidden rounded-lg border border-[rgba(247,247,247,0.20)] text-white text-md font-['Lufga'] font-normal leading-[18px] placeholder:text-[rgba(247,247,247,0.3)] focus:outline-none focus:border-[rgba(247,247,247,0.4)] transition-colors"
        />
        {showCharCount && maxLength && (
          <motion.div
            ref={counterRef}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-['Lufga'] font-normal leading-[18px] pointer-events-none"
            style={{ color: counterColor, willChange: 'transform' }}
          >
            {charactersRemaining}
          </motion.div>
        )}
      </div>
    </div>
  );
}
