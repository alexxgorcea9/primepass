"use client"

import { motion } from 'framer-motion';

const tabs = ["Events", "Analytics"]

interface TabSelectProps {
  activeTab?: number;
  onTabChange?: (index: number) => void;
}

export default function TabSelect({ activeTab = 0, onTabChange }: TabSelectProps) {
  const selectedTab = activeTab

  return (
    <nav className="container">
      <ul>
        {tabs.map((name, index) => {
          const isSelected = selectedTab === index

          return (
            <li
              key={index}
              className={isSelected ? "selected" : ""}
              role="tab"
              aria-selected={isSelected}
            >
              {isSelected ? (
                <motion.div
                  layoutId="dashboard-tab-indicator"
                  className="selected-indicator"
                />
              ) : null}
              <motion.button
                /**
                 * Using onTap instead of onClick makes this
                 * element keyboard-accessible by default
                 */
                onTapStart={() => onTabChange?.(index)}
                whileFocus={{
                  backgroundColor:
                    "var(--accent-transparent)",
                }}
              >
                {name}
              </motion.button>
            </li>
          )
        })}
      </ul>
      <StyleSheet />
    </nav>
  )
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
            padding: 10px 14px;
            border-radius: 20px;
            mix-blend-mode: difference;
        }

    `}</style>
  )
}
