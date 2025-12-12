import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import avatar from "../../../assets/image.png";
import locationIcon from "../../../assets/location.svg";
import calendarIcon from "../../../assets/calendar-black.svg";
import clockIcon from "../../../assets/clock.svg";
import qrIcon from "../../../assets/qr.svg";
import verifyIcon from "../../../assets/verify.svg";
import arrowLeft from "../../../assets/arrow-left.svg";
import defaulHero from "../../../assets/default-hero.jpeg";
import {
  Star,
  ShoppingCart,
  ShoppingBag,
  Check,
  ChevronRight,
} from "lucide-react";
import type { Ticket } from "@/api/tickets";

interface Props {
  ticket: Ticket;
  onClose: () => void;
}

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (timeString: string) => {
  if (/^\d{2}:\d{2}/.test(timeString)) return timeString.substring(0, 5);
  try {
    const [h, m] = timeString.split(":");
    return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
  } catch {
    return timeString;
  }
};

const ExpandedTicketCard: React.FC<Props> = ({ ticket, onClose }) => {
  const [activeTab, setActiveTab] = useState<"Details" | "Event" | "Add Ons">(
    "Details"
  );
  const [showQR, setShowQR] = useState(false);
  const [selectedAddOnId, setSelectedAddOnId] = useState<number | null>(null);
  const [addOnsMode, setAddOnsMode] = useState<"purchased" | "available">(
    "available"
  );

  const {
    eventTitle,
    eventLocation,
    eventDate,
    eventTime,
    ticketType,
    perks = [],
    uniqueCode,
    heroImageUrl,
    buyerName,
    organizerProfilePicture,
    availableAddOns = [],
    eventShortDescription, // 👈 use this in Event tab
  } = ticket;

  // ownerEmail is coming from backend (user.email); we cast for safety so TS
  // doesn't complain if the Ticket type isn't updated yet.
  const ownerEmail = (ticket as Ticket & { ownerEmail?: string }).ownerEmail;

  const organizerName = ticket.organizerName || "Organizer";
  // 👇 display email if available, then buyerName, else fallback
  const displayName = ownerEmail || buyerName || "You";

  const purchasedAddOns =
    (ticket as Ticket & { purchasedAddOns?: typeof availableAddOns })
      .purchasedAddOns || [];

  const selectedAddOn = availableAddOns.find(
    (addOn) => addOn.id === selectedAddOnId
  );
  const hasAvailableAddOns = availableAddOns.length > 0;
  const hasPurchasedAddOns = purchasedAddOns.length > 0;

  return (
    <div className="w-full h-[calc(100vh-170px)] relative rounded-[40px] overflow-hidden bg-gradient-to-b from-black/20 to-black/80 shadow-lg border border-white/10">
      {/* Background hero image */}
      <div
        className="w-full h-[55%] absolute top-0 left-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${heroImageUrl || defaulHero})`,
        }}
      />

      {/* Dark overlay over hero */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90" />

      {/* Foreground content */}
      <div className="relative z-20 w-full h-full">
        {/* TOP LEFT: Organizer + event title */}
        <div className="absolute top-5 left-5 right-28 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <img
              src={organizerProfilePicture || avatar}
              alt="Organizer"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex flex-col">
              <span className="text-[11px] text-white/70">{organizerName}</span>
              <span className="text-sm font-semibold text-white">
                {eventTitle}
              </span>
            </div>
          </div>
        </div>

        {/* TOP RIGHT: Close button + event info pills */}
        <div className="absolute top-5 right-5 flex flex-col items-end gap-3">
          {/* Close button now sits in the hero, top-right */}
          <button
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/80 text-white"
            onClick={onClose}
          >
            ✕
          </button>

          {/* Location / date / time pills */}
          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center gap-2 px-4 py-2 bg-[rgba(247,247,247,0.5)] backdrop-blur-[40px] rounded-full text-xs text-[var(--BG)]">
              <img src={locationIcon} alt="Location" className="w-3 h-3" />
              <span>{eventLocation}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-[rgba(247,247,247,0.5)] backdrop-blur-[40px] rounded-full text-xs text-[var(--BG)]">
              <img src={calendarIcon} alt="Date" className="w-3 h-3" />
              <span>{formatDate(eventDate)}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-[rgba(247,247,247,0.5)] backdrop-blur-[40px] rounded-full text-xs text-[var(--BG)]">
              <img src={clockIcon} alt="Time" className="w-3 h-3" />
              <span>{formatTime(eventTime)}</span>
            </div>
          </div>
        </div>

        {/* Bottom Black Section */}
        <div className="absolute bottom-0 w-full h-[60%] bg-black z-20 flex flex-col px-5 pb-6 rounded-b-[40px]">
          {/* Tabs and QR Button */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-3">
              {["Details", "Event", "Add Ons"].map((tab) => (
                <button
                  key={tab}
                  className={`text-xs sm:text-sm px-4 py-2 rounded-full transition
                    ${
                      activeTab === tab
                        ? "bg-white text-[var(--BG)] shadow-sm"
                        : "text-white/70 hover:text-white"
                    }`}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                >
                  {tab}
                </button>
              ))}
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
          </div>

          {/* Gray Card Container */}
          <div
            className="relative z-20 w-full rounded-[30px] px-6 py-6 mt-4 flex flex-col gap-4 flex-grow overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, rgba(247, 247, 247, 0.10) 0%, var(--Ivory-White, rgba(247, 247, 247, 0.30)) 100%)",
            }}
          >
            {/* DETAILS TAB */}
            {activeTab === "Details" && (
              <>
                {/* Top row: For You + ticket type chip */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={avatar}
                      alt="user"
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="text-xs sm:text-sm text-white/80">
                      For{" "}
                      <span className="font-semibold text-white">
                        {displayName}
                      </span>
                    </div>
                  </div>
                  {ticketType && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs sm:text-sm text-white">
                      <Star size={14} className="text-yellow-400" />
                      <span className="font-medium">{ticketType}</span>
                    </div>
                  )}
                </div>

                {/* Perks list */}
                {perks.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <img src={verifyIcon} alt="perks" className="w-5 h-5" />
                      <span>Perks included</span>
                    </div>

                    <div className="space-y-2">
                      {perks.map((perk) => (
                        <div
                          key={perk.id}
                          className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3"
                        >
                          <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                            <Check size={14} className="text-[#F7B733]" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">
                              {perk.title}
                            </div>
                            {perk.description && (
                              <p className="mt-1 text-xs leading-relaxed text-white/70">
                                {perk.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {perks.length === 0 && (
                  <div className="mt-4 text-xs sm:text-sm text-white/70">
                    This ticket has no extra perks attached.
                  </div>
                )}
              </>
            )}

            {/* EVENT TAB – use eventShortDescription */}
            {activeTab === "Event" && (
              <>
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-white/70">Event</span>
                  <span className="text-sm font-semibold text-white">
                    Information
                  </span>
                </div>
                <div className="flex-1 rounded-2xl bg-black/20 backdrop-blur-md px-5 py-4 flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-white/80">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10">
                      <img
                        src={locationIcon}
                        alt="Location"
                        className="w-3 h-3"
                      />
                      <span>{eventLocation}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10">
                      <img
                        src={calendarIcon}
                        alt="Date"
                        className="w-3 h-3"
                      />
                      <span>{formatDate(eventDate)}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10">
                      <img src={clockIcon} alt="Time" className="w-3 h-3" />
                      <span>{formatTime(eventTime)}</span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed mt-2 flex-1">
                    {eventShortDescription ||
                      "This is a description of the event. Add a proper event description from the backend to show here."}
                  </p>
                </div>
              </>
            )}

            {/* ADD ONS TAB – (your existing logic; left as-is) */}
            {activeTab === "Add Ons" && (
              <>
                {/* Toggle buttons */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      className={`text-xs px-3 py-1.5 rounded-full border transition
                        ${
                          addOnsMode === "purchased"
                            ? "bg-white text-[var(--BG)] border-white"
                            : "bg-transparent text-white/70 border-white/30"
                        }`}
                      onClick={() => setAddOnsMode("purchased")}
                    >
                      Purchased
                    </button>
                    <button
                      className={`text-xs px-3 py-1.5 rounded-full border transition
                        ${
                          addOnsMode === "available"
                            ? "bg-white text-[var(--BG)] border-white"
                            : "bg-transparent text-white/70 border-white/30"
                        }`}
                      onClick={() => setAddOnsMode("available")}
                    >
                      Available
                    </button>
                  </div>
                </div>

                {/* PURCHASED VIEW */}
                {addOnsMode === "purchased" && (
                  <>
                    {!hasPurchasedAddOns && (
                      <div className="flex items-center justify-center h-full text-sm text-white/70">
                        No add-ons purchased for this ticket.
                      </div>
                    )}

                    {hasPurchasedAddOns && (
                      <div className="flex flex-col gap-3 overflow-y-auto pr-1">
                        {purchasedAddOns.map((addOn) => (
                          <div
                            key={addOn.id}
                            className="w-full rounded-2xl bg-black/15 backdrop-blur-md px-5 py-4 border border-white/10 flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                  <ShoppingBag size={18} className="text-white" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-semibold text-[#F7B733]">
                                    {addOn.price}
                                  </span>
                                  <span className="text-sm font-semibold text-white">
                                    {addOn.title}
                                  </span>
                                </div>
                              </div>
                              <div className="px-3 py-1 rounded-full bg白/15 text-xs text-white flex items-center gap-1">
                                <Check size={14} /> Added
                              </div>
                            </div>
                            {addOn.description && (
                              <p className="text-xs text-white/75 leading-relaxed">
                                {addOn.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* AVAILABLE VIEW */}
                {addOnsMode === "available" && (
                  <>
                    {!hasAvailableAddOns && (
                      <div className="flex items-center justify-center h-full text-sm text-white/70">
                        No add-ons available for this ticket.
                      </div>
                    )}

                    {hasAvailableAddOns && !selectedAddOn && (
                      <div className="flex flex-col gap-3 overflow-y-auto pr-1">
                        {availableAddOns.map((addOn) => (
                          <button
                            key={addOn.id}
                            className="w-full flex items-center justify-between gap-3 rounded-2xl bg-black/20 backdrop-blur-md px-5 py-4 text-left hover:bg-black/30 transition"
                            onClick={() => setSelectedAddOnId(addOn.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                <ShoppingBag size={18} className="text-white" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-white">
                                  {addOn.title}
                                </span>
                                {addOn.description && (
                                  <span className="text-xs text-white/70">
                                    {addOn.description}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">
                                {addOn.price}
                              </span>
                              <ChevronRight
                                size={16}
                                className="text-white/60"
                              />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {hasAvailableAddOns && selectedAddOn && (
                      <div className="flex flex-col gap-4 h-full">
                        <button
                          className="self-start text-xs text-white/70 flex items-center gap-1"
                          onClick={() => setSelectedAddOnId(null)}
                        >
                          ← Back to Add Ons
                        </button>

                        <div className="flex-1 rounded-2xl bg-black/20 backdrop-blur-md px-5 py-4 flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                <ShoppingBag size={18} className="text-white" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-white">
                                  {selectedAddOn.title}
                                </span>
                                {selectedAddOn.description && (
                                  <span className="text-xs text-white/70">
                                    {selectedAddOn.description}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-white">
                              {selectedAddOn.price}
                            </span>
                          </div>

                          <button className="mt-auto flex items-center justify-center gap-2 rounded-full bg-white text-[var(--BG)] px-4 py-2 text-sm font-semibold">
                            <ShoppingCart size={16} />
                            Add to order
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* QR Modal */}
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
                    backgroundImage: `url(${heroImageUrl || defaulHero})`,
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
    </div>
  );
};

export default ExpandedTicketCard;
