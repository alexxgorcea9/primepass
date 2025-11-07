"use client"

import { AnimatePresence, LayoutGroup, motion } from "motion/react"
import React, { useState } from "react"
import Scan from "@/assets/scan-barcode-black.svg"
import Heart from "@/components/Organizer/EventDetails/Checkin/Heart";
import X from "@/components/Organizer/EventDetails/Checkin/X";
import RotatingDots from '@components/Organizer/EventDetails/Checkin/RotatingDots';

type IslandState = "waiting" | "valid" | "invalid"

function StateTrigger({
                        value,
                        currentState,
                        children,
                        onStateChange,
                      }: {
  value: IslandState
  currentState: IslandState
  children: React.ReactNode
  onStateChange: (value: IslandState) => void
}) {
  return (
    <button
      className="state-trigger"
      onClick={() => onStateChange(value)}
      data-state={currentState === value ? 'active' : 'inactive'}
    >
      {children}
      {currentState === value && (
        <motion.div
          className="state-indicator"
          layoutId="state-indicator"
        />
      )}
    </button>
  )
}

function StateContent({
  value,
  title,
  content,
  buttonText,
                        onStateChange,
}: {
  value: string;
  title: string;
  content: React.ReactNode;
  buttonText: string;
  onStateChange?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(5px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{
        opacity: 0,
        filter: 'blur(5px)',
        transition: { duration: 0.15 },
      }}
      layout="position"
      className="state-content"
    >
      <h3>{title}</h3>
      <div className="content-wrapper">{content}</div>

      {buttonText && (
        <motion.button whileTap={{ scale: 0.9 }} className="button large" onClick={onStateChange}>
          <img src={Scan} alt="Scan" className="w-6 h-6" />
          {buttonText}
        </motion.button>
      )}
    </motion.div>
  );
}

export default function DynamicIsland() {
  const [state, setState] = useState<IslandState>('waiting');

  return (
    <LayoutGroup>
      <motion.div className="island-root"
                  layout
                  transition={{
                    layout: { duration: 0.3, ease: "easeInOut" }
                  }}>
        <motion.div
          className="state-list"
          aria-label="Dynamic Island States"
          layout
        >
          <StateTrigger
            value="waiting"
            currentState={state}
            onStateChange={setState}
          >
            Waiting
          </StateTrigger>
          <StateTrigger
            value="valid"
            currentState={state}
            onStateChange={setState}
          >
            Valid
          </StateTrigger>
          <StateTrigger
            value="invalid"
            currentState={state}
            onStateChange={setState}
          >
            Invalid
          </StateTrigger>
        </motion.div>

        <AnimatePresence mode="wait" initial={false}>
          {state === 'waiting' && (
            <StateContent
              key="waiting"
              value="waiting"
              title="Point me at something scannable"
              content={
                <RotatingDots />
              }
              buttonText=""
            />
          )}
          {state === 'valid' && (
            <StateContent
              key="valid"
              value="valid"
              title="That's a keeper"
              content={
                  <Heart />
              }
              buttonText="New Scan"
              onStateChange={() => setState('waiting')}
            />
          )}
          {state === 'invalid' && (
            <StateContent
              key="invalid"
              value="invalid"
              title="QR says no-go"
              content={
                  <X />
              }
              buttonText="New Scan"
              onStateChange={() => setState('waiting')}
            />
          )}
        </AnimatePresence>

        <StyleSheet />
      </motion.div>
    </LayoutGroup>
  );
}

/**
 * ==============   Styles   ================
 */

function StyleSheet() {
  return (
    <style>{`
        .island-root {
            display: flex;
            flex-direction: column;
            width: 100%;
            max-width: 100%;
            background-color: #f7f7f70d;
            border-radius: 20px;
            overflow: visible;
            -webkit-backdrop-filter: blur(40px);
            transform-origin: bottom center;
        }

        .state-list {
            display: flex;
            border-bottom: 1px solid #1d2628;
        }

        .state-trigger {
            font-family: inherit;
            padding: 0 20px;
            height: 45px;
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            line-height: 1;
            color: #888;
            user-select: none;
            cursor: pointer;
            background: transparent;
            border: none;
            border-bottom: 2px solid transparent;
            transition: all 0.2s ease;
            position: relative;
        }

        .state-trigger .state-indicator {
            position: absolute;
            bottom: -2px;
            left: 0;
            right: 0;
            height: 2px;
            background: #ff0088;
        }

        .state-trigger:hover {
            color: #fff;
        }

        .state-trigger[data-state='active'] {
            color: #fff;
        }

        .state-content {
            padding: 20px;
            will-change: opacity, filter;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .state-content h3 {
            margin: 0 0 10px 0;
            color: #fff;
            font-size: 18px;
            font-weight: 500;
        }

        .content-wrapper {
            margin: 0 0 20px 0;
            color: #aaa;
            font-size: 14px;
            line-height: 1.5;
        }

        .form-fields {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .input-field {
            padding: 8px 12px;
            border: 1px solid #1d2628;
            border-radius: 4px;
            background: #0b1011;
            color: #fff;
            font-size: 14px;
        }

        .input-field:focus {
            outline: none;
            border-color: #ff0088;
            transition: border-color 0.2s ease;
        }

        .button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: fit-content;
            padding: 10px;
            border-radius: 40px;
            font-weight: 500;
            font-size: 14px;
            gap: 10px;
            user-select: none;
            border: none;
            background: #f7f7f7;
            color: #0a0a0a;
            cursor: pointer;
        }

        .button.large {
            font-size: 16px;
            padding: 10px;
            height: fit-content;
        }
    `}</style>
  )
}