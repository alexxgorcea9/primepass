import Scan from '@/assets/scan-barcode.svg';
import { useNavigate, useParams } from 'react-router-dom';
import CheckinTabs from '@components/Organizer/EventDetails/Checkin/CheckinTabs';
import Export from '@/assets/export.svg';
import { useState } from 'react';

type Tabs = 'Tickets' | 'Tables';

const CheckinHeader = () => {
  const navigate = useNavigate();
  const { username, event_id } = useParams<{ username: string; event_id: string }>();
  const [activeTab, setActiveTab] = useState<Tabs>('Tickets');

  const handleScanClick = () => {
    navigate(`/${username}/event/${event_id}/scan-qr`);
  };

  function handleExportClick() {
    //TODO: Implement export functionality
  }

  return (
    <div className="p-2.5 items-center justify-between flex flex-row">

      <CheckinTabs activeTab={activeTab === 'Tickets' ? 0 : 1} onTabChange={(index) => setActiveTab(index === 0 ? 'Tickets' : 'Tables')} />

      {activeTab === 'Tickets' ? (
        <button
          onClick={handleScanClick}
          className="w-12 h-12 bg-gradient-to-b from-white/5 to-white/10 rounded-full flex items-center justify-center hover:from-white/10 hover:to-white/15 transition-all"
        >
          <img src={Scan} alt="Scan" className="w-6 h-6" />
        </button>
      ) :
        (
          <button
            onClick={handleExportClick}
            className="w-fit h-fit bg-white rounded-full flex items-center justify-center px-5 py-2.5 gap-2.5"
          >
            <text className="text-md text-BG"> Export</text>
            <img src={Export} alt="Export" className="w-4 h-4" />
          </button>
        )
      }

    </div>
  )
}

export default CheckinHeader;