"use client"

import { motion } from 'framer-motion';

const tabs = ["Waves", "Privileges", "Add Ons", "Tables"];

interface TierDetailTabsProps {
  activeTab?: number;
  onTabChange?: (index: number) => void;
}

export default function TierDetailTabs({ activeTab = 0, onTabChange }: TierDetailTabsProps) {
  const selectedTab = activeTab;

  return (
    <nav className="w-fit bg-[rgba(247,247,247,0.05)] overflow-hidden rounded-[8px] backdrop-blur-[20px] flex justify-center items-center">
      <ul className="flex gap-0 flex-row items-center justify-center">
        {tabs.map((name, index) => {
          const isSelected = selectedTab === index;

          return (
            <li
              key={index}
              className="text-white relative"
              role="tab"
              aria-selected={isSelected}
            >
              {isSelected && (
                <motion.div
                  layoutId="tier-detail-tab-indicator"
                  className="absolute inset-0 bg-[#F7F7F7] rounded-lg z-0"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <motion.button
                onTapStart={() => onTabChange?.(index)}
                className="relative z-10 h-12 px-2.5 py-2.5 overflow-hidden rounded-lg flex flex-col justify-center items-center gap-2.5"
                style={{ mixBlendMode: 'difference' }}
                whileFocus={{
                  backgroundColor: isSelected ? undefined : "rgba(247, 247, 247, 0.1)",
                }}
              >
                <div className="flex flex-col justify-center text-sm font-['Lufga'] font-normal leading-[18px] text-[#F7F7F7]">
                  {name}
                </div>
              </motion.button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
