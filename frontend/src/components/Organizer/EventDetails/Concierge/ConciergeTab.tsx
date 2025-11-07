import TabsRequests from '@components/Organizer/EventDetails/Concierge/TabsRequests';
import RequestCard from '@components/Organizer/EventDetails/Concierge/RequestCard';
import LoadingRipple from '@components/Organizer/EventDetails/LoadingRipple';
import { useEventSpecialRequests } from '@/hooks/useConcierge';
import type { Event } from '@/api/events';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface ConciergeTabProps {
  event: Event;
}

type StatusFilter = 'pending' | 'resolved';

const ConciergeTab = ({ event }: ConciergeTabProps) => {
  const { id: eventId } = event;
  const { data: requests, isLoading, error } = useEventSpecialRequests(eventId);
  const [activeTab, setActiveTab] = useState<StatusFilter>('pending');
  const navigate = useNavigate();

  // Filter requests by status
  const filteredRequests = requests?.filter(request => request.status === activeTab) || [];

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex justify-center items-center p-6">
        <LoadingRipple />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="absolute inset-0 flex justify-center items-center p-6">
        <div className="bg-[rgba(255,13,0,0.1)] border border-[rgba(255,13,0,0.3)] rounded-[20px] p-6 text-center max-w-md">
          <p className="text-[#FF0D00]">Failed to load special requests. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto [&::-webkit-scrollbar]:hidden">
      <div className="pt-[5.5rem] px-2.5 pb-[5rem]">
        {/* Header with tabs */}
        <div className="w-full h-fit justify-between items-center gap-2.5 flex pb-2.5">
          <span className="text-white text-lg leading-7">Requests</span>
          <TabsRequests 
            activeTab={
              activeTab === 'pending' ? 0 : 1
            } 
            onTabChange={(index) => {
              const statuses: StatusFilter[] = ['pending', 'resolved'];
              setActiveTab(statuses[index]);
            }}
          />
        </div>

        {/* Main scrollable content */}
        <div className="pt-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.15,
                exit: { duration: 0.1 }
              }}
              className="flex flex-col"
            >
              {filteredRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="text-center">
                    <div className="text-white/50 text-base mb-2">
                      No {activeTab === 'pending' ? 'pending' : 'resolved'} requests
                    </div>
                    <div className="text-white/30 text-sm">
                      {activeTab === 'pending' 
                        ? 'New special requests will appear here'
                        : 'Completed requests will appear here'
                      }
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 [&::-webkit-scrollbar]:hidden"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  <AnimatePresence initial={false}>
                    {filteredRequests.map((request) => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        onClick={() => {
                          navigate(`/organizer/event/${eventId}/request/${request.id}`);
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ConciergeTab;