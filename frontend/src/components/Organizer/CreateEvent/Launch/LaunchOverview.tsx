import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, X, Calculator } from 'lucide-react';
import FeeSection from './FeeSection';
import InfoRow from './InfoRow';
import PaymentMethodCard from './PaymentMethodCard';
import LaunchButton from './LaunchButton';
import TabsLaunch from '@components/Organizer/CreateEvent/Launch/TabsLaunch';
import MultiStateBadge, { STATES } from '@components/Organizer/CreateEvent/Launch/MultiStateBadge';

type FeeOption = 'absorb' | 'guests';

interface LaunchOverviewProps {
  onBack?: () => void;
  revenueCapacity: number;
  totalTickets: number;
  feePercentage: number;
  paymentMethod?: {
    lastFourDigits: string;
    expiryDate: string;
  };
  onAddCard?: () => void;
  onChangeCard?: () => void;
  onLaunch?: () => void;
  badgeState: keyof typeof STATES;
  onBadgeStateChange: (state: keyof typeof STATES) => void;
  hasValidTickets?: boolean;
  hasAllDetails?: boolean;
  hasBanner?: boolean;
}

export default function LaunchOverview({
  revenueCapacity,
  totalTickets,
  feePercentage,
  paymentMethod,
  onAddCard,
  onChangeCard,
  onLaunch,
  badgeState,
  onBadgeStateChange,
  hasValidTickets = false,
  hasAllDetails = false,
  hasBanner = false,
}: LaunchOverviewProps) {
  const [activeView, setActiveView] = useState<'overview' | 'preview'>('overview');
  const [activeFeeOption, setActiveFeeOption] = useState<FeeOption>('guests');

  const revenue = activeFeeOption === 'guests' ? revenueCapacity : revenueCapacity - (revenueCapacity * feePercentage / 100);

  const isReadyToLaunch = hasValidTickets && hasAllDetails && hasBanner;

  function handleOptionChange() {
    setActiveFeeOption(activeFeeOption === 'guests' ? 'absorb' : 'guests');
  }

  return (
    <div className="w-full self-stretch rounded-[20px] inline-flex flex-col justify-start items-center gap-2.5 overflow-visible">

      {/* Content */}
      <div className="w-full self-stretch flex-1 py-2.5 rounded-[20px] flex flex-col justify-start items-start gap-2.5 overflow-hidden">

        {/* Header */}
        <div className="w-full flex justify-between items-center overflow-hidden">
          <TabsLaunch activeTab={activeView === 'overview' ? 0 : 1} onTabChange={(index) => setActiveView(index === 0 ? 'overview' : 'preview')} />
          <MultiStateBadge state={badgeState} onStateChange={onBadgeStateChange} disabled={!isReadyToLaunch}/>
        </div>


        <AnimatePresence mode="wait">
          {activeView === 'overview' ? (
            <motion.div
              key="overview"
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(10px)' }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full flex flex-col gap-2.5"
            >
              {/* Fee Section */}
              <FeeSection feePercentage={feePercentage} onOptionChange={handleOptionChange}/>

              {/* Revenue Capacity */}
              <InfoRow
                icon={Calculator}
                label="Revenue Capacity"
                value={`$${revenue.toLocaleString()}.00`}
              />

              {/* Total Tickets */}
              <InfoRow
                icon={Calculator}
                label="Total Tickets"
                value={totalTickets.toLocaleString()}
              />

              {/* Payment Method Cards */}
              {!paymentMethod && (
                <PaymentMethodCard onAddCard={onAddCard} />
              )}

              {paymentMethod && (
                <PaymentMethodCard
                  lastFourDigits={paymentMethod.lastFourDigits}
                  expiryDate={paymentMethod.expiryDate}
                  onChangeCard={onChangeCard}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(10px)' }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full self-stretch flex-1 flex items-center justify-center"
            >
              <div className="text-[#F7F7F7] text-sm">Preview content - to be implemented</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Launch Button */}
      <AnimatePresence mode="wait">
        {badgeState === 'back' && (
          <motion.div
            key="launch-button"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            <LaunchButton
              disabled={!paymentMethod}
              onLaunch={onLaunch}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
