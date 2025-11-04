import { motion, Transition } from 'framer-motion';

export default function LaunchLoadingScreen() {
  const animation = {
    transform: ['scale(0)', 'scale(1)'],
    opacity: [1, 0],
  };

  const transition: Transition = {
    duration: 2,
    repeat: Infinity,
    ease: 'easeOut',
  };

  return (
    <div className="w-full h-full bg-[#0A0A0A] flex flex-col justify-center items-center gap-8">
      {/* Ripple Animation */}
      <div className="relative w-[100px] h-[100px]">
        <motion.div
          className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-[5px] border-accent2 opacity-0"
          style={{ willChange: 'transform, opacity' }}
          animate={animation}
          transition={transition}
        />
        <motion.div
          className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-[5px] border-accent2 opacity-0"
          style={{ willChange: 'transform, opacity' }}
          animate={animation}
          transition={{
            ...transition,
            delay: 0.5,
          }}
        />
        <motion.div
          className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-[5px] border-accent2 opacity-0"
          style={{ willChange: 'transform, opacity' }}
          animate={animation}
          transition={{
            ...transition,
            delay: 1,
          }}
        />
      </div>
    </div>
  );
}