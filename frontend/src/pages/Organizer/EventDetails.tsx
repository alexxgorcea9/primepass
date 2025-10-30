import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import EventDetailsHeader from '@components/Organizer/EventDetails/EventDetailsHeader';
import EventDetailsNavBar from '@components/Organizer/EventDetails/EventDetailsNavBar';
import TicketsTab from '@components/Organizer/EventDetails/Tickets/TicketsTab';
import ConciergeTab from '@components/Organizer/EventDetails/Concierge/ConciergeTab';
import InfoTab from '@components/Organizer/EventDetails/Info/InfoTab';
import CheckinTab from '@components/Organizer/EventDetails/Checkin/CheckinTab';

const EventDetails = () => {
  const tabs = ["Tickets", "Concierge", "Info", "Checkin"];
  const[activeTab, setActiveTab] = React.useState("Tickets");

  const renderTabContent = () => {
    switch (activeTab) {
      case "Tickets":
        return <TicketsTab />;
      case "Concierge":
        return <ConciergeTab />;
      case "Info":
        return <InfoTab />;
      case "Checkin":
        return <CheckinTab />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      {/* Header at top */}
      <EventDetailsHeader />
      
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
      <EventDetailsNavBar activeTab={tabs.indexOf(activeTab)} onTabChange={(index) => setActiveTab(tabs[index])} tabs={tabs} />
    </div>
  );
};

export default EventDetails;