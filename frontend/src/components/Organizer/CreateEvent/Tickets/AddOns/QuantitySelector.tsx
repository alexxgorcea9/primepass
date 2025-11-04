"use client"

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import NumberCounterField from '../NumberCounterField';

interface QuantitySelectorProps {
  isUnlimited?: boolean;
  quantity?: number;
  onUnlimitedChange?: (value: boolean) => void;
  onQuantityChange?: (value: number) => void;
  min?: number;
  max?: number;
}

const options = ["Unlimited", "Finite"];

export default function QuantitySelector({ 
  isUnlimited = true,
  quantity = 0,
  onUnlimitedChange,
  onQuantityChange,
  min = 1,
  max = 10000
}: QuantitySelectorProps) {
  const [internalUnlimited, setInternalUnlimited] = useState(isUnlimited);
  const [internalQuantity, setInternalQuantity] = useState(quantity);

  const selectedIndex = internalUnlimited ? 0 : 1;

  const handleToggle = (unlimited: boolean) => {
    setInternalUnlimited(unlimited);
    onUnlimitedChange?.(unlimited);
  };

  const handleQuantityChange = (value: number) => {
    setInternalQuantity(value);
    onQuantityChange?.(value);
  };

  return (
    <div className="w-full flex flex-col gap-0">
      <div className="w-full  p-2.5 inline-flex justify-between items-center gap-2.5 overflow-hidden">
        <div className="w-fit justify-center text-white text-md font-normal font-['Lufga'] leading-none">
          Amount
        </div>

        {/* Toggle */}
        <nav className="toggle-container">
          <ul>
            {options.map((name, index) => {
              const isSelected = selectedIndex === index;
              const unlimited = index === 0; // Unlimited = true, Finite = false

              return (
                <li
                  key={index}
                  className={isSelected ? "selected" : ""}
                  role="tab"
                  aria-selected={isSelected}
                >
                  {isSelected ? (
                    <motion.div
                      layoutId="quantity-toggle-indicator"
                      className="selected-indicator"
                    />
                  ) : null}
                  <motion.button
                    onTapStart={() => handleToggle(unlimited)}
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

      {/* Quantity Selector - Only visible when Finite is selected */}
      <AnimatePresence>
        {!internalUnlimited && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <NumberCounterField
              label="Quantity"
              value={internalQuantity}
              onChange={handleQuantityChange}
              min={min}
              max={max}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <StyleSheet />
    </div>
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
            font-size: 1rem;
            line-height: 1.5rem;
            font-weight: 400;
        }

    `}</style>
  );
}