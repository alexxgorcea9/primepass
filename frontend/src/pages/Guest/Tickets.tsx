import { useLocation } from 'react-router-dom';
import XClose from '@/assets/xclose.svg';
import Location from '@/assets/location.svg';
import Calendar from '@/assets/calendar-black.svg';
import Clock from '@/assets/clock.svg';
import React from 'react';
import { useEventTiers } from '@/hooks/useEvents';
import type { Tier } from '@/api/events';
import TierCard from '@/components/Guest/Tickets/TierCard';
import { TIER_GRADIENTS } from '@/constants/tierGradients';

const formatTime = (timeString: string): string => {
  if (/^\d{2}:\d{2}/.test(timeString)) {
    return timeString.substring(0, 5);
  }
  try {
    const [hours, minutes] = timeString.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  } catch {
    return timeString;
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

interface TicketsLocationState {
  eventId: number;
  eventName: string;
  location: string;
  date: string;
  time: string;
  heroImageUrl: string;
  tiers?: Tier[];
}

const Tickets = () => {
  const location = useLocation();
  const eventData = location.state as TicketsLocationState | null;
  
  const shouldFetch = !eventData?.tiers && !!eventData?.eventId;
  const { data: fetchedTiers, isLoading: loading, error } = useEventTiers(
    eventData?.eventId || 0,
    shouldFetch
  );

  const tiers = eventData?.tiers || fetchedTiers || [];

  const getColorFromGradient = (gradientId: string): string => {
    const gradient = TIER_GRADIENTS.find(g => g.id === gradientId);
    return gradient?.from || '#A8FF78';
  };

  const getGradientClassName = (gradientId: string): string => {
    const gradient = TIER_GRADIENTS.find(g => g.id === gradientId);
    return gradient?.className || 'from-[#A8FF78] to-[#78FFD6]';
  };

  const getLowestPrice = (waves: Tier['waves']): number | undefined => {
    if (!waves || waves.length === 0) return undefined;
    const prices = waves.map(w => parseFloat(w.price));
    return Math.min(...prices);
  };

  if (!eventData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">No event data available</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0">
      <div className="w-full h-1/3 relative overflow-hidden">
        <img
          src={eventData.heroImageUrl}
          alt="Event"
          className="w-full h-full object-cover"
        />

        <button
          className="absolute top-4 left-4 w-[50px] z-50 h-[50px] bg-gradient-to-b from-[rgba(247,247,247,0.10)] to-[rgba(247,247,247,0.05)] overflow-hidden rounded-full outline-[1px] outline-[rgba(247,247,247,0.10)] outline-offset-[-0.5px] backdrop-blur-[20px] inline-flex items-center justify-center cursor-pointer"
          onClick={() => window.history.back()}
        >
          <img src={XClose} alt="XClose" className="w-4 h-4" />
        </button>

        <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-2">
          <div className="flex items-center justify-center py-2.5 px-5 bg-[rgba(247,247,247,0.5)] backdrop-blur-[40px] rounded-full gap-2 w-fit whitespace-nowrap">
            <img src={Location} alt="Location" className="w-3 h-3" />
            <span className="text-sm text-BG">{eventData.location}</span>
          </div>
          <div className="flex items-center justify-center py-2.5 px-5 bg-[rgba(247,247,247,0.5)] backdrop-blur-[40px] rounded-full gap-2 w-fit whitespace-nowrap">
            <img src={Calendar} alt="Calendar" className="w-3 h-3" />
            <span className="text-sm text-BG">{formatDate(eventData.date)}</span>
          </div>
          <div className="flex items-center justify-center py-2.5 px-5 bg-[rgba(247,247,247,0.5)] backdrop-blur-[40px] rounded-full gap-2 w-fit whitespace-nowrap">
            <img src={Clock} alt="Clock" className="w-3 h-3" />
            <span className="text-sm text-BG">{formatTime(eventData.time)}</span>
          </div>
        </div>

        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#0A0A0A] to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none" />
      </div>

      <div className="flex-1 overflow-auto px-[10px] py-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-400">Loading tickets...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-12">
            <p className="text-red-400">Failed to load ticket tiers</p>
          </div>
        )}

        {!loading && !error && tiers.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-400">No tickets available for this event</p>
          </div>
        )}

        {!loading && !error && tiers.length > 0 && (
          <div className="space-y-4">
            {tiers.map((tier) => (
              <TierCard
                key={tier.id}
                id={tier.id}
                name={tier.name}
                eventId={eventData.eventId}
                eventName={eventData.eventName}
                privileges={tier.privileges}
                lowestAvailablePrice={getLowestPrice(tier.waves)}
                color={getColorFromGradient(tier.gradient)}
                icon={tier.icon}
                gradientClassName={getGradientClassName(tier.gradient)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tickets;
