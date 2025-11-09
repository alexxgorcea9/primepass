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
              className="w-12 h-12 p-2.5 bg-white/5 backdrop-blur-[40px] rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Notifications"
            >
              <img src={NotificationsIcon} alt="Notifications" className="w-4 h-4" />
            </button>
            <button
              onClick={() => onIconClick?.('ticket')}
              className="w-12 h-12 p-2.5 bg-white/5 backdrop-blur-[40px] rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
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
            className="w-12 h-12 p-2.5 bg-white/5 backdrop-blur-[40px] rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            aria-label="Create Event"
          >
            <img src={AddIcon} alt="Create Event" className="w-4 h-4" />
          </button>
        );
      
      case 'team':
        return (
          <button
            onClick={() => onIconClick?.('settings')}
            className="w-12 h-12 p-2.5 bg-white/5 backdrop-blur-[40px] rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4 text-[#F7F7F7]" strokeWidth={1.5} />
          </button>
        );
      
      default:
        return null;
    }
  };

  const FALLBACK_PROFILE = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop';

  return (
    <nav className="relative w-full h-auto min-h-[68px] p-2.5">
      <div className="relative flex items-center justify-end gap-1.5 w-full min-h-[48px]">
        {renderIcons()}
        <button 
          className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center hover:opacity-80 transition-opacity"
          onClick={() => navigate('/organizer/settings')}
          aria-label="Go to Settings"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="User avatar"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = FALLBACK_PROFILE;
              }}
            />
          ) : (
            <div className="w-full h-full bg-white/5 backdrop-blur-[40px] flex items-center justify-center">
              <img src={ProfileIcon} alt="Profile" className="w-4 h-4" />
            </div>
          )}
        </button>
      </div>
    </nav>
  );
}