"use client"

import { motion } from 'framer-motion';
import TicketIcon from '@/assets/ticket.svg';
import TableIcon from '@/assets/table.svg';

const tabs = [
  { name: "Tickets", icon: TicketIcon },
  { name: "Tables", icon: TableIcon }
];

interface TabSelectProps {
  activeTab?: number;
  onTabChange?: (index: number) => void;
}

export default function CheckinTabs({
                                      activeTab = 0,
                                      onTabChange,
                                    }: TabSelectProps) {
  const selectedTab = activeTab;

  return (
    <nav className="container">
      <ul>
        {tabs.map((tab, index) => {
          const isSelected = selectedTab === index;

          return (
            <li
              key={index}
              className={isSelected ? 'selected' : ''}
              role="tab"
              aria-selected={isSelected}
              aria-label={tab.name}
            >
              {isSelected ? (
                <motion.div
                  layoutId="launch-tab-indicator"
                  className="selected-indicator"
                />
              ) : null}
              <motion.button
                onTapStart={() => onTabChange?.(index)}
                whileFocus={{
                  backgroundColor: 'var(--accent-transparent)',
                }}
                className="h-12 p-2.5"
              >
                <div className="flex flex-col justify-center items-center">
                  <img src={tab.icon} alt={tab.name} className="w-5 h-5" />
                </div>
              </motion.button>
            </li>
          );
        })}
      </ul>
      <StyleSheet />
    </nav>
  );
}

/**
 * ==============   Styles   ================
 */

function StyleSheet() {
  return (
    <style>{`
        .container {
            width: fit-content;
            background-color: #F7F7F70D;
            padding: 4px;
            border-radius: 8px;
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
        }

        .container ul {
            display: flex;
            gap: 5px;
            flex-direction: row;
            align-items: center;
            justify-content: center;
        }

        .container li {
            color: #f7f7f7;
            position: relative;
            font-family: 'Lufga', sans-serif;
        }

        .container .selected-indicator {
            background-color: #f7f7f7;
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            z-index: 1;
            border-radius: 8px;
        }

        .container button {
            z-index: 2;
            position: relative;
            cursor: pointer;
            padding: 8px 12px;
            border-radius: 20px;
            mix-blend-mode: difference;
        }

        .container button {
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
    `}</style>
  );
}