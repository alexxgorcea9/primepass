import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import CreateEventHeader from '@components/Organizer/CreateEvent/CreateEventHeader';
import CreateEventTabs from '@components/Organizer/CreateEvent/CreateEventTabs';
import TextInputLine from '@components/Organizer/CreateEvent/Details/TextInputLine';
import DateTimePicker from '@components/Organizer/CreateEvent/Details/DateTimePicker';
import LongTextInput from '@components/Organizer/CreateEvent/Details/LongTextInput';
import GradualBlur from '@components/GradualBlur';
import TicketsTab from '@components/Organizer/CreateEvent/Tickets/TicketsTab';
import ImageUploadZone from '@components/Organizer/CreateEvent/Media/ImageUploadZone';
import LaunchOverview from '@components/Organizer/CreateEvent/Launch/LaunchOverview';
import LaunchLoadingScreen from '@components/Organizer/CreateEvent/Launch/LaunchLoadingScreen';
import LaunchSuccessScreen from '@components/Organizer/CreateEvent/Launch/LaunchSuccessScreen';
import { STATES } from '@components/Organizer/CreateEvent/Launch/MultiStateBadge';
import GalleryUpload from '@components/Organizer/CreateEvent/Media/GalleryUpload';
import { eventsApi, BulkEventCreateData } from '@/api/events';
import { eventKeys } from '@/hooks/useEvents';

// Type definitions
interface Tier {
  id: string;
  name: string;
  gradientId: string;
  icon?: string;
  specialRequests?: boolean;
}

interface Wave {
  id: string;
  name: string;
  ticketCount: number;
  price: number;
  isActive?: boolean;
}

interface Privilege {
  id: string;
  name: string;
  description: string;
  isActive?: boolean;
}

interface AddOn {
  id: string;
  price: number;
  name: string;
  description: string;
  availability: number | 'Unlimited';
}

interface Table {
  id: string;
  name: string;
  seats: number;
  minimumSpend: number;
  count: number;
  isActive?: boolean;
}

interface MediaData {
  id: string;
  url: string;
  file: File;
  type: 'image' | 'video';
}

// Map to store tier-specific data
interface TierData {
  waves: Wave[];
  privileges: Privilege[];
  addOns: AddOn[];
  tables: Table[];
  bookingNumber: string;
}

