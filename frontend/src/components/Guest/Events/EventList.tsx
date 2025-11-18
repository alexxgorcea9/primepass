"use client"

import { AnimatePresence, motion } from "motion/react"
import React, { useState } from "react"
import { useNavigate } from 'react-router-dom'
import type { Event, EventMedia } from '@/api/events'
import GradualBlur from '@components/GradualBlur';
import Location from '@/assets/location.svg';
import Calendar from '@/assets/calendar-black.svg';
import Clock from '@/assets/clock.svg';

interface EventWithMedia extends Event {
  media: EventMedia[];
}

interface EventListProps {
  events: EventWithMedia[];
  isLoading: boolean;
}

// Format time as hh:mm
const formatTime = (timeString: string): string => {
  // If the time is already in HH:MM format, return it
  if (/^\d{2}:\d{2}/.test(timeString)) {
    return timeString.substring(0, 5);
  }
  // Otherwise try to parse it
  try {
    const [hours, minutes] = timeString.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  } catch {
    return timeString;
  }
};

// Format date as dd mmm yyyy
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

function Card({
                id,
                title,
                shortDescription,
                organizerProfilePicture,
                location,
                date,
                time,
                heroImageUrl,
                open,
              }: {
  id: number;
  title: string;
  shortDescription: string;
  organizerProfilePicture?: string;
  location: string;
  date: string;
  time: string;
  heroImageUrl: string;
  open: () => void;
}) {
  return (
    <li className="card" onClick={open}>
      <motion.div className="card-content" layoutId={`card-container-${id}`}>
        <GradualBlur
          target="parent"
          position="top"
          height="6rem"
          strength={2}
          divCount={5}
          curve="bezier"
          exponential={true}
          opacity={1}
          zIndex={40}
        />

        <GradualBlur
          target="parent"
          position="bottom"
          height="6rem"
          strength={2}
          divCount={5}
          curve="bezier"
          exponential={true}
          opacity={1}
          zIndex={40}
        />

        <motion.div
          className="card-image-container"
          layoutId={`card-image-container-${id}`}
        >
          <motion.img
            className="card-image"
            src={heroImageUrl}
            alt={title}
            layoutId={`card-image-${id}`}
          />
        </motion.div>
        <motion.div
          className="title-container"
          layoutId={`title-container-${id}`}
          layout="position"
        >
          <div className="organizer-profile">
            {organizerProfilePicture ? (
              <img
                src={organizerProfilePicture}
                alt="Organizer"
                className="organizer-avatar"
              />
            ) : (
              <div className="organizer-avatar-placeholder" />
            )}
          </div>
          <div className="flex flex-col items-start justify-between gap-0 title-text-container">
            <h2 className="text-lg text-white">{title}</h2>
            <p className="text-sm text-white">{shortDescription}</p>
          </div>
        </motion.div>
        <motion.div
          className="footer-container"
          layoutId={`footer-container-${id}`}
        >
          <div className="footer-item">
            <img src={Location} alt="Location" className="w-3 h-3" />
            <span className="text-sm text-BG">{location}</span>
          </div>
          <div className="footer-item">
            <img src={Calendar} alt="Calendar" className="w-3 h-3" />
            <span className="text-sm text-BG">
              {formatDate(date)}
            </span>
          </div>
          <div className="footer-item">
            <img src={Clock} alt="Clock" className="w-3 h-3" />
            <span className="text-sm text-BG">{formatTime(time)}</span>
          </div>
        </motion.div>
      </motion.div>
    </li>
  );
}

function List({ events, open }: { events: EventWithMedia[]; open: (id: number) => void }) {
  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">No upcoming events found.</p>
      </div>
    );
  }

  return (
    <ul className="card-list">
      {events.map((event) => (
        <Card
          key={event.id}
          id={event.id}
          title={event.title}
          shortDescription={event.shortDescription}
          organizerProfilePicture={event.organizerProfilePicture}
          location={event.location}
          date={event.date}
          time={event.time}
          heroImageUrl={event.heroImageUrl}
          open={() => open(event.id)}
        />
      ))}
    </ul>
  )
}

function Item({ event, close, navigate }: { event: EventWithMedia; close: VoidFunction; navigate: ReturnType<typeof useNavigate> }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [descriptionHeight, setDescriptionHeight] = useState(0);
  const descriptionRef = React.useRef<HTMLDivElement>(null);
  
  // Prepare media assets for gallery preview
  const mediaAssets = event.media?.slice(0, 4) || [];
  const remainingCount = (event.media?.length || 0) > 4 ? (event.media?.length || 0) - 3 : 0;
  const displayAssets = remainingCount > 0 ? mediaAssets.slice(0, 3) : mediaAssets;
  
  // Update description height when it changes
  React.useEffect(() => {
    if (descriptionRef.current) {
      setDescriptionHeight(descriptionRef.current.scrollHeight);
    }
  }, [showFullDescription, event.description]);
  
  // Calculate blur height based on description content
  // Base blur of 6rem (~96px) + additional height for expanded content
  const blurHeight = showFullDescription && descriptionHeight > 100 
    ? `${Math.min(descriptionHeight + 100, 500)}px` 
    : '6rem';
  
  // Create array of all images (hero + media)
  const allImages = [event.heroImageUrl, ...(event.media?.map(m => m.file) || [])];
  
  // Trim description to approximately 150 characters
  const MAX_DESCRIPTION_LENGTH = 150;
  const description = (event.description && event.description.trim()) ? event.description : event.shortDescription;
  const shouldTrimDescription = description.length > MAX_DESCRIPTION_LENGTH;
  const trimmedDescription = shouldTrimDescription && !showFullDescription
    ? description.substring(0, MAX_DESCRIPTION_LENGTH).trim()
    : description;
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        style={{ pointerEvents: "auto" }}
        className="overlay"
        onClick={close}
      />
      <div className="card-content-container open">

        <motion.div
          className="card-content"
          layoutId={`card-container-${event.id}`}
        >
          <GradualBlur
            target="parent"
            position="top"
            height="6rem"
            strength={2}
            divCount={5}
            curve="bezier"
            exponential={true}
            opacity={1}
            zIndex={40}
          />

          {/* Dark overlay for readability */}
          <motion.div
            className="dark-overlay"
            initial={false}
            animate={{ height: blurHeight }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ 
              position: 'absolute', 
              bottom: 0, 
              left: 0, 
              right: 0, 
              pointerEvents: 'none',
              background: 'linear-gradient(to top, rgba(11, 16, 17, 0.95), rgba(11, 16, 17, 0.7) 50%, transparent)',
              zIndex: 35
            }}
          />
          
          {/* Blur gradient */}
          <motion.div
            initial={false}
            animate={{ height: blurHeight }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, pointerEvents: 'none' }}
          >
            <GradualBlur
              target="parent"
              position="bottom"
              height="100%"
              strength={2}
              divCount={5}
              curve="bezier"
              exponential={true}
              opacity={1}
              zIndex={40}
            />
          </motion.div>

          <motion.div
            className="card-image-container"
            layoutId={`card-image-container-${event.id}`}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              const swipeThreshold = 50;
              const swipeVelocityThreshold = 500;
              
              if (offset.x > swipeThreshold || velocity.x > swipeVelocityThreshold) {
                // Swiped right - go to previous image
                setCurrentImageIndex((prev) => 
                  prev > 0 ? prev - 1 : allImages.length - 1
                );
              } else if (offset.x < -swipeThreshold || velocity.x < -swipeVelocityThreshold) {
                // Swiped left - go to next image
                setCurrentImageIndex((prev) => 
                  prev < allImages.length - 1 ? prev + 1 : 0
                );
              }
            }}
          >
            <motion.img
              className="card-image"
              src={allImages[currentImageIndex]}
              alt={event.title}
              layoutId={`card-image-${event.id}`}
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
            
            {/* Navigation dots */}
            <div className="navigation-dots">
              {allImages.map((_, index) => (
                <button
                  key={index}
                  className={`nav-dot ${index === currentImageIndex ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  aria-label={`View image ${index + 1}`}
                />
              ))}
            </div>
          </motion.div>
          <motion.div
            className="title-container"
            layoutId={`title-container-${event.id}`}
            layout="position"
          >
            <div className="footer-item">
              <img src={Location} alt="Location" className="w-3 h-3" />
              <span className="text-sm text-BG">{event.location}</span>
            </div>
            <div className="footer-item">
              <img src={Calendar} alt="Calendar" className="w-3 h-3" />
              <span className="text-sm text-BG">
                {formatDate(event.date)}
              </span>
            </div>
            <div className="footer-item">
              <img src={Clock} alt="Clock" className="w-3 h-3" />
              <span className="text-sm text-BG">{formatTime(event.time)}</span>
            </div>
          </motion.div>
          <motion.div className="content-container" layout>
            {/* Tickets button and gallery preview row */}
            <div style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px'}}>
              {/* Tickets button */}
              <div 
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(180deg, rgba(247, 247, 247, 0.20) 0%, rgba(247, 247, 247, 0.30) 100%)',
                  overflow: 'hidden',
                  borderRadius: '120px',
                  outline: '1px rgba(247, 247, 247, 0.30) solid',
                  outlineOffset: '-0.50px',
                  backdropFilter: 'blur(20px)',
                  display: 'inline-flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                navigate(`/events/${event.id}/tickets`);
                }}
              >
                <div className="text-white text-sm font-['Lufga'] leading-6 whitespace-nowrap">Tickets</div>
              </div>
              
              {/* Gallery preview */}
              {event.media && event.media.length > 0 && (
                <div style={{
                  padding: '4px',
                  background: 'rgba(247, 247, 247, 0.20)',
                  overflow: 'hidden',
                  borderRadius: '40px',
                  backdropFilter: 'blur(20px)',
                  display: 'inline-flex',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  {displayAssets.map((asset, index) => (
                    <img
                      key={asset.id}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '40px',
                        objectFit: 'cover'
                      }}
                      src={asset.file}
                      alt={`Media ${index + 1}`}
                    />
                  ))}
                  {remainingCount > 0 && (
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'rgba(247, 247, 247, 0.30)',
                      overflow: 'hidden',
                      borderRadius: '40px',
                      display: 'inline-flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{
                        color: '#0A0A0A',
                        fontSize: '12px',
                        fontFamily: 'Poppins',
                        fontWeight: '400',
                        lineHeight: '18px'
                      }}>+{remainingCount}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <motion.h1 
              className="event-title"
              layout
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {event.title}
            </motion.h1>
            
            <motion.div 
              ref={descriptionRef}
              className="event-description"
              initial={false}
              animate={{ 
                height: showFullDescription ? 'auto' : 'auto'
              }}
              transition={{ 
                duration: 0.3,
                ease: "easeInOut"
              }}
              layout
            >
              <motion.p
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {trimmedDescription}
                {shouldTrimDescription && !showFullDescription && '... '}
                {shouldTrimDescription && (
                  <button
                    className="see-more-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFullDescription(!showFullDescription);
                    }}
                  >
                    {showFullDescription ? 'see less' : 'see more'}
                  </button>
                )}
              </motion.p>
            </motion.div>
            
            {/* Media tabs */}
            {allImages.length > 1 && (
              <div style={{
                width: '100%', 
                paddingTop: 16, 
                paddingBottom: 4, 
                overflow: 'hidden', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: 10, 
                display: 'flex'
              }}>
                {allImages.map((_, index) => (
                  <div
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    style={{
                      width: index === currentImageIndex ? 32 : 8,
                      height: 8,
                      background: index === currentImageIndex 
                        ? 'var(--Ivory-White, #F7F7F7)' 
                        : 'rgba(247, 247, 247, 0.40)',
                      borderRadius: index === currentImageIndex ? 40 : 9999,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}

function StoreFront({ events }: { events: EventWithMedia[] }) {
  const [openId, open] = useState<number | null>(null)
  const navigate = useNavigate()

  const close = () => open(null)
  const selectedEvent = events.find(e => e.id === openId);

  return (
    <>
      <List events={events} open={open} />
      <AnimatePresence>
        {openId && selectedEvent && <Item close={close} event={selectedEvent} navigate={navigate} key="item" />}
      </AnimatePresence>
    </>
  )
}

export default function EventList({ events, isLoading }: EventListProps) {
  if (isLoading) {
    return (
      <div id="app-store">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400">Loading events...</p>
        </div>
        <StyleSheet />
      </div>
    );
  }

  return (
    <div id="app-store">
      <StoreFront events={events} />
      <StyleSheet />
    </div>
  )
}

/**
 * ==============   Styles   ================
 */

const StyleSheet = () => {
  return (
    <style>{`
            @media (max-width: 620px) {
              body {
                overflow: hidden;
              }
            }

            #example-container {
                width: 100%;
            }

            #app-store {
                width: 100%;
                max-width: 990px;
                display: flex;
                flex-direction: column;
                padding: 40px 20px 100px;
                margin: 0 auto;
            }

            /* Hide scrollbar for all browsers */
            #app-store::-webkit-scrollbar {
                display: none;
            }
            
            #app-store {
                -ms-overflow-style: none;  /* IE and Edge */
                scrollbar-width: none;  /* Firefox */
            }

            #app-store,
            #app-store * {
                box-sizing: border-box;
            }

            #app-store header {
                position: relative;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            #app-store .avatar {
                background: #0b1011;
                border-radius: 50%;
                border: 1px solid var(--divider);
                width: 40px;
                height: 40px;
                overflow: hidden;
            }

            .store-title {
                font-variation-settings: "opsz" 20, "wght" 640;
                font-size: 34px;
                margin: 5px 0;
                letter-spacing: -0.05em;
                color: var(--text);
            }

            .date {
                color: var(--feint-text);
                font-size: 14px;
                text-transform: uppercase;
            }

            #app-store ul,
            #app-store li {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            #app-store p.big {
                margin-bottom: 10px;
            }

            #app-store .card-list {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
                gap: 20px;
                width: 100%;
                max-width: 100%;
            }

            /* Up to 640px: single column, square cards */
            @media (max-width: 639px) {
                #app-store .card-list {
                    grid-template-columns: 1fr;
                }
                
                #app-store .card {
                    width: 100%;
                    aspect-ratio: 1;
                    max-width: 640px;
                    margin: 0 auto;
                    overflow: hidden;
                }
            }

            /* 640px and above: two columns with 320px cards */
            @media (min-width: 640px) {
                #app-store .card-list {
                    grid-template-columns: repeat(2, 1fr);
                    max-width: 680px; /* 320px * 2 + 20px gap */
                    margin: 0 auto;
                }
                
                #app-store .card {
                    width: 100%;
                    aspect-ratio: 1;
                    min-width: 320px;
                }
            }

            #app-store .card {
                position: relative;
                padding: 0px;
                box-sizing: border-box;
                cursor: pointer;
            }

            .card-content-container {
                width: 100%;
                height: 100%;
                position: relative;
                display: block;
                pointer-events: none;
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
            }

            .card-content-container.open {
                top: 0;
                left: 0;
                right: 0;
                position: fixed;
                z-index: 1000001;
                overflow: hidden;
                padding: 10px;
                justify-content: center;
                align-items: center;
            }

            .dark .h3, .dark span {
                color: #0f1115;
            }

            .card-content {
                pointer-events: auto;
                position: relative;
                border-radius: 40px;
                background: #0b1011;
                overflow: hidden;
                width: 100%;
                height: 100%;
                margin: 0 auto;
            }

            .open .card-content {
                width: calc(100vw - 20px);
                height: calc(100vh - 20px);
                overflow: hidden;
                pointer-events: auto;
                display: flex;
                flex-direction: column;
            }

            .card-open-link {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
            }

            .card-image-container {
                overflow: hidden;
                height: 100%;
                width: 100%;
                display: flex;
                justify-content: stretch;
                flex-direction: column;
                position: relative;
            }

            .card-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                position: absolute;
                top: 0;
                left: 0;
            }

            .open .card-image-container {
                z-index: 1;
                flex: 1;
                min-height: 0;
                cursor: grab;
                touch-action: pan-y;
            }
            
            .open .card-image-container:active {
                cursor: grabbing;
            }

            .title-container {
                position: absolute;
                top: 0px;
                left: 0px;
                padding: 20px;
                width: 100%;
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 10px;
                z-index: 50;
            }

            .open .title-container {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                padding: 20px;
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 5px;
                z-index: 50;
                flex-wrap: wrap;
            }

            .organizer-profile {
                display: flex;
            }

            .organizer-avatar {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                object-fit: cover;
            }

            .organizer-avatar-placeholder {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
                border: 2px solid rgba(255, 255, 255, 0.3);
            }

            .title-text-container {
                height: 48px;
            }

            .title-container p {
                margin: 0;
            }

            .title-container h2 {
                color: #fff;
                margin: 0;
                text-wrap: balance;
            }

            .short-description {
                color: rgba(255, 255, 255, 0.85);
                font-size: 14px;
                line-height: 1.4;
                margin-top: 8px;
                text-wrap: balance;
            }

            .footer-container {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                padding: 20px;
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 5px;
                z-index: 50;
            }

            .open .footer-container {
                position: relative;
                padding: 20px;
            }

            .footer-item {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 10px 20px;
                background: rgba(247, 247, 247, 0.5);
                backdrop-filter: blur(40px);
                -webkit-backdrop-filter: blur(40px);
                border-radius: 1000px;
                gap: 8px;
                width: fit-content;
                white-space: nowrap;
                flex-shrink: 0;
            }

            .footer-item:first-child {
                flex: 1;
                min-width: 0;
                width: auto;
            }

            .footer-item:first-child span {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .footer-icon {
                font-size: 14px;
                flex-shrink: 0;
            }

            .footer-text {
                color: #fff;
                font-size: 13px;
                font-weight: 500;
                line-height: 1.4;
            }

            .category {
                color: #fff;
                font-size: 14px;
                text-transform: uppercase;
            }

            .overlay {
                inset: 0;
                z-index: 1000000;
                position: fixed;
                background: rgba(0, 0, 0, 1);
                will-change: opacity;
            }

            .overlay a {
                display: block;
                position: fixed;
                top: 0;
                bottom: 0;
                width: 100vw;
                left: 50%;
                transform: translateX(-50%);
            }

            .content-container {
                padding: 20px;
                max-width: 700px;
                width: 90vw;
            }

            .open .content-container {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                padding: 60px 20px 30px 20px;
                max-width: 100%;
                width: 100%;
                z-index: 70;
                pointer-events: auto;
                min-height: 200px;
            }

            .navigation-dots {
                position: absolute;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 8px;
                z-index: 80;
                padding: 8px 12px;
                border-radius: 1000px;
                pointer-events: auto;
            }

            .open .card-image-container .navigation-dots {
                bottom: 20px;
            }

            .nav-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.4);
                border: none;
                cursor: pointer;
                transition: all 0.3s ease;
                padding: 0;
                pointer-events: auto;
            }

            .nav-dot.active {
                background: rgba(255, 255, 255, 1);
                width: 24px;
                border-radius: 4px;
            }

            .nav-dot:hover {
                background: rgba(255, 255, 255, 0.6);
            }

            .event-title {
                font-size: 28px;
                font-weight: 700;
                color: #fff;
                margin: 0 0 16px 0;
                line-height: 1.2;
            }

            .event-description {
                color: rgba(255, 255, 255, 0.85);
                font-size: 16px;
                line-height: 1.5;
                margin-bottom: 20px;
                overflow: hidden;
                will-change: height;
            }

            .event-description p {
                margin: 0;
                transition: opacity 0.2s ease;
                display: inline;
            }

            .see-more-btn {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.6);
                font-size: 16px;
                cursor: pointer;
                padding: 0;
                text-decoration: none;
                transition: color 0.2s ease;
                font-weight: 400;
                display: inline;
                margin-left: 4px;
            }

            .see-more-btn:hover {
                color: rgba(255, 255, 255, 0.9);
            }

            @media only screen and (max-width: 639px) {
                body {
                    overflow: hidden;
                }

                #app-store {
                    padding: 20px 10px 60px;
                }

                #app-store .card-list {
                    gap: 16px;
                }

                #app-store .card-content-container.open {
                    padding: 10px;
                }
            }

            @media only screen and (min-width: 640px) and (max-width: 990px) {
                #app-store {
                    padding: 30px 15px 80px;
                }

                #app-store .card-list {
                    gap: 16px;
                }
            }

    `}</style>
  )
}

