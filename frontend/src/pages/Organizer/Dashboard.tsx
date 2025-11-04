import React from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import StatCard from '@components/Organizer/Dashboard/StatCard';
import Tabs from '@components/Organizer/Dashboard/Tabs';
import Navbar from '@components/Organizer/Dashboard/Navbar';
import Stack from '@components/Organizer/Dashboard/Stack';
import GradualBlur from '@/components/GradualBlur';
import { useMyUpcomingEvents, useMyFinishedEvents } from '@/hooks/useEvents';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState(0);
  const [openStack, setOpenStack] = React.useState<'active' | 'past' | null>(null);

  // Fetch events using TanStack Query
  const {
    data: upcomingData,
    isLoading: isLoadingUpcoming,
    error: upcomingError,
  } = useMyUpcomingEvents(1, 100);

  const {
    data: finishedData,
    isLoading: isLoadingFinished,
    error: finishedError,
  } = useMyFinishedEvents(1, 100);

  // Filter events based on is_finished status
  const activeEvents = React.useMemo(
    () => (upcomingData?.results || []).filter((event) => !event.isFinished),
    [upcomingData]
  );

  const pastEvents = React.useMemo(
    () => (finishedData?.results || []).filter((event) => event.isFinished),
    [finishedData]
  );

  return (
    <section className="fixed inset-0 h-screen overflow-hidden">
      {/* Fixed Navbar at top */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar type="organizer" />
      </div>

      {/* Fixed Tabs below navbar, centered */}
      <div className="fixed bottom-[20px] left-0 right-0 z-40 flex justify-center">
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="h-full overflow-y-auto px-[10px] pt-[20px] pb-8 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === 0 && (
            <motion.div
              key="events"
              initial={{ opacity: 0, filter: "blur(5px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{
                opacity: 0,
                filter: "blur(5px)",
                transition: { duration: 0.15 },
              }}
              className="w-full pt-[60px]"
            >
              <LayoutGroup>
                <motion.div layout className="flex flex-col">
                  <Stack
                    title="Active Events"
                    events={activeEvents}
                    isLoading={isLoadingUpcoming}
                    error={upcomingError}
                    isOpen={openStack === 'active'}
                    onToggle={() => setOpenStack(openStack === 'active' ? null : 'active')}
                    isVisible={openStack === null || openStack === 'active'}
                  />
                  <Stack
                    title="Past Events"
                    events={pastEvents}
                    isLoading={isLoadingFinished}
                    error={finishedError}
                    isOpen={openStack === 'past'}
                    onToggle={() => setOpenStack(openStack === 'past' ? null : 'past')}
                    isVisible={openStack === null || openStack === 'past'}
                  />
                </motion.div>
              </LayoutGroup>
            </motion.div>
          )}
          {activeTab === 1 && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, filter: "blur(5px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{
                opacity: 0,
                filter: "blur(5px)",
                transition: { duration: 0.15 },
              }}
              className="flex flex-col gap-[10px] w-full"
            >
              <h2 className="text-2xl font-bold mb-[10px]">Analytics Overview</h2>
              {/* Full width Total Revenue card */}
              <StatCard title="Total Revenue" value="$120,000.00" />

              {/* Two cards side by side */}
              <div className="flex gap-[10px] w-full">
                <div className="flex-1">
                  <StatCard title="Total Ticket Sales" value="12,000" />
                </div>
                <div className="flex-1">
                  <StatCard title="Attendance Rate" value="98%" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
    </section>
  );
};

export default Dashboard;