import type { Variants } from 'framer-motion';
import { motion } from 'framer-motion';
import { CSSProperties, useState } from 'react';
import EventCard from './EventCard';
import type { Event } from '@/api/events';

const EVENT_CARD_HEIGHT = 218;
const STACK_GAP = 10;
const CARD_PEEK_OFFSET = -30; // How much of each card shows behind the front card

interface StackProps {
  title?: string;
  events: Event[];
  isLoading: boolean;
  error: Error | null;
  isOpen?: boolean;
  onToggle?: () => void;
  isVisible?: boolean;
}

export default function Stack({
                                title = 'Events',
                                events = [],
                                isLoading = false,
                                error = null,
                                isOpen: controlledIsOpen,
                                onToggle,
                                isVisible = true,
                              }: StackProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const handleToggle = onToggle || (() => setInternalIsOpen(open => !open));

  const totalCards = events.length;
  const visibleCards = isOpen ? totalCards : Math.min(3, totalCards);

  const stackVariants: Variants = {
    open: {
      y: 20,
      scale: 1,
      cursor: 'pointer',
      height: EVENT_CARD_HEIGHT * totalCards + STACK_GAP * (totalCards - 1) + 50 + 128, // Added 128px for pb-32
    },
    closed: {
      y: 0,
      scale: 1,
      cursor: 'default',
      height: EVENT_CARD_HEIGHT + 2 * Math.abs(CARD_PEEK_OFFSET) + 50,
    },
  };

  if (!isVisible) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <motion.div
        layout
        style={{...stackContainerStyle, height: EVENT_CARD_HEIGHT + 2 * Math.abs(CARD_PEEK_OFFSET) + 50}}
      >
        <motion.h2 style={stackTitleStyle}>{title}</motion.h2>
        <div style={loadingContainerStyle}>
          <div style={spinnerStyle} />
          <p style={loadingTextStyle}>Loading events...</p>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        layout
        style={{...stackContainerStyle, height: EVENT_CARD_HEIGHT + 2 * Math.abs(CARD_PEEK_OFFSET) + 50}}
      >
        <motion.h2 style={stackTitleStyle}>{title}</motion.h2>
        <div style={errorContainerStyle}>
          <p style={errorTextStyle}>Failed to load events</p>
          <p style={errorDetailStyle}>{error.message}</p>
        </div>
      </motion.div>
    );
  }

  // Empty state
  if (events.length === 0) {
    return (
      <motion.div
        layout
        style={{...stackContainerStyle, height: EVENT_CARD_HEIGHT + 2 * Math.abs(CARD_PEEK_OFFSET) + 50}}
      >
        <motion.h2 style={stackTitleStyle}>{title}</motion.h2>
        <div style={emptyContainerStyle}>
          <p style={emptyTextStyle}>No events found</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      style={stackContainerStyle}
      variants={stackVariants}
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
      className={isOpen ? "pb-32" : "pb-10"}
      transition={{
        layout: {
          type: 'spring',
          stiffness: 400,
          damping: 30,
        },
        type: 'spring',
        mass: 0.7,
      }}
    >
      <StackHeader
        title={title}
        isExpanded={isOpen}
        onCollapse={() => {
          if (onToggle) {
            onToggle();
          } else {
            setInternalIsOpen(false);
          }
        }}
      />

      {events.slice(0, visibleCards).map((event, i) => (
        <StackedEventCard
          key={event.id}
          index={i}
          event={event}
          totalCards={totalCards}
          onExpand={handleToggle}
          isOpen={isOpen}
        />
      ))}
    </motion.div>
  );
}

const StackHeader = ({
                       title,
                       isExpanded,
                       onCollapse,
                     }: {
  title: string;
  isExpanded: boolean;
  onCollapse: () => void;
}) => {
  const variants: Variants = {
    open: {
      y: 0,
      scale: 1,
      opacity: 1,
    },
    closed: {
      y: -10,
      scale: 0.8,
      opacity: 0,
    },
  };

  return (
    <motion.div
      style={headerContainerStyle}
      variants={variants}
      initial={false}
      animate={isExpanded ? 'open' : 'closed'}
      transition={{
        type: 'spring',
        stiffness: 600,
        damping: 50,
        delay: isExpanded ? 0.2 : 0,
      }}
    >
      <motion.h2 style={stackTitleStyle}>{title}</motion.h2>
      <motion.button
        style={collapseButtonStyle}
        whileHover={{
          backgroundColor: '#f5f5f5',
          color: '#0f1115',
        }}
        onClick={onCollapse}
      >
        Collapse
      </motion.button>
    </motion.div>
  );
};

