"use client"

import { AnimateNumber } from "motion-plus/react"
import { LayoutGroup, motion, MotionProps } from "framer-motion"
import { useState } from "react"

export default function NumberCounter({
                                        min = -Infinity,
                                        max = Infinity,
                                      }: {
  min?: number
  max?: number
}) {
  const [value, setValue] = useState(0)

  const handlePointerDown = (delta: number) => () => {
    setValue(Math.min(Math.max(value + delta, min), max))
  }

  return (
    <LayoutGroup>
      <motion.div layout style={container}>
        <motion.button
          disabled={min != null && value <= min}
          onPointerDown={handlePointerDown(-1)}
          {...buttonProps}
        >
          <AdditionIcon type="minus" />
        </motion.button>
        <AnimateNumber style={number}>{value}</AnimateNumber>
        <motion.button
          disabled={max != null && value >= max}
          onPointerDown={handlePointerDown(1)}
          {...buttonProps}
        >
          <AdditionIcon type="plus" />
        </motion.button>
      </motion.div>
    </LayoutGroup>
  )
}

/**
 * ==============   Styles   ================
 */

const container = {
  backgroundColor: "#f7f7f70d",
  borderRadius: 1000,
  padding: "10px 20px",
  display: "flex",
  alignItems: "center",
  gap: 20,
  fontFamily: `"Azeret Mono", monospace`,
}

const button = {
  backgroundColor: "#f7f7f70d",
  borderRadius: 50,
  padding: 10,
  display: "flex",
  alignItems: "center",
  gap: 10,
}

const number = {
  fontSize: 20,
  fontVariantNumeric: "tabular-nums",
}

const buttonProps: MotionProps = {
  initial: {
    boxShadow: "0px 0px 0px 2px #0cdcf700",
  },
  whileHover: {
    scale: 1.1,
  },
  whileTap: {
    scale: 0.9,
  },
  whileFocus: {
    boxShadow: "0px 0px 0px 2px #0cdcf7ff",
  },
  layout: true,
  style: button,
}

/**
 * ==============   Icons   ================
 */
const AdditionIcon = ({ type }: { type: "plus" | "minus" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14" />
    {type === "plus" && <path d="M12 5v14" />}
  </svg>
)
