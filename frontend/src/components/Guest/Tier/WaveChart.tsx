import React from 'react';
import { motion } from 'framer-motion';

interface PriceWave {
  id: number;
  name: string;
  price: number;
  ticket_count: number;
  height: number;
  sold: boolean;
  active: boolean;
  remaining: number;
}

interface PricingChartProps {
  waves: PriceWave[];
  loading: boolean;
  tierData: {
    name: string;
    price: number;
    type: string;
  };
  tierColors: {
    gradient: string;
    background: string;
    iconColor: string;
  };
  activeWave: PriceWave | null;
  activeWaveIndex: number;
}

const WaveChart: React.FC<PricingChartProps> = ({
                                                  waves,
                                                  loading,
                                                  tierData,
                                                  tierColors,
                                                  activeWave,
                                                  activeWaveIndex,
                                                }) => {
  console.log('WaveChart DEBUG: Received props:', {
    waves: waves.length,
    loading,
    tierData,
    tierColors,
    activeWave,
    activeWaveIndex,
  });

  // Show loading state
  if (loading) {
    return (
      <motion.div
        className='relative flex h-full w-full flex-col items-start gap-2 overflow-hidden rounded-[20px] p-4'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className='flex h-full w-full items-center justify-center rounded-[20px] bg-[var(--BG-1)] p-5'>
          <div className='flex h-full w-full animate-pulse flex-col items-center justify-center'>
            <div className='bg-opacity-20 mb-2 h-4 w-1/2 rounded bg-gray-300'></div>
            <div className='bg-opacity-20 mb-2 h-32 w-full rounded bg-gray-300'></div>
            <div className='bg-opacity-20 h-4 w-1/3 rounded bg-gray-300'></div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className='relative flex h-full w-full flex-col items-start gap-2 overflow-hidden rounded-[20px] p-4'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className='relative mb-1 flex w-full items-start justify-between self-stretch'>
        <div className='inline-flex items-center gap-[10px] rounded-[40px] bg-[#0A0A0A]/40 px-[12px] py-[5px] backdrop-blur-sm'>
          <div
            className='relative self-stretch text-lg font-semibold text-white'
            style={{ color: tierColors.iconColor }}
            data-testid='tier-name-display'
          >
            {tierData.name}
          </div>
        </div>

        <div className='flex flex-col items-end'>
          <div className='text-4xl font-bold whitespace-nowrap text-white'>
            ${tierData.price}
          </div>
          <div className='text-xs whitespace-nowrap text-[#B4B8B3]'>
            {activeWave?.name || ''}
          </div>
        </div>
      </div>

      <div className='flex w-full flex-grow items-end gap-[10px] pt-2'>
        {waves.map((wave, index) => {
          // Determine if this wave comes after the active wave
          const isAfterActiveWave =
            activeWaveIndex >= 0 && index > activeWaveIndex;

          return (
            <div
              key={index}
              className='flex flex-col items-center'
              style={{
                width: '60px',
              }}
            >
              <div className='relative mb-1 text-xs whitespace-nowrap text-[#B4B8B3]'>
                ${wave.price}
              </div>

              <div className='relative flex h-fit flex-col items-center justify-end'>
                <div className='relative'>
                  <div
                    className={`w-[60px] rounded-[40px]`}
                    style={{
                      height: `${wave.height}px`,
                      backgroundColor:
                        wave.sold || wave.remaining === 0
                          ? 'var(--Grey)' // Grey for sold out waves
                          : 'unset',
                      backgroundImage: !(wave.sold || wave.remaining === 0)
                        ? 'linear-gradient(to bottom, var(--Accent3), var(--Gold2))'
                        : 'unset',
                      opacity: isAfterActiveWave ? 0.5 : 1, // 50% opacity for waves after the active wave
                    }}
                  />

                  <div className='absolute -bottom-[30px] left-0 z-10 flex h-[60px] w-[60px] items-center justify-center rounded-[40px] bg-[#f7f7f733] backdrop-blur-[20px]'>
                    <div className='text-[10px] leading-4 whitespace-nowrap text-white'>
                      {wave.name}
                    </div>
                  </div>
                </div>
              </div>

              <div className='mt-8 text-center text-xs whitespace-nowrap text-[#B4B8B3]'>
                {
                  wave.sold
                    ? 'Sold out'
                    : wave.active
                      ? `${wave.remaining} left` // Current wave shows remaining tickets
                      : `${wave.ticket_count}x` // Upcoming waves show total tickets with 'x' suffix
                }
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default WaveChart;
