import React, { useState } from 'react';
import { Ticket } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

interface EventCardProps {
  eventName: string;
  date: string;
  imageUrl?: string | null;
  revenue: number;
  revenueDecimals?: number;
  ticketsSold: number;
  attendance: number;
  avgTicket: number;
  perPerson: number;
  eventId: number;
  isStackOpen?: boolean;
  onStackToggle?: () => void;
}

const EventCard: React.FC<EventCardProps> = ({
  eventName,
  date,
  imageUrl,
  revenue,
  revenueDecimals = 75,
  ticketsSold,
  attendance,
  avgTicket,
  perPerson,
  eventId,
  isStackOpen = true,
  onStackToggle,
}) => {
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();
  const hasValidImage = imageUrl && !imageError;
  const fallbackGradient = 'linear-gradient(90deg, rgba(217, 179, 226, 0.30) 0%, rgba(244, 192, 95, 0.30) 100%)';
  const fallbackBG = 'rgba(29, 29, 29, 1)';
  const firstLetter = eventName.charAt(0).toUpperCase();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleClick = () => {
    if (!isStackOpen && onStackToggle) {
      onStackToggle();
    } else if (username) {
      navigate(`/${username}/event/${eventId}`);
    }
  };

  return (
    <div
      className="w-full h-fit relative overflow-hidden rounded-[20px] cursor-pointer"
      style={{
        background: hasValidImage ? `url(${imageUrl}) center/cover` : fallbackBG,
      }}
      onClick={handleClick}
    >
      {/* Background overlay */}
      {hasValidImage ? (
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: 'blur(50px)',
            WebkitBackdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.01)',
          }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-[10px] p-2.5">
        {/* Date and Event Name Section */}
        <div className="flex flex-col gap-[10px] overflow-hidden">
            <div className="inline-flex flex-col p-[10px] overflow-hidden">
              <div
                className="flex flex-col justify-center"
                style={{
                  color: 'var(--color-grey)',
                  fontSize: 'var(--text-sm)',
                  fontFamily: 'var(--font-family-lufga)',
                  fontWeight: 400,
                  lineHeight: 'var(--text-sm-lh)',
                  wordWrap: 'break-word',
                }}
              >
                {date}
              </div>
              <div
                className="flex flex-col justify-center"
                style={{
                  color: 'var(--clor-white)',
                  fontSize: 'var(--text-base)',
                  fontFamily: 'var(--font-family-lufga)',
                  fontWeight: 400,
                  lineHeight: 'var(--text-base-lh)',
                  wordWrap: 'break-word',
                }}
              >
                {eventName}
              </div>
            </div>
        </div>

        {/* Image and Stats Section */}
        <div className="flex h-fit items-center gap-[10px] overflow-hidden">
          {/* Event Image */}
          <div className="w-[120px] h-[120px] overflow-hidden rounded-[20px] flex items-center justify-center">
            {hasValidImage ? (
              <img
                src={imageUrl}
                alt={eventName}
                className="w-full h-full rounded-[20px] object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div
                className="w-full h-full rounded-[20px] flex items-center justify-center"
                style={{
                  background: fallbackGradient,
                  color: '#ffffff',
                  fontSize: '48px',
                  fontFamily: 'var(--font-family-lufga)',
                  fontWeight: 700,
                }}
              >
                {firstLetter}
              </div>
            )}
          </div>

          {/* Stats Panel */}
          <div className="flex-1 self-stretch overflow-hidden rounded-[20px] flex flex-col">
            <div
              className="flex-1 p-[10px] overflow-hidden rounded-[20px] flex flex-col justify-between"
              style={{
                background: 'var(--color--BG-1)',
              }}
            >
              {/* Revenue Section */}
              <div className="flex flex-col overflow-hidden">
                <div
                  className="flex flex-col justify-center text-sm text-grey"
                >
                  Revenue
                </div>
                <div className="flex justify-between items-start overflow-hidden">
                  <div className="flex items-center overflow-hidden">
                    <div
                      className="flex flex-col justify-center text-2xl text-white"
                    >
                      {formatCurrency(revenue)}
                    </div>
                    <div
                      className="flex flex-col justify-center text-2xl text-grey"
                    >
                      ,{revenueDecimals.toString().padStart(2, '0')}
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-[5px] px-[10px] py-[4px] overflow-hidden rounded-[80px]"
                    style={{
                      background: 'var(--color-BG-2)',
                    }}
                  >
                    <Ticket className="w-3 h-3" style={{ color: 'var(--clor-white)' }} />
                    <div
                      className="flex flex-col justify-center text-md text-white"
                    >
                      {ticketsSold}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Stats Section */}
              <div className="flex justify-between items-center overflow-hidden">
                {/* Attendance */}
                <div className="flex items-center gap-[5px] overflow-hidden">
                  <div className="inline-flex flex-col overflow-hidden">
                    <div
                      className="flex flex-col justify-center text-sm text-grey"
                    >
                      Attendance
                    </div>
                    <div
                      className="flex flex-col justify-center text-md text-white"
                    >
                      {attendance}%
                    </div>
                  </div>
                </div>

                {/* Avg Ticket */}
                <div className="inline-flex flex-col gap-[5px] overflow-hidden">
                  <div className="flex flex-col overflow-hidden">
                    <div
                      className="flex flex-col justify-center text-sm text-grey"
                    >
                      Avg Ticket
                    </div>
                    <div
                      className="flex flex-col justify-center text-md text-white"
                    >
                      {formatCurrency(avgTicket)}
                    </div>
                  </div>
                </div>

                {/* Per Person */}
                <div className="flex items-center gap-[5px] overflow-hidden">
                  <div className="inline-flex flex-col overflow-hidden">
                    <div
                      className="flex flex-col justify-center text-sm text-grey"
                    >
                      Per Person
                    </div>
                    <div
                      className="flex flex-col justify-center text-md text-white"
                    >
                      {formatCurrency(perPerson)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;