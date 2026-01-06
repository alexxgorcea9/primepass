import Header from "../../components/Organizer/CreateEvent/Header";
import PrivilegesSection from "../../components/Guest/Tier/PrivilegesSection";
import WaveChart from "../../components/Guest/Tier/WaveChart";
import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Wave } from '@/api/events';
import { TIER_GRADIENTS } from '@/constants/tierGradients';
import { useTierDetail } from '@/hooks/useEvents';

interface TierLocationState {
  id: string | number;
  name: string;
  eventId: string | number;
  eventName: string;
  privileges?: any[];
  lowestAvailablePrice?: number;
  color: string;
  icon?: string;
  gradientClassName?: string;
}

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

const Tier = () => {
  const location = useLocation();
  const tierData = location.state as TierLocationState | null;
  const [quantity, setQuantity] = useState(1);

  // Fetch tier details with waves using TanStack Query
  const {
    data: tierDetails,
    isLoading,
    isError,
    error,
    refetch
  } = useTierDetail(
    Number(tierData?.eventId || 0),
    Number(tierData?.id || 0),
    !!(tierData?.eventId && tierData?.id) // Only fetch if both IDs exist
  );

  // Transform backend Wave data to WaveChart PriceWave format
  const transformWavesForChart = (waves: Wave[]): PriceWave[] => {
    const maxTickets = Math.max(...waves.map(w => w.ticketCount));
    const minHeight = 80;
    const maxHeight = 200;

    return waves.map((wave, index) => {
      const heightRatio = wave.ticketCount / maxTickets;
      const height = minHeight + (maxHeight - minHeight) * heightRatio;

      return {
        id: wave.id,
        name: wave.name || `Wave ${index + 1}`,
        price: parseFloat(wave.price),
        ticket_count: wave.ticketCount,
        height: height,
        sold: false, // TODO: Calculate based on actual sold tickets
        active: index === 0, // TODO: Determine active wave from backend
        remaining: wave.ticketCount, // TODO: Get actual remaining from backend
      };
    });
  };

  // Transform waves data for the chart
  const waveData = useMemo(() => {
    if (!tierDetails?.waves || tierDetails.waves.length === 0) {
      return [];
    }
    return transformWavesForChart(tierDetails.waves);
  }, [tierDetails?.waves]);

  // Calculate active wave and index
  const activeWaveIndex = waveData.findIndex(
    (wave) => !wave.sold && wave.remaining > 0
  );
  const activeWave =
    activeWaveIndex >= 0
      ? waveData[activeWaveIndex]
      : waveData.length > 0
        ? waveData[0]
        : null;

  // Get tier colors from gradient
  const getTierColors = () => {
    const gradient = TIER_GRADIENTS.find(g => g.id === (tierDetails?.gradient || tierData?.color));
    return {
      gradient: gradient?.className || 'from-[#A8FF78] to-[#78FFD6]',
      background: gradient?.from || '#A8FF78',
      iconColor: gradient?.from || '#A8FF78',
    };
  };

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
  };

  const handleCheckout = () => {
    console.log('Checkout clicked with quantity:', quantity);
  };

  // Show error state with retry option
  if (isError) {
    return (
      <div className="flex flex-col h-screen bg-BG">
        <div className="flex-shrink-0 p-4">
          <Header title={tierData?.eventName || 'Event'} />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
          <div className="text-white text-center">
            <h2 className="text-xl font-semibold mb-2">Failed to load tier details</h2>
            <p className="text-grey text-sm mb-4">{error?.message || 'Something went wrong'}</p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 bg-white text-BG rounded-full font-semibold hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-BG">
      {/* Header */}
      <div className="flex-shrink-0 p-4">
        <Header title={tierData?.eventName || 'Event'} />
      </div>

      {/* WaveChart - height fits content */}
      <div className="flex-shrink-0">
        <WaveChart
          waves={waveData}
          loading={isLoading}
          tierData={{
            name: tierData?.name || 'Tier',
            price: activeWave?.price || tierData?.lowestAvailablePrice || 0,
            type: tierDetails?.hasSpecialRequests ? 'special' : 'standard',
          }}
          tierColors={getTierColors()}
          activeWave={activeWave}
          activeWaveIndex={activeWaveIndex}
        />
      </div>

      {/* PrivilegesSection - fills remaining space */}
      <div className="flex-1 min-h-0 p-2.5 overflow-y-auto">
        <PrivilegesSection
          privileges={tierDetails?.privileges || tierData?.privileges || []}
          loading={isLoading}
          quantity={quantity}
          onQuantityChange={handleQuantityChange}
          onCheckout={handleCheckout}
        />
      </div>
    </div>
  )
}

export default Tier;