import React from 'react';
import StatCard from '@components/Organizer/StatCard';
import Tabs from '@components/Organizer/Tabs';

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-BG p-[10px]">
      {/* Empty dashboard - ready for content */}
      <Tabs />
    </div>
  );
};

export default Dashboard;
