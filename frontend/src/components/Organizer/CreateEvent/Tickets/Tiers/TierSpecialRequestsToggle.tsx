"use client"

import { motion } from 'framer-motion';

interface TierSpecialRequestsToggleProps {
  specialRequests: boolean;
  onToggle: (value: boolean) => void;
}

const options = ["Yes", "No"];

export default function TierSpecialRequestsToggle({ specialRequests, onToggle }: TierSpecialRequestsToggleProps) {
  const selectedIndex = specialRequests ? 0 : 1;


  return (
    <motion.div 
      layout
      className={`self-stretch h-fit p-2.5 overflow-hidden rounded-[20px] flex flex-col justify-between items-start  ${
        specialRequests
          ? 'bg-gradient-to-r from-[rgba(217,179,226,0.30)] to-[rgba(247,247,247,0.30)]'
          : 'bg-BG-2' // alternative background
      }`}
    >
      <div className="self-stretch px-2.5 overflow-hidden inline-flex justify-between items-center">
        <div className="flex-1 overflow-hidden flex justify-start items-center gap-2.5">
          <div className="py-[5px] overflow-hidden inline-flex flex-col justify-center items-center gap-2.5">
            <div className="self-stretch justify-center flex flex-col text-[#F7F7F7] text-sm font-normal font-['Lufga'] leading-[18px]">
              Special Requests
            </div>
          </div>
        </div>
        <nav className="toggle-container">
          <ul>
            {options.map((name, index) => {
              const isSelected = selectedIndex === index;
              const value = index === 0; // Yes = true, No = false

              return (
                <li
                  key={index}
                  className={isSelected ? "selected" : ""}
                  role="tab"
                  aria-selected={isSelected}
                >
                  {isSelected ? (
                    <motion.div
                      layoutId="toggle-indicator"
                      className="selected-indicator"
                    />
                  ) : null}
                  <motion.button
                    onTapStart={() => onToggle(value)}
                    whileFocus={{
                      backgroundColor: "var(--accent-transparent)",
                    }}
                  >
                    {name}
                  </motion.button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      <StyleSheet />
    </motion.div>
  );
}

/**
 * ==============   Styles   ================
 */

function StyleSheet() {
  return (
    <style>{`
        .toggle-container {
            width: fit-content;
            height: fit-content;
            background-color: #F7F7F70D;
            border-radius: 8px;
        }

        .toggle-container ul {
            display: flex;
            gap: 5px;
            flex-direction: row;
            align-items: center;
            justify-content: center;
        }

        .toggle-container li {
            color: #f7f7f7;
            position: relative;
        }

        .toggle-container .selected-indicator {
            background-color: #f7f7f7;
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            z-index: 1;
            border-radius: 8px;
        }

        .toggle-container button {
            z-index: 2;
            position: relative;
            cursor: pointer;
            padding: 10px 14px;
            border-radius: 8px;
            mix-blend-mode: difference;
        }

    `}</style>
  );
}
