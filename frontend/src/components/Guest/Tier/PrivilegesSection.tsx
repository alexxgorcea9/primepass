import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, PanInfo, LayoutGroup } from 'framer-motion';
import { AnimateNumber } from 'motion-plus/react';

// Import SVG icons
import Verify from '@/assets/verify.svg';
import Card from '@/assets/card.svg';
import Add from '@/assets/add.svg';
import Minus from '@/assets/minus.svg';

interface Privilege {
  id: number;
  title: string;
  description: string;
}

interface PrivilegesSectionProps {
  privileges: Privilege[];
  loading?: boolean;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onCheckout: () => void;
}

const PrivilegesSection = ({
                             privileges,
                             loading = false,
                             quantity,
                             onQuantityChange,
                             onCheckout,
                           }: PrivilegesSectionProps): React.ReactElement => {
  const [currentPrivilegeIndex, setCurrentPrivilegeIndex] = useState(0);
  const [isIncrementing, setIsIncrementing] = useState(true);
  const [dragDirection, setDragDirection] = useState<number>(0);
  const dragConstraintsRef = useRef(null);

  // Swipe threshold for changing privilege
  const SWIPE_THRESHOLD = 50;

  const incrementQuantity = () => {
    setIsIncrementing(true);
    onQuantityChange(Math.min(quantity + 1, 10)); // Max 10 tickets
  };

  const decrementQuantity = () => {
    setIsIncrementing(false);
    onQuantityChange(Math.max(quantity - 1, 1)); // Min 1 ticket
  };

  if (loading) {
    return (
      <motion.div
        className='flex h-full w-full items-center justify-center rounded-[20px] p-2.5'
        style={{
          background:
            'linear-gradient(90deg, rgba(217, 179, 226, 0.30) 0%, rgba(247, 247, 247, 0.30) 100%)',
        }}
      >
        <div className='text-white'>Loading privileges...</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className='flex h-full w-full flex-col gap-2.5 rounded-[20px] p-2.5'
      style={{
        background:
          'linear-gradient(90deg, rgba(217, 179, 226, 0.30) 0%, rgba(247, 247, 247, 0.30) 100%)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {/* Privileges Header */}
      <div className='flex items-center gap-2.5 p-2'>
        <img src={Verify} alt='verify' className='h-6 w-6' />
        <h2 className='text-lg font-semibold text-white'>Privileges</h2>
      </div>

      {/* Privilege Content */}
      <div className='flex flex-grow flex-col gap-2.5 overflow-hidden rounded-[20px] bg-BG-1 p-2.5'>
        <div className='flex flex-grow'>
          {privileges.length > 0 ? (
            <>
              <motion.div
                className='h-full w-full flex-grow'
                ref={dragConstraintsRef}
                drag='x'
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragStart={() => {
                  setDragDirection(0);
                }}
                onDrag={(_, info) => {
                  setDragDirection(info.offset.x);
                }}
                onDragEnd={(_, info: PanInfo) => {
                  // Only change the slide if swipe was significant
                  if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
                    if (info.offset.x > 0 && currentPrivilegeIndex > 0) {
                      // Swipe right, go to previous
                      setCurrentPrivilegeIndex(currentPrivilegeIndex - 1);
                    } else if (
                      info.offset.x < 0 &&
                      currentPrivilegeIndex < privileges.length - 1
                    ) {
                      // Swipe left, go to next
                      setCurrentPrivilegeIndex(currentPrivilegeIndex + 1);
                    }
                  }
                }}
              >
                <AnimatePresence mode='wait'>
                  <motion.div
                    key={currentPrivilegeIndex}
                    initial={{ opacity: 0, x: dragDirection > 0 ? -50 : 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: dragDirection > 0 ? 50 : -50 }}
                    transition={{ duration: 0.3 }}
                    className='flex flex-col gap-2.5 p-2.5'
                  >
                    <h3 className='whitespace-nowrap text-base font-semibold text-white'>
                      {privileges[currentPrivilegeIndex].title}
                    </h3>
                    <p className='text-sm leading-[18px] font-Lufga text-grey'>
                      {privileges[currentPrivilegeIndex].description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </>
          ) : (
            <div className='flex h-full w-full items-center justify-center p-4'>
              <p className='text-center text-sm text-grey'>
                No privileges available for this tier
              </p>
            </div>
          )}
        </div>

        {/* Progress indicator */}
        {privileges.length > 0 && (
          <div className='flex h-5 items-center justify-center gap-1.5 p-2'>
            {privileges.map((_, index) => (
              <div
                key={index}
                className={`h-0.5 flex-1 rounded-lg cursor-pointer ${index === currentPrivilegeIndex ? 'bg-white' : 'bg-white/10'}`}
                onClick={() => setCurrentPrivilegeIndex(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Ticket Counter and Controls */}
      <LayoutGroup>
        <motion.div
          layout
          className='flex h-[60px] items-center justify-between gap-2.5 rounded-[40px] px-5 py-2.5'
        >
          <span className='text-md text-grey'>Tickets</span>

          <div className='flex items-center gap-2.5'>
            <motion.button
              disabled={quantity <= 1}
              onPointerDown={decrementQuantity}
              layout
              initial={{ boxShadow: '0px 0px 0px 2px rgba(255, 255, 255, 0)' }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              whileFocus={{ boxShadow: '0px 0px 0px 2px rgba(255, 255, 255, 0.5)' }}
              className='flex h-10 w-10 items-center justify-center rounded-full bg-white/10 disabled:opacity-30'
            >
              <img src={Minus} alt='Minus' className='h-4 w-4' />
            </motion.button>

            <AnimateNumber
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: 'white'
              }}
            >
              {quantity}
            </AnimateNumber>

            <motion.button
              disabled={quantity >= 10}
              onPointerDown={incrementQuantity}
              layout
              initial={{ boxShadow: '0px 0px 0px 2px rgba(255, 255, 255, 0)' }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              whileFocus={{ boxShadow: '0px 0px 0px 2px rgba(255, 255, 255, 0.5)' }}
              className='flex h-10 w-10 items-center justify-center rounded-full bg-white/10 disabled:opacity-30'
            >
              <img src={Add} alt='Plus' className='h-4 w-4' />
            </motion.button>
          </div>
        </motion.div>
      </LayoutGroup>

      {/* Checkout Button */}
      <button
        className='flex h-[42px] items-center justify-center gap-1.5 rounded-[40px] bg-white'
        onClick={onCheckout}
      >
        <img src={Card} alt="Card" className='h-4 w-4' />
        <span className='text-md leading-[18px] text-BG'>Checkout</span>
      </button>
    </motion.div>
  );
};

export default PrivilegesSection;
