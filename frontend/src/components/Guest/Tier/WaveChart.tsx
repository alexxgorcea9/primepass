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

interface TierData {
  name: string;
  price: number;
  type: 'special' | 'standard';
}

interface TierColors {
  gradient: string;
  background: string;
  iconColor: string;
}

interface WaveChartProps {
  waves: PriceWave[];
  loading: boolean;
  tierData: TierData;
  tierColors: TierColors;
  activeWave: PriceWave | null;
  activeWaveIndex: number;
}

const WaveChart: React.FC<WaveChartProps> = ({
  waves,
  loading,
  tierData,
  tierColors,
  activeWave,
  activeWaveIndex,
}) => {
  if (loading) {
    return (
      <motion.div
        className="flex h-[280px] w-full items-center justify-center rounded-[20px] p-4"
        style={{
          background: `linear-gradient(90deg, rgba(217, 179, 226, 0.30) 0%, rgba(247, 247, 247, 0.30) 100%)`,
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-white">Loading wave data...</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex h-[280px] w-full flex-col gap-4 rounded-[20px] p-4"
      style={{
        background: `linear-gradient(90deg, rgba(217, 179, 226, 0.30) 0%, rgba(247, 247, 247, 0.30) 100%)`,
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Tier Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-white">{tierData.name}</h1>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              ${activeWave?.price.toFixed(2) || tierData.price.toFixed(2)}
            </span>
            {tierData.type === 'special' && (
              <span className="text-sm text-white/70">Special Request</span>
            )}
          </div>
        </div>
        {activeWave && (
          <div className="text-right">
            <div className="text-sm text-white/70">Remaining</div>
            <div className="text-xl font-semibold text-white">
              {activeWave.remaining}/{activeWave.ticket_count}
            </div>
          </div>
        )}
      </div>

      {/* Wave Chart */}
      {waves.length > 0 ? (
        <div className="flex flex-grow items-end justify-between gap-2 px-2">
          {waves.map((wave, index) => (
            <motion.div
              key={wave.id}
              className="relative flex flex-1 flex-col items-center gap-2"
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Wave bar */}
              <div
                className={`w-full rounded-t-lg transition-all duration-300 ${
                  index === activeWaveIndex
                    ? `bg-gradient-to-b ${tierColors.gradient}`
                    : wave.sold
                      ? 'bg-white/20'
                      : 'bg-white/40'
                }`}
                style={{ height: `${wave.height}px` }}
              >
                {/* Active wave indicator */}
                {index === activeWaveIndex && (
                  <motion.div
                    className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-3 py-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                  >
                    <span className="text-xs font-semibold text-BG">
                      ${wave.price.toFixed(2)}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Wave label */}
              <span className="text-xs text-white/70">{wave.name}</span>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-grow items-center justify-center">
          <p className="text-sm text-white/70">No waves available</p>
        </div>
      )}
    </motion.div>
  );
};

export default WaveChart;
