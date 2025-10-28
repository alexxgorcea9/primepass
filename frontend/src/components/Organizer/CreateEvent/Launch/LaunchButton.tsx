import { motion, PanInfo, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import Play from '@/assets/play.svg';
import ArrowRight from '@/assets/arrow-right.svg';

interface LaunchButtonProps {
  disabled?: boolean;
  onLaunch?: () => void;
}

export default function LaunchButton({ disabled = false, onLaunch }: LaunchButtonProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [isLaunched, setIsLaunched] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Calculate the maximum drag distance (container width - circle width)
  const CONTAINER_WIDTH = 280; // w-[280px]
  const CIRCLE_WIDTH = 72; // w-[72px] h-[72px]
  const PADDING = 6; // 6px padding to match vertical spacing (container 84px - circle 72px = 12px / 2 = 6px each side)
  const MAX_DRAG = CONTAINER_WIDTH - CIRCLE_WIDTH - (PADDING * 2); // Account for padding on both sides
  const THRESHOLD = MAX_DRAG * 0.7; // 70% threshold

  // Motion value for x position
  const x = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 500, damping: 30 });

  // Transform x position to visual properties
  const xInput = [0, MAX_DRAG];
  
  // Background gradient transforms based on drag position
  const background = useTransform(
    x,
    xInput,
    [
      'linear-gradient(90deg, rgba(247, 247, 247, 0.05) 0%, rgba(247, 247, 247, 0.05) 100%)',
      'linear-gradient(90deg, rgba(0, 255, 13, 0.25) 0%, rgba(0, 255, 13, 0.15) 100%)',
    ]
  );

  // Circle background color based on progress
  const circleColor = useTransform(
    x,
    xInput,
    ['#F7F7F7', '#00FF0D']
  );

  // Icon opacity and rotation for smooth feedback
  const iconRotation = useTransform(x, [0, MAX_DRAG], [0, 360]);
  const playIconOpacity = useTransform(x, [0, MAX_DRAG * 0.3], [1, 0]);
  const checkIconOpacity = useTransform(x, [MAX_DRAG * 0.6, MAX_DRAG], [0, 1]);
  
  // SVG path animations
  const checkPathLength = useTransform(x, [MAX_DRAG * 0.6, MAX_DRAG], [0, 1]);
  const circlePathLength = useTransform(x, [0, MAX_DRAG * 0.5], [0, 1]);

  // Animation variants for the flowing arrows
  const arrowAnimationVariants = {
    initial: { opacity: 0.1 },
    animate1: {
      opacity: [0.1, 1, 0.1],
      transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
    },
    animate2: {
      opacity: [0.1, 1, 0.1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 0.3,
      },
    },
    animate3: {
      opacity: [0.1, 1, 0.1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 0.6,
      },
    },
  };

  // Control spring target based on state
  useEffect(() => {
    if (!isDragging) {
      if (isLaunched) {
        x.set(MAX_DRAG);
      } else {
        x.set(0);
      }
    }
  }, [isDragging, isLaunched, x, MAX_DRAG]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled || isLaunched) return;
    
    const dragDistance = info.offset.x;
    
    setIsDragging(false);
    
    // If dragged past threshold, launch!
    if (dragDistance >= THRESHOLD) {
      setIsLaunched(true);
      
      // Trigger launch callback after animation
      setTimeout(() => {
        onLaunch?.();
      }, 300);
    }
  };

  return (
    <div className="relative">
      <motion.div
        ref={constraintsRef}
        className="w-[280px] h-[84px] rounded-[120px] backdrop-blur-[20px] relative overflow-hidden"
        style={{ 
          background: isDragging || isLaunched ? background : 'rgba(247, 247, 247, 0.05)',
          transition: 'background 0.3s ease-out'
        }}
      >
        {/* Text Label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div 
            className="text-[#F7F7F7] text-md font-normal font-['Lufga'] leading-none"
            animate={{
              scale: isDragging ? 0.95 : 1,
              opacity: isDragging ? 0.7 : 1
            }}
            transition={{ duration: 0.2 }}
          >
            {isLaunched ? 'Launching...' : 'Launch Event'}
          </motion.div>
        </div>

        {/* Flowing Arrows */}
        <motion.div 
          className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none"
          animate={{
            opacity: isDragging || isLaunched ? 0.3 : 1,
            scale: isDragging || isLaunched ? 0.9 : 1
          }}
          transition={{ duration: 0.3 }}
        >
          <motion.img 
            src={ArrowRight} 
            alt="" 
            className="w-4 h-4" 
            variants={arrowAnimationVariants}
            initial="initial"
            animate="animate1"
          />
          <motion.img 
            src={ArrowRight} 
            alt="" 
            className="w-4 h-4" 
            variants={arrowAnimationVariants}
            initial="initial"
            animate="animate2"
          />
          <motion.img 
            src={ArrowRight} 
            alt="" 
            className="w-4 h-4" 
            variants={arrowAnimationVariants}
            initial="initial"
            animate="animate3"
          />
        </motion.div>

        {/* Draggable Circle */}
        <motion.div
          drag={!isLaunched && !disabled && "x"}
          dragConstraints={{ left: 0, right: MAX_DRAG }}
          dragElastic={0}
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          style={{ 
            x: isDragging ? x : springX,
            backgroundColor: circleColor,
          }}
          whileDrag={{ scale: 1.08, cursor: 'grabbing' }}
          animate={isLaunched ? { scale: [1, 1.15, 1.05] } : { scale: 1 }}
          transition={{ 
            scale: { type: 'spring', stiffness: 400, damping: 25 },
            backgroundColor: { duration: 0.3, ease: 'easeOut' }
          }}
          className={`w-[72px] h-[72px] p-1 absolute left-[6px] top-1/2 -translate-y-1/2 rounded-full flex justify-center items-center cursor-grab active:cursor-grabbing ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {/* Play Icon (fades out as you drag) */}
          <motion.img 
            src={Play} 
            alt="Play" 
            className="w-6 h-6 object-contain absolute"
            style={{ 
              opacity: playIconOpacity,
              rotate: iconRotation 
            }}
          />
          
          {/* Success SVG Icon (appears as you complete the drag) */}
          <motion.svg
            className="w-8 h-8 absolute"
            viewBox="0 0 50 50"
            style={{ opacity: checkIconOpacity }}
          >
            {/* Circle outline */}
            <motion.circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              strokeWidth="2.5"
              stroke="currentColor"
              className="text-white"
              style={{ 
                pathLength: circlePathLength,
                rotate: -90,
                transformOrigin: 'center'
              }}
            />
            {/* Check mark */}
            <motion.path
              fill="none"
              strokeWidth="2.5"
              stroke="currentColor"
              className="text-white"
              d="M15,25 L22,32 L35,19"
              strokeDasharray="0 1"
              style={{ pathLength: checkPathLength }}
            />
          </motion.svg>
        </motion.div>
      </motion.div>
    </div>
  );
}
