"use client"

import { motion, useTime, useTransform } from "motion/react"
import React from 'react';
import Dots from "@/components/Organizer/EventDetails/Checkin/Dots";

export default function RotatingDots() {
  const time = useTime()

  // Create a looping time value (0-4000ms repeating)
  const loopTime = useTransform(time, (t) => t % 4000)

  // Create a cycle: rotate fast, then pause, then repeat
  const rotate = useTransform(
    loopTime,
    [0, 500, 1500, 2000, 3000], // time keyframes
    [0, 360, 360, 720, 720],     // rotation keyframes
  )

  const box = {
    width: 100,
    height: 100,
    rotate,
  }

  return (
    <>
      <div style={{ ...layer, filter: "blur(4px)" }}>
      </div>
      <div style={{ ...layer, filter: "blur(2px)" }}>
      </div>
      <div style={layer}>
        <div style={boxContainer}>
          <motion.div style={box}>
            <Dots />
          </motion.div>
        </div>
      </div>
    </>
  )
}

/**
 * ==============   Styles   ================
 */
const layer: React.CSSProperties = {
  position: "relative",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 20,
}

const boxContainer: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 50,
  flexWrap: "wrap",
}