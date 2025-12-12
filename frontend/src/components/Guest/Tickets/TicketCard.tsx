import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

import avatar from "../../../assets/image.png";
import qrIcon from "../../../assets/qr.svg";
import arrowLeft from "../../../assets/arrow-left.svg";
import starIcon from "../../../assets/star.svg";
import defaultHero from "../../../assets/default-hero.jpeg";
import GradualBlur from "@components/GradualBlur";
import defaulHero from '@/assets/default-hero.jpeg';

interface TicketCardProps {
  ticketId: number;
  eventId: number;
  eventTitle: string;
  eventLocation: string;
  eventDate: string;
  eventTime: string;
  countdownDate: string;
  countdownTime: string;
  ticketType: string;
  uniqueCode: string;
  heroImageUrl?: string;
  eventShortDescription: string;
  organizerImageUrl?: string;
  perks: string[];
  onExpand: () => void;
}

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

const contentAppearance = {
  duration: 0.25,
  ease: "easeOut",
};

const buildCountdownTarget = (date: string, time: string) => {
  const [hours = "00", minutes = "00"] = time.split(":");
  const dateObj = new Date(date);
  if (Number.isNaN(dateObj.getTime())) return null;
  dateObj.setHours(Number(hours), Number(minutes), 0, 0);
  return dateObj;
};

const computeRemaining = (target: Date | null) => {
  if (!target) return { label: "Event Started", started: true };
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { label: "Event Started", started: true };

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const h = String(hours).padStart(2, "0");
  const m = String(minutes).padStart(2, "0");
  const s = String(seconds).padStart(2, "0");

  return { label: `${h}:${m}:${s}`, started: false };
};

