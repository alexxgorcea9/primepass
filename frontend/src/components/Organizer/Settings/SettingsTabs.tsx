"use client"

import { motion } from "motion/react"
import { useState } from "react"

const tabs = ["Payments", "Guests"]

export default function SettingsTabs() {
  const [selectedTab, setSelectedTab] = useState(0)

  return (
    <nav className="container sticky-tabs">
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
                  layoutId="selected-indicator"
                  className="selected-indicator"
                />
              ) : null}
              <motion.button
                /**
                 * Using onTap instead of onClick makes this
                 * element keyboard-accessible by default
                 */
                onTapStart={() => setSelectedTab(index)}
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
        .sticky-tabs {
            position: sticky;
            top: 88px;
            z-index: 30;
            background-color: #0A0A0A;
            padding-top: 10px;
            padding-bottom: 10px;
        }

        .container {
            padding: 5px;
        }

        .container ul {
            display: flex;
            gap: 5px;
            flex-direction: row;
            align-items: center;
            justify-content: start;
        }

        .container li {

            position: relative;
        }

        .container li.selected {
            color: #0a0a0a;
        }

        .container .selected-indicator {
            background-color: #f7f7f7;
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            z-index: 1;
            border-radius: 40px;
        }

        .container button {
            z-index: 2;
            position: relative;
            cursor: pointer;
            padding: 10px 14px;
            border-radius: 5px;
            mix-blend-mode: difference;
            color: #f7f7f7;
            transition: color 0.3s ease;
        }

    `}</style>
  )
}
