import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Ticket from '@/assets/ticket.svg';
import TierCard from './Tiers/TierCard';
import { TIER_GRADIENTS } from '@/constants/tierGradients';
import NewTierForm, { TierFormData } from './Tiers/NewTierForm';
import TierDetailView from './TierDetailView';

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

interface TierData {
  waves: Wave[];
  privileges: Privilege[];
  addOns: AddOn[];
  tables: Table[];
  bookingNumber: string;
}

interface TicketsTabProps {
  tiers: Tier[];
  setTiers: React.Dispatch<React.SetStateAction<Tier[]>>;
  tierDataMap: Record<string, TierData>;
  setTierDataMap: React.Dispatch<React.SetStateAction<Record<string, TierData>>>;
}

export default function TicketsTab({ tiers, setTiers, tierDataMap, setTierDataMap }: TicketsTabProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);

  const handleAddTier = useCallback(() => {
    setShowCreateForm(true);
  }, []);

  const handleDeleteTier = useCallback((tierId: string) => {
    setTiers(prev => prev.filter(tier => tier.id !== tierId));
    // Also remove the tier's data from the map
    setTierDataMap(prev => {
      const newMap = { ...prev };
      delete newMap[tierId];
      return newMap;
    });
  }, [setTiers, setTierDataMap]);

  const handleCloseForm = useCallback(() => {
    setShowCreateForm(false);
  }, []);

  const handleSaveTier = useCallback((tierData: TierFormData) => {
    const newTier: Tier = {
      id: Date.now().toString(),
      name: tierData.name || 'New Tier',
      gradientId: tierData.gradientId,
      icon: tierData.icon,
      specialRequests: tierData.specialRequests,
    };
    setTiers(prev => [...prev, newTier]);

    // Initialize empty data for the new tier
    setTierDataMap(prev => ({
      ...prev,
      [newTier.id]: {
        waves: [],
        privileges: [],
        addOns: [],
        tables: [],
        bookingNumber: '',
      }
    }));
  }, [setTiers, setTierDataMap]);

  const handleTierClick = useCallback((tierId: string) => {
    setSelectedTierId(tierId);
  }, []);

  const handleCloseTierDetail = useCallback(() => {
    setSelectedTierId(null);
  }, []);

  return (
    <div className="w-full rounded-[20px] py-2.5 inline-flex flex-col justify-start items-start gap-2.5 overflow-hidden">
      <div className="w-full flex-1 flex flex-col justify-start items-start gap-2.5 overflow-hidden">
        {selectedTierId ? (
          /* Tier Detail View */
          (() => {
            const tier = tiers.find(t => t.id === selectedTierId);
            const gradient = TIER_GRADIENTS.find(
              g => g.id === tier?.gradientId
            );
            const tierData = tierDataMap[selectedTierId] || {
              waves: [],
              privileges: [],
              addOns: [],
              tables: [],
              bookingNumber: '',
            };

            return (
              <TierDetailView
                tierId={selectedTierId}
                tierName={tier?.name || ''}
                tierGradientClassName={gradient?.className || ''}
                onClose={handleCloseTierDetail}
                tierData={tierData}
                setTierDataMap={setTierDataMap}
              />
            );
          })()
        ) : showCreateForm ? (
          /* Create Tier Form */
          <NewTierForm onClose={handleCloseForm} onSave={handleSaveTier} />
        ) : (
          <>
            {/* Header Section */}
              <div className="self-stretch flex flex-col justify-start items-start gap-2.5 overflow-hidden">
                <div className="self-stretch inline-flex justify-between items-center overflow-hidden">
                  {/* Tiers Label */}
                  <div className="flex flex-row flex-1 items-center justify-start gap-2.5">
                    <div className="w-12 h-12 p-2.5 bg-gradient-to-r from-[rgba(217,179,226,0.30)] to-[rgba(244,192,95,0.30)] rounded-full inline-flex flex-col items-center justify-center gap-2.5 overflow-hidden">
                      <div className="w-4 h-4 relative">
                        <img
                          src={Ticket}
                          alt="Ticket"
                          className="w-4 h-4 absolute "
                        />
                      </div>
                    </div>
                    <div className="justify-center text-Ivory-White text-base font-normal font-['Lufga'] leading-normal">
                      Tiers
                    </div>
                  </div>

                  {/* Add Button */}
                  <div className=" rounded-[40px] backdrop-blur-[20px] flex justify-center items-center gap-2.5 overflow-hidden">
                    <button
                      onClick={handleAddTier}
                      className="w-12 h-12 p-2.5 bg-[rgba(247,247,247,0.20)] rounded-full inline-flex flex-col justify-center items-center gap-2.5 overflow-hidden hover:bg-[rgba(247,247,247,0.30)] transition-colors"
                      aria-label="Add tier"
                    >
                      <Plus
                        className="w-4 h-4 text-[#F7F7F7]"
                        strokeWidth={1.5}
                      />
                    </button>
                  </div>
                </div>
              </div>

            {/* Tier Cards List or Empty State */}
              {tiers.length === 0 ? (
                <div className="h-full w-full flex-1 flex items-center justify-center">
                  <p className="text-[#B4B8B3] text-sm font-normal font-['Lufga']">
                    No tiers created yet. Click + to add your first tier.
                  </p>
                </div>
              ) : (
                <motion.div
                  layout
                  className="w-full flex flex-col"
                >
                  <AnimatePresence initial={false} mode="popLayout">
                    {tiers.map(tier => {
                      const gradient = TIER_GRADIENTS.find(
                        g => g.id === tier.gradientId
                      );
                      return (
                        <TierCard
                          key={tier.id}
                          name={tier.name}
                          gradientClassName={gradient?.className || TIER_GRADIENTS[0].className}
                          icon={tier.icon}
                          specialRequests={tier.specialRequests}
                          onClick={() => handleTierClick(tier.id)}
                          onDelete={() => handleDeleteTier(tier.id)}
                        />

                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              )}
          </>
        )}
      </div>
    </div>
  );
}