const TicketCard: React.FC<TicketCardProps> = ({
  eventTitle,
  eventLocation,
  countdownDate,
  countdownTime,
  ticketType,
  uniqueCode,
  heroImageUrl,
  organizerImageUrl,
  perks,
  onExpand,
}) => {
  const [showQR, setShowQR] = useState(false);
  const [countdownLabel, setCountdownLabel] = useState("00:00:00");
  const [eventStarted, setEventStarted] = useState(false);

  // Countdown logic
  useEffect(() => {
    const target = buildCountdownTarget(countdownDate, countdownTime);
    const update = () => {
      const { label, started } = computeRemaining(target);
      setCountdownLabel(label);
      setEventStarted(started);
    };
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [countdownDate, countdownTime]);

  const heroSrc =
    heroImageUrl && heroImageUrl !== "" ? heroImageUrl : defaultHero;
  const organizerSrc =
    organizerImageUrl && organizerImageUrl !== "" ? organizerImageUrl : avatar;

  // QR modal portal

  return (
    <>
      <motion.div
        className="relative w-full max-w-[360px] aspect-square rounded-[40px] overflow-hidden bg-[#0b1011] shadow-lg cursor-pointer"
        layout
        transition={springTransition}
        onClick={onExpand}
      >
        {/* Hero image as background */}
        <motion.div
          className="relative w-full h-full"
          layoutId={`ticket-image-container-${uniqueCode}`}
        >
          <motion.img
            key={heroSrc}
            src={heroSrc}
            alt={eventTitle}
            className="absolute inset-0 w-full h-full object-cover"
            layoutId={`ticket-image-${uniqueCode}`}
          />
        </motion.div>

        {/* EventList-style blurs */}
        <GradualBlur
          target="parent"
          position="top"
          height="6rem"
          strength={2}
          divCount={5}
          curve="bezier"
          exponential
          opacity={1}
          zIndex={30}
        />
        <GradualBlur
          target="parent"
          position="bottom"
          height="6rem"
          strength={2}
          divCount={5}
          curve="bezier"
          exponential
          opacity={1}
          zIndex={30}
        />

        {/* Extra dark gradient at bottom for readability */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/90 via-black/70 to-transparent z-30" />

        {/* HEADER: avatar + title + “Location: …” + QR */}
        <motion.header
          className="absolute left-0 right-0 top-0 z-40 flex items-center justify-between px-5 pt-5"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={contentAppearance}
        >
          <div className="flex items-center gap-3">
            <div className="flex">
              <img
                src={organizerSrc}
                alt="Organizer"
                className="w-10 h-10 rounded-full object-cover border border-white/40"
              />
            </div>
            <div className="flex flex-col items-start justify-between gap-0">
              <h2 className="text-sm sm:text-base font-semibold text-white">
                {eventTitle}
              </h2>
              <p className="text-[11px] sm:text-xs text-white/80">
                Location: {eventLocation}
              </p>
            </div>
          </div>

          {/* QR button */}
          <button
            type="button"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 border border-white/30 backdrop-blur-md"
            onClick={(e) => {
              e.stopPropagation();
              setShowQR(true);
            }}
          >
            <img src={qrIcon} alt="Show QR" className="w-5 h-5" />
          </button>
        </motion.header>

        {/* BOTTOM: VIP + perks pill & countdown pill (Figma-style) */}
        {/* BOTTOM: single row – VIP & countdown with EventList-style pills */}
<motion.div
  className="absolute left-0 right-0 bottom-0 z-40 px-5 pb-5"
  initial={{ y: 20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={contentAppearance}
>
  <div className="flex items-center gap-3">
    {/* VIP / ticket type pill */}
    <div
      className="
        flex-1 min-w-0
        flex items-center gap-2
        px-5 py-2
        rounded-full
        bg-[rgba(247,247,247,0.5)]
        backdrop-blur-[40px]
        border border-white/40
        whitespace-nowrap
      "
    >
      <img
        src={starIcon}
        alt="Ticket type"
        className="w-4 h-4 flex-shrink-0"
      />
      <div className="flex flex-col min-w-0">
        <span className="text-xs  text-[var(--BG)] truncate">
          {ticketType}
        </span>
        {perks && perks.length > 0 && (
          <span className="text-xs font-medium text-[var(--BG)]/80 truncate">
            {perks.join(" | ")}
          </span>
        )}
      </div>
    </div>

    {/* Countdown / status pill */}
    <div
      className="
        flex items-center justify-center
        px-5 py-2
        rounded-full
        bg-[rgba(247,247,247,0.5)]
        backdrop-blur-[40px]
        border border-white/40
        whitespace-nowrap
      "
    >
      <span className="text-xs text-[var(--BG)]">
        {eventStarted ? "Used" : countdownLabel}
      </span>
    </div>
  </div>
</motion.div>
      </motion.div>
    {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showQR && (
              <motion.div
                className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowQR(false)}
              >
                {/* Blurred hero background */}
                <div
                  className="absolute inset-0 bg-cover bg-center blur-lg scale-110"
                  style={{
                    backgroundImage: `url(${
                      heroImageUrl || defaulHero
                    })`,
                    zIndex: -1,
                  }}
                />
                {/* Optional dark overlay on top of blur */}
                <div className="absolute inset-0 bg-black/60" />

                {/* Back button */}
                <button
                  className="absolute top-6 left-6 w-12 h-12 flex items-center justify-center text-white z-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowQR(false);
                  }}
                >
                  <img
                    src={arrowLeft}
                    alt="Back"
                    className="w-8 h-8 object-contain"
                  />
                </button>

                {/* Title */}
                <div className="absolute top-10 left-0 w-full flex items-center justify-center z-50 pointer-events-none">
                  <span className="text-white text-sm font-semibold font-['Lufga']">
                    Scan QR
                  </span>
                </div>

                {/* QR card */}
                <motion.div
                  className="bg-black rounded-2xl p-6 shadow-lg border border-white/10 z-50"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?data=${uniqueCode}&size=220x220&color=ffffff&bgcolor=000000`}
                    alt="QR Code"
                    className="w-56 h-56 object-contain"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};

export default TicketCard;
