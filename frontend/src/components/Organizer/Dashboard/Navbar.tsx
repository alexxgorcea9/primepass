import AddIcon from '@/assets/add.svg';
import ProfileIcon from '@/assets/profile.svg';
import NotificationsIcon from '@/assets/notifications.svg';
import TicketIcon from '@/assets/ticket.svg';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type NavbarType = 'guest' | 'organizer' | 'team';

interface NavbarProps {
  type: NavbarType;
  avatarUrl?: string;
  onIconClick?: (iconType: string) => void;
}

export default function Navbar({ type, avatarUrl, onIconClick }: NavbarProps) {
  const navigate = useNavigate();
  
  const renderIcons = () => {
    switch (type) {
      case 'guest':
        return (
          <>
            <button
              onClick={() => onIconClick?.('notifications')}
              className="w-12 h-12 p-2.5 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Notifications"
            >
              <img src={NotificationsIcon} alt="Notifications" className="w-4 h-4" />
            </button>
            <button
              onClick={() => onIconClick?.('ticket')}
              className="w-12 h-12 p-2.5 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Ticket"
            >
              <img src={TicketIcon} alt="Ticket" className="w-4 h-4" />
            </button>
          </>
        );
      
      case 'organizer':
        return (
          <button
            onClick={() => navigate('/create-event')}
            className="w-12 h-12 p-2.5 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            aria-label="Create Event"
          >
            <img src={AddIcon} alt="Create Event" className="w-4 h-4" />
          </button>
        );
      
      case 'team':
        return (
          <button
            onClick={() => onIconClick?.('settings')}
            className="w-12 h-12 p-2.5 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4 text-[#F7F7F7]" strokeWidth={1.5} />
          </button>
        );
      
      default:
        return null;
    }
  };

  return (
    <nav className="relative w-full h-auto min-h-[68px] p-2.5">
      <div className="relative flex items-center justify-end gap-1.5 w-full min-h-[48px]">
        {renderIcons()}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="User avatar"
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <button className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center"
          onClick={() => navigate('/${username}/settings')}
          >

            <img src={ProfileIcon} alt="Profile" className="w-4 h-4" />
          </button>
        )}
      </div>
    </nav>
  );
}