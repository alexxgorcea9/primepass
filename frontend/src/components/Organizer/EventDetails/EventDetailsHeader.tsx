import { useNavigate } from 'react-router-dom';

import XClose from '@/assets/xclose.svg';

type TabType = 'Tickets' | 'Concierge' | 'Team' | 'Info' | 'Checkin';

interface EventDetailsHeaderProps {
  activeTab: TabType;
}

const EventDetailsHeader = ({
  activeTab,
}: EventDetailsHeaderProps) => {
  const navigate = useNavigate();

  const getHeaderText = () => {
    switch (activeTab) {
      case 'Tickets':
        return 'Event Tickets';
      case 'Concierge':
        return 'Concierge Services';
      case 'Team':
        return 'Event Team';
      case 'Info':
        return 'Event Information';
      case 'Checkin':
        return 'Guest Check-in';
      default:
        return 'Event Details';
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 w-full flex items-center justify-between p-2.5 z-50">
      <div className="text-2xl font-bold text-white">{getHeaderText()}</div>
      <button
        className="bg-BG-1 rounded-full w-12 h-12 flex justify-center items-center"
        onClick={() => navigate(-1)}
      >
        <img src={XClose} alt="XClose" className="w-4 h-4" />
      </button>
    </div>
  );
};

export default EventDetailsHeader;
