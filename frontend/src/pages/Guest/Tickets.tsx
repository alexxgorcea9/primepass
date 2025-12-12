import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import TicketCard from '../../components/Guest/Tickets/TicketCard.tsx';
import ExpandedTicketCard from '../../components/Guest/Tickets/ExpandedTicketCard';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useMyTickets } from '@/hooks/useTickets';
import type { Ticket as ApiTicket } from '@/api/tickets';
import NotificationIcon from '../../assets/notifications.svg';
import TicketIcon from '../../assets/ticket.svg';
import defaultAvatar from '../../assets/image.png';

const Tickets: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: tickets, isLoading: loading, error } = useMyTickets();
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [selectedTicketData, setSelectedTicketData] = useState<ApiTicket | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (loading) {
    return <div className="text-white p-4">Loading your tickets...</div>;
  }

  if (error) {
    return <div className="text-white p-4">Error: Failed to load tickets</div>;
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white p-5">
        <p>No tickets found.</p>
      </div>
    );
  }

  const getUserProfilePicture = () => {
    if (user?.profile_picture && user.profile_picture !== '') {
      return user.profile_picture;
    }
    return defaultAvatar;
  };

  const handleTicketClick = (ticket: ApiTicket) => {
    setSelectedTicketId(ticket.id);
    setSelectedTicketData(ticket);
  };

  const handleCloseExpanded = () => {
    setSelectedTicketId(null);
    setSelectedTicketData(null);
  };

  return (
    <div className="w-full h-screen bg-[var(--BG)] overflow-hidden flex flex-col">
      {/* HEADER – same in both states (no event title / X here anymore) */}
      <motion.div className="w-full px-5 pt-5 flex items-center justify-between">
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTicketId ? 'tickets-title-expanded' : 'tickets-title'}
              className="text-white text-left text-2xl font-normal font-['Lufga'] leading-loose z-10"
              initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }}
              animate={{
                y: 0,
                opacity: 1,
                filter: 'blur(0px)',
                transition: {
                  y: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                  filter: { duration: 0.25 },
                },
              }}
              exit={{
                y: -20,
                opacity: 0,
                filter: 'blur(10px)',
                transition: {
                  y: { duration: 0.2 },
                  opacity: { duration: 0.2 },
                  filter: { duration: 0.15 },
                },
              }}
            >
              Tickets
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation icons */}
        <motion.div className="ml-auto flex items-center gap-[5px]" layout>
          <Link
            to="/notifications"
            className="flex w-12 h-12 p-2.5 justify-center items-center rounded-full bg-[rgba(247,247,247,0.05)]"
          >
            <img
              src={NotificationIcon}
              alt="Notifications"
              className="w-4 h-4"
            />
          </Link>

          <Link
            to="/tickets"
            className="flex w-12 h-12 p-2.5 justify-center items-center rounded-full bg-[rgba(247,247,247,0.05)]"
          >
            <img src={TicketIcon} alt="Tickets" className="w-4 h-4" />
          </Link>

          <Link
            to="/settings"
            className="flex w-12 h-12 justify-center items-center rounded-full overflow-hidden bg-[#1A1A1A]"
          >
            <img
              src={getUserProfilePicture()}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={(e) =>
                ((e.target as HTMLImageElement).src = defaultAvatar)
              }
            />
          </Link>
        </motion.div>
      </motion.div>

      {/* Main content */}
      {selectedTicketId && selectedTicketData ? (
        // Expanded view stays full area
        <div className="flex-1 w-full overflow-hidden transition-all duration-300 ease-in-out relative z-20">
          <ExpandedTicketCard
            ticket={selectedTicketData}
            onClose={handleCloseExpanded}
          />
        </div>
      ) : (
        // Normal tickets list – center the card
        <div className="flex-1 w-full flex flex-col items-center mt-6">
          <div className="w-full max-w-md mx-auto px-5 pb-10 pt-4">
            <motion.div
              className="w-full flex flex-col items-center gap-5 overflow-y-auto max-h-[calc(100vh-170px)] pb-10 scrollbar-hide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              {tickets.map((ticket) => {
                const eventDate = ticket.eventDate;
                const eventTime = ticket.eventTime;

                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: { duration: 0.25 },
                    }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full flex justify-center"
                  >
                    <TicketCard
                      ticketId={ticket.id}
                      eventId={ticket.event}
                      eventTitle={ticket.eventTitle}
                      eventLocation={ticket.eventLocation}
                      eventDate={eventDate}
                      eventTime={eventTime}
                      countdownDate={eventDate}
                      countdownTime={eventTime}
                      ticketType={ticket.tierName}
                      uniqueCode={ticket.ticketCode}
                      heroImageUrl={ticket.heroImageUrl}
                      eventShortDescription={ticket.eventShortDescription ?? ''}
                      organizerImageUrl={ticket.organizerProfilePicture}
                      perks={ticket.perks?.map((p) => p.title) ?? []}
                      onExpand={() => handleTicketClick(ticket)}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;
