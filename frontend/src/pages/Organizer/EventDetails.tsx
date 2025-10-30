import React from 'react';

const EventDetails = () => {
  const tabs = ["Tickets", "Concierge", "Info", "Checkin"];
  const[activeTab, setActiveTab] = React.useState("Tickets");

  return <div className="text-white text-md justify-center">Event Details</div>;
};

export default EventDetails;