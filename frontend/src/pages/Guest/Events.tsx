import Navbar from "@components/Organizer/Dashboard/Navbar";
import GradualBlur from '@/components/GradualBlur';
import EventList from '@components/Guest/Events/EventList';
import { useAuth } from '@/contexts/AuthContext';
import React, { useMemo } from 'react';
import { useUpcomingEvents, useEventsMedia } from '@hooks/useEvents';

const Events = () => {
  const { user } = useAuth();
  const { data: eventsResponse, isLoading: eventsLoading, error: eventsError } = useUpcomingEvents();
  
  // Extract events from paginated response
  const events = eventsResponse?.results;
  
  // Fetch media for all events
  const mediaQueries = useEventsMedia(events);
  
  // Combine events with their media
  const eventsWithMedia = useMemo(() => {
    if (!events) return [];
    
    return events.map((event, index) => ({
      ...event,
      media: mediaQueries[index]?.data || [],
    }));
  }, [events, mediaQueries]);
  
  const isLoading = eventsLoading || mediaQueries.some(q => q.isLoading);

  return (
    <div className="fixed inset-0 h-screen overflow-hidden">
      <div className="fixed top-0 left-0 right-0 z-80">
        <Navbar type="guest" avatarUrl={user?.profile_picture} />
      </div>
      <GradualBlur
        target="parent"
        position="top"
        height="6rem"
        strength={2}
        divCount={5}
        curve="bezier"
        exponential={true}
        opacity={1}
        zIndex={70}
      />

      <div className="h-full overflow-y-auto pt-16 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <EventList events={eventsWithMedia} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default Events;