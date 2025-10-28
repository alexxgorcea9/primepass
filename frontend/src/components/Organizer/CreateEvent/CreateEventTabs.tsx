"use client"

import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';

const tabs = ["Details", "Media", "Tickets"];

interface CreateEventTabsProps {
  activeTab?: number;
  onTabChange?: (index: number) => void;
  onLaunch?: () => void;
}

export default function CreateEventTabs({ 
  activeTab = 0, 
  onTabChange,
  onLaunch 
}: CreateEventTabsProps) {
  const selectedTab = activeTab;

  return (
    <nav className="w-fit">
      <div className="w-fit p-1 bg-[rgba(247,247,247,0.05)] overflow-hidden rounded-lg backdrop-blur-[20px] flex justify-center items-center gap-1">
        {tabs.map((name, index) => {
          const isSelected = selectedTab === index;

          return (
            <div
              key={index}
              className={`relative h-12 ${isSelected ? '' : ''}`}
            >
              {isSelected && (
                <motion.div
                  layoutId="create-event-tab-indicator"
                  className="absolute inset-0 bg-[#F7F7F7] rounded-lg z-0"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <motion.button
                onTapStart={() => onTabChange?.(index)}
                className="relative z-10 h-full p-2.5 overflow-hidden rounded-lg flex flex-col justify-center items-center gap-2.5"
                style={{ mixBlendMode: 'difference' }}
                whileFocus={{
                  backgroundColor: isSelected ? undefined : "rgba(247, 247, 247, 0.1)",
                }}
              >
                <div className="flex flex-col justify-center text-sm font-['Lufga'] font-normal leading-[18px] text-[#F7F7F7]">
                  {name}
                </div>
              </motion.button>
            </div>
          );
        })}
        
        {/* Launch Button */}
        <button
          onClick={() => onTabChange?.(3)}
          className={`h-12 px-2.5 py-2.5 overflow-hidden rounded-lg flex justify-center items-center gap-2.5 transition-all ${
            selectedTab === 3
              ? 'bg-gradient-to-r from-[rgba(217,179,226,0.30)] to-[rgba(244,192,95,0.30)]'
              : 'bg-gradient-to-r from-[rgba(217,179,226,0.20)] to-[rgba(244,192,95,0.20)] hover:from-[rgba(217,179,226,0.30)] hover:to-[rgba(244,192,95,0.30)]'
          }`}
        >
          <div className="flex flex-col justify-center text-white text-sm font-['Lufga'] font-normal leading-[18px]">
            Launch
          </div>
          <Rocket className="w-4 h-4 text-[#F7F7F7]" strokeWidth={1.5} />
        </button>
      </div>
    </nav>
  );
}
