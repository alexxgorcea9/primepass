"use client"

import {
  AnimatePresence,
  motion,
  Transition,
} from "motion/react"
import { useEffect, useRef, useState } from "react"

interface MultiStateBadgeProps {
  state: keyof typeof STATES;
  onStateChange: (state: keyof typeof STATES) => void;
  disabled?: boolean;
}

export default function MultiStateBadge({ state, onStateChange, disabled = false }: MultiStateBadgeProps) {
  return (
    <div style={styles.container}>
      <button
        onClick={() => {
          if (!disabled) {
            onStateChange(getNextState(state))
          }
        }}
        disabled={disabled}
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Badge state={state} />
      </button>
    </div>
  )
}

const Badge = ({ state }: { state: keyof typeof STATES }) => {
  return (
    <motion.div
      style={{
        ...styles.badge,
        gap: 8,
      }}
      initial={false}
      animate={{
        backgroundColor: state === "ready" ? "#f7f7f7" : "#ff0d000d",
        color: state === "ready" ? "#0f1115" : "#ff0d00",
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
    >
      <Icon state={state} />
      <Label state={state} />
    </motion.div>
  )
}

/**
 * ==============   Icons   ================
 */
const Icon = ({ state }: { state: keyof typeof STATES }) => {
  const IconComponent = state === "back" ? <ArrowLeft /> : <></>

  return (
    <>
      <motion.span
        style={styles.iconContainer}
        animate={{
          width: state === "ready" ? 0 : 20,
        }}
        transition={SPRING_CONFIG}
      >
        <AnimatePresence>
          <motion.span
            key={state}
            style={styles.icon}
            initial={{
              y: -40,
              scale: 0.5,
              filter: "blur(6px)",
            }}
            animate={{
              y: 0,
              scale: 1,
              filter: "blur(0px)",
            }}
            exit={{
              y: 40,
              scale: 0.5,
              filter: "blur(6px)",
            }}
            transition={{
              duration: 0.15,
              ease: "easeInOut",
            }}
          >
            {IconComponent}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </>
  )
}

const ICON_SIZE = 20
const STROKE_WIDTH = 1.5
const VIEW_BOX_SIZE = 24

const svgProps = {
  width: ICON_SIZE,
  height: ICON_SIZE,
  viewBox: `0 0 ${VIEW_BOX_SIZE} ${VIEW_BOX_SIZE}`,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: STROKE_WIDTH,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}

const springConfig: Transition = {
  type: "spring",
  stiffness: 150,
  damping: 20,
}

const animations = {
  initial: { pathLength: 0 },
  animate: { pathLength: 1 },
  transition: springConfig,
}

const secondLineAnimation = {
  ...animations,
  transition: { ...springConfig, delay: 0.1 },
}

function ArrowLeft() {
  return (
    <motion.svg {...svgProps}>
      <motion.line x1="19" y1="12" x2="5" y2="12" {...animations} />
      <motion.polyline points="12 19 5 12 12 5" {...secondLineAnimation} />
    </motion.svg>
  )
}

const Label = ({ state }: { state: keyof typeof STATES }) => {
  const [labelWidth, setLabelWidth] = useState(0)

  const measureRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (measureRef.current) {
      const { width } = measureRef.current.getBoundingClientRect()
      setLabelWidth(width)
    }
  }, [state])

  return (
    <>
      {/* Hidden copy of label to measure width */}
      <div
        ref={measureRef}
        style={{
          position: "absolute",
          visibility: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        {STATES[state]}
      </div>

      <motion.span
        layout
        style={{
          position: "relative",
        }}
        animate={{
          width: labelWidth,
        }}
        transition={SPRING_CONFIG}
      >
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={state}
            style={{
              textWrap: "nowrap",
            }}
            initial={{
              y: -20,
              opacity: 0,
              filter: "blur(10px)",
              position: "absolute",
            }}
            animate={{
              y: 0,
              opacity: 1,
              filter: "blur(0px)",
              position: "relative",
            }}
            exit={{
              y: 20,
              opacity: 0,
              filter: "blur(10px)",
              position: "absolute",
            }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
          >
            {STATES[state]}
          </motion.div>
        </AnimatePresence>
      </motion.span>
    </>
  )
}

/**
 * ==============   Styles   ================
 */
type Styles = {
  [K: string]: React.CSSProperties | Styles
}
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    height: 80,
  },
  badge: {
    display: "flex",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 20px",
    borderRadius: 999,
    willChange: "transform, filter",
  },
  iconContainer: {
    height: 20,
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    position: "absolute",
    left: 0,
    top: 0,
  },
} as const satisfies Styles

/**
 * ==============   Utils   ================
 */
export const STATES = {
  ready: "Ready",
  back: "Back",
} as const

const getNextState = (state: keyof typeof STATES) => {
  return state === "ready" ? "back" : "ready"
}

const SPRING_CONFIG: Transition = {
  type: "spring",
  stiffness: 600,
  damping: 30,
}
