"use client"

import { motion, transform, useAnimate } from "motion/react"
import { useEffect, useState } from "react"

function CharactersRemaining() {
  const [value, setValue] = useState("")
  const maxLength = 12
  const charactersRemaining = maxLength - value.length
  const [counterRef, animate] = useAnimate()

  const mapRemainingToColor = transform([2, 6], ["#ff008c", "#ccc"])

  useEffect(() => {
    if (charactersRemaining > 6) return

    const mapRemainingToSpringVelocity = transform([0, 5], [50, 0])

    animate(
      counterRef.current,
      { scale: 1 },
      {
        type: "spring",
        velocity: mapRemainingToSpringVelocity(charactersRemaining),
        stiffness: 700,
        damping: 80,
      }
    )
  }, [animate, charactersRemaining])

  return (
    <div className="container">
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <div>
        <motion.span
          ref={counterRef}
          style={{
            color: mapRemainingToColor(charactersRemaining),
            willChange: "transform",
          }}
        >
          {charactersRemaining}
        </motion.span>
      </div>
      <Stylesheet />
    </div>
  )
}

function Stylesheet() {
  return (
    <style>
      {`
        .container, input {
          position: relative;
          font-size: 32px;
          line-height: 1;
        }

        input {
          background-color: #0b1011;
          color: #f5f5f5;
          border: 2px solid #1d2628;
          border-radius: 10px;
          padding: 20px;
          padding-right: 70px;
          width: 300px;
        }

        input:focus {
          border-color: var(--hue-blue);
        }

        .container div {
          color: #ccc;
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            #0b1011 20%
          );
          position: absolute;
          top: 50%;
          right: 2px;
          transform: translateY(-50%);
          padding: 10px;
          padding-right: 20px;
          padding-left: 50px;
        }

        .container div span {
          display: block;
        }
      `}
    </style>
  )
}

export default CharactersRemaining
