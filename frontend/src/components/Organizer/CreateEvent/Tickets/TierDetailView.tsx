import { useState, useCallback, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TierDetailHeader from './Tiers/TierDetailHeader';
import TierDetailTabs from './TierDetailTabs';
import WaveCard from './Waves/WaveCard';
import PrivilegeCard from './Privileges/PrivilegeCard';
import AddOnCard from './AddOns/AddOnCard';
import TableCard from './Tables/TableCard';
import NewWaveForm, { WaveFormData } from './Waves/NewWaveForm';
import NewPrivilegeForm, { PrivilegeFormData } from './Privileges/NewPrivilegeForm';
import NewAddOnForm, { AddOnFormData } from './AddOns/NewAddOnForm';
import NewTableForm, { TableFormData } from './Tables/NewTableForm';
import PhoneInput from '../../../Auth/PhoneInput';

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

interface TierDetailViewProps {
  tierId: string;
  tierName: string;
  tierGradientClassName: string;
  onClose: () => void;
  tierData: TierData;
  setTierDataMap: React.Dispatch<React.SetStateAction<Record<string, TierData>>>;
}

function TierDetailView({
                          tierId,
                          tierName,
                          tierGradientClassName,
                          onClose,
                          tierData,
                          setTierDataMap
                        }: TierDetailViewProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [showWaveForm, setShowWaveForm] = useState(false);
  const [showPrivilegeForm, setShowPrivilegeForm] = useState(false);
  const [showAddOnForm, setShowAddOnForm] = useState(false);
  const [showTableForm, setShowTableForm] = useState(false);

  const isFormOpen = showWaveForm || showPrivilegeForm || showAddOnForm || showTableForm;

  const updateTierData = useCallback((updates: Partial<TierData>) => {
    setTierDataMap(prev => ({
      ...prev,
      [tierId]: {
        ...prev[tierId],
        ...updates
      }
    }));
  }, [tierId, setTierDataMap]);

  const handleAdd = useCallback(() => {
    switch (activeTab) {
      case 0:
        setShowWaveForm(true);
        break;
      case 1:
        setShowPrivilegeForm(true);
        break;
      case 2:
        setShowAddOnForm(true);
        break;
      case 3:
        setShowTableForm(true);
        break;
    }
  }, [activeTab]);

  const handleSaveWave = useCallback((waveData: WaveFormData) => {
    const newWave: Wave = {
      id: Date.now().toString(),
      name: waveData.name,
      ticketCount: waveData.amount,
      price: waveData.price,
      isActive: false,
    };
    updateTierData({ waves: [...tierData.waves, newWave] });
  }, [tierData.waves, updateTierData]);

  const handleSavePrivilege = useCallback((privilegeData: PrivilegeFormData) => {
    const newPrivilege: Privilege = {
      id: Date.now().toString(),
      name: privilegeData.title,
      description: privilegeData.description,
      isActive: false,
    };
    updateTierData({ privileges: [...tierData.privileges, newPrivilege] });
  }, [tierData.privileges, updateTierData]);

  const handleSaveAddOn = useCallback((addOnData: AddOnFormData) => {
    const newAddOn: AddOn = {
      id: Date.now().toString(),
      price: addOnData.price,
      name: addOnData.title,
      description: addOnData.description,
      availability: addOnData.isUnlimited ? 'Unlimited' : addOnData.amount,
    };
    updateTierData({ addOns: [...tierData.addOns, newAddOn] });
  }, [tierData.addOns, updateTierData]);

  const handleSaveTable = useCallback((tableData: TableFormData) => {
    const newTable: Table = {
      id: Date.now().toString(),
      name: tableData.title,
      seats: tableData.seats,
      minimumSpend: tableData.minimumSpend,
      count: tableData.amount,
      isActive: false,
    };
    updateTierData({ tables: [...tierData.tables, newTable] });
  }, [tierData.tables, updateTierData]);

  const handleCloseWaveForm = useCallback(() => setShowWaveForm(false), []);
  const handleClosePrivilegeForm = useCallback(() => setShowPrivilegeForm(false), []);
  const handleCloseAddOnForm = useCallback(() => setShowAddOnForm(false), []);
  const handleCloseTableForm = useCallback(() => setShowTableForm(false), []);

  const handleBookingNumberChange = useCallback((value: string) => {
    updateTierData({ bookingNumber: value });
  }, [updateTierData]);

  const handleDeleteWave = useCallback((waveId: string) => {
    updateTierData({ waves: tierData.waves.filter(wave => wave.id !== waveId) });
  }, [tierData.waves, updateTierData]);

  const handleDeletePrivilege = useCallback((privilegeId: string) => {
    updateTierData({ privileges: tierData.privileges.filter(privilege => privilege.id !== privilegeId) });
  }, [tierData.privileges, updateTierData]);

  const handleDeleteAddOn = useCallback((addOnId: string) => {
    updateTierData({ addOns: tierData.addOns.filter(addOn => addOn.id !== addOnId) });
  }, [tierData.addOns, updateTierData]);

  const handleDeleteTable = useCallback((tableId: string) => {
    updateTierData({ tables: tierData.tables.filter(table => table.id !== tableId) });
  }, [tierData.tables, updateTierData]);


  return (
    <div className="w-full h-full overflow-visible inline-flex flex-col justify-start items-end gap-2.5">
      {!isFormOpen && (
        <TierDetailHeader
          tierName={tierName}
          gradientClassName={tierGradientClassName}
          onClose={onClose}
          onAdd={handleAdd}
        />
      )}

      {!isFormOpen && (
        <TierDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      <div className="h-full w-full">
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === 0 && (
            <motion.div
              key="waves"
              initial={{ opacity: 0, filter: 'blur(5px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{
                opacity: 0,
                filter: 'blur(5px)',
                transition: { duration: 0.15 },
              }}
            >
              {showWaveForm ? (
                <NewWaveForm
                  onClose={handleCloseWaveForm}
                  onSave={handleSaveWave}
                />
              ) : (
                <>
                  {tierData.waves.length === 0 ? (
                    <div className="w-full py-8 text-center text-gray-400 text-sm font-['Lufga']">
                      No waves added yet
                    </div>
                  ) : (
                    <motion.div
                      layout
                      className="flex flex-col"
                    >
                      <AnimatePresence initial={false} mode="popLayout">
                        {tierData.waves.map((wave) => (
                          <WaveCard
                            key={wave.id}
                            name={wave.name}
                            ticketCount={wave.ticketCount}
                            price={wave.price}
                            isActive={wave.isActive}
                            onDelete={() => handleDeleteWave(wave.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {activeTab === 1 && (
            <motion.div
              key="privileges"
              initial={{ opacity: 0, filter: 'blur(5px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{
                opacity: 0,
                filter: 'blur(5px)',
                transition: { duration: 0.15 },
              }}
            >
              {showPrivilegeForm ? (
                <NewPrivilegeForm
                  onClose={handleClosePrivilegeForm}
                  onSave={handleSavePrivilege}
                />
              ) : (
                <>
                  {tierData.privileges.length === 0 ? (
                    <div className="w-full py-8 text-center text-gray-400 text-sm font-['Lufga']">
                      No privileges added yet
                    </div>
                  ) : (
                    <motion.div
                      layout
                      className="flex flex-col"
                    >
                      <AnimatePresence initial={false} mode="popLayout">
                        {tierData.privileges.map((privilege) => (
                          <PrivilegeCard
                            key={privilege.id}
                            name={privilege.name}
                            description={privilege.description}
                            isActive={privilege.isActive}
                            onDelete={() => handleDeletePrivilege(privilege.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {activeTab === 2 && (
            <motion.div
              key="addons"
              initial={{ opacity: 0, filter: 'blur(5px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{
                opacity: 0,
                filter: 'blur(5px)',
                transition: { duration: 0.15 },
              }}
            >
              {showAddOnForm ? (
                <NewAddOnForm
                  onClose={handleCloseAddOnForm}
                  onSave={handleSaveAddOn}
                />
              ) : (
                <>
                  {tierData.addOns.length === 0 ? (
                    <div className="w-full py-8 text-center text-gray-400 text-sm font-['Lufga']">
                      No add-ons added yet
                    </div>
                  ) : (
                    <motion.div
                      layout
                      className="flex flex-col"
                    >
                      <AnimatePresence initial={false} mode="popLayout">
                        {tierData.addOns.map((addOn) => (
                          <AddOnCard
                            key={addOn.id}
                            price={addOn.price}
                            name={addOn.name}
                            description={addOn.description}
                            availability={addOn.availability}
                            onDelete={() => handleDeleteAddOn(addOn.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {activeTab === 3 && (
            <motion.div
              key="tables"
              initial={{ opacity: 0, filter: 'blur(5px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{
                opacity: 0,
                filter: 'blur(5px)',
                transition: { duration: 0.15 },
              }}
            >
              {showTableForm ? (
                <NewTableForm
                  onClose={handleCloseTableForm}
                  onSave={handleSaveTable}
                />
              ) : (
                <>
                  <div className="self-stretch py-2.5 inline-flex justify-between items-center gap-2.5 overflow-hidden">
                    <div className="text-[#F7F7F7] text-sm font-normal font-['Lufga']">
                      Booking Number
                    </div>
                    <PhoneInput
                      value={tierData.bookingNumber}
                      onChange={handleBookingNumberChange}
                    />
                  </div>

                  {tierData.tables.length === 0 ? (
                    <div className="w-full py-8 text-center text-gray-400 text-sm font-['Lufga']">
                      No tables added yet
                    </div>
                  ) : (
                    <motion.div
                      layout
                      className="flex flex-col"
                    >
                      <AnimatePresence initial={false} mode="popLayout">
                        {tierData.tables.map((table) => (
                          <TableCard
                            key={table.id}
                            name={table.name}
                            seats={table.seats}
                            minimumSpend={table.minimumSpend}
                            count={table.count}
                            isActive={table.isActive}
                            onDelete={() => handleDeleteTable(table.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default memo(TierDetailView);