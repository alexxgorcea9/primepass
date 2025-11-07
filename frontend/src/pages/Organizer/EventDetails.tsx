import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';

import EventDetailsHeader from '@components/Organizer/EventDetails/EventDetailsHeader';
import EventDetailsNavBar from '@components/Organizer/EventDetails/EventDetailsNavBar';
import TicketsTab from '@components/Organizer/EventDetails/Tickets/TicketsTab';
import ConciergeTab from '@components/Organizer/EventDetails/Concierge/ConciergeTab';
import TeamTab from '@components/Organizer/EventDetails/Team/TeamTab';
import InfoTab from '@components/Organizer/EventDetails/Info/InfoTab';
import CheckinTab from '@components/Organizer/EventDetails/Checkin/CheckinTab';
import GradualBlur from '@components/GradualBlur';
import LoadingRipple from '@components/Organizer/EventDetails/LoadingRipple';
import { useEventDetail } from '@hooks/useEvents';

type TabType = "Tickets" | "Concierge" | "Team" | "Info" | "Checkin";

const EventDetails = () => {
  const tabs: TabType[] = ["Tickets", "Concierge", "Team", "Info", "Checkin"];
  const [activeTab, setActiveTab] = React.useState<TabType>("Tickets");

  const { event_id } = useParams<{ event_id: string }>();
  const eventId = Number(event_id);
  const { data: event, isLoading, error } = useEventDetail(eventId);

  const renderTabContent = () => {
    if (!event) {
      return null;
    }

    switch (activeTab) {
      case "Tickets":
        return <TicketsTab />;
      case "Concierge":
        return <ConciergeTab event={event} />;
      case "Team":
        return <TeamTab event={event} />;
      case "Info":
        return <InfoTab event={event} />;
      case "Checkin":
        return <CheckinTab />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingRipple />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-red-500">Unable to load event details.</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">

      {/* Header at top */}
      <EventDetailsHeader activeTab={activeTab}/>

      {/* Tab content fills remaining space */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, filter: "blur(5px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navbar at bottom */}
      <EventDetailsNavBar activeTab={tabs.indexOf(activeTab)} onTabChange={(index) => setActiveTab(tabs[index])} />

      <GradualBlur
        target="parent"
        position="top"
        height="6rem"
        strength={2}
        divCount={5}
        curve="bezier"
        exponential={true}
        opacity={1}
        zIndex={40}
      />

      <GradualBlur
        target="parent"
        position="bottom"
        height="6rem"
        strength={2}
        divCount={5}
        curve="bezier"
        exponential={true}
        opacity={1}
        zIndex={40}
      />

    </div>
  );
};

export default EventDetails;