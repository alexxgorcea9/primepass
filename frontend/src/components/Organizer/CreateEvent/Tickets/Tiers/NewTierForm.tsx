import { useState } from 'react';
import { motion } from 'framer-motion';
import TextInputLine from '@components/Organizer/CreateEvent/Details/TextInputLine';
import TierIconSelector from './TierIconSelector';
import TierColorSelector from './TierColorSelector';
import TierSpecialRequestsToggle from './TierSpecialRequestsToggle';
import FormHeader from '@components/Organizer/CreateEvent/Tickets/FormHeader';
import Ticket from '@/assets/ticket.svg';

interface CreateTierFormProps {
  onClose: () => void;
  onSave?: (tierData: TierFormData) => void;
}

export interface TierFormData {
  name: string;
  icon: string;
  gradientId: string;
  specialRequests: boolean;
}

export default function NewTierForm({ onClose, onSave }: CreateTierFormProps) {
  const [tierName, setTierName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(Ticket);
  const [selectedGradient, setSelectedGradient] = useState('emerald');
  const [specialRequests, setSpecialRequests] = useState(true);


  const isFormValid = tierName.trim() !== '';

  const handleSave = () => {
    if (!isFormValid) return;

    if (onSave) {
      onSave({
        name: tierName,
        icon: selectedIcon,
        gradientId: selectedGradient,
        specialRequests,
      });
    }
    onClose();
  };

  return (
    <motion.div
      layout
      className="w-full overflow-hidden inline-flex flex-col justify-start items-start gap-2.5"
    >
      {/* Header */}
      <FormHeader
        title="New Tier"
        onClose={onClose}
        onAdd={handleSave}
        isAddDisabled={!isFormValid}
      />

      {/* Name Input */}
      <TextInputLine
        label="Name"
        value={tierName}
        onChange={setTierName}
        placeholder="Tier Name"
        maxLength={20}
        showCharCount={true}
      />

      {/* Icon Selector */}
      <TierIconSelector
        selectedIcon={selectedIcon}
        onIconChange={setSelectedIcon}
      />

      {/* Color Selector */}
      <TierColorSelector
        selectedGradientId={selectedGradient}
        onGradientChange={setSelectedGradient}
      />

      {/* Special Requests Toggle */}
      <TierSpecialRequestsToggle
        specialRequests={specialRequests}
        onToggle={setSpecialRequests}
      />
    </motion.div>
  );
}