const CreateEvent = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [launchBadgeState, setLaunchBadgeState] = useState<keyof typeof STATES>('ready');
  const [isLaunching, setIsLaunching] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [createdEventData, setCreatedEventData] = useState<any>(null);

  // Form state - Details tab
  const [eventName, setEventName] = useState('');
  const [eventSubtitle, setEventSubtitle] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDateTime, setEventDateTime] = useState(new Date());
  const [eventDescription, setEventDescription] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  // Gallery media state - lifted to persist across tabs
  const [galleryMedia, setGalleryMedia] = useState<MediaData[]>([]);

  // Tiers state - lifted to persist across tab changes
  const [tiers, setTiers] = useState<Tier[]>([]);

  // Tier-specific data - stored in a map keyed by tier ID
  const [tierDataMap, setTierDataMap] = useState<Record<string, TierData>>({});

  // Calculate total revenue from all waves across all tiers
  const totalRevenue = React.useMemo(() => {
    return tiers.reduce((total, tier) => {
      const tierData = tierDataMap[tier.id];
      if (!tierData?.waves) return total;

      const tierRevenue = tierData.waves.reduce((tierTotal, wave) => {
        return tierTotal + (wave.ticketCount * wave.price);
      }, 0);

      return total + tierRevenue;
    }, 0);
  }, [tiers, tierDataMap]);

  const feePercentage = 3;

  const totalTickets = tiers.reduce((total, tier) => {
    const tierData = tierDataMap[tier.id];
    if (!tierData?.waves) return total;
    return total + tierData.waves.reduce((tierTotal, wave) => {
      return tierTotal + wave.ticketCount;
    }, 0);
  }, 0);

  // Validation: Check if there's at least one tier with one wave with at least one ticket
  const hasValidTickets = React.useMemo(() => {
    return tiers.some(tier => {
      const tierData = tierDataMap[tier.id];
      if (!tierData?.waves || tierData.waves.length === 0) return false;
      return tierData.waves.some(wave => wave.ticketCount > 0);
    });
  }, [tiers, tierDataMap]);

  // Validation: Check if all details are filled
  const hasAllDetails = React.useMemo(() => {
    return Boolean(
      eventName.trim() &&
      eventSubtitle.trim() &&
      eventLocation.trim() &&
      eventDescription.trim()
    );
  }, [eventName, eventSubtitle, eventLocation, eventDescription]);

  // Validation: Check if banner is uploaded
  const hasBanner = Boolean(bannerImage);

  const handleBannerUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setBannerImage(url);
    setBannerFile(file); // Store the actual file for upload
  };

  const handleBannerRemove = () => {
    if (bannerImage) {
      URL.revokeObjectURL(bannerImage);
    }
    setBannerImage('');
    setBannerFile(null);
  };

  const handleLaunch = async () => {
    // Prevent multiple submissions
    if (isLaunching) return;

    setIsLaunching(true);
    setShowLoadingScreen(true);

    try {
      // Format date and time for API
      const date = eventDateTime.toISOString().split('T')[0]; // YYYY-MM-DD
      const time = eventDateTime.toTimeString().split(' ')[0]; // HH:MM:SS

      // Transform tiers data from local format to API format
      const transformedTiers = tiers.map(tier => {
        const tierData = tierDataMap[tier.id] || {
          waves: [],
          privileges: [],
          addOns: [],
          tables: [],
          bookingNumber: ''
        };

        return {
          name: tier.name,
          icon: tier.icon || 'ticket',
          gradientId: tier.gradientId,
          specialRequests: tier.specialRequests || false,
          waves: tierData.waves.map(wave => ({
            name: wave.name,
            ticketCount: wave.ticketCount,
            price: wave.price
          })),
          privileges: tierData.privileges.map(privilege => ({
            name: privilege.name,
            description: privilege.description
          })),
          addOns: tierData.addOns.map(addon => ({
            name: addon.name,
            description: addon.description,
            price: addon.price,
            availability: addon.availability
          })),
          tables: tierData.tables.map(table => ({
            name: table.name,
            count: table.count,
            seats: table.seats,
            minimumSpend: table.minimumSpend
          }))
        };
      });

      // Transform media data
      const transformedMedia = galleryMedia.map(media => ({
        url: media.url,
        type: media.type,
        isFeatured: false
      }));

      // Build the API payload
      const eventData: BulkEventCreateData = {
        title: eventName,
        description: eventDescription,
        shortDescription: eventSubtitle,
        location: eventLocation,
        date: date,
        time: time,
        heroImage: bannerFile || undefined, // Send actual file, not blob URL
        tiers: transformedTiers,
        media: transformedMedia
      };

      // Call the bulk create API
      const response = await eventsApi.bulkCreate(eventData);

      // Store event data and show success screen
      setCreatedEventData(response);
      setShowLoadingScreen(false);
      setShowSuccessScreen(true);

      // Invalidate React Query cache to refresh Dashboard
      // Invalidate all my-events queries (both upcoming and finished)
      await queryClient.invalidateQueries({ 
        queryKey: eventKeys.myEvents(),
        exact: false
      });

    } catch (error: any) {
      console.error('Error launching event:', error);

      // Hide loading screen on error
      setShowLoadingScreen(false);
      setIsLaunching(false);

      // Show error message to user
      const errorMessage = error.response?.data?.error
        || error.response?.data?.detail
        || 'Failed to create event. Please try again.';

      alert(`Error: ${errorMessage}`);
    }
  };

  return (
    <section className="fixed inset-0 h-screen overflow-hidden">
      {/* Loading Screen */}
      {showLoadingScreen && <LaunchLoadingScreen />}
      
      {/* Success Screen */}
      {showSuccessScreen && createdEventData && (
        <div className="fixed inset-0 z-50">
          <LaunchSuccessScreen
            eventName={createdEventData.title || eventName}
            eventLink={`${window.location.origin}/events/${createdEventData.id}`}
            accessCode={createdEventData.id?.toString() || ''}
            onCopyLink={() => {
              navigator.clipboard.writeText(`${window.location.origin}/events/${createdEventData.id}`);
            }}
            onShareCode={() => {
              navigator.clipboard.writeText(createdEventData.id?.toString() || '');
            }}
            onGoToDashboard={() => {
              navigate('/organizer/dashboard');
            }}
          />
        </div>
      )}
      
      {/* Fixed Header at top */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4">
        <CreateEventHeader />
      </div>

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

      {/* Fixed Tabs at bottom, centered */}
      <AnimatePresence>
        {!(activeTab === 3 && launchBadgeState === 'back') && (
          <motion.div
            key="create-event-tabs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="fixed bottom-[20px] left-0 right-0 z-40 flex justify-center"
          >
            <CreateEventTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onLaunch={handleLaunch}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable Content */}
      <div className="h-full overflow-y-auto px-[16px] pt-[80px] pb-[100px] [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === 0 && (
            <motion.div
              key="details"
              initial={{ opacity: 0, filter: "blur(5px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{
                opacity: 0,
                filter: "blur(5px)",
                transition: { duration: 0.15 },
              }}
              className="flex flex-col items-center justify-center text-white gap-4"
            >
              <TextInputLine label="Name" value={eventName} onChange={setEventName} placeholder="Event Name" maxLength={20} showCharCount={true} />
              <TextInputLine label="Subtitle" value={eventSubtitle} onChange={setEventSubtitle} placeholder="Short description" maxLength={50} showCharCount={true} />
              <TextInputLine label="Location" value={eventLocation} onChange={setEventLocation} placeholder="Location" maxLength={50} showCharCount={true} />
              <DateTimePicker selectedDate={eventDateTime} onDateTimeChange={setEventDateTime} />
              <LongTextInput value={eventDescription} onChange={setEventDescription} placeholder="Description" maxLength={500} />
            </motion.div>
          )}
          {activeTab === 1 && (
            <motion.div
              key="media"
              initial={{ opacity: 0, filter: "blur(5px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{
                opacity: 0,
                filter: "blur(5px)",
                transition: { duration: 0.15 },
              }}
              className="flex flex-col gap-4 text-white w-full"
            >
              {/* Event Banner Section */}
              <div className="self-stretch rounded-[20px] flex flex-col justify-start items-start gap-2.5 overflow-hidden">
                <div className="self-stretch inline-flex justify-between items-center overflow-hidden">
                  <div className="p-2.5 flex justify-start items-center gap-2.5 overflow-hidden">
                    <div className="justify-center text-[#F7F7F7] text-lg font-normal font-['Lufga'] leading-normal">
                      Event Banner
                    </div>
                  </div>
                </div>
              </div>

              {/* Banner Upload Zone */}
              <ImageUploadZone
                onUpload={handleBannerUpload}
                onRemove={handleBannerRemove}
                initialPreview={bannerImage}
              />

              <GalleryUpload
                media={galleryMedia}
                setMedia={setGalleryMedia}
              />

            </motion.div>
          )}
          {activeTab === 2 && (
            <motion.div
              key="tickets"
              initial={{ opacity: 0, filter: "blur(5px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{
                opacity: 0,
                filter: "blur(5px)",
                transition: { duration: 0.15 },
              }}
              className="flex items-center justify-center text-white"
            >
              <TicketsTab
                tiers={tiers}
                setTiers={setTiers}
                tierDataMap={tierDataMap}
                setTierDataMap={setTierDataMap}
              />
            </motion.div>
          )}
          {activeTab === 3 && (
            <motion.div
              key="launch"
              initial={{ opacity: 0, filter: "blur(5px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{
                opacity: 0,
                filter: "blur(5px)",
                transition: { duration: 0.15 },
              }}
              className="flex items-center justify-center text-white"
            >
              <LaunchOverview
                onBack={() => setActiveTab(0)}
                revenueCapacity={totalRevenue}
                totalTickets={totalTickets}
                feePercentage={feePercentage}
                paymentMethod={{
                  lastFourDigits: '7666',
                  expiryDate: '03/23'
                }}
                onAddCard={() => console.log('Add card')}
                onChangeCard={() => console.log('Change card')}
                onLaunch={handleLaunch}
                badgeState={launchBadgeState}
                onBadgeStateChange={setLaunchBadgeState}
                hasValidTickets={hasValidTickets}
                hasAllDetails={hasAllDetails}
                hasBanner={hasBanner}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default CreateEvent;