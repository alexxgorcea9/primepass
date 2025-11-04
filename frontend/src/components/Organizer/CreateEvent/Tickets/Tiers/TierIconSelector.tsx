import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Ticket from '@/assets/ticket.svg';
import Crown from '@/assets/crown.svg';
import Diamond from '@/assets/diamonds.svg';
import Shield from '@/assets/shield.svg';
import Star from '@/assets/star.svg';
import Flash from '@/assets/flash.svg';

interface TierIconSelectorProps {
  selectedIcon: string; // stores the actual SVG import (URL)
  onIconChange: (icon: string) => void;
}

export default function TierIconSelector({ selectedIcon, onIconChange }: TierIconSelectorProps) {
  const [showIconPicker, setShowIconPicker] = useState(false);

  const iconOptions = [
    { name: 'Ticket', icon: Ticket },
    { name: 'Crown', icon: Crown },
    { name: 'Diamond', icon: Diamond },
    { name: 'Shield', icon: Shield },
    { name: 'Star', icon: Star },
    { name: 'Flash', icon: Flash },
  ];

  const handleIconSelect = (icon: string) => {
    onIconChange(icon); // pass SVG path up
    setShowIconPicker(false);
  };

  // Find selected icon by SVG URL instead of name
  const selectedIconObj =
    iconOptions.find(i => i.icon === selectedIcon) || iconOptions[0];

  return (
    <motion.div layout className="self-stretch">
      {/* Icon Selector */}
      <motion.div
        layout
        className="self-stretch p-2.5 inline-flex justify-start items-center gap-2.5"
      >
        <div className="w-[100px] justify-center flex flex-col text-[#F7F7F7] text-md font-normal font-['Lufga'] leading-[18px]">
          Icon
        </div>
        <button
          onClick={() => setShowIconPicker(!showIconPicker)}
          className="w-6 h-6 bg-[rgba(247,247,247,0.05)] overflow-hidden rounded-lg backdrop-blur-[20px] flex justify-center items-center hover:bg-[rgba(247,247,247,0.10)] transition-colors"
        >
          <img
            src={selectedIconObj.icon}
            alt={selectedIconObj.name}
            className="w-3 h-3"
          />
        </button>
      </motion.div>

      {/* Icon Options Row - Popup */}
      <AnimatePresence initial={false}>
        {showIconPicker && (
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
              className="inline-flex justify-start items-center gap-2.5 w-full"
            >
              <div className="flex-1 p-2.5 bg-[rgba(247,247,247,0.05)] rounded-lg border border-[rgba(247,247,247,0.20)] inline-flex justify-between items-center">
                {iconOptions.map(({ name, icon }) => (
                  <button
                    key={name}
                    onClick={() => handleIconSelect(icon)} // send back the SVG URL
                    className="w-6 h-6 bg-[rgba(247,247,247,0.05)] rounded-lg flex justify-center items-center hover:bg-[rgba(247,247,247,0.10)] transition-colors"
                  >
                    <img src={icon} alt={name} className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
