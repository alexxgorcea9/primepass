import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TIER_GRADIENTS } from '@/constants/tierGradients';

interface TierColorSelectorProps {
  selectedGradientId: string;
  onGradientChange: (gradientId: string) => void;
}

export default function TierColorSelector({ selectedGradientId, onGradientChange }: TierColorSelectorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const selectedGradientObj = TIER_GRADIENTS.find(g => g.id === selectedGradientId);

  const handleGradientSelect = (gradientId: string) => {
    onGradientChange(gradientId);
    setShowColorPicker(false);
  };

  return (
    <motion.div layout className="self-stretch">
      {/* Color Selector */}
      <motion.div layout className="self-stretch p-2.5 inline-flex justify-start items-center gap-2.5">
        <div className="w-[100px] justify-center flex flex-col text-[#F7F7F7] text-md font-normal font-['Lufga'] leading-[18px]">
          Color
        </div>
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className={`w-6 h-6 p-2.5 bg-gradient-to-b ${selectedGradientObj?.className} rounded-lg backdrop-blur-[20px] hover:scale-110 transition-transform cursor-pointer`}
        />
      </motion.div>

      {/* Color Palette - Popup */}
      <AnimatePresence initial={false}>
        {showColorPicker && (
          <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ 
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1]
            }}
            style={{ overflow: 'hidden' }}
            className="self-stretch"
          >
            <motion.div 
              layout
              className="p-2.5 flex flex-col justify-center items-start gap-2.5 w-full"
            >
              <div className="self-stretch p-2.5 bg-[rgba(247,247,247,0.05)] overflow-hidden rounded-lg border border-[rgba(247,247,247,0.20)] inline-flex justify-between items-center">
                {TIER_GRADIENTS.map((gradient) => (
                  <button
                    key={gradient.id}
                    onClick={() => handleGradientSelect(gradient.id)}
                    className={`w-6 h-6 p-2.5 bg-gradient-to-b ${gradient.className} rounded-lg backdrop-blur-[20px] hover:scale-110 transition-transform ${
                      selectedGradientId === gradient.id ? 'ring-2 ring-[#F7F7F7] ring-offset-2 ring-offset-[#0A0A0A]' : ''
                    }`}
                    aria-label={`Select ${gradient.name} color`}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
