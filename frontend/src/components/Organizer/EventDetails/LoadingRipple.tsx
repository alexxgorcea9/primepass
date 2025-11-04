"use client"

import { motion, Transition } from "motion/react"

function LoadingRipple() {
  const animation = {
    transform: ["scale(0)", "scale(1)"],
    opacity: [1, 0],
  }

  const transition: Transition = {
    duration: 2,
    repeat: Infinity,
    ease: "easeOut",
  }

  return (
    <div className="container">
      <div className="ripple-container">
        <motion.div
          className="ripple"
          animate={animation}
          transition={transition}
        />
        <motion.div
          className="ripple"
          animate={animation}
          transition={{
            ...transition,
            delay: 0.5,
          }}
        />
        <motion.div
          className="ripple"
          animate={animation}
          transition={{
            ...transition,
            delay: 1,
          }}
        />
      </div>
      <StyleSheet />
    </div>
  )
}

/**
 * ==============   Styles   ================
 */
function StyleSheet() {
  return (
    <style>
      {`
            .container {
                display: flex;
                justify-content: center;
                align-items: center;
            }

            .ripple-container {
                position: relative;
                width: 100px;
                height: 100px;
            }

            .ripple {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                border-radius: 50%;
                border: 5px solid #D9B3E2;
                will-change: transform, opacity;
                opacity: 0;
            }
            `}
    </style>
  )
}

export default LoadingRipple