const StackedEventCard = ({
                            index,
                            event,
                            totalCards,
                            onExpand,
                            isOpen,
                          }: {
  index: number;
  event: Event;
  totalCards: number;
  onExpand: () => void;
  isOpen: boolean;
}) => {
  const variants: Variants = {
    open: {
      y: 0,
      gap: 10,
      scale: 1,
      opacity: 1,
      cursor: 'pointer',
    },
    closed: {
      y: -index * (EVENT_CARD_HEIGHT - CARD_PEEK_OFFSET),
      scale: 1 - index * 0.05,
      opacity: 1 - index * 0.3,
      cursor: index === 0 ? 'pointer' : 'default',
    },
  };

  const cardStyle = getEventCardStyle(index, totalCards);

  // Transform API data to EventCard format
  const eventCardData = {
    eventName: event.title,
    date: new Date(event.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    imageUrl: event.heroImageUrl,
    // TODO: These should come from your analytics/tickets API
    revenue: 0,
    revenueDecimals: 0,
    ticketsSold: 0,
    attendance: 0,
    avgTicket: 0,
    perPerson: 0,
    eventId: event.id,
    isStackOpen: isOpen,
    onStackToggle: onExpand,
  };

  return (
    <motion.div
      style={{
        ...cardStyle,
        pointerEvents: isOpen ? 'auto' : (index === 0 ? 'auto' : 'none'),
      }}
      variants={variants}
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
      transition={{
        type: 'spring',
        stiffness: 600,
        damping: 50,
        delay: index * 0.04,
      }}
      onClick={onExpand}
    >
      <EventCard {...eventCardData} />
    </motion.div>
  );
};

/**
 * ==============   Styles   ================
 */
const stackContainerStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: STACK_GAP,
  width: '100%',
  overflow: 'hidden',
  paddingTop: 50,
};

const headerContainerStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  height: 40,
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  transformOrigin: 'bottom center',
  pointerEvents: 'none',
};

const stackTitleStyle: CSSProperties = {
  fontSize: 18,
  lineHeight: 1,
  marginLeft: 8,
  color: '#ffffff',
};

const collapseButtonStyle: CSSProperties = {
  display: 'flex',
  height: 36,
  padding: '10px',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 5,
  borderRadius: 1000,
  color: '#f7f7f7',
  background: '#f7f7f70d',
  pointerEvents: 'auto',
  cursor: 'pointer',
  border: 'none',
};

const loadingContainerStyle: CSSProperties = {
  height: EVENT_CARD_HEIGHT,
  width: '100%',
  borderRadius: 20,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 16,
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

const spinnerStyle: CSSProperties = {
  width: 40,
  height: 40,
  border: '3px solid rgba(255, 255, 255, 0.1)',
  borderTop: '3px solid #ffffff',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const loadingTextStyle: CSSProperties = {
  color: '#ffffff',
  fontSize: 14,
  opacity: 0.7,
};

const errorContainerStyle: CSSProperties = {
  height: EVENT_CARD_HEIGHT,
  width: '100%',
  borderRadius: 20,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
};

const errorTextStyle: CSSProperties = {
  color: '#ef4444',
  fontSize: 16,
  fontWeight: 600,
};

const errorDetailStyle: CSSProperties = {
  color: '#fca5a5',
  fontSize: 14,
  opacity: 0.8,
};

const emptyContainerStyle: CSSProperties = {
  height: EVENT_CARD_HEIGHT,
  width: '100%',
  borderRadius: 20,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

const emptyTextStyle: CSSProperties = {
  color: '#ffffff',
  fontSize: 14,
  opacity: 0.5,
};

/**
 * ==============   Utils   ================
 */
function getEventCardStyle(index: number, totalCards: number): CSSProperties {
  return {
    height: EVENT_CARD_HEIGHT,
    width: '100%',
    borderRadius: 20,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: totalCards - index,
    userSelect: 'none',
    overflow: 'hidden',
    flexShrink: 0,
  };
}

// Add keyframe animation in your global CSS
// @keyframes spin {
//   0% { transform: rotate(0deg); }
//   100% { transform: rotate(360deg); }
// }