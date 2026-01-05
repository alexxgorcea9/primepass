import Header from "../../components/Organizer/CreateEvent/Header";
import PrivilegesSection from "../../components/Guest/Tier/PrivilegesSection";
import WaveChart from "../../components/Guest/Tier/WaveChart";
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { eventsApi, Tier as TierType, Wave } from '@/api/events';
import { TIER_GRADIENTS } from '@/constants/tierGradients';

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
  const [tierDetails, setTierDetails] = useState<TierType | null>(null);
  const [loading, setLoading] = useState(true);
  const [waveData, setWaveData] = useState<PriceWave[]>([]);

  // Fetch tier details with waves
  useEffect(() => {
    const fetchTierDetails = async () => {
      if (!tierData?.eventId || !tierData?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const details = await eventsApi.getTierDetail(
          Number(tierData.eventId),
          Number(tierData.id)
        );
        setTierDetails(details);

        // Transform waves data for the chart
        if (details.waves && details.waves.length > 0) {
          const transformedWaves = transformWavesForChart(details.waves);
          setWaveData(transformedWaves);
        }
      } catch (error) {
        console.error('Error fetching tier details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTierDetails();
  }, [tierData?.eventId, tierData?.id]);

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

  return (
    <div className="fixed inset-0 h-screen overflow-hidden bg-BG">
      <div className="fixed top-0 left-0 right-0 z-50 p-4">
        <Header title={tierData?.eventName || 'Event'} />
      </div>

      <div className="fixed top-16 left-0 right-0 z-40 p-4">
        <WaveChart
          waves={waveData}
          loading={loading}
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

      <div className="fixed top-[340px] left-0 right-0 z-30 p-4">
        <PrivilegesSection
          privileges={tierDetails?.privileges || tierData?.privileges || []}
          loading={loading}
          quantity={quantity}
          onQuantityChange={handleQuantityChange}
          onCheckout={handleCheckout}
        />
      </div>
    </div>
  )
}

export default Tier